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

    let cashPriceTotal = 0;
    let mainAirCode    = '';
    let sqlText        = '';;
    let airCode	       = FirstAir ? FirstAir.slice(0,2) : '';
    let issueComm1     = issueCommAdt;
    let issueComm2     = issueCommChd;
    let IssueStop      = '';
    let depoButton;
    let payData        = '';
    let disForce       = '';
    let cardDis        = '';
    let cardTitle      = '';
    let AutoIssue      = '';
    let Year           = deps.getNow().YY;
    if (main_air) mainAirCode = main_air;
    else mainAirCode = airCode;
    if (in_status < '9') {
        if (b2bMASTER == "Y") {
            depoButton = `
                <span class="btn_basic btn_purple"  onClick="return depoInformatioin('${uid}')">입금안내</span>
            `;
        }
        menubutton = `
        <span class="btn_basic btn_gray"    onClick="return orderPrint('${uid}')">예약증</span>
        <span class="btn_basic btn_blue"    onClick="return OneQna('${uid}')">1:1 문의</span>
        ${depoButton}
        <span class="btn_basic btn_purple"  onClick="return invoice('${deps.aes128Encrypt(deps.getNow().aviaSecurityKey, uid)}', '')">인보이스</span>
        <span class="btn_basic btn_purple"  onClick="return invoiceWrite('${deps.aes128Encrypt(deps.getNow().aviaSecurityKey, uid)}', '')">인보이스작성</span>
        <span class="btn_basic btn_yellow"  onClick="return reissueCreate('${uid}')">재발행주문서생성</span>
        <span class="btn_basic btn_mint"    onClick="return reissueSearch('${uid}')">재발행 검색</span>
        
        `;
    };
    let menus = `
        <div class='border regis-tle-box shadow-sm mw20 mat10'>
            <div class="d-inline regis-tle" style="font-size:1.2em;">
                예약정보확인
                ${menubutton}
                <span class="btn_basic btn_blue fr" onClick="return ruleDetail('${uid}')">규정보기</span>
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
        result = await pool.request().input('uid',deps.sql.Int , uid).query(sqlText);
        quoteCount = result.recordset[0].cnt;
    }

    const cardSql = `SELECT TOP 1 * FROM card_auth WHERE interline_uid = ${uid} AND result_code = 'O' `;
    const resultCard = await pool.request().query(cardSql);
    const cardRow = resultCard.recordset[0]; // 첫 번째 결과 row
    const card_auth_uid = cardRow?.uid || '';
    const auth_number   = cardRow?.auth_number || '';

    const routeSql = `
        SELECT a.*,
        (SELECT cityName FROM [airPort_code] WHERE SUBSTRING(a.citycode,1,3) = portCode) AS depName,
        (SELECT cityName FROM [airPort_code] WHERE SUBSTRING(a.citycode,4,3) = portCode) AS arrName,
        (SELECT addressReq FROM [airPort_code] WHERE SUBSTRING(a.citycode,1,3) = portCode) AS addressReq1,
        (SELECT addressReq FROM [airPort_code] WHERE SUBSTRING(a.citycode,4,3) = portCode) AS addressReq2
        FROM interline_routing AS a
        WHERE uid_minor = '${uid}' AND a.minor_num < 100
        ORDER BY minor_num
    `;
    result = await pool.request().query(routeSql);
    const routeRow = result.recordset;

    let logList    = '';
    let routeData  = '';
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
        const { cabinClass, citycode, air_code, minor_num , depName, arrName , OperatingAirline , air_class , in_date
            , start_time1 , start_time2 , out_date , seat_status , Groups , Flt_time , ex_baggage , Locn , terminal
        } = trimmedRow;
    
        let dep = citycode.substring(0,3);
	    let arr = citycode.substring(3,6);

        if (seat_status !== "HK") IssueStop = "Y";

        if (b2bMASTER === 'Y') {
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

                    <td ondblclick="doubleChange('AirA_${minor_num}','AirB_${minor_num}')">
                    <div id="AirA_${minor_num}">${air_code}</div>
                    <div id="AirB_${minor_num}" style="display:none">
                        <input onChange="dataChange('interline_routing','${uid}','${minor_num}','air_code',this.value)" ${hideWrite} class="form-control form-control-sm ${hideCls} mwa wh80 ac" value="${air_code}">
                    </div>
                    </td>

                    <td ondblclick="doubleChange('ShareA_${minor_num}','ShareB_${minor_num}')">
                    <div id="ShareA_${minor_num}">${airImg}</div>
                    <div id="ShareB_${minor_num}" style="display:none">
                        <input onChange="dataChange('interline_routing','${uid}','${minor_num}','OperatingAirline',this.value)" ${hideWrite} class="form-control form-control-sm ${hideCls} mwa wh40 ac" value="${OperatingAirline}">
                    </div>
                    </td>

                    <td ondblclick="doubleChange('CabinA_${minor_num}','CabinB_${minor_num}')">
                    <div id="CabinA_${minor_num}">${cabinClass || '&nbsp;'}</div>
                    <div id="CabinB_${minor_num}" style="display:none">
                        ${cabinSelect}
                    </div>
                    </td>

                    <td ondblclick="doubleChange('ClsA_${minor_num}','ClsB_${minor_num}')">
                    <div id="ClsA_${minor_num}">${air_class}</div>
                    <div id="ClsB_${minor_num}" style="display:none">
                        <input onChange="dataChange('interline_routing','${uid}','${minor_num}','air_class',this.value)" ${hideWrite} class="form-control form-control-sm ${hideCls} mwa wh30 ac" value="${air_class}">
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

                    <td ondblclick="doubleChange('Date2A_${minor_num}','Date2B_${minor_num}')">
                    <div id="Date2A_${minor_num}">${deps.cutDate(out_date)}</div>
                    <div id="Date2B_${minor_num}" style="display:none">
                        <input onChange="dataChange('interline_routing','${uid}','${minor_num}','out_date',this.value)" ${hideWrite} class="form-control form-control-sm ${hideCls} mwa wh100 ac" value="${out_date}">
                    </div>
                    </td>

                    <td ondblclick="doubleChange('Time2A_${minor_num}','Time2B_${minor_num}')">
                    <div id="Time2A_${minor_num}">${deps.cutTime(start_time2)}</div>
                    <div id="Time2B_${minor_num}" style="display:none">
                        <input onChange="dataChange('interline_routing','${uid}','${minor_num}','start_time2',this.value)" ${hideWrite} class="form-control form-control-sm ${hideCls} mwa wh60 ac" value="${start_time2}">
                    </div>
                    </td>

                    <td ondblclick="doubleChange('SeatStatusA_${minor_num}','SeatStatusB_${minor_num}')">
                    <div id="SeatStatusA_${minor_num}">${seat_status} ${Groups}</div>
                    <div id="SeatStatusB_${minor_num}" style="display:none">
                        <input onChange="dataChange('interline_routing','${uid}','${minor_num}','seat_status',this.value)" ${hideWrite} class="form-control form-control-sm ${hideCls} mwa wh40 ac" value="${seat_status}">
                    </div>
                    </td>

                    <td ondblclick="doubleChange('Flt_timeA_${minor_num}','Flt_timeB_${minor_num}')">
                    <div id="Flt_timeA_${minor_num}">${deps.FltTmCheck(Flt_time)}</div>
                    <div id="Flt_timeB_${minor_num}" style="display:none">
                        <input onChange="dataChange('interline_routing','${uid}','${minor_num}','Flt_time',this.value)" ${hideWrite} class="form-control form-control-sm ${hideCls} mwa wh100 ac" value="${Flt_time}">
                    </div>
                    </td>

                    <td title="성인기준" ondblclick="doubleChange('Ex_bagA_${minor_num}','Ex_bagB_${minor_num}')">
                    <div id="Ex_bagA_${minor_num}">${ex_baggage}</div>
                    <div id="Ex_bagB_${minor_num}" style="display:none">
                        <input onChange="dataChange('interline_routing','${uid}','${minor_num}','ex_baggage',this.value)" style="ime-mode:inactive" ${hideWrite} class="form-control form-control-sm ${hideCls} ac mwa" value="${ex_baggage}">
                    </div>
                    </td>
                    <td class='ac '><input onChange="dataChange('interline_routing','${uid}','${minor_num}','Locn',this.value)"  style='ime-mode:inactive' ${hideWrite} class='form-control form-control-sm ${hideCls}  ac   ' value='${Locn}'></td>
			        <td><input onChange="dataChange('interline_routing','${uid}','${minor_num}','terminal',this.value)"   style='ime-mode:inactive' ${hideWrite} class='form-control form-control-sm ${hideCls}  ac  mwa' value='${terminal}'></td>
                </tr>
            `;
        } else {
            if (HiddenStop != "") HiddenStop = `<br>${HiddenStop}`;
            routeData += `
                <tr>
                    <td>${minor_num}. $depName → $arrName $HiddenStop</td>
                    <td>$air_code</td>
                    <td>$airImg</td>
                    <td>$cabinClass</td>
                    <td>$air_class</td>
                    <td>".CutDate($in_date)."</td>
                    <td>".CutTime($start_time1)."</td>
                    <td>".CutDate($out_date)."</td>
                    <td>".CutTime($start_time2)."</td>
                    <td>$seat_status</td>
                    <td>".FltTmCheck($Flt_time)."</td>
                    <td title='성인기준'>$ex_baggage</td>
                    <td>$Locn</td>
			        <td>$terminal</td>
                </tr>
            `;
        }
    }

    let routeDatas = `
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
					<td class="wh80">항공편</td>
					<td>공동</td>
					<td>캐빈</td>
					<td class="wh40">CLS</td>
					<td class="wh100">탑승일</td>
					<td class="wh60">출발시간</td>
					<td class="wh100">도착일</td>
					<td class="wh60">도착시간</td>
					<td class="wh50">상태</td>
					<td>비행시간</td>
					<td class="wh90">Bag</td>
					<td class="wh90">좌석</td>
					<td class="wh50">터미널</td>
				</tr>
                ${routeData}
            </table>
        </div>
    </div>
    `;


    const billQuery = `select ResultMsg , auth_number , uid as cardUid , minor_num as minorNum   from interline_card where uid_minor = '${uid}' and void is null order by uid desc `;
    const resultBill = await pool.request().query(billQuery);
    const billRow = resultBill.recordset;

    const aCardData = {};
    for (const row of billRow) {
        aCardData[row.minorNum] ??= {};
        aCardData[row.minorNum]["MSG"]  = row.ResultMsg || '';
        aCardData[row.minorNum]["AUTH"] = row.auth_number || '';
        aCardData[row.minorNum]["UID"]  = row.cardUid || '';
    }
    const paxQuery = `
        SELECT a.*, 
                b.ticket_type, 
                c.out_number, 
                c.re_ok, 
                c.uid AS ref_uid, 
                card.uid AS cardUid,
                (
                SELECT uid 
                FROM interline_bill 
                WHERE uid_minor = a.uid_minor 
                    AND minor_num = a.minor_num 
                    AND void IS NULL 
                    AND auth_num != ''
                ) AS uidCashNum
        FROM interline_pax AS a
        LEFT OUTER JOIN AirTickets AS b 
            ON a.ticket_number = b.air_line_code + b.ticket_number 
        AND b.ticket_type IN ('S', 'N', 'V', 'I', 'E')
        LEFT OUTER JOIN air_refund AS c 
            ON a.ticket_number = c.air_line_code + c.ticket_number
        LEFT OUTER JOIN card_auth AS card 
            ON card.interline_uid = a.uid_minor 
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

    for (const row of paxRow) {
        const trimmedRow = {};
        for (const [key, val] of Object.entries(row)) {
            trimmedRow[key] = val === null ? '' : (typeof val === 'string' ? val.trim() : val);
        }
        let {
            eng_name1 , eng_name2 , birthday , expire , passport , country , sex ,ticket_number , ticket_number2 ,card_type , card_number , expire_date, cash_price , card_price
            , ticket_type, out_number, re_ok, minor_num , ref_uid, cardUid , uidCashNum , refund_req , method_type , installment , card_holder , jumin2 , SelectCard , paxrelation
        } = trimmedRow;

        if (birthday.length > 20) birthday = deps.aes128Decrypt (deps.getNow().aviaSecurityKey,birthday);
        if (expire.length   > 20) expire   = deps.aes128Decrypt (deps.getNow().aviaSecurityKey,expire);
        if (passport.length > 20) passport = deps.aes128Decrypt (deps.getNow().aviaSecurityKey,passport);
        let addHTML      = '';
        let countryData  = '';
        let genData      = '';
        let cardData     = '';
        let ex1Data      = '';
        let ex2Data      = '';
        let first_ticket = '';
        let refundData   = '';
        let view2        = '';
        let auth         = '';
        let cardAuth     = '';
        let issueCount   = 0;
        let NOWSTIME     = deps.getNow().NOWSTIME;
        let week         = deps.getNow().Week;
        let time         = NOWSTIME.slice(8.12);
        let addTicket    = '';
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
        if (in_status == "4") {
            html = `
                <td>${eng_name1} / ${eng_name2}</td>
                <td>${genName}</td>
                <td>${countryName}</td>
                <td>${birthday}</td>
                <td>${passport}</td>
                <td>${expire}</td>
                <td class='none'>${tel_number}</td>
            `;
        } else {
            html = `
                <td>
                    <input type='text' name='tename1_${minor_num}' id='tename1_${minor_num}' ${read4} ${hideWrite} ${hideWrite5} onChange="dataChange('interline_pax','${uid}','${minor_num}','eng_name1',this.value)" value='${eng_name1}' class='f_name form-control form-control-sm ${hideCls}'> / 
                    <input type='text' name='tename2_${minor_num}' id='tename2_${minor_num}' ${read4} ${hideWrite} ${hideWrite5} onChange="dataChange('interline_pax','${uid}','${minor_num}','eng_name2',this.value)" value='${eng_name2}' class='l_name form-control form-control-sm ${hideCls}'>
                </td>
                <td>
                    <select class='wh80' name='tsex_${minor_num}'  id='tsex_${minor_num}' ${disWrite} ${disWrite5} onChange="dataChange('interline_pax','${uid}','${minor_num}','sex',this.value)">
                        <option value=''>
                        ${genData}
                    </select>
                </td>
                <td>
                    <select class=' wh100' name=tcountry_${minor_num} id=tcountry_${minor_num} ${hideCls4} onChange="dataChange('interline_pax','${uid}','${minor_num}','country',this.value)">
                        <option value=''>
                        ${countryData}
                    </select>
                </td>
                <td><input type='text' class='form-control form-control-sm $hideCls4' ${hideWrite4} name='tbirth_${minor_num}' id='tbirth_${minor_num}'  onChange="return RevDateCheck(this.value,'BIRTH','${minor_num}','${uid}')"  value='${birthday}'></td>
                <td class='ac'><input type='text' class='form-control form-control-sm $hideCls4' ${hideWrite4} name='tpassport_${minor_num}' id='tpassport_${minor_num}' onChange="dataChange('interline_pax','${uid}','${minor_num}','passport',this.value)"  value='${passport}'></td>
                <td class='ac'><input type='text' class='form-control form-control-sm $hideCls4' ${hideWrite4} name='texpire_${minor_num}' id='texpire_${minor_num}'  onChange="return RevDateCheck(this.value,'EXPIRE','${minor_num}','${uid}')" value='${expire}'></td>
                <td class='none'><input type='text' class='form-control form-control-sm $hideCls4 ' ${hideWrite4} onChange="return dataChange('interline_pax','${uid}','${minor_num}','tel_number',this.value)"  value='${tel_number}'></td>
            `;
        }

        if (ticket_number !== '' || [4, 5].includes(in_status) || issueCount > 0) {
            if (!first_ticket) {
              air_line_code = ticket_number.substring(0, 3);
              first_ticket = ticket_number.slice(-10);
            }
          
            const read11 = ticket_number !== '' ? 'readonly' : '';
          
            // 환불 상태 처리
            let refund_type = '';
            let siteref_uid = '';
            if (ref_uid && (out_number !== '' || re_ok === 'Y')) {
              ref_status = `<font color=red>환불완료</font>`;
            } else if (ref_uid) {
              if (b2bMASTER === 'Y' || (b2bMASTER === 'X' && b2bSiteCode === bspSiteCode)) {
                ref_status = `<span class='btn_basic btn_yellow' onClick="createRefund('${ticket_number.slice(3)}','${air_line_code}','${refund_type}','${siteref_uid}','${uid}','${ref_uid}')">환불대기</span>`;
              } else {
                ref_status = `<span class='btn_basic btn_yellow'>환불대기</span>`;
              }
            } else if (ticket_type === 'V') {
              ref_status = `<span class='btn_basic btn_red'>Void 완료</span>`;
            } else {
              ref_status = '';
              const allowRefund = (b2bMASTER === 'Y' || (b2bMASTER === 'X' && b2bSiteCode === bspSiteCode));
          
              if (allowRefund) {
                ref_status += `<span class='btn_basic btn_red font14' onClick="return createRefund('${ticket_number.slice(3)}','${ticket_number.slice(-10)}','','','${uid}','')">환불접수</span>&nbsp;`;
              }
          
              if (refund_req === 'Y') {
                const cxl = (allowRefund) ? `ondblClick="return cancelRefund('${uid}','${minor_num}','')"` : '';
                ref_status += `<span class='btn_basic btn_gray' ${cxl}>환불요청 ${CuTDateTime(refund_req_time, "S")}</span>`;
              } else if (NOWSTIME > '20230927150000' && NOWSTIME < '20231004090000') {
                ref_status += `<span class='btn_basic btn_purple' onClick="alert('3월 2일 오전 9시 이후에 신청하여 주세요')">환불요청</span>`;
              } else if (NOWSTIME > '20231229150000' && NOWSTIME < '20240102090000') {
                ref_status += `<span class='btn_basic btn_purple' onClick="alert('1월 2일 오전 9시 이후에 신청하여 주세요')">환불요청</span>`;
              } else if (NOWSTIME > '20240208150000' && NOWSTIME < '20240213090000') {
                ref_status += `<span class='btn_basic btn_purple' onClick="alert('2월 13일 오전 9시 이후에 신청하여 주세요')">환불요청</span>`;
              } else if (NOWSTIME > '20240913150000' && NOWSTIME < '20240919090000') {
                ref_status += `<span class='btn_basic btn_purple' onClick="alert('9월 19일 오전 9시 이후에 신청하여 주세요')">환불요청</span>`;
              } else if ((/[06]/.test(week) || time > '1800') && b2bMASTER !== 'Y' && b2bSiteCode === site_code) {
                ref_status += `<span class='btn_basic btn_purple' onClick="alert('17시 이후에는 환불접수 불가능합니다 \\r\\n(평일09시~16시59분까지 접수가능)')">환불요청</span>`;
              } else if (b2bSiteCode === site_code) {
                ref_status += `<span class='btn_basic btn_red font14' onClick="return reqRefund('${uid}','${ticket_number.slice(3)}','${ticket_number.slice(0,3)}')">환불요청</span>`;
              }
            }
          
            // 티켓 번호 추가 입력창
            if (ticket_number2 !== '') {
              addTicket = `<input size=18 onChange="dataChange('interline_pax','${uid}','${minor_num}','ticket_number2',this.value)" ${read11} class='form-control-sm  wh130' value='${ticket_number2}'>`;
            }
          
            const air = ticket_number.slice(0, 3);
            const tkt = ticket_number.slice(-10);
          
            if (air && ticket_type && b2bMASTER === 'Y') {
              view = `<span class='btn_basic btn_yellow' onClick="modTicket('${tkt}','${ticket_type}','${air}')">티켓보기</span>`;
            } else if (air && !ticket_type && b2bMASTER === 'Y') {
              view = `<span class='btn_basic btn_blue' onClick="ticketCreate('${uid}','${minor_num}')">티켓생성</span>`;
              if (minor_num === '1') {
                view += `<span class='btn_basic btn_yellow' onClick="ticketAutoCreate('${uid}')">티켓 자동 생성</span>`;
              }
            } else if (!air && /A|G/i.test(mainRow.atr_yes)) {
              view = `<span class='btn_basic btn_red' onClick="return ticketErrorIssue('${uid}','${minor_num}')">티켓 오류 재발권</span>`;
            } else {
              view = '';
            }
          
            if (b2bMASTER === 'Y' && !eng_name1 && !eng_name2) {
              Del = `<span class='btn_basic btn_red' ondblClick="paxDel('${uid}','${minor_num}')">Del</span>`;
            } else {
              Del = '';
            }
          
            refundData += refundData ? `,${ticket_number}` : ticket_number;
          
            // 최종 HTML 추가
            addHTML = `
              <tr>
                <td align="center" colspan="1">${Del}</td>
                <td align="center" colspan="1">${ref_status}</td>
                <td colspan=3 style="padding:0 0 0 8">티켓번호 :
                  <input size=18 onChange="dataChange('interline_pax','${uid}','${minor_num}','ticket_number',this.value)" ${hideWrite} class="  form-control-sm ${hideCls} wh130" value="${ticket_number}">
                  ${addTicket}
                </td>
                <td>${view}</td>
                <td>${view2}</td>
                
              </tr>
            `;
            //<td colspan="2">${auth} ${auth_print} ${sale_target}</td>
          
            issueCount++;
        } else {
            addHTML = '';
        }
          

        paxHTML += `
            <tr class='passenger_box'>
                <td class='ac nowrap'> Pax ${minor_num} </td>
                ${html}
            </tr>
            ${addHTML}
        `;
        
        card_number = card_number ? (deps.aes128Decrypt (deps.getNow().aviaSecurityKey,card_number)) : '';
        expire_date = expire_date ? (deps.aes128Decrypt (deps.getNow().aviaSecurityKey,expire_date)) : '';

        let aCard = deps.cardNumSplit(card_number);
        let ex2   = expire_date.slice(0,4);
        let ex1   = expire_date.slice(5,7);
        if (card_price === null) card_price = 0;
        if (cash_price === null) cash_price = 0;
        if (method_type == "2") {
            check2_1 = ""; 
            check2_2 = "checked"; 
            none     = '';
        } else {
            check2_1 = "checked";
            check2_2 = "";
            none     = 'none';
        }

        cardData = `<option value=''>선택`;
        for (const [key , val] of Object.entries(arrCardType)) {
            const selected = key === card_type ? 'selected' : '';
            cardData += `<option value='${key}' ${selected} >${val}`;
        };
        ex1Data = `<option value=''>선택`;
        for (let dCount = 1 ; dCount < 13 ; dCount ++) {
            const selected1 = dCount === ex2 ? 'selected' : '';
            ex1Data += `<option value='${dCount}' ${selected1}>${dCount} 월`;
        }
        ex2Data = `<option value=''>선택`;
        for (let dCount = Year ; dCount < Year + 11 ; dCount ++) {
            const selected2 = dCount === ex2 ? 'selected' : '';
            ex2Data += `<option value='${dCount}' ${selected2}>${dCount} 년`;
        }
        insData = `<option value=''>선택`;
        for (let dCount = 1 ; dCount < 13 ; dCount ++) {
            const selected1 = dCount === installment ? 'selected' : '';
            insData += `<option value='${dCount}' ${selected1}>${dCount} 월`;
        }
        if (SelectCard == "B") check3_2 = "checked"; else check3_1 = "checked";
        paxRelData = Object.entries(arrPaxRelation)
        .map(([k, v]) => `<option value="${k}" ${paxrelation === k ? 'selected' : ''}>${v}</option>`)
        .join('');

        payData += `
            <tr  bgcolor=#FFFFFF>
                <td align=center ><input type=text class='form-control-sm dinherit input2' name='aPax2[]' readonly style='width:35px;text-align:center' value='${minor_num}'></td>
                <td align=center $cardTitle>
                    <label><input type=radio name='aMethod_${minor_num}' ${disForce} value='1' ${check2_1} onClick="cashCheck('${minor_num}','${sex}','')">현금</label>
                    <label><input type=radio name='aMethod_${minor_num}' ${disForce} ${cardDis} value='2' ${check2_2} onClick="cardCheck('${minor_num}','${sex}','')">카드</label>
                    
                </td>
                <td align=center ><input type=text readonly    class='form-control form-control-sm dinherit input1 wh90 ar' ID=cash_price_${minor_num} name='aCashAmount[]' value='${cash_price.toLocaleString()}'></td>
                <td align=center ><input type=text     onChange="cardCheck('${minor_num}','${sex}',this.value)" class='wh90 ar form-control-sm dinherit input1 ' ID=card_price_${minor_num} name='aCardAmount[]' value='${card_price.toLocaleString()}'></td>
                <td align=center ><select class=' dinherit input6 wh90 methodChangeChk' ID=aCardtype_${minor_num} name='aCardtype[]'>${cardData}</select></td>
                <td align=center >
                    <input type=text  class=' form-control-sm dinherit pal0 ac wh50 methodChangeChk' autocomplete='one-time-code'  maxlength=4 ID='aCardnum1_${minor_num}' onkeyup="StrLimit(this.form.name,this.value,4,'aCardnum2_${minor_num}')"     name='aCardnum1[]' value='${aCard[0]}'>
                    <input type=text  class=' form-control-sm dinherit pal0 ac wh50 methodChangeChk' autocomplete='one-time-code'  maxlength=4 ID='aCardnum2_${minor_num}' onkeyup="StrLimit(this.form.name,this.value,4,'aCardnum3_${minor_num}')"     name='aCardnum2[]' value='${aCard[1]}'>
                    <input type=text  class=' form-control-sm dinherit pal0 ac wh50 methodChangeChk' autocomplete='one-time-code'  maxlength=4 ID='aCardnum3_${minor_num}' onkeyup="StrLimit(this.form.name,this.value,4,'aCardnum4_${minor_num}')"     name='aCardnum3[]' value='${aCard[2]}'>
                    <input type=text  class=' form-control-sm dinherit pal0 ac wh50 methodChangeChk' autocomplete='one-time-code'  maxlength=4 ID='aCardnum4_${minor_num}' onkeyup="StrLimit(this.form.name,this.value,4,'aExpiredate1_${minor_num}')"  name='aCardnum4[]' value='${aCard[3]}'>
                </td>
                <td align=center >
                    <select class=' dinherit input6 methodChangeChk' ID=aExpiredate1_${minor_num} name='aExpiredate1[]' style='width:40%'>${ex1Data}</select>
                    <select class=' dinherit input6 methodChangeChk' ID=aExpiredate2_${minor_num} name='aExpiredate2[]' style='width:55%'>${ex2Data}</select>
                </td>
                <td align=center >
                    <select class=' dinherit input6 wh70 methodChangeChk' ID=aInstallment_${minor_num} name='aInstallment[]' >${insData}</select>
                </td>
            </tr>

            <tr ID='cardHolder_${minor_num}' style='display:${none}'>
                <td colspan=2>${cardAuth}</td>
                <td colspan=6>
                    <table border=0 cellpadding=2 cellspacing=0 width=100%>
                        <tr>
                            <td align='' colspan=''>카드홀더(카드소유자) :</td>
                            <td colspan=''><input type=text class='methodChangeChk' name='aCardHolder[]' id=aCardHolder_${minor_num} value='${card_holder}' autocomplete='one-time-code'>
                            <td><font color=red>탑승자와의 관계</font> : <select name='paxrelation_${minor_num}' class='methodChangeChk'><option value=''>${paxRelData}</select></td>
                            <td align='right'>${cardCopy}</td>
                        </tr>
                        <tr>
                            <td><label><input type=radio name='aSelectCard_${minor_num}' class='methodChangeChk' value='C' ${check3_1}>개인카드</label> <label><input type=radio name='aSelectCard_${minor_num}' class='methodChangeChk' value='B' ${check3_2}>법인카드</label></td>
                            <td  style='border:1 solid red'>비밀번호(앞2자리) <input type=password class='input1 methodChangeChk_ wh40' name=aCardPasswd[] id=aCardPasswd_${minor_num} value='${card_pass}' autocomplete='one-time-code' size=3 maxlength=2><font class='cowhite'>$card_pass</font></td>
                            <td  style='border:1 solid red'>생년월일(6자리)/사업자번호</td>
                            <td><input type='password' class='input1 methodChangeChk wh60' name='aJumin2[]' id='aJumin2_${minor_num}' value='${jumin2}' size='8' maxlength='10' autocomplete='one-time-code'><font class='cowhite'>${jumin2}</font></td>
                        </tr>
                        
                        
                        
                    </table>
                </td>
            </tr>
        `;
        cashPriceTotal += cash_price;
    }
    paxDatas = `
        <div class='schedule pdw20'>
            <div class='border regis-tle-box shadow-sm'>
                <div class='schedule_title'>
			    <p style='font-weight:700;'><span style='color:#da082f;'>&gt;</span>탑승자 정보</p>    
                <table class='passenger_box02'>
                    <tr>
                        <td class="wh40">No.</td>
                        <td>성함(성/이름)</td>
                        <td>성별</td>
                        <td>국적</td>
                        <td>생년월일</td>
                        <td>여권번호</td>
                        <td>유효기간</td>
                        <td class='none'>연락처(opt)</td>
                    </tr>

                    ${paxHTML}
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
    memberDatas = `
    <div class='schedule pdw20'>
		<div class='border regis-tle-box shadow-sm'>
            <div class='schedule_title'>
                <p style='font-weight:700;'><span style='color:#da082f;'>&gt;</span>탑승인원</p>
            </div>
            <table>
				<tr>
					<td class="regis-hotel-td5">인원</td>
					<td>
                        ${mem}
					</td>
					<td class="regis-hotel-td5">거래처명</td>
					<td>
						<div id="siteBefore"  ondblClick=' siteChange() '><p>${site_name} ${site_manager}  </p></div>
						<div id="siteAfter" style="display:none"><input type='text' class="form-control form-control-sm wauto " onChange="dataChange('${uid}','0','site_code',this.value)" value="${site_code}"></div>
						대표; ${deps.telNumber(tel_number)} ${dayoutTel} 알림용; ${deps.telNumber(manager_tel2)}
					</td>
                </tr>
                <tr>
                    <td class="regis-hotel-td5">이메일</td>
                    <td>
                        <input type='text' class=' form-control-sm wauto' onChange="dataChange('interline','${uid}','','email',this.value)" value="${email}">
                        <span class="btn_basic btn_blue  airSend ${hideCls} none" onCLick="return gdsContactSend('${uid}')">항공사 전송</span>
                    </td>
                    <td class="regis-hotel-td5">고객명</td>
                    <td ondblClick="doubleChange('OrderA_0','OrderB_0')">
                        <div id='OrderA_0' >${order_name}</div>
                        <div id='OrderB_0' style='display:none'>
                            <input type='text' class="form-control form-control-sm wauto ${hideCls}" <?=$hideWrite?> onChange="dataChange('interline','${uid}','','order_name',this.value)" value="${order_name}" name="order_name">
                        </div>
                    </td>
                </tr>
                <tr>
					<td class="regis-hotel-td5">대표 연락처</td>
					<td>
						<input type='text' class=' form-control-sm wauto' name="dep_tel" onChange="dataChange('interline','${uid}','','dep_tel',this.value)"  value="${dep_tel}">
						<span class="btn_basic btn_blue none airSend ${hideCls}" onCLick="return gdsContactSend('${uid}')">항공사 전송</span>
					</td>
                </tr>
            </table>
        </div>
    </div>
    `;
    

    sqlText = `select count(*) as cnt from interline_pax where uid_minor = @uid and method_type = '2'`;
    result  = await pool.request().input('uid',deps.sql.Int , uid).query(sqlText);
    const cardCount     = result.recordset[0]?.cnt
    sqlText = `select count(*) as cnt from interline_pax where uid_minor = @uid and ( method_type = '1' or cash_price > 0 ) `;
    result  = await pool.request().input('uid',deps.sql.Int , uid).query(sqlText);
    const cashCount     = result.recordset[0]?.cnt
    sqlText = `select tr_il + tr_si as cnt from vavs.dbo.VACS_AHST where gubun in ('51','53') and airOrder = @uid and bankOwner = 'OYE' and void is null `;
    result  = await pool.request().input('uid',deps.sql.Int , uid).query(sqlText);
    const visualDate = result.recordset[0]?.cnt || '';
    sqlText = `select tr_il + tr_si as cnt from vavs.dbo.VACS_AHST where gubun = '48' and airOrder = @uid and bankOwner = 'OYE' and void is null  `;
    result  = await pool.request().input('uid',deps.sql.Int , uid).query(sqlText);
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
    priceDatas = `
    <div class='schedule pdw20'>
		<div class='border regis-tle-box shadow-sm'>
            <div class='schedule_title'>
                <p style='font-weight:700;'><span style='color:#da082f;'>&gt;</span>결제금액 정보</p>
            </div>
            <table>
                <tr>
                    <td>항공권료</td>
                    <td colspan=3>
                        <div>
                            성인 : ${(air_amount+issueComm1).toLocaleString()} (항공료) + ${adult_tax.toLocaleString()}(택스) * ${adult_member}명 = ${((air_amount+adult_tax+issueComm1)*adult_member).toLocaleString()}원
                            ${memPrice}
                        </div>
                    </td>
                </tr>
                <tr>
					<td>총결제금액</td>
					<td>대리점 입금가 : ${(input_amount+issueComm).toLocaleString()} 원</td>
                    <td>
						${customPriceData}
						<span Id="issuePrice1" class="" ondblClick="priceChange ('issue')">
							발권수수료 : ${issueCommSite?.toLocaleString() || 0}원
						</span>
						<span Id="issuePrice2" class="hh35 " style="display:none">
                            발권수수료 : <input type='text' class='wh80 lm5 ar' onChange="dataChange('interline_minor','${uid}','0','issueCommSite',this.value)" name='issueCommSite' value='${issueCommSite?.toLocaleString() || 0}'>/1인(성인,소아)
						</span>

						${issueCommData}

						${viewBill}
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
                    <td>No</td>
                    <td>결제방법</td>
                    <td>현금금액</td>
                    <td>카드 금액</td>
                    <td>종류</td>
                    <td>카드번호</td>
                    <td>유효기간</td>
                    <td>할부기간</td>
                </tr>
                ${payData}
            </table>
            <div class='table-center mat10' >
                ${buttons}
            </div>
        </div>
    </div>
    `;

  
    sqlText = ` select a.* from dat_table as a where db_name = 'interline' and uid_minor = @uid  order by up_date desc   `;
    result  = await pool.request().input('uid',deps.sql.Int , uid).query(sqlText);
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