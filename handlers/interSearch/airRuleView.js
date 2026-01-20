const { Parser } = require('xml2js');
const deps = require('../../src/common/dependencies');
const { interSearchLogSave , mainInterQuery } = require('../../src/utils/database');
const { uapiGalRuleSearch , uapiGalParse } = require('../../src/utils/functionGalileo');
const {} = require('../../src/utils/functionSabre');

function spaceCheck(str) {
    let key = 0;
    const s = String(str ?? '');
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i);
      if (code > 32) { // 비공백(ASCII>32) 만나면 그 인덱스 반환
        key = i;
        break;
      }
      key = code;      // 전부 공백류면 마지막 코드값(≤32)로 덮어씀
    }
    return key;
}

module.exports = async (req, res) => {
    const uid  = req.body.uid  || '';
    const mode = req.body.mode || '';
    pool = await deps.getPool();    

    let mainRow   =  await mainInterQuery (uid);
    
    let errorMsg  = '';
    let re        = "ok";
    const atr_yes = mainRow.atr_yes.trim();
    let pData = mainRow;
    pData.BRANCH = 'P7144368' ;
    pData.pool   = pool;
    pData.Owner  = 'AVIA';
    let sqlText  = '';
    let result   = '';
    let xml      = '';
    let rsCount  = 0;
    let ruleList = '';
    let RuleOk   = '';
    let sCnt     = 0;
    let spc      = '';
    let bold     = '';
    const sql    = deps.sql;
    const aData  = [];

    if (!errorMsg) {
        
        sqlText = `select * from ${deps.hubGds}hubFareRuleDetail where uid_minor = @uid and category in ('15','16') order by minor_num  `;
        result  = await pool.request()
                    .input('uid', sql.Int , uid )
                    .query(sqlText);
        for (const row of result.recordset) {
            const { category ,  contents }= row;
            deps.arrPush(aData, "T" , category) ;
            deps.arrPush(aData, "C" , contents);
            RuleOk = "Y";
        }
        
        if (RuleOk === "Y") {
            for (let ix = 0 ; ix < aData.T.length ; ix ++ ) {
                const title    = aData.T[ix];
                const contents = aData.C[ix];
                const tmp1           = contents.split('\n');
                let   data1_   = '';
                let   data2_   = '';
                for (let cnt = 0 ; cnt < tmp1.length ; cnt ++) {
                    sCnt   = spaceCheck (tmp1[cnt]);
                    spc    = '&nbsp;'.repeat(Math.max(0, sCnt)); 
                    const cls = cnt === 0 ? 'bold' : '';
                    data1_  += `<span class='${cls}'>${spc}${tmp1[cnt]}</span><br>`;
                }
                data1_ = data1_.replace('NON-REFUNDABLE',`<span style='font-weight:bold;font-size:14px; color:red;'>NON-REFUNDABLE</span>`)
                ruleList += `<tr><td class='font12px'>${title} ${data1_}</td><td class='font12px bgcF7'>${data2_}</td></tr>`;
            }
        } else {
            sqlText = `select GoodCode , airRule  from interline_routing where uid_minor = @uid order by minor_num asc`;
            result  = await pool.request()
                    .input('uid', sql.Int , uid )
                    .query(sqlText);
            for (const row of result.recordset) {
                const { GoodCode , airRule  }= row;
                deps.arrPush(pData, "RULE", `${GoodCode}^^${airRule}`) ;
            }
            if (atr_yes === "G") {
                galXml = await uapiGalRuleSearch (pData);
                const res = await uapiGalParse(galXml);
                const fares = res?.Envelope?.Body?.AirFareRulesRsp?.FareRule ?? "";
                const arrFare = Array.isArray(fares) ? fares : [fares];
                const aSql = [];
                let minor = 1;
                for (let ix = 0 ; ix < arrFare.length ; ix ++) {
                    for (let ii = 0 ; ii < arrFare[ix].FareRuleLong.length ; ii ++) {
                        let FareRuleLong = arrFare[ix].FareRuleLong[ii]._;
                        let Category     = arrFare[ix].FareRuleLong[ii].$.Category;
                        FareRuleLong     = FareRuleLong.replace(/'/g,"''");
                        aSql.push(`('${uid}','${minor}','${Category}','${FareRuleLong}','','${pData.Owner}')` );
                        minor ++;
                    }
                }
                sqlText = `insert into ${deps.hubGds}hubFareRuleDetail  (uid_minor,minor_num,category,contents,rule_key,Owner) values ${aSql.join(',')}`;
                await pool.request().query(sqlText);
                errorMsg = 're';
            } else if (atr_yes === "A") {

            }
        }
        if (!ruleList) ruleList = `<tr><td colspan="2" class='ac hh50'>룰 조회에 오류가 있습니다.</td></tr>`;
        ruleList = `
            <div class='reservation_pop_box '>
            <div class='reservation_pop ' style='top:0px !important;'>
            <div class='item-title '>
                <p class='t1'>
                    <span class=''>항공요금규정</span>
                </p>
                <div class='bar'></div>
                <p class='cursor' onClick='ruleClose()' style='position:absolute;top:8px;right:8px; font-size:14px; color:#fff; '>닫기 <img src='../images/close.png' class='close_img'></p>
            </div>
            <div class='table_item'>
                <table>
                    <tr>
                        <th class='ac whp50' width=''>영문</th>
                        <th class='ac whp50' width=''>한글</th>
                    </tr>
                    ${ruleList}
                </table>
            </div>
            </div>
            </div>
        `;
    } else {
        re = "no";
    }
    //console.log(aData)
    res.json ({success:re,msg:errorMsg , ruleData: ruleList});
    
}