const deps = require('../../src/common/dependencies');
const { arrGender , arrCabinType , arrCountryCode } = require('../../src/utils/airConst');

module.exports = async (req, res) => {
    const data = req.body;
    const b2bMASTER = req.cookies.b2bMASTER;
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const b2bSiteName = req.cookies?.b2bSiteName || '';
    const { 
        ticket_type , RouteCount ,  adt , chd , inf , departure , arrive , issueCommSite , issueComm , issueComm1 , issueComm2
        , adult_price , adult_tax , child_price , child_tax , infant_price , infant_tax , TotalPrice
    } = data;
    let   addElement = "";
    const excludedKeys = /airRule|airSeg/i;
    
    for (const [key, val] of Object.entries(data)) {
        let newVal = val;
        if (!excludedKeys.test(key)) {
            newVal = typeof val === "string" ? val.toUpperCase() : val;
        }
        addElement += `<input type="hidden" name="${key}" value="${newVal}">`;
    }
    const airName = {};
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
        // 결과 반복 처리
        airResult.recordset.forEach(row => {
            let { 
                code_2, name 
            } = row;
            airName[code_2] = name?.trim() || "";
        });

    let segHTML      = '';
    let chdNone      = '';
    let infNone      = '';
    let tasfNone1    = '';
    let foreignNeed  = '';
    let brandHTML    = '';
    let paxHTML      = '';
    let brandNone    = 'none';
    let siteRead     = '';
    let passScanNone = '';
    let airInfos     = '';
    if (b2bMASTER !== "Y") tasfNone1 = "none";	
    if (chd == 0) chdNone = "none";
    if (inf == 0) infNone = "none";
    let issueCommSite2 = (issueCommSite * adt) + (issueCommSite * chd) ;
    const aCity = [];
    const aNote = [];
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
        ShareHTML        = '경유';
        if((departure === city1 && arrive === city2) || (departure === city2 && arrive === city1) ){
            ShareHTML	= "직항";
        }
        
        air			    = air_code.substring(0,2).toUpperCase();
        sDate			= deps.StrClear(in_date.substring(0,10));
	    eDate			= deps.StrClear(out_date.substring(0,10));
        
        week            = deps.getWeek(deps.getWeekday(sDate));
        const addTime = (sDate < eDate) ? "+" + (StrClear(eDate) - StrClear(sDate)) : "";
        if (air == "VJ")      aNote["VJ"] = "Y";
        else if (air == "QV") aNote["QV"] = "Y";
        else if (air == "8M") aNote["8M"] = "Y";
        if (air_code != "") {
            aCity.push(city1);
            aCity.push(city2);
            segHTML += `
			    <div class='airplane'>
                    <ul>
                        <li>여정 ${minor_num}</li>
                        <li><img src='../images/airline/${air}.png' class='list-air-icon2'>${airName[air]} (${air_code} ${air_class})</li>
                        <li>[${city1}] -> [${city2}]</li>
                        <li>${in_date.substring(0,10)} (${week})</li>
                        <li class='warm-color'>${arrCabinType[Cabin]}</li>
                        <li>출발시간: ${start_time1}</li>
                        <li>도착시간: ${start_time2} ${addTime}</li>
                    </ul>
                </div>
            `;
        }
    }

    const CityList = [...new Set(aCity.filter(code => !!code))];
    const placeholders2 = CityList.map((_, i) => `@code${i}`).join(", ");
    const sql2 = `
        SELECT portCode, cityName, addressReq
        FROM airPort_code
        WHERE portCode IN (${placeholders2})
    `;
    const request2 = pool.request();
        CityList.forEach((code, i) => {
        request2.input(`code${i}`, code);
    });

    const result2 = await request2.query(sql2);
    result2.recordset.forEach(row => {
        const portCode = row.portCode?.trim();
        const cityName = row.cityName?.trim();
        const addressReq = row.addressReq?.trim();
      
        if (addressReq === "Y") {
            foreignNeed = "Y";
        }
      
        aCity[portCode] = cityName;
      
        const regex = new RegExp(`\\[${portCode}\\]`, "g");
        segHTML = segHTML.replace(regex, `<span title='${cityName}'>${portCode}</span>`);
    });

    let foreignHTML = "";

    if (foreignNeed === "Y") {
        foreignHTML = `
            <div class='item-1-1 w-100 pat4'>
            <div class='t1'>해외 목적지 주소 입력 ※ 모든 입력은 영문으로 하세요</div>
            <table class='resrv-detail'>
                <tr>
                <th class='th'>우편번호</th>
                <th class='th'>주명(TEXAS)</th>
                <th class='th'>도시(NewYork)</th>
                <th class='th'>주소</th>
                </tr>
                <tr>
                <td class='td'><input type='text' name='foreign_addr1' oninput='BlockHangulKey(this)' maxlength='17' class='form-control' id='foreign_addr1' value=''></td>
                <td class='td'><input type='text' name='foreign_addr2' oninput='BlockHangulKey(this)' maxlength='35' class='form-control' id='foreign_addr2' value=''></td>
                <td class='td'><input type='text' name='foreign_addr3' oninput='BlockHangulKey(this)' maxlength='35' class='form-control' id='foreign_addr3' value=''></td>
                <td class='td'><input type='text' name='foreign_addr4' oninput='BlockHangulKey(this)' maxlength='35' class='form-control' id='foreign_addr4' value=''></td>
                </tr>
            </table>
            </div>
        `;
    }
    
    let str1_title   = `ⓘ 항공 예약(부킹) 도움말 `;
	let str1_content = `<p class='p1'>· 항공안전법 시행규직 제182조 및 별지 제73호 서식에 의거 입출항 신고서 의무 제출로 인해 국적,성명,생년월일은 필수이며 탑승객명단 모두 정확히 기재를 바랍니다.</p>
						<p>· 탑승자명은 여권에 등록된 이름과 동일해야 하며, 상이할 경우 탑승이 거절됩니다.(예약/결제 후 탑승자명을 변경할 수 없습니다.)</p>
						<p>· 유아(24개월 미만)는 성인탑승자 1인당 1명만 예약이 가능합니다.</p>`;
	let str2_title   = `ⓘ 시스템 도움말`;
	let str2_content = `<p>· 부킹 및 예약속도는 <span>사용자의 네트워크 속도</span> 및 <span>항공사</span> 또는 <span>예약인원</span>에 따라 시간이 소요됩니다.</p>`;

    if (aNote["VJ"] === "Y")      airInfos = `<span class='btn_slim btn_yellow' onClick="return airInfo('VJ')">비엣젯(VJ) 여권입력 및 환불안내</span>`;
    else if (aNote["QV"] === "Y") airInfos = `<span class='btn_slim btn_yellow' onClick="return airInfo('QV')">라오(QV) 항공 여권 입력 방법 안내</span>`;
    else if (aNote["8M"] === "Y") airInfos = `<span class='btn_slim btn_yellow' onClick="return airInfo('8M')">미얀마(8M) 항공 발권시 주의사항</span>`;

    let countryData = '';
    let country     = '';
    arrCountryCode.forEach(val => { 
        const tmp = val.split('/');
        const selected = tmp[1] === country ? 'selected': '';
        countryData += `<option value="${tmp[1]}" ${selected}>${tmp[2]}`;
    });

    let paxCnt = 1;
    function makePaxRow(count, genderCode) {
        return `
            <tr>
                <td class='td wh60'>승객 ${count}</td>
                <td class='td'><input type='text' name='tename1_${count}' id='tename1_${count}' onkeypress='English_field(this.value)' onkeyup="beforePaxCheck('${count}')" style='ime-mode:inactive ;text-transform: uppercase;' class='form-control' value='chang'></td>
                <td class='td'><input type='text' name='tename2_${count}' id='tename2_${count}' onkeypress='English_field(this.value)' onkeyup="beforePaxCheck('${count}')" style='ime-mode:inactive ;text-transform: uppercase;' class='form-control' value='yongseon'></td>
                <td class='td'>
                <select class='select_01 wh120' name='tsex_${count}' id='tsex_${count}'>
                    <option value='${genderCode}'> ${arrGender[genderCode]}</option>
                    <option value='${genderCode.replace("M", "F")}'> ${arrGender[genderCode.replace("M", "F")]}</option>
                </select>
                </td>
                <td class='td'>
                <select class='select_01 wh120' name='tcountry_${count}' id='tcountry_${count}'>
                    <option value=''>선택</option>
                    ${countryData}
                </select>
                </td>
                <td class='td'><input type='text' name='tbirth_${count}' class='form-control' id='tbirth_${count}' onchange="return RevDateCheck(this.value, 'BIRTH', '${count}')" value='' title='YYYYMMDD(년월일) or DDMMMYY(27FEB20) 두가지 형식으로 입력' value='20210101'></td>
                <td class='td'><input type='text' name='tpassport_${count}' class='form-control' id='tpassport_${count}' style='ime-mode:inactive;text-transform: uppercase;' value=''></td>
                <td class='td'><input type='text' name='texpire_${count}' class='form-control' id='texpire_${count}' onchange="return RevDateCheck(this.value, 'EXPIRE', '${count}')" value=''></td>
                <td class='td wh40 ${passScanNone}' onclick="return passPicture('${count}')">
                    <svg xmlns='http://www.w3.org/2000/svg' height='30' viewBox='0 96 960 960' width='30'>
                        <path d='M479.5 790q72.5 0 121.5-49t49-121.5q0-72.5-49-121T479.5 450q-72.5 0-121 48.5t-48.5 121q0 72.5 48.5 121.5t121 49Z' />
                    </svg>
                </td>
            </tr>
        `;
    }
    for (let ix = 1; ix < Number(adt) + 1; ix++) {
        paxHTML += makePaxRow(paxCnt++, "M");
    }
    for (let ix = 1; ix < Number(chd) + 1; ix++) {
        paxHTML += makePaxRow(paxCnt++, "MC");
    }
    for (let ix = 1; ix < Number(inf) + 1; ix++) {
        paxHTML += makePaxRow(paxCnt++, "MI");
    }

    const html = `
    <div id='detail-popup'>
        <div class='detail-top'>
            <ul class='tab_ul'>
                <li class='current tab_active'><a href='#none'>예약상세</a></li>
            </ul>

            <ul class='tab_menu'>
                <li id='datail-close' onClick="$('#revPopup').hide();" class='cowhite'>닫기</li>
            </ul>

        </div>
        <form name='frmReserve' method='post' id='frmReserve'>
        ${addElement}
        <input type='hidden' name='revGubun'>
        <div class='content'>
            <div class='current tab4'>
                <div class='item-1 w-100'>
                    <div class='item-1-1 w-100'>
                        <p class='t1'>항공 스케줄</p>
                        <div class='air_schedule_item'>
                            <div class='air-info'>
                                ${segHTML}
                            </div>
                            <div class='air-price'>
                                <div class='in-wrap'>
                                <span class='md-title'>
                                    <span>총 운임금액</span>
                                    <span class='total-pay' id='finalTotalAmount'>${deps.numberFormat(parseInt(TotalPrice) + parseInt(issueComm) + issueCommSite2)}원</span>
                                </span>
                                <span class='pay'>
                                    <span>성인 ${adt}명</span>
                                    <span class='price' id='finalAdtAmount'>${deps.numberFormat(adt * (parseInt(adult_price) + parseInt(adult_tax) + parseInt(issueComm1)))}원</span>
                                </span>
                                <span class='pay ${chdNone}'>
                                    <span>소아 ${chd}명</span>
                                    <span class='price' id='finalKidAmount'>${deps.numberFormat(chd * (parseInt(child_price) + parseInt(child_tax) + parseInt(issueComm2)))}원</span>
                                </span>
                                <span class='pay ${infNone}'>
                                    <span>유아 ${inf}명</span>
                                    <span class='price' id='finalInfAmount'>${deps.numberFormat(inf * (parseInt(infant_price) + parseInt(infant_tax) ))}원</span>
                                </span>
                                <span class='pay ${tasfNone1}'>
                                    <span>마크업</span>
                                    <span class='price'>${deps.numberFormat(issueComm)}원</span>
                                </span>
                                <span class='pay'>
                                    <span>발권수수료</span>
                                    <span class='price'>${deps.numberFormat(issueCommSite2)}원</span>
                                </span>
                                </div>                      
                            </div>
                        </div>
                    </div>
                    <div class='sp10'></div>
                    <div class='item-1-1 w-100 ${brandNone}'>
                        <p class='t1'>추가옵션요금</p>
                        <div class='optionBx swiper mySwiper01'>
                            <ul class='swiper-wrapper'>
                                ${brandHTML}
                            </ul>
                        </div>
                        <div class='swiper-button-prev '></div>
                        <div class='swiper-button-next ' ></div>
                    </div>
                    <div class='sp10'></div>
                    <div class='item-1-1 w-100'>
                        <div class='t1'>예약자 정보
                            <div class='switch'>
                            <input type='checkbox' id='switch1' switch='none' />
                            <label for='switch1' data-on-label='' data-off-label='' onclick='managerSet()'></label>
                            <span>기본사항</span>
                            </div>
                        </div>
                        <div class='item-table'>
                            <table class='whp100'>
                            <tr>
                                <td class='th'><span class='cored'>*</span> 예약자성함</td>
                                <td class='td'>
                                <input type='text' name='username1' tabindex='1' maxlength='20' class='form-control input02' placeholder='성' value='chang'>
                                <input type='text' name='username2' tabindex='2' maxlength='30' class='form-control input03' placeholder='이름' value='yong'>	
                                </td>
                                <td class='th'><span class='cored'>*</span> 비상연락처</td>
                                <td class='td'><input type='text' name='dep_tel' tabindex='3' class='form-control' value='01026949511'></td>
                                <td class='th'>여행사명</td>
                                <td class='td wh300'>
                                <input type='text' name='site_code' value='${b2bSiteCode}' tabindex='3' ${siteRead} class='form-control fl wh100' onchange="siteInterCheck('site',this.value)">
                                <input type='text' name='site_name' value='${b2bSiteName}' tabindex='3' readonly class='form-control fl' style='width:174px'>
                                <div style='position:relative'>
                                    <div style='position:absolute;top:43px;left:-13px;width:301px;z-index:10;' id='SiteSearch'></div>
                                </div>
                                </td>
                            </tr>
                            <tr>
                                <td class='th'><span class='cored'>*</span> 이메일</td>
                                <td class='td'><input type='text' name='email' tabindex='4' class='form-control' value='changys8@naver.com'></td>
                                <td class='th' colspan='2'><span class='cored'>항공사 결항 및 취소시 연락은 위의번호로 전송됩니다.</span></td>
                                <td class='th none'>현지연락처</td>
                                <td class='td none'><input type='text' name='arr_tel' tabindex='5' class='form-control'></td>
                                <td class='th'>담당자선택</td>
                                <td class='td' id='siteManager'>
                                    <select class='form-control' name='manager_id' id='manager_id'>
                                        <option value=''>선택</option>
                                    </select>
                                </td>
                            </tr>
                            </table>
                        </div>
                    </div>
                    <div class='sp10'></div>
                    <div class='item-1-1 w-100'>
                        <div class='item-1-1-t'>
                            <div class='t1'>탑승자 정보 <span class='c_red'>*</span>주의 : 소아/유아 인경우 반드시 생년월일을 <span class='c_red'>나이에 맞게</span> 입력 해주세요.
                                <div class='switch'> 
                                </div>
                                <div class='switch wh320'> 
                                    ${airInfos}
                                    <div ID='PaxDataView'><span class='btn_slim btn_mint' onClick='return paxDataShow()'>명단 붙여 넣기</span></div>
                                </div>
                            </div>
                            <div class='item-1-1-t none fr ' id='PaxDataArea' style='position:absolute ; z-index:999; '>
                                <div class='wh500 fr backEFEFEF'>
                                <table class='oyeTable2 ar' >
                                    <tr>
                                        <th class='font13'>입력순서 : 성/이름,성별(M or F),국적(3코드),생년월일,여권번호,유효기간(한줄씩입력)</th>
                                    </tr>
                                    <tr>
                                        <td ><textarea class='wh500 hh100 font13' id='paxData' name='paxData'></textarea></td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <span class='btn_slim btn_blue' onClick='return paxDataSave()'>명단 적용 하기</span>
                                            <span class='btn_slim btn_gray' onClick='return paxDataHide()'>취소</span>
                                        </td>
                                    </tr>
                                </table>
                                </div>
                            </div>
                            <table class='resrv-detail'>
                                <tbody>
                                <tr>
                                    <th class='th'>순서</th>
                                    <th class='th cored'>영문 성(*)</th>
                                    <th class='th cored'>영문 이름(*)</th>
                                    <th class='th cored'>성별(*)</th>
                                    <th class='th'>국적</th>
                                    <th class='th'>생년월일</th>
                                    <th class='th'>여권번호</th>
                                    <th class='th'>여권만료일</th>
                                    <th class='th wh40 ${passScanNone}'>스캔</th>
                                </tr>
                                ${paxHTML}
                                
                                </tbody>
                            </table>

                            ${foreignHTML}
                        </div>

                    </div>
                    <div class='button-wrap whp100 pat20'>
                        <div class='' id='revActionArea'>
                            <div type='text' class='rev ac pat10' style='cursor:pointer' onClick="return revAction('',event)">예약하기</div>
                        </div>
                    </div>
                    <div class='sp10'></div>
                    <div class='item-2-5'>
                        <p class='t1'>${str1_title}</p>
                        <div class='item-table'>
                            <div class='guide_box'>
                                ${str1_content}
                            </div>
                        </div>
                        <div class='sp10'></div>
                        <p class='t1'>${str2_title}</p>
                        <div class='item-table'>
                            <div class='guide_box'>
                                ${str2_content}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </form>
    </div>
    
    `;

    res.json ({success:'ok', datas : html});
}