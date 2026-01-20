const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { accumulateDayRow , buildDayHTML} = require('../../src/utils/stats'); 


//left outer join interline as a (nolock) on main.uid = a.uid   
module.exports = async (req, res) => {
    const data        = req.body;
    let   start_date  = req.body.start_date || '';
    let   end_date    = req.body.end_date || '';
    let   GU1         = req.body.GU1     || '';
    let   GU2         = req.body.GU2     || '';
    let   GU3         = req.body.GU3    || '';
    let   GU4         = req.body.GU4    || '';
    let   GU5         = req.body.GU5    || '';
    const gMode       = req.body.gMode  || '';
    const page        = req.body.page    || '1';
    const listCount   = req.body.listCount;
    const sWord       = req.body.sWord || '';
    const sFrom       = req.body.sFrom || '';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const mainTable   = 'interline';
    const pool        = await deps.getPool();
    let   YY          = deps.getNow().YY;
    let   MM          = deps.getNow().MM;
    let   cYear       = data.cYear  || YY;
    let   cMonth      = data.cMonth || MM;
    
    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }
    const search_key = GU5 === "DAY" ? `${cYear}${cMonth.padStart(2,'0')}` : cYear;
    if (GU1 === "ISSUE")	    addQry += ` and a.issue_date like '${search_key}%' `;
    else if (GU1 === "ORDER")	addQry += ` and a.order_date like '${search_key}%' `;
    else if (GU1 === "DEP")	    addQry += ` and d.in_date like '${search_key}%' `;

    if (GU4 === "Inter")	    addQry += ` and atr_yes != 'DOM' `; else addQry += ` and atr_yes = 'DOM' `;

    try {
        const fieldQry = `
            a.* 
        `;

        const joinQry = `
            left outer join site              (nolock) as b on a.site_code = b.site_code
            left outer join tblManager        (nolock) as c on a.operator = c.member_code
            left outer join interline_routing (nolock) as d on a.uid = d.uid_minor and d.minor_num = '1' 
            left outer join tblManager        (nolock) as f on a.issue_manager = f.member_code
            left outer join interline_pax     (nolock) as k on a.uid = k.uid_minor and k.minor_num = '1' 
            left outer join interline_minor   (nolock) as n on a.uid = n.uid_minor 
        `;

        const baseQuery = `
        select 
            ${fieldQry}
            from ${mainTable} (nolock) as a 
            ${joinQry}
            where 
            ${addQry}
        `;
        //console.log(baseQuery)
        const result = await pool.request().query(baseQuery);
        let   rows = ``;
        let   tot = 0;
        let  cData = '', mData = '';
        let  aData = {};
        for (const row of result.recordset) {
            //console.log(row)
            accumulateDayRow (aData , row , {GU1 : GU1 , GU5 : GU5 });

            
            tot ++;
        };

        let listHTML = buildDayHTML(aData, {
            GU2: Number(cYear),
            GU3: Number(cMonth),
            GU5,
            bgcolor1: '#ffffff'
          });
        
        let bgcolor = 'fff' , font = '';

        if (!listHTML) {
            listHTML = `<tr><td colspan='20' class='ac hh50'>검색된 데이터가 없습니다.</td></tr>`;
        }
        listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr style='background-color:#eee;'>
                    <th class="wh200">구분</th>
                    <th class="wh200">예약건</th>
                    <th class="wh200">인원</th>
                    <th>총금액</th>
                    <th>항공운임</th>
                    <th>택스</th>
                </tr>
                ${listHTML}
            </table>
        `;

        res.json({success : 'ok', listData: listHTML , totalCount: tot });
    } catch (err) {
        console.error('에러:'+err);
        res.status(500).send('Database error');
    }
	
};



