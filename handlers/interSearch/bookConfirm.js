const deps = require('../../src/common/dependencies');
const { arrCabinType } = require('../../src/utils/airConst');

module.exports = async (req, res) => {
    const data = req.body;
    const b2bMASTER = req.cookies.b2bMASTER;
 
    const { ticket_type , RouteCount ,  adt , chd , inf , departure , arrive  } = data;

    let tasfNone1 , tasfNone2 ;
    if (b2bMASTER !== "Y") tasfNone1 = "none";	
    else tasfNone2 = "none";	
    const air1 = data.airCode1.substring(0, 2);
    const air2 = data.airCode2.substring(0, 2);
    const air3 = data.airCode3.substring(0, 2);
    const air4 = data.airCode4.substring(0, 2);
    
    const pool = await deps.getPool();
    const airCodes = [air1, air2, air3, air4].filter(v => !!v); // 빈 값 제거
    const placeholders = airCodes.map((_, i) => `@code${i}`).join(", "); // '@code0, @code1, ...'
    const sql = `
    SELECT code_2, name, max_member, max_seg, issueLimit, autoIssueNo, noReason, issue_limit
        FROM airLine_code
        WHERE code_2 IN (${placeholders})
    `;
    const request = pool.request();
    airCodes.forEach((code, i) => {
        request.input(`code${i}`, code);
    });
    const airResult = await request.query(sql);
        
    // 결과 저장용 객체들
    const airName = {};
    const airMax = {};
    const airSeg = {};
    const airIssue = [];
    
    let   noReasonData = "";
    let   maxIssueLimit = null;
    let   success = '';
    let   msg  = '';

    // 결과 반복 처리
    airResult.recordset.forEach(row => {
        let { 
            code_2, name,max_member,max_seg,issueLimit,autoIssueNo,noReason,issue_limit,
        } = row;
        if (!max_member) max_member = 9;
        //if (Number(max_member) > 0) {
            airName[code_2] = name?.trim() || "";
            airMax[code_2] = max_member;
            airSeg[code_2] = max_seg;
            airIssue.push(issueLimit);
        //}
    
        if (autoIssueNo === "Y") {
            noReasonData = noReason?.trim() || "";
        }
    
        if (Number(issue_limit) > 0) {
            if (maxIssueLimit === null || maxIssueLimit > issue_limit) {
                maxIssueLimit = issue_limit;
            }
        }
    });
    

    const member  = adt + chd + inf;
    if (airMax[air1] !== undefined && airMax[air1] < member) {
        success = 'no';
        msg     = `${airName[air1]}항공은 최대 ${airMax[air1]}인 까지만 예약이 됩니다. 다시 검색해 주세요!`;
    }

    let noNotice = '';
    if (noReasonData) {
        noNotice = `
            <div class='ac hh30'>
                <span class='cored'>자동발권불가: ${noReasonData} <br>
            </div>
        `;
    }

    let vjNotice = '';
    if (air1 === "VJ") {
        vjNotice = `
            <div class='ac'>
                <span class='cored'>비엣젯 항공</span>은 취소시 환불이 거의 되지 않습니다. 환불 규정을 확인하세요. <br>
                이에 동의하시면 체크 후 예약 진행해주세요.<br>
                <label><input type='checkbox' id='vjAgree'> 동의하기</label><br><br>
            </div>
        `;
    }

    const groupRestrictedAirlines = /AV|AY|EY|LH|AF|KL|EK|NZ|ET|KQ/i;
    let groupNotice = "";
    if (groupRestrictedAirlines.test(air1)) {
        groupNotice = `
          <div class='ac'>
            <span class='cored'>${air1} 항공</span>은 같은 일정으로 9명을 초과할 수 없습니다. <br>
            ※ 10명 이상 예약은 단체 요청 부탁드립니다.<br>
            ※ 다른 주문서여도 같은 일정, 같은 항공사로 예약시 취소 처리 됩니다.<br>
            <label><input type='checkbox' id='groupAgree'> 동의하기</label><br><br>
          </div>
        `;
    }

    // 여정 보여 주기

    const cData = [];
    ChkData = [];
    itiHTML = [];
    ChkData["D"] = ChkData["D"] || [];
    ChkData["F"] = ChkData["F"] || [];
    rData = [];
    let noBag = '';
    
    for (let minor_num = 1; minor_num < 13; minor_num++) {
        const get = key => data[`${key}${minor_num}`] || "";
        
        const city1       = get("depCity");
        const city2       = get("arrCity");
        const in_date     = get("DepartureTime");
        const out_date    = get("ArriveTime");
        const Flt_time    = get("airFltTm");
        const air_code    = get("airCode");
        const air_class   = get("airClass");
        let   airEquip    = get("airEquip");
        const airSeg      = get("airSeg");
        
        const Cabin       = get("Cabin");
        let   Baggage     = get("Baggage");
        const aCount      = get("AvailCount");
        const Group       = get("Groups");
        
        const DepTerminal = get("DepTerminal");
        const ArrTerminal = get("ArrTerminal");
        
        const start_time1 = in_date.substring(11, 16); // "HH:MM"
        const start_time2 = out_date.substring(11, 16);
        
        // 필요하면 cData 배열에 저장
        cData[city1]     = 1;
        cData[city2]     = 1;
        ShareHTML        = '경유';
        if((departure === city1 && arrive === city2) || (departure === city2 && arrive === city1) ){
            ShareHTML	= "직항";
        }

        air			    = air_code.substring(0,2);
        sDate			= deps.StrClear(in_date.substring(0,10));
	    eDate			= deps.StrClear(out_date.substring(0,10));

        week            = deps.getWeek(deps.getWeekday(sDate));
        const addTime = (sDate < eDate) ? "+" + (StrClear(eDate) - StrClear(sDate)) : "";
        if (air_code != "") {
            ChkData["D"].push(sDate);
            ChkData["F"].push(air_code);
            if (airEquip.startsWith("3")) {
                airEquip = `에어버스 ${airEquip}`;
            } else {
                airEquip = `보잉 ${airEquip}`;
            }
            rData[Group] = rData[Group] || {
                DEP: [], ARR: [], DTIME: [], ATIME: [], FTIME: []
            };

            rData[Group].DEP.push(city1);
            rData[Group].ARR.push(city2);
            rData[Group].DTIME.push(in_date);
            rData[Group].ATIME.push(out_date);
            rData[Group].FTIME.push(Flt_time);

            if (!Baggage) {
                Baggage = "<span class='cored'>없음</span>";
                noBag   = "Y";
            }

            itiHTML[Group] = itiHTML[Group] || [];
            itiHTML[Group].push(`
                <div class='area02'>
                    <div>
                    <span>${deps.cutDate(in_date)} (${week})</span>
                    <span>${city1} [${city1}] T${DepTerminal}</span>
                    <span class='arrow'></span>
                    <span>${city2} [${city2}] T${ArrTerminal}</span>
                    </div>
                    <div>
                    <span><img src='../images/airline/${air}.png'> ${airName[air.toUpperCase()]} ${air_code} (${start_time1} - ${start_time2} ${addTime})</span>
                    <span>${airEquip}</span>
                    <span>${air_class} ${arrCabinType[Cabin]} / ${aCount}석</span>
                    <span>무료수화물 ${Baggage}</span>
                    </div>
                </div>
            `);
        }
    }



    if (noBag == "Y") {
        noBag = `
            <div class='ac hh30'>
                <span class='cored'>※위탁수하물 포함 운임은 예약후 별도 요청 부탁드립니다.<br>
            </div>
        `;
    }


    const portCodesArr = Object.keys(cData).filter(code => code.trim() !== "");
    const portCodes = portCodesArr.map(code => `'${code}'`).join(",");
    const portSql = `
        SELECT portCode, portName, cityName, addressReq
        FROM airPort_code
        WHERE portCode IN (${portCodes})
    `;

    const portResult = await pool.request().query(portSql);
    // 결과 저장용
    const aCity = {};
    const pCity = {};
    let foreignNeed = "";

    portResult.recordset.forEach(row => {
        const portCode = row.portCode?.trim() || "";
        const portName = row.portName?.trim() || "";
        const cityName = row.cityName?.trim() || "";
        const addressReq = row.addressReq?.trim() || "";

        if (addressReq === "Y") foreignNeed = "Y";

        aCity[portCode] = cityName;
        pCity[portCode] = portName;
    });

    let routeHTML = "";

    for (const key in itiHTML) {
        const routeData = itiHTML[key];
        const ticketKey = String(key);
        let name = "";
        let fIcon = "";

        if (ticket_type !== "3" && ticketKey === "1") {
            name = "가는편";
            fIcon = "ico01";
        } else if (ticket_type !== "3" && ticketKey === "2") {
            name = "오는편";
            fIcon = "ico02";
        } else {
            name = `여정 ${ticketKey}`;
            fIcon = "ico01";
        }

        let sub = "";
        let cnt = 0;
        let fltTime = 0;

        for (const html of routeData) {
            sub += html;
            fltTime += Number(rData[key]["FTIME"][cnt]) || 0;
            cnt++;
        }

        const depList   = rData[key]["DEP"];
        const arrList   = rData[key]["ARR"];
        const dtimeList = rData[key]["DTIME"];
        const atimeList = rData[key]["ATIME"];

        const city1     = depList[0];
        const city2     = arrList[arrList.length - 1];

        let shareTime = 0;
        if (cnt > 1) {
            const lastDep  = deps.StrClear(dtimeList[dtimeList.length - 1]).substring(0, 14);
            const firstArr = deps.StrClear(atimeList[0]).substring(0, 14);
            shareTime = deps.timeTermCheck(lastDep, firstArr);  // 함수로 직접 구현되어 있어야 함
        }

        fltTime += shareTime;

        const shareCount = cnt > 1 ? `(${cnt - 1}경유` : "";
        const shareTimeText = shareTime > 0 ? ` / 환승대기시간 ${deps.FltTmCheck(shareTime)}` : "";

        routeHTML += `
            <div class='detail'>
                <div class='area01'>
                    <div>
                        <span class='${fIcon}'></span>
                        <span>${name}</span>
                    </div>
                    <div>
                        <span>${city1}(${city1})</span>
                        <span>→</span>
                        <span>${city2}(${city2})</span>
                    </div>
                    <div>${shareCount}</div>
                </div>
                ${sub}
            </div>
        `;
    }

    for (const [portCode, cityName] of Object.entries(aCity)) {
        const regex = new RegExp(`\\(${portCode}\\)`, 'g'); // (ICN)
        routeHTML = routeHTML.replace(regex, `(${cityName})`);
    }
      
    for (const [portCode, cityName] of Object.entries(pCity)) {
        const regex = new RegExp(`\\[${portCode}\\]`, 'g'); // [ICN]
        routeHTML = routeHTML.replace(regex, `(${cityName})`);
    }

    TotalPrice = deps.numberFormat(parseInt(data.TotalPrice)+parseInt(data.issueComm));
    mem2    = adt + chd;
    priceHTML = `
        <tr>
            <th>성인</th>
            <td>${deps.numberFormat(parseInt(data.adult_price)+parseInt(data.issueComm1))}원</td>
            <td>${deps.numberFormat(data.adult_tax)}원</td>
            <td>${adt} 명</td>
            <td>${deps.numberFormat(parseInt(data.adult_price)+parseInt(data.adult_tax)+parseInt(data.issueComm1))}원</td>
        </tr>
    `;
    if (chd > 0) {
        priceHTML += `
        <tr>
            <th>소아</th>
            <td>${deps.numberFormat(parseInt(data.child_price)+parseInt(data.issueComm2))}원</td>
            <td>${deps.numberFormat(data.child_tax)}원</td>
            <td>${chd} 명</td>
            <td>${deps.numberFormat(parseInt(data.child_price)+parseInt(data.child_tax)+parseInt(data.issueComm2))}원</td>
        </tr>
        `;
    }
    if (inf > 0) { 
        priceHTML += `
        <tr>
            <th>유아</th>
            <td>${deps.numberFormat(data.infant_price)}원</td>
            <td>${deps.numberFormat(data.infant_tax)}원</td>
            <td>${inf} 명</td>
            <td>${deps.numberFormat(parseInt(data.infant_price)+parseInt(data.infant_tax))}원</td>
        </tr>    
        `;
    }


    resName = `
        <button class='btnReservation' onClick='return reserveView ()' id='revButton' style='display:; margin:0 auto'>
            예약하기
        </button>
    `;
    
    const html =`
    <div id='detail-popup' style='width:50%!important'>
        <div class='detail-top'>
            <li class='tit'>예약상세</li>
            <li id='datail-close' onClick="$('#revPopup').hide();" ><img src='../images/close.png'></li>
        </div>
        <div class='detail-content'>
            <div class="selecInfo">
                ${routeHTML}
            </div>
        </div>

        <div class='detail-content-price'>
            <table>
            <colgroup>
                <col style="width: 10%;">
                <col style="width: 25%;">
                <col style="width: 25%;">
                <col style="width: 15%;">
                <col style="width: 25%;">
            </colgroup>
            <thead>
                <tr>
                    <th>승객</th>
                    <th>요금</th>
                    <th>택스</th>
                    <th>인원</th>
                    <th>합계</th>
                </tr>
            </thead>
            <tbody>
                ${priceHTML}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan='2'>
                        <span class='${tasfNone1} '>
                            마크업(Tasf)
                            <input type="text" class="d-inline wh70 ar" readonly="" name="tasfInter" id="tasfInter" onchange="return tasfChange()" value="${data.issueComm}">원
                        </span>
                        <span class='${tasfNone2} cored '>
                            소비자 판매가 
                            <input type="text" class="d-inline wh80 ar" onFocus='this.select()' value="{$TotalPrice}" id="customPrice" onChange="return customChange ()" title="소비자 실제 판매 금액(발권수수료 포함/${TotalPrice}원)">원
                        </span>
                    </td>
                    <td colspan='2'>
                        발권수수료 /인당 
                        <input type="text" class="d-inline wh70 ar" name="tasfInterSite" onFocus='this.select()' id="tasfInterSite" onchange="return tasfChange()" value="${data.issueCommSite}">
                    </td>
                    <td colspan='1'>
                        총금액 <span class='sum' id='TotalAmount'>${TotalPrice}원</span>
                    </td>
                </tr>
            </tfoot>
        </table>
        </div>
        
        ${noBag}
        ${noNotice}
        ${vjNotice}
        ${groupNotice}

        <div class='aq_btn_new'>
            ${resName}
        </div>
    </div>
    `;
    res.json ({success:'ok', datas : html});
}