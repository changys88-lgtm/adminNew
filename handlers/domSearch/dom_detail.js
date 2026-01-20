const deps = require('../../src/common/dependencies');
const {mainInterQuery } = require('../../src/utils/database');
const { arrInterType, arrInterGubun, arrCabinType, arrGdsType , arrDsrType , arrCountryCode , arrGender, arrCardType ,arrPaxRelation } = require('../../src/utils/airConst');

module.exports = async (req, res) => {
  const uid         = req.body.uid;
  const b2bMASTER   = req.cookies?.b2bMASTER || '';
  const b2bSiteCode = req.cookies?.b2bSiteCode || '';
  if (!uid) {
    return res.status(400).send("UID 없음");
  }

  const pool = await deps.getPool();

  try {
    const mainRow = await mainInterQuery(pool,uid);
    for (const [key, value] of Object.entries(mainRow)) {
        global[key] = (typeof value === 'string') ? value.trim() : value;
    }
    //console.log(mainRow);
    //const datas = mainRow.recordset[0];
    const mainData = {};
    const members2 = adult_member + child_member;
    mainData["uid"]		        = uid;
    mainData["members"]		    = adult_member + child_member + infant_member;
    mainData["adult_amount"]	= air_amount   + adult_tax;
    mainData["child_amount"]	= child_amount + child_tax;
    mainData["infant_amount"]	= infant_amount + infant_tax;
    mainData["site_code"]		= site_code;
    mainData["site_name"]		= site_name;
    mainData["issueComm"]		= issueComm;
    mainData["issueComm1"]		= issueCommAdt || '';
    mainData["issueComm2"]		= issueCommChd || '';
    mainData["pUid"]		    = ``;

    const numberFormat = deps.numberFormat;
    const NOWS         = deps.getNow().NOWS;
    const sql          = deps.sql;
    let cashPriceTotal = 0;
    let mainAirCode    = '';
    let sqlText        = '';
    let sqlResult      = '';
    let airCode	       = FirstAir ? FirstAir.slice(0,2) : '';
    let issueComm1     = issueCommAdt;
    let issueComm2     = issueCommChd;
    let IssueStop      = '';
    let depoButton;
    let disForce       = '';
    let cardDis        = '';
    let cardTitle      = '';
    let AutoIssue      = '';
    let menubutton     = '';
    let Year           = deps.getNow().YY;
    if (main_air) mainAirCode = main_air;
    else mainAirCode = airCode;
    if (in_status < '9') {
        menubutton = `
            <span class="btn_basic btn_blue"    onClick="return OneQna('${uid}')">1:1 문의</span>
            <span class="btn_basic btn_purple"  onClick="return invoice('${deps.aes128Encrypt(deps.getNow().aviaSecurityKey, uid)}', '')">인보이스</span>
            <span class="btn_basic btn_purple"  onClick="return invoiceWrite('${deps.aes128Encrypt(deps.getNow().aviaSecurityKey, uid)}', '')">인보이스작성</span>
        `;
    };
    if (in_status === '4') {
        menubutton += `<span class="btn_basic btn_red fr" onClick="return ruleDomeView('${uid}')">전체 취소</span>`;
    } else if (in_status < '4') {
        menubutton += `<span class="btn_basic btn_red fr" onClick="return issueVoid('${uid}')">예약취소</span>`;
    } else if (in_status === '9') {
        menubutton += `<span class="btn_basic btn_gray fr">취소완료</span>`;
    }
    let menus = `
        <div class='border regis-tle-box shadow-sm mw20 mat10'>
            <div class="d-inline regis-tle" style="font-size:1.2em;">
                예약정보확인
                ${menubutton}
            </div>
        </div>
    `;


    if (in_status >= '4') {
        disForce = 'disabled';
    } else {
        disForce = '';
    }

    const airSql = `select code_2, cardNo , autoIssueNo , noReason  from airLine_code where code_2 = '${airCode}' `;
    const resultAir = await pool.request().query(airSql);
    const airRow = resultAir.recordset[0]; // 첫 번째 결과 row
    const cardNo      = airRow["cardNo"];
    const code_2      = airRow["code_2"];
    const autoIssueNo = airRow["autoIssueNo"];
    const noReason    = airRow["noReason"];
    let   noNotice    = '';
    let   quoteCount  = '';

    if ((code_2 == "" || cardNo == "Y" || atr_yes == "C") && airCode != "KE") {
        cardDis   = "disabled";
        cardTitle = " title='카드발권 불가' ";
    }

    if (autoIssueNo === "Y") {
        noNotice = `
            <div class='ac hh30'>
                <span class='cored'>자동발권불가: ${noReason} <br>
            </div>
        `;
    }

    if (atr_yes === "ATR") {
        quoteCount = 1;
    } else {
        sqlText = `select count(*) as cnt from interline_quote where uid_minor = @uid `;
        result = await pool.request().input('uid',sql.Int , uid).query(sqlText);
        quoteCount = result.recordset[0].cnt;
    }

    const cardSql = `SELECT TOP 1 * FROM card_auth WHERE interline_uid = ${uid} AND result_code = 'O' `;
    const resultCard = await pool.request().query(cardSql);
    const cardRow = resultCard.recordset[0]; // 첫 번째 결과 row
    const card_auth_uid = cardRow?.uid || '';
    const auth_number   = cardRow?.auth_number || '';

    const arrRouteData = [];
    sqlText = `select * from interline_domestic_rev where uid_minor = @uid order by minor_num asc `;
    sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
    for (const put of sqlResult.recordset) {
        let { minor_num , pnrAlpha , pnrNumeric, agentTL  } = put;
        deps.arrPush(arrRouteData,"PNR" ,pnrAlpha);
        deps.arrPush(arrRouteData,"NPNR",pnrNumeric);
        deps.arrPush(arrRouteData,"TL"  ,agentTL)
    }

    const arrPriceData = [];
    sqlText = `select * from interline_domestic_price where uid_minor = @uid order by gubun asc `;
    sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
    for (const put of sqlResult.recordset) {
        let { totalAmount , tax, fuelSurcharge , basePrice , tasf , approvalNo , paxType ,gubun  } = put;
        gubun = gubun.trim();
        arrPriceData.TOT ??= {};
        arrPriceData.TOT[gubun] = (arrPriceData.TOT[gubun] ?? 0) + totalAmount;
        const grp = (arrPriceData[gubun] ??= {});
        const pax = (grp[paxType] ??= { TOT:0, TAX:0, SUR:0, TAX1:0, BASE:0, TASF:0 });
        pax.TOT  += totalAmount;
        pax.TAX  += (tax + fuelSurcharge);
        pax.SUR  += fuelSurcharge;
        pax.TAX1 += tax;
        pax.BASE += basePrice;
        pax.TASF += tasf / members2 ;

        grp.TOT   = (grp.TOT ?? 0) + totalAmount;
        grp.AUTH  = approvalNo;
    }
    //console.log(arrPriceData[1])
    const aRoute = {};

    sqlText = `select minor_num , air_code , in_date , cancelDate , seat_status from interline_routing where uid_minor = @uid order by minor_num `;
    sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
    for (const put of sqlResult.recordset) {
        let { minor_num , in_date , cancelDate , seat_status , air_code } = put;
        aRoute[minor_num] ??= [];
        aRoute[minor_num]['CX']  = cancelDate;
        aRoute[minor_num]['IN']  = in_date;
        aRoute[minor_num]['ST']  = seat_status;
        aRoute[minor_num]['AIR'] = air_code.slice(0,2);
    }




    const billQuery = `select ResultMsg , auth_number , uid as cardUid , minor_num as minorNum   from interline_card where uid_minor = '${uid}' and void is null order by uid desc `;
    const resultBill = await pool.request().query(billQuery);
    const billRow = resultBill.recordset;

    for (const row of billRow) {
        aCardData[minorNum]["MSG"]  = row.ResultMsg;
        aCardData[minorNum]["AUTH"] = row.auth_number;
        aCardData[minorNum]["UID"]  = row.cardUid;
    }

    let addQry = '';
    addQry = ` , (select top 1 [desc] from interline_domestic_discount where air_code = '${aRoute[1]['AIR']}' and discount_code = dc_code ) as dcName `
    if (aRoute[2]?.['AIR'] || '') addQry += ` , (select top 1 [desc] from interline_domestic_discount where air_code = '${aRoute[2]['AIR']}' and discount_code = dc_code2 ) as dcName2 `

    const paxQuery = `
        SELECT a.*, 
                b.ticket_type, 
                c.out_number, 
                c.re_ok, 
                c.uid AS ref_uid, 
                card.uid AS cardUid
                ${addQry}
        FROM interline_pax AS a
        LEFT OUTER JOIN AirTickets AS b ON a.ticket_number = b.air_line_code + b.ticket_number AND b.ticket_type IN ('S', 'N', 'V', 'I', 'E')
        LEFT OUTER JOIN air_refund AS c ON a.ticket_number = c.air_line_code + c.ticket_number
        LEFT OUTER JOIN card_auth AS card ON card.interline_uid = a.uid_minor 
            AND card.interline_minor = a.minor_num 
            AND card.result_code = 'O' 
            AND card.goods_name = 'Tasf' 
            AND card.status != '9'
        WHERE a.uid_minor = ${uid}
        ORDER BY a.minor_num
    `;

    const resultPax = await pool.request().query(paxQuery);
    const paxRow = resultPax.recordset;

    let paxHTML    = '';
    let read4      = '';
    let hideWrite5 = '';
    let hideWrite4 = '';
    let hideCls4   = '';
    let disWrite5  = '';
    const aData = {depTot : 0 , arrTot : 0};
    const aTicket = [];

    for (const row of paxRow) {
        const trimmedRow = {};
        for (const [key, val] of Object.entries(row)) {
            trimmedRow[key] = val === null ? '' : (typeof val === 'string' ? val.trim() : val);
        }
        let {
            eng_name1 , eng_name2 , birthday , expire , passport , country , sex ,ticket_number , ticket_number2 ,card_type , card_number , expire_date, cash_price , card_price
            , ticket_type, tel_number, minor_num , method_type , installment , card_holder , jumin2 , SelectCard , paxrelation , dep_status , arr_status
            , dc_dep_air , dc_dep_tax , dc_arr_air , dc_arr_tax , dc_code , dc_code2 , dcName , dcName2
        } = trimmedRow;

        aTicket[1] = ticket_number;
	    aTicket[2] = ticket_number2;

        if (birthday.length > 20) birthday = deps.aes128Decrypt (deps.getNow().aviaSecurityKey,birthday);
        if (expire.length   > 20) expire   = deps.aes128Decrypt (deps.getNow().aviaSecurityKey,expire);
        if (passport.length > 20) passport = deps.aes128Decrypt (deps.getNow().aviaSecurityKey,passport);
        let addHTML      = '';
        let countryData  = '';
        let genData      = '';
        let cardData     = '';
        let ex1Data      = '';
        let ex2Data      = '';
        let cardAuth     = '';
        let cardCopy     = '';
        let check3_1     = '';
        let check3_2     = '';
        let card_pass    = '';
        let paxRelData   = '';
        arrCountryCode.forEach(val => { 
            const tmp = val.split('/');
            const selected = tmp[1] === country ? 'selected': '';
            if (tmp[1] === country) countryName = tmp[2];
            countryData += `<option value="${tmp[1]}" ${selected}>${tmp[2]}`;
        });
        for (const [key, val] of Object.entries(arrGender)) {
            const selected = key === sex ? 'selected' : '';
            if (key === sex) genName = val;          
            genData += `<option value="${key}" ${selected}>${val} `;
        }
        let paxType;
        if (sex === 'M' || sex === 'F') {
            paxType = 'ADT';
        } else if (sex === 'MC' || sex === 'FC') {
            paxType = 'CHD';
        } else {
            paxType = 'INF';
        }
        const tasf1      = arrPriceData[1]?.[paxType]?.TASF || 0;
        const tasf2      = arrPriceData[2]?.[paxType]?.TASF || 0;
        const depPrice   = dc_dep_air + dc_dep_tax + tasf1;
        const arrPrice   = dc_arr_air + dc_arr_tax + tasf2;
        aData.depTot     += depPrice;
        aData.arrTot     += arrPrice;

        let   depStatus  = ``;
        let   dep_cancel = ``;
        let   addInfo1   = '';
        let   addInfo2   = '';
        let   rowspan    = ` rowspan='1' `;
        base = numberFormat(arrPriceData[1][paxType]["BASE"]);
        tax  = numberFormat(arrPriceData[1][paxType]["TAX1"]);
        sur  = numberFormat(arrPriceData[1][paxType]["SUR"]);
        addInfo1 = ` <br>B:${base},T:${tax},S:${sur} `;
        dc_code    = `<span class='btn_slim btn_yellow' title='${dcName}'>${dc_code}</span>`;
        if (dc_code2) {
            dc_code2 = `<span class='btn_slim btn_yellow' title='${dcName2}'>${dc_code2}</span>`;
            base = numberFormat(arrPriceData[2][paxType]["BASE"]);
            tax  = numberFormat(arrPriceData[2][paxType]["TAX1"]);
            sur  = numberFormat(arrPriceData[2][paxType]["SUR"]);
            addInfo2 = ` <br>B:${base},T:${tax},S:${sur} `;
            rowspan    = ` rowspan='2' `;
        }
        tel_number = tel_number ? (deps.aes128Decrypt (deps.getNow().aviaSecurityKey,tel_number)) : '';

        if (in_status === "4") {
            if (aRoute[1]["ST"] === "RF") {
                depStatus = `<font class='cored'>환불 Fee ${numberFormat(dep_fee)}원</font>`;
            } else if (!dep_status && aRoute[1]["ST"] === 'HK' && in_status === '4') {
                depStatus = `<font color='red'>발권오류</font>`;
            } else if (!dep_status && !aRoute[1]["CX"]) {
                depStatus = `<font color='blue'>완료</font>`;
                if (String(issue_date || '').slice(0, 8) === NOWS) {
                    dep_cancel = `<span class='btn_slim btn_red' title='부분 취소가 필요할 겨우 전체 취소후 발권을 다시 하세요!!'>당일취소무료</span>`;
                } else if (aRoute[1]['IN'] > NOWS) {
                    dep_cancel = `<span class='btn_slim btn_red' onClick="return domOneCancel('${uid}','${minor_num}','1','${aFee?.[1] ?? 0}')">취소수수료 : ${numberFormat(aFee?.[1] ?? 0)}원</span>`;
                } else {
                    dep_cancel = `<span class='btn_slim btn_gray'>취소불가</span>`;
                }
            } else if (aRoute[1]["CX"]) {
                depStatus = `<font class='cored'>취소</font>`;
                dep_cancel = `<font class='cored'>취소일 : ${CutDateTime(aRoute[1]["CX"], 'S')}</font>`;
            } else if (dep_status === 'C') {
                depStatus = `<font class='cored'>취소 / 환불Fee ${numberFormat(dep_fee)}원</font>`;
                if (b2bMASTER === 'Y') {
                    const orderNum = `${uid}_${minor_num}_1`;
                    const cnt = await countVacsAhst({ gubun: '65', orderNum, bankOwner: 'OYE' });
                    depStatus += cnt === 0
                    ? ` <span class='btn_slim btn_purple' onClick="return depoChange('${site_code}','${uid}','${minor_num}','1','${dep_fee}')">차감${dep_fee}</span>`
                    : `<span class='btn_slim btn_yellow'>차감완료</span>`;
                }
                dep_cancel  = `<font class='cored'>요청일 : ${CutDateTime(dep_chg_date, 'S')}</font>`;
                dep_cancel += `<span class='wh50'></span><font class='cored'>취소일 : ${CutDateTime(dep_chg_condate, 'S')}</font>`;
            }
            
            if (dep_status === 'R') {
                depStatus = `<font class='cored'>요청 / 환불Fee ${numberFormat(dep_fee)}원</font>`;
                dep_cancel = `<font class='cored'>요청일 : ${CutDateTime(dep_chg_date, 'S')}</font>`;
                if (b2bMASTER === 'Y') {
                    dep_cancel += `&nbsp; &nbsp; <span class='btn_slim btn_purple ' onClick="return domOneConfirm('${uid}','${minor_num}','1')">취소처리완료</span>`;
                }
            }

            if (aRoute[2]["ST"] === "RF") {
                arrStatus = `<font class='cored'>환불 Fee ${numberFormat(arr_fee)}원</font>`;
            } else if (!arr_status && aRoute[2]["ST"] === 'HK' && in_status === '4') {
                arrStatus = `<font color='red'>발권오류</font>`;
            } else if (!arr_status && !aRoute[2]["CX"]) {
                arrStatus = `<font color='blue'>완료</font>`;
                if (String(issue_date || '').slice(0, 8) === NOWS) {
                    arr_cancel = `<span class='btn_slim btn_red' title='부분 취소가 필요할 겨우 전체 취소후 발권을 다시 하세요!!'>당일취소무료</span>`;
                } else if (aRoute[2]['IN'] > NOWS) {
                    arr_cancel = `<span class='btn_slim btn_red' onClick="return domOneCancel('${uid}','${minor_num}','1','${aFee?.[1] ?? 0}')">취소수수료 : ${numberFormat(aFee?.[1] ?? 0)}원</span>`;
                } else {
                    arr_cancel = `<span class='btn_slim btn_gray'>취소불가</span>`;
                }
            } else if (aRoute[2]["CX"]) {
                arrStatus = `<font class='cored'>취소</font>`;
                arr_cancel = `<font class='cored'>취소일 : ${CutDateTime(aRoute[2]["CX"], 'S')}</font>`;
            } else if (arr_status === 'C') {
                arrStatus = `<font class='cored'>취소 / 환불Fee ${numberFormat(arr_fee)}원</font>`;
                if (b2bMASTER === 'Y') {
                    const orderNum = `${uid}_${minor_num}_1`;
                    const cnt = await countVacsAhst({ gubun: '65', orderNum, bankOwner: 'OYE' });
                    arrStatus += cnt === 0
                    ? ` <span class='btn_slim btn_purple' onClick="return depoChange('${site_code}','${uid}','${minor_num}','1','${arr_fee}')">차감${arr_fee}</span>`
                    : `<span class='btn_slim btn_yellow'>차감완료</span>`;
                }
                arr_cancel  = `<font class='cored'>요청일 : ${CutDateTime(arr_chg_date, 'S')}</font>`;
                arr_cancel += `<span class='wh50'></span><font class='cored'>취소일 : ${CutDateTime(arr_chg_condate, 'S')}</font>`;
            }
            
            if (arr_status === 'R') {
                arrStatus = `<font class='cored'>요청 / 환불Fee ${numberFormat(arr_fee)}원</font>`;
                arr_cancel = `<font class='cored'>요청일 : ${CutDateTime(arr_chg_date, 'S')}</font>`;
                if (b2bMASTER === 'Y') {
                    arr_cancel += `&nbsp; &nbsp; <span class='btn_slim btn_purple ' onClick="return domOneConfirm('${uid}','${minor_num}','1')">취소처리완료</span>`;
                }
            }
             
        }

        html = `
            <td ${rowspan}>${eng_name1} / ${eng_name2}</td>
            <td ${rowspan}>${genName}</td>
            <td ${rowspan}>${countryName}</td>
            <td ${rowspan}>${birthday}</td>
            <td ${rowspan}>${tel_number}</td>
            <td>출발</td>
            <td>${numberFormat(depPrice)} 원 ${addInfo1}</td>
            <td>${depStatus}</td>
			<td>${dep_cancel}</td>
			<td>${dc_code}</td>
        `;

        // 최종 HTML 추가
        if (dc_code2) {
            addHTML = `
                <tr>
                    <td>리턴</td>
                    <td>${numberFormat(arrPrice)} 원 ${addInfo2}</td>
                    <td>${arrStatus}</td>
                    <td>${arr_cancel}</td>
                    <td>${dc_code2}</td>
                </tr>
            `;
        }
        paxHTML += `
            <tr class='passenger_box'>
                <td ${rowspan} class='ac nowrap'> ${minor_num} </td>
                ${html}
            </tr>
            ${addHTML}
        `;
        
    }
    const paxDatas = `
        <div class='schedule pdw20'>
            <div class='border regis-tle-box shadow-sm'>
                <div class='schedule_title'>
			    <p style='font-weight:700;'><span style='color:#da082f;'>&gt;</span>탑승자 정보</p>    
                <table class='passenger_box02'>
                    <tr>
                        <td class="wh40">인원</td>
                        <td>이름(성/이름)</td>
                        <td>성별</td>
                        <td>국적</td>
                        <td class="wh150">생년월일</td>
                        <td>연락처(선택)</td>
                        <td>구간</td>
                        <td>요금</td>
                        <td>상태</td>
                        <td>취소</td>
                        <td>할인</td>
                    </tr>
                    ${paxHTML}
                </table>
            </div>
        </div>
    `;
    
    
    const routeSql = `
        SELECT a.*,
        (SELECT cityName FROM [airPort_code] WHERE SUBSTRING(a.citycode,1,3) = portCode) AS depName,
        (SELECT cityName FROM [airPort_code] WHERE SUBSTRING(a.citycode,4,3) = portCode) AS arrName,
        (SELECT addressReq FROM [airPort_code] WHERE SUBSTRING(a.citycode,1,3) = portCode) AS addressReq1,
        (SELECT addressReq FROM [airPort_code] WHERE SUBSTRING(a.citycode,4,3) = portCode) AS addressReq2
        ,b.method_type,b.card_type,b.card_number,b.expire_date,b.installment,b.card_price,b.card_holder,b.card_pass,b.card_auth,b.jumin2,b.SelectCard,b.paxrelation
        FROM interline_routing AS a
        left outer join interline_domestic_card as b on a.uid_minor = b.uid_minor and a.minor_num = b.minor_num
        WHERE a.uid_minor = '${uid}' AND a.minor_num < 100
        ORDER BY a.minor_num
    `;
    result = await pool.request().query(routeSql);
    const routeRow = result.recordset;
    let logList    = '';
    let routeData  = '';
    let payDatas    = '';
    let HiddenStop = '';
    let hideWrite  = '';
    let disWrite   = '';
    let hideCls    = '';
    let airImg     = '';
    if (b2bMASTER == "") {
        hideCls   = "hiddenCls";
        hideWrite = "readonly";
        disWrite  = "disabled";
    }
    for (const row of routeRow) {
        const trimmedRow = {};
        for (const [key, val] of Object.entries(row)) {
            trimmedRow[key] = typeof val === 'string' ? val.trim() : val;
            trimmedRow[key] = val === null ? '' : val;
        }
        let { cabinClass, citycode, air_code, minor_num , depName, arrName , air_class , in_date
            , start_time1 , start_time2 , out_date , seat_status , Groups , Flt_time , card_holder
            , card_pass , jumin2 , card_number , expire_date , card_type , installment , SelectCard , paxrelation
        } = trimmedRow;

        let dep = citycode.substring(0,3);
	    let arr = citycode.substring(3,6);

        if (seat_status !== "HK") IssueStop = "Y";

        let cabinOptions = Object.entries(arrCabinType)
            .filter(([key]) => key.length > 1)
            .map(([k, v]) => `<option value="${k}" ${cabinClass === k ? 'selected' : ''}>${v}</option>`)
            .join('');


        cabinSelect = `
        <select onChange="dataChange('interline_routing','${uid}','${minor_num}','cabinClass',this.value)">
            <option value="">캐빈선택</option>
            ${cabinOptions}
        </select>`;
        //depName = depName || dep;
        //arrName = arrName || arr;
        let depNameData = `<a title='${depName}'>${dep}</a>`;
        let arrNameData = `<a title='${arrName}'>${arr}</a>`;
        routeData += `
            <tr>
                <td>
                <div id="RouteA_${minor_num}" ondblclick="doubleChange('RouteA_${minor_num}','RouteB_${minor_num}')">
                    ${minor_num}. ${depNameData} → ${arrNameData}
                </div>
                <div id="RouteB_${minor_num}" style="display:none">
                    <span class="cursor" ondblclick="routeDel('${minor_num}')">x</span>
                    <input onChange="dataChange('interline_routing','${uid}','${minor_num}','minor_num',this.value)" ${hideWrite} class="${hideCls} mwa wh30 ac" value="${minor_num}">
                    <input onChange="dataChange('interline_routing','${uid}','${minor_num}','citycode',this.value)" ${hideWrite} class="${hideCls} mwa wh80 ac" value="${citycode}">
                </div>
                ${HiddenStop}
                </td>
                <td>
                    ${arrRouteData['PNR'][(minor_num-1)]} / ${arrRouteData['NPNR'][(minor_num-1)]}
                </td>
                <td ondblclick="doubleChange('AirA_${minor_num}','AirB_${minor_num}')">
                <div id="AirA_${minor_num}">${air_code}</div>
                <div id="AirB_${minor_num}" style="display:none">
                    <input onChange="dataChange('interline_routing','${uid}','${minor_num}','air_code',this.value)" ${hideWrite} class="form-control form-control-sm ${hideCls} mwa wh80 ac" value="${air_code}">
                </div>
                </td>

                <td ondblclick="doubleChange('CabinA_${minor_num}','CabinB_${minor_num}')">
                <div id="CabinA_${minor_num}">${cabinClass || '&nbsp;'}</div>
                <div id="CabinB_${minor_num}" style="display:none">
                    ${cabinSelect}
                </div>
                </td>

                <td ondblclick="doubleChange('DateA_${minor_num}','DateB_${minor_num}')">
                <div id="DateA_${minor_num}">${deps.cutDate(in_date)}</div>
                <div id="DateB_${minor_num}" style="display:none">
                    <input onChange="dataChange('interline_routing','${uid}','${minor_num}','in_date',this.value)" ${hideWrite} class="form-control form-control-sm ${hideCls} mwa wh100 ac" value="${in_date}">
                </div>
                </td>

                <td ondblclick="doubleChange('Time1A_${minor_num}','Time1B_${minor_num}')">
                <div id="Time1A_${minor_num}">${deps.cutTime(start_time1)}</div>
                <div id="Time1B_${minor_num}" style="display:none">
                    <input onChange="dataChange('interline_routing','${uid}','${minor_num}','start_time1',this.value)" ${hideWrite} class="form-control form-control-sm ${hideCls} mwa wh60 ac" value="${start_time1}">
                </div>
                </td>

                <td ondblclick="doubleChange('Time2A_${minor_num}','Time2B_${minor_num}')">
                <div id="Time2A_${minor_num}">${deps.cutTime(start_time2)}</div>
                <div id="Time2B_${minor_num}" style="display:none">
                    <input onChange="dataChange('interline_routing','${uid}','${minor_num}','start_time2',this.value)" ${hideWrite} class="form-control form-control-sm ${hideCls} mwa wh60 ac" value="${start_time2}">
                </div>
                </td>

                <td ondblclick="doubleChange('Flt_timeA_${minor_num}','Flt_timeB_${minor_num}')">
                <div id="Flt_timeA_${minor_num}">${deps.FltTmCheck(Flt_time)}</div>
                <div id="Flt_timeB_${minor_num}" style="display:none">
                    <input onChange="dataChange('interline_routing','${uid}','${minor_num}','Flt_time',this.value)" ${hideWrite} class="form-control form-control-sm ${hideCls} mwa wh100 ac" value="${Flt_time}">
                </div>
                </td>

                <td class='ac '>${deps.cutDateTime(issue_date)}</td>
                <td><span class='btn_basic btn_blue ' onClick="return ruleDomeView('${air_code}','${uid}','${minor_num}')" >규정보기 및 취소</span></td>
            </tr>
        `;


        sqlText = ` select  cardType,cardName from domestic_cardType where air_code = @air order by uid  `; 
        sqlResult = await pool.request().input('air',sql.NVarChar,air_code.slice(0,2)).query(sqlText);
        let cardData = `<option value=''>선택`;
        for (const put of sqlResult.recordset){
            let { cardType,cardName } = put;
            const selected = cardType.trim() === card_type ? 'selected' : '';
            cardData += `<option value='${cardType}' ${selected} >${cardName}`;
        }

        if (minor_num === '1') name = "출발"; else name = "리턴";
        if (in_status > 1)     cardClose = "disabled"; else cardClose = '';
        let none = '';
        let cardCopy = '';
        const card_price = (minor_num === 1) ? aData.depTot : aData.arrTot;

        card_number = card_number ? (deps.aes128Decrypt (deps.getNow().aviaSecurityKey,card_number)) : '';
        expire_date = expire_date ? (deps.aes128Decrypt (deps.getNow().aviaSecurityKey,expire_date)) : '';
        jumin2      = jumin2      ? (deps.aes128Decrypt (deps.getNow().aviaSecurityKey,jumin2)) : '';
        let aCard = deps.cardNumSplit(card_number);
        let ex1   = expire_date.slice(0,4);
        let ex2   = expire_date.slice(5,7);
        if (card_price === null) card_price = 0;
        
        ex1Data = `<option value=''>선택`;
        for (let dCount = 1 ; dCount < 13 ; dCount ++) {
            const selected1 = dCount == ex2 ? 'selected' : '';
            ex1Data += `<option value='${dCount}' ${selected1}>${dCount} 월`;
        }
        ex2Data = `<option value=''>선택`;
        for (let dCount = Year ; dCount < Year + 11 ; dCount ++) {
            const selected2 = dCount == ex1 ? 'selected' : '';
            ex2Data += `<option value='${dCount}' ${selected2}>${dCount} 년`;
        }
        insData = `<option value=''>선택`;
        for (let dCount = 1 ; dCount < 13 ; dCount ++) {
            const selected1 = dCount == installment ? 'selected' : '';
            insData += `<option value='${dCount}' ${selected1}>${dCount} 월`;
        }
        
        paxRelData = Object.entries(arrPaxRelation)
            .map(([k, v]) => `<option value="${k}" ${paxrelation === k ? 'selected' : ''}>${v}</option>`)
            .join('');

        let status = '';
        if (seat_status === "HK" && in_status !== '9') {
            if (( in_status === "4" || in_status === "A") && aTicket[minor_num]) status = ` <span class='btn_slim btn_blue'>발권완료</span> `;
            else if (( in_status === "4" || in_status === "A") && !aTicket[minor_num]) status = ` <span class='btn_slim btn_red'>발권오류</span> <div class='btn_slim btn_yellow PriceModify cursor' onClick="return domeStart('${uid}','4','${minor_num}')">편도재발권</div> `;
        }
        else if (seat_status === "TE" && in_status < '9') status = ` <span class='btn_slim btn_blue'>발권완료</span> `;
        else if (seat_status === "RF" && in_status < '9') status = ` <span class='btn_slim btn_purple'>환불완료</span> `;
        else if (in_status === '9') status = ` <span class='btn_slim btn_red'>취소완료</span> `;

        payDatas += `
            <tr  bgcolor=#FFFFFF>
                <td align=center ><input type=text class='none' name='aPax2[]' readonly style='width:27px;text-align:center' value='${minor_num}'> ${name} </td>
                <td align=center >
                    <label><input type=radio name='aMethod_${minor_num}' value='1' ${cardClose || ''}           onClick="cashCheck('${minor_num}','','')">현금</label>
                    <label><input type=radio name='aMethod_${minor_num}' value='2' ${cardClose || ''}  checked  onClick="cardCheck('${minor_num}','','')">카드</label>
                </td>
                <input type='hidden' name='aMethod_${minor_num}' value='2'>
                <input type='hidden'  ID=cash_price_${minor_num} name='aCashAmount[]' value='0'>
                <td align=center ><input type=text style='width:70px;text-align:right' readonly class='wh90 form-control-sm dinherit input1 ' ID=card_price_${minor_num} name='aCardAmount[]' value='${numberFormat(card_price)}'></td>
                <td align=center ><select class=' dinherit input6 wh90 methodChangeChk' ID='aCardtype_${minor_num}' name='aCardtype[]'>${cardData}}</select></td>
                <td align=center class='nowrap'>
                    <input type=text  class=' form-control-sm dinherit pal0 ac wh60 methodChangeChk' readonly onfocus="this.removeAttribute('readonly')" maxlength=4 ID=aCardnum1_${minor_num} onkeyup="StrLimit(this.form.name,this.value,4,'aCardnum2_${minor_num}')"    name='aCardnum1[]' value='${aCard[0]}'>
                    <input type=text  class=' form-control-sm dinherit pal0 ac wh60 methodChangeChk' readonly onfocus="this.removeAttribute('readonly')" maxlength=4 ID=aCardnum2_${minor_num} onkeyup="StrLimit(this.form.name,this.value,4,'aCardnum3_${minor_num}')"    name='aCardnum2[]' value='${aCard[1]}'>
                    <input type=text  class=' form-control-sm dinherit pal0 ac wh60 methodChangeChk' readonly onfocus="this.removeAttribute('readonly')" maxlength=4 ID=aCardnum3_${minor_num} onkeyup="StrLimit(this.form.name,this.value,4,'aCardnum4_${minor_num}')"    name='aCardnum3[]' value='${aCard[2]}'>
                    <input type=text  class=' form-control-sm dinherit pal0 ac wh60 methodChangeChk' readonly onfocus="this.removeAttribute('readonly')" maxlength=4 ID=aCardnum4_${minor_num} onkeyup="StrLimit(this.form.name,this.value,4,'aExpiredate1_${minor_num}')" name='aCardnum4[]' value='${aCard[3]}'>
                </td>
                <td align=center >
                    <select class=' dinherit input6 methodChangeChk' ID=aExpiredate1_${minor_num} name='aExpiredate1[]' style='width:40%'>${ex1Data}</select>
                    <select class=' dinherit input6 methodChangeChk' ID=aExpiredate2_${minor_num} name='aExpiredate2[]' style='width:55%'>${ex2Data}</select>
                </td>
                <td align=center >
                    <select class=' dinherit input6 wh70 methodChangeChk' ID=aInstallment_${minor_num} name='aInstallment[]' >${insData}</select>
                </td>
                <td>
                    <input type=text class='wh100 methodChangeChk' readonly onfocus="this.removeAttribute('readonly')" name='aCardHolder[]' id=aCardHolder_${minor_num} value='${card_holder}' >
                </td>
                <td>
                    <select id='aPaxRelation_${minor_num}' name='aPaxRelation_${minor_num}'><option value=''>${paxRelData}</select>
                </td>

            </tr>
            <tr ID=cardHolder_${minor_num} style='display:'>
                <td colspan= valign='top' colspan='2'>${status}</td>
                <td colspan='2' title=''>
                    <label><input type=radio name='aSelectCard_${minor_num}' ${cardClose || ''} class='aSelectCard_${minor_num} methodChangeChk' ${SelectCard === 'C' ? 'checked' : ''} value='C' >개인카드</label> 
                    <label><input type=radio name='aSelectCard_${minor_num}' ${cardClose || ''} class='aSelectCard_${minor_num} methodChangeChk' ${SelectCard === 'B' ? 'checked' : ''} value='B' >법인카드</label></td>
                <td  style='border:1 solid red'>비밀번호(앞2자리) <input type=text class=' methodChangeChk' readonly onfocus="this.removeAttribute('readonly')" name=aCardPasswd[] id=aCardPasswd_${minor_num} value='${card_pass}' size=3 maxlength=2></td>
                <td  style='border:1 solid red' colspan='2'>카드 소유자 생년월일(8자리) 또는 사업자 번호 <input type=text class=' methodChangeChk' readonly onfocus="this.removeAttribute('readonly')" name=aJumin2[] id=aJumin2_${minor_num} value='${jumin2}' size=8 maxlength=10></td>
                ${cardCopy}
            </tr>
	    `;
    }

    const routeDatas = `
    <div class='schedule pdw20'>
		<div class='border regis-tle-box shadow-sm'>
			<div class='schedule_title'>
				<p style='font-weight:700;'><span style='color:#da082f;'>&gt;</span>선택한 항공 스케줄</p>
				<p>#${uid},</p>
				<p>${deps.cutDateTime(order_date,"S")}</p>
			</div>
			<table class='schedule_i_box'>
				<tr>
					<td class="">구간 </td>
                    <td class="">PNR</td>
					<td class="wh80">항공편</td>
					<td>좌석</td>
					<td class="wh100">탑승일</td>
					<td class="wh60">출발</td>
					<td class="wh60">도착</td>
					<td>비행시간</td>
					<td>발권일시</td>
					<td>규정</td>
				</tr>
                ${routeData}
            </table>
        </div>
    </div>
    `;

    let pnrData   = RecLoc;
    let airData   = airPnr;
    let tlData    = deps.cutDateTime(TL);
    let issueData = deps.cutDateTime(issue_date);
    if (hideWrite == "") {
        pnrData   = `<input type='text' class="form-control form-control-sm wauto ${hideCls}" ${hideWrite} onChange="dataChange('interline','${uid}','','RecLoc',this.value)"     value="${RecLoc}">`;
        airData   = `<input type='text' class="form-control form-control-sm wauto ${hideCls}" ${hideWrite} onChange="dataChange('interline','${uid}','','airPnr',this.value)"     value="${airPnr}">`;
        tlData    = `<input type='text' class="form-control form-control-sm wauto ${hideCls}" ${hideWrite} onChange="dataChange('interline','${uid}','','TL',this.value)"         value="${deps.cutDateTime(TL)}">`;
        issueData = `<input type='text' class="form-control form-control-sm wauto ${hideCls}" ${hideWrite} onChange="dataChange('interline','${uid}','','issue_date',this.value)" value="${deps.cutDateTime(issue_date)}">`;
    } 
    let statusOptions = Object.entries(arrInterGubun)
        .map(([k, v]) => `<option value="${k}" ${in_status === k ? 'selected' : ''}>${v}</option>`)
        .join('');
    let statusSelect = `
        <select onChange="dataChange('interline','${uid}','','in_status',this.value)" class="wh100   form-control-sm  ${hideCls} ${disWrite}">
            ${statusOptions}
        </select>`;
        
    let gdsOptions = Object.entries(arrGdsType)
        .map(([k, v]) => `<option value="${k}" ${atr_yes === k ? 'selected' : ''}>${v}</option>`)
        .join('');
    let gdsSelect = `
        <select onChange="dataChange('interline','${uid}','','atr_yes',this.value)" class="wh100   form-control-sm  ${hideCls} ${disWrite}">
            ${gdsOptions}
        </select>`;

    let typeOptions = Object.entries(arrInterType)
        .map(([k, v]) => `<option value="${k}" ${ticket_type === k ? 'selected' : ''}>${v}</option>`)
        .join('');
    let  typeSelect = `
        <select onChange="dataChange('interline','${uid}','','ticket_type',this.value)" class="wh100   form-control-sm  ${hideCls} ${disWrite}">
            ${typeOptions}
        </select>`;
    
    let dsrOptions = Object.entries(arrDsrType)
        .map(([k, v]) => `<option value="${k}" ${status === k ? 'selected' : ''}>${v}</option>`)
        .join('');
    let  dsrSelect = `
        <select onChange="dataChange('interline','${uid}','','status',this.value)" class="wh100   form-control-sm  ${hideCls} ${disWrite}">
            ${dsrOptions}
        </select>`;
    let gubunSelect = `
        <select onChange="dataChange('interline','${uid}','','ticket_gubun',this.value)" class="wh100   form-control-sm  ${hideCls} ${disWrite}">
            <option value=''>
            <option value='FIT'>FIT
            <option value='GROUP'>GROUP
        </select>`;
    let gradeSelect = `
        <select onChange="dataChange('interline','${uid}','','searchGrade',this.value)" class="wh100   form-control-sm  ${hideCls} ${disWrite}">
            <option value="">검색조건
            <option value="Y">Y
            <option value="C">C
            <option value="F">F
            <option value="VFR">VFR
            <option value="LBR">LBR
            <option value="STU">STU
        </select>`;

    if (b2bMASTER == "Y") {
        statusHTML = `
            <span class='fl'>
                ${statusSelect}
            </span>
            <span class='fl'>
                ${gdsSelect}
            </span>
            <span class='fl'>
                ${typeSelect}
            </span>
        `;
        statusHTML = `
            ${statusSelect} 
            ${gdsSelect}
            ${typeSelect}
        `;
        dsrHTML = `
            ${dsrSelect} 
            ${gubunSelect}
            ${gradeSelect}
        `;
    } else {
        statusHTML = arrInterGubun[in_status];
        dsrHTML = `
            ${dsrSelect} 
            ${gubunSelect}
            ${gradeSelect}
        `;
    }
    revDatas = `
    <div class='schedule pdw20'>
		<div class='border regis-tle-box shadow-sm'>
            <div class='schedule_title'>
                <p style='font-weight:700;'><span style='color:#da082f;'>&gt;</span>예약 정보</p>
            </div>
            <table>
				<tr>
					<td class="regis-hotel-td5">PNR</td>
					<td>
                        ${pnrData}
					</td>
					<td class="regis-hotel-td5">항공사 PNR</td>
					<td>
                        ${airData}
					</td>
					<td class="regis-hotel-td5">상태</td>
                    <td class="wh400">
                       ${statusHTML}
                    </td>
                </tr>
                <tr>
					<td class="regis-hotel-td5">TL</td>
					<td>
                        ${tlData}
					</td>
                    <td class="regis-hotel-td5">발권일</td>
					<td>
                        ${issueData}
					</td>
                    <td class=""></td>
                    <td class="">
                        ${dsrHTML}
                    </td>
                </tr>
            </table>
        </div>
    </div>
    `;

    let dayoutTel = '';
    let mem = `성인 : ${adult_member}`;
    if (child_member > 0)  mem += `,소아 : ${child_member}`;
    if (infant_member > 0) mem += `,유아 : ${infant_member}`;

    if (tel_number)   tel_number   = deps.aes128Decrypt (deps.getNow().aviaSecurityKey,tel_number);
    if (manager_tel2) manager_tel2 = deps.aes128Decrypt (deps.getNow().aviaSecurityKey,manager_tel2);
    if (dep_tel)      dep_tel      = deps.aes128Decrypt (deps.getNow().aviaSecurityKey,dep_tel);
    if (arr_tel)      arr_tel      = deps.aes128Decrypt (deps.getNow().aviaSecurityKey,arr_tel);
    memberDatas = `
    <div class='schedule pdw20'>
		<div class='border regis-tle-box shadow-sm'>
            <div class='schedule_title'>
                <p style='font-weight:700;'><span style='color:#da082f;'>&gt;</span>탑승인원</p>
            </div>
            <table>
				<tr>
					<td class="regis-hotel-td5">인원</td>
					<td class='al'>
                        ${mem}
					</td>
					<td class="regis-hotel-td5">거래처명</td>
					<td class='al'>
						<div id="siteBefore"  ondblClick=' siteChange() '><p>${site_name} ${site_manager}  </p></div>
						<div id="siteAfter" style="display:none"><input type='text' class="form-control form-control-sm wauto " onChange="dataChange('${uid}','0','site_code',this.value)" value="${site_code}"></div>
					</td>
                    <td class="regis-hotel-td5">고객명</td>
                    <td class='al' ondblClick="doubleChange('OrderA_0','OrderB_0')">
                        <div id='OrderA_0' >${order_name}</div>
                    </td>
                </tr>
                <tr>
                    <td class="regis-hotel-td5">이메일</td>
                    <td class='al'>
                        <input type='text' class=' form-control-sm wauto' onChange="dataChange('interline','${uid}','','email',this.value)" value="${email}">
                        <span class="btn_basic btn_blue  airSend ${hideCls} none" onCLick="return gdsContactSend('${uid}')">항공사 전송</span>
                    </td>
                    <td class="regis-hotel-td5">핸드폰</td>
                    <td class='al'>
                        <input type='text' class=' form-control-sm wauto' onChange="dataChange('interline','${uid}','','dep_tel',this.value)" value="${dep_tel}">
                    </td>
                    <td class="regis-hotel-td5">비상 연락처</td>
                    <td class='al'>
                        <input type='text' class=' form-control-sm wauto' onChange="dataChange('interline','${uid}','','arr_tel',this.value)" value="${arr_tel}">
                    </td>
                </tr>
                <tr>
					<td class="regis-hotel-td5">TL</td>
					<td class='al'>
						<input type='text' class=' form-control-sm wauto' name="TL" readonly onChange="dataChange('interline','${uid}','','TL',this.value)"  value="${deps.cutDateTime(arrRouteData['TL'][0])}">
					</td>
                    <td class="regis-hotel-td5">발권일</td>
					<td class='al'>
						<input type='text' class=' form-control-sm wauto' name="TL" readonly onChange="dataChange('interline','${uid}','','issue_date',this.value)"  value="${deps.cutDateTime(issue_date)}">
					</td>
                    <td class="regis-hotel-td5"></td>
					<td class='al'>
					</td>
                </tr>
            </table>
        </div>
    </div>
    `;
    

    sqlText = `select count(*) as cnt from interline_pax where uid_minor = @uid and method_type = '2'`;
    result  = await pool.request().input('uid',sql.Int , uid).query(sqlText);
    const cardCount     = result.recordset[0]?.cnt
    sqlText = `select count(*) as cnt from interline_pax where uid_minor = @uid and ( method_type = '1' or cash_price > 0 ) `;
    result  = await pool.request().input('uid',sql.Int , uid).query(sqlText);
    const cashCount     = result.recordset[0]?.cnt
    sqlText = `select tr_il + tr_si as cnt from vavs.dbo.VACS_AHST where gubun in ('51','53') and airOrder = @uid and bankOwner = 'OYE' and void is null `;
    result  = await pool.request().input('uid',sql.Int , uid).query(sqlText);
    const visualDate = result.recordset[0]?.cnt || '';
    sqlText = `select tr_il + tr_si as cnt from vavs.dbo.VACS_AHST where gubun = '48' and airOrder = @uid and bankOwner = 'OYE' and void is null  `;
    result  = await pool.request().input('uid',sql.Int , uid).query(sqlText);
    const voidDate = result.recordset[0]?.cnt || '';

    let memPrice        = '';
    let mChk1           = '';
    let mChk2           = '';
    let issueCommData   = '';
    let customPriceData = '';
    let viewBill        = '';
    let cardDate        = '';
    if (child_member  > 0) memPrice += `<br>소아 : ${(child_amount+issueComm2).toLocaleString()}(항공료) + ${child_tax.toLocaleString()}(텍스) * ${child_member}명 = ${((child_amount+child_tax+issueComm2)*child_member).toLocaleString()}원 `;
    if (infant_member > 0) memPrice += `<br>소아 : ${infant_amount.toLocaleString()}(항공료) + ${infant_tax.toLocaleString()}(텍스) * ${infant_member}명 = ${((infant_amount+infant_tax)*infant_amount).toLocaleString()}원 `;
    if (customPrice > 0)   customPriceData = `<span Id="issuePrice1" class="pal30 cored" ondblClick="priceChange ('issue')"> 판매가 : ${customPrice.toLocaleString()}원  </span>`;
    if (issueComm > 0 || issueCommSite > 0) { 
        if (tasfAuthType == "T")      mChk1 = "checked";
        else if (tasfAuthType == "I") mChk2 = "checked";
        if (cardDate == "" && cardCount > 0) {
            issueCommData = `
                <span >
                    <label><input type='radio' value='T' name='tasfAuthType' onChange="dataChange('interline_minor','${uid}','0','tasfAuthType',this.value)" class='wh30 hh15' ${mChk1} >성인1 통합승인</label> &nbsp; 
                    <label><input type='radio' name='tasfAuthType' value='I'  onChange="dataChange('interline_minor','${uid}','0','tasfAuthType',this.value)" class='wh30 hh15' ${mChk2}>개별승인</label> 
                </span>
            `;
        } else {
            issueCommData = ` / 승인 `+deps.cutDate(cardDate);
        }
    } 

    if(auth_number > 0 && tasfAuthType == "T") { 
        viewBill = `
        <span>	
            <a href="javascript://" onclick="return cardView2('${card_auth_uid}')">수수료영수증 보기</a>
        </span>
        `;
    }
    let cardData = '';
    let cardBill = '';
    if (b2bMASTER == "Y" && issueComm > 0) { 
        if (in_status === "9") cardData = "<font color='red'>승인불가(취소상태)</font>";
        else if (!cardDate) cardData =  `<button class='btn_basic btn_blue f14 PriceModify' onClick="return tasfConfirm('${uid}','${issueComm*members2}')">발권수수료승인</button>`;
        else cardData = ` / 승인 ${cutDate(cardDate)} `;
    }
    if (card_auth_uid > 0) { 
        cardBill = `<span class='btn_slim btn_yellow' onclick="return cardView2('${card_auth_uid}">수수료영수증 보기</span>`;
    }

    priceDatas = `
    <div class='schedule pdw20'>
		<div class='border regis-tle-box shadow-sm'>
            <div class='schedule_title'>
                <p style='font-weight:700;'><span style='color:#da082f;'>&gt;</span>결제금액 정보</p>
            </div>
            <table>
                <tr>
                    <td class="regis-hotel-td5">총 결제 금액 </td>
                    <td><input onChange="dataChange('${uid}','0','total_amount',this.value)"  ${hideWrite} class='form-control form-control-sm  ${hideCls} wh80' value='${numberFormat(total_amount)}' style='display: inherit;'> 원</td>
                    <td class="regis-hotel-td5">대리점 입금가 : <input onChange="dataChange('${uid}','0','input_amount',this.value)"  ${hideWrite} class='form-control form-control-sm ${hideCls} wh80' value='${numberFormat(total_amount)}'style='display: inherit;'> 원</td>
                    <td class="regis-hotel-td5">
                        <div id='TASFA_0' ${ (b2bMASTER === "Y") ? ` ondblClick="cellChange('TASF','0')" ` : '' }> 발권수수료 : ${numberFormat(issueComm*members2)} 원
                        ${cardData}
                        ${cardBill}
                        </div>
                        <div id='TASFB_0' style='display:none'>발권수수료 : <input  onChange="dataChange('<?=$uid?>',0,'issueComm',this.value)" class='wh80 ac form-smooth ' value='<?=$mainRow["issueComm"]?>'> / 1인 금액</div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
    `;

    let buttons = `<span class='PriceModifyAlram none' ><font color='red'>결제방법 변경시는 '결재수단저장' 이후에 발권요청하시기 바랍니다.</font></span>`;

    if (in_status !== "4"  ) buttons += `<span class='btn_basic btn_purple f14 none' id='MethodSave' onClick="return priceCheck('${uid}')">결제수단저장</span>`;
    if (in_status < 4 && deps.StrClear(TL) < deps.getNow().NOWSTIME.slice(0,12) ) {
        buttons += `<span>TL 이 초과되어 발권이 진행되지 않습니다	${deps.cutDateTime(TL)}</span>`;
    } else if (in_status < 4 && in_status !== 'A' && QuoteDate &&  ( QuoteDate < deps.getNow().NOWS || Number(total_amount) === 0) ) {
        buttons += `<span class='btn_basic btn_blue f14' title='당일 발권 불가시 운임 수정 클릭해서 운임 재확인 하시고 자동 발권 해주세요' onClick="return priceReCheck('${uid}','opener')">예약하신 운임과 다를 수 있습니다. 발권전 운임을 재확인 하세요(클릭)</span>`;
    } else if (in_status === "4") {
        buttons += `<p class='f14 nom' >발권완료시간 : ${deps.cutDateTime(issue_date)}</span>`;
    } else if (in_status === "9") {
        buttons += `<span class='blink cored' >취소 완료</span>`;
    } else if (in_status < 4 && in_status !== 'A') {
             if (mainAirCode === "KE" && cardCount > 0  ) AutoIssue = "N";
        else if (mainAirCode === "PR" && atr_yes === "G") AutoIssue = "N";
        else if (atr_yes === "ATR"                      ) AutoIssue = "N";
        else if (Number(adult_member) === 0             ) AutoIssue = "N";
        else AutoIssue = "Y";
        if (cardCount > 0 || autoIssueNo === "Y" || atr_yes === "S" || AutoIssue === "N") {
            if (issue_req === "Y") {
                buttons += `<span>발권 요청 : ${deps.cutDateTime(issue_req_time,"S")}</span>`;
                buttons += `<span class='btn_basic btn_red f14' onClick="return issueStart('${uid}','X')">발권요청취소</span>`;
            } else {
                buttons += noNotice;
                buttons += `<span class='btn_basic btn_blue f14 PriceModify' onClick="return issueStart('${uid}','5')">발권요청</span>`;
            }
            if (cardCount > 0) buttons += `<span class='blink'><font color='red'>카드 발권은 발권 요청만 가능</font> ※증빙서류(카드사본)는 바로 첨부하여 주세요!</span>`;
        }
        if (IssueStop === "Y") {
            buttons += `<span class=' cored' >미확정 예약이므로 카운터에 연락 부탁드립니다.</span>`;
        } else if (quoteCount === 0){
            buttons += `<span class=' cored' >요금 불일치</span>`;
            buttons += `<span class='btn_basic btn_blue f14' title='요금 생성이 안되었거나 잘못되었을경우 사용합니다'  onClick="return priceReCheck('${uid}','opener')">운임을 재생성합니다.(클릭)</span>`;
        } else {
            if (b2bMASTER === "Y" && AutoIssue === "Y") {
                buttons += `<span class='btn_basic btn_blue f14 PriceModify' onClick="return issueStart('${uid}','4')">자동발권</span>`;
                if (cardCount === 0 && cashCount > 0)buttons += `<span class='coblue'>발권후잔액: ${Deposit - cashPriceTotal} 원 </span>`;
            } else {
                if (Deposit >= cashPriceTotal && cardCount === 0 && cashCount > 0) {
                    buttons += `<span class='btn_basic btn_blue f14 PriceModify' onClick="return issueStart('${uid}','4')">자동발권</span>`;
                } else if (visualDate.slice(0,8) === getNow().NOWS) {
                    buttons += `<span class='btn_basic btn_blue f14 PriceModify' onClick="return issueStart('${uid}','4')" title='발권중 오류로 재발권시도(클릭) 하세요. 1회 시도후 발권이 안될시에는 관리자에게 문의 하세요'>발권중 오류로 재발권</span>`;
                } else {
                    buttons += `<span class='blink'><font color='red'>잔액부족 ${(total_amount + issueComm) - Deposit}</font></span>`;
                }
            }
        }
    }
    paymentDatas = `
    <div class='schedule pdw20'>
		<div class='border regis-tle-box shadow-sm'>
            <div class='schedule_title'>
                <p style='font-weight:700;'><span style='color:#da082f;'>&gt;</span>결제수단</p>
            </div>
            <table>
                <tr>
                    <td class="">구분</td>
                    <td>결제방법</td>
                    <td>카드금액</td>
                    <td>종류</td>
                    <td>카드번호</td>
                    <td>유효기간</td>
                    <td>할부기간</td>
                    <td>카드홀더</td>
                    <td>탑승자관계</td>
                </tr>
                ${payDatas}
            </table>
            <div class='table-center mat10' >
                ${buttons}
            </div>
        </div>
    </div>
    `;

  
    sqlText = ` select a.* from dat_table as a where db_name = 'interline' and uid_minor = @uid  order by up_date desc   `;
    result  = await pool.request().input('uid',sql.Int , uid).query(sqlText);
    for (const row of result.recordset) {
        const {username , minor_num , content ,up_date } = row;
        logList += `
            <tr>    
                <td class="">${username}</td>
                <td class="">${content}</td>
                <td class="">${deps.cutDateTime(up_date)}</td>
                <td class="">Del</td>
            </tr>
        `;
    }  
    if (!logList) logList = `<tr><td class='ac' colspan='4'>등록된 댓글이 없습니다.</td></tr>`;

    logDatas = `
    <div class='schedule pdw20'>
		<div class='border regis-tle-box shadow-sm'>
            <div class='schedule_title'>
                <p style='font-weight:700;'><span style='color:#da082f;'>&gt;</span>메모</p>
            </div>
            <div class='schedule_title'>
			    <p><span class="btn_basic btn_blue " onClick="return interlineLogView('${uid}')">로그보기</span> <span>*상세한 로그를 확인할 수 있습니다.</span></p>
            </div>
            <table>
                <tr>
                    <td>작성자</td>
                    <td>내용</td>
                    <td>작성일시</td>
                    <td>삭제</td>
                </tr>
                ${logList}
            </table>
        </div>
    </div>
    `;

    if (!routeDatas) {
      return res.status(404).send("데이터 없음");
    }

    const jsonMain = JSON.stringify(mainData);
    res.json({ paxData: paxDatas , menu:menus , route:routeDatas , revData: revDatas , memberData: memberDatas , priceData:priceDatas , paymentData: paymentDatas , forms: jsonMain , logData: logDatas });
  } catch (err) {
    console.error("order_detail 오류:", err);
    res.status(500).send("서버 오류");
  } finally {
    //deps.sql.close();
  }

};