const { query } = require('mssql');
const deps = require('../../src/common/dependencies');
const { arrInsureStatusCode , arrCountryCode } = require('../../src/utils/airConst'); 
const { uidNext } = require('../../src/utils/idxFunction');
const { insureAutoCheck, insureService } = require('../../src/utils/functionInsure');
const { cutDate, cutTime } = require('../../src/utils/cutDate');

module.exports = async (req, res) => {
    const data        = req.body;
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const orgMode     = (data.orgMode || '').trim();   
    const pool        = await deps.getPool();
    let   mode        = (data.mode || '').trim();   
    let   uid         = data.uid  || '';
    let   ticket_num  = data.ticket_num  || '';
    let   minor       = data.minor  || '';
    let   cYear       = data.cYear  || '';
    let   gubun1      = data.gubun1 || '';
    let   aView       = data.aView  || '';
    let   msg         = '';
    let   sqlText     = '';
    let   sqlResult   = '';
    let   rsCount     = '';
    let   titleData   = '';
    let   htmlData    = '';
    let   contents    = '';
    let   content     = data.content || '';
    let   subject     = data.subject || '';
    let   username    = data.username || '';
    const sql             = deps.sql;
    const aes128Encrypt   = deps.aes128Encrypt;
    const aes128Decrypt   = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;
    const NOWSTIME        = deps.getNow().NOWSTIME;
    const NOWS            = deps.getNow().NOWS;
    const mainTable       = 'insure_rev';

    let   html            = '';
    let   addQry          = '';
    let   modes           = '';
    let   row             = {};
    let   buttonName      = '신규입력';
    let   modRead         = '';
    let   statusData      = '';
    let   manData         = '';
    let   memberData      = '';
    let   adtData = '', chdData = '' , infData = '';
    let   countryData     = '';
    let   startHour = '', startMinute = '', returnHour = '' , returnMinute = '';
    let   kr_down = '' , en_down = '', re_issue = '';
    let   siteData        = '';
    if (mode === "view") {
            
            
            htmlData  = `
                <form name="frmDetail" id="frmDetail" method="post" enctype="multipart/form-data">
                    <input type="hidden" name="mode"		value="${modes}">
                    <input type="hidden" name="uid"			value="${uid}">
                    <input type="hidden" name="orgMode"		value="${mode}">
                    <div class="border regis-box shadow-sm menuArea" >
                    <div class="row w-90 p-3">
                        <div class="col">
                        <table class="table regis-hotel">
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="width:130px;" required>제목  </th>
                                <td class="regis-hotel-td2" colspan="3">
                                    ${row.subject || ''}
                                </td>
                            </tr>
                            
                            
                            
                        </table>
                        </div>
                    </div>
                    <div class="row w-70 regis-btn ">
                        <div class="col-12 ac" style="margin-bottom:20px;">
                            <span type="button" class="btn btn-yellow " href="javascript://" onCLick="return newReg('${uid}','modify')" style="width:50%;font-size:19px !important;padding-top:10px;padding-bottom:13px;">수정하기</span>
                        </div>
                    </div>
                    </div>
                </form>
            `;
        
    } else if (mode === "input" || mode === "modify") {
        if (mode === "input") {
            buttonName = '신규입력';
            titleData  = `<i class="fas fa-edit" style="color:#777;font-size:16px;"></i> 여행자보험 등록`;
            row.ip_loss  = 'L';
            row.start_time = '0000';
            row.arrive_time = '2355';
        } else {
            buttonName = '수정입력';
            titleData  = `<i class="fas fa-edit" style="color:#777;font-size:16px;"></i> 여행자보험 수정 #${uid}`;
            addQry = `
                left outer join site as b on a.site_code = b.site_code
                OUTER APPLY (
                    select( 
                        select 
                            minor_num, kname, jumin, sex, tel, insure_amt, auth_url, insure_type, token, email, jumin2, insure_com_amt, insure_total_amt, auth_url_en, tasf
                        from insure_rev_pax where uid_minor = a.uid
                        order by minor_num
                        for json path
                    ) as paxData 
                ) as m1
                OUTER APPLY (
                    select( 
                        select 
                            minor_num , man_id , manager
                        from site_manager where site_code = a.site_code
                        order by minor_num
                        for json path
                    ) as manData 
                ) as m2
            `;
            sqlText   = ` select a.* , paxData , manData , b.site_name from ${mainTable} as a ${addQry} where a.uid = @uid `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
            row       = sqlResult.recordset?.[0];
            modRead   = 'readonly';
        }

        sqlText = `select site_code,site_name from site order by site_code`;
        sqlResult = await pool.request().query(sqlText);
        for (const put of sqlResult.recordset) {
            const site_code = (put.site_code ?? '').trim();
            const site_name = (put.site_name ?? '').trim();
            const s = site_code === row.site_code ? 'selected' : '';
            siteData += `<option value='${site_code}' ${s}> ${site_name}</option>`;
        }
        for (const [k,v] of Object.entries(arrInsureStatusCode)) {
            const s = row.status === k ? 'selected' : '';
            statusData += `<option value='${k}' ${s}> ${v}`;
        }
        if (row.manData) {
            const rows = JSON.parse(row.manData);
            for (const put of rows) {
                const s = put.man_id === row.manager_id ? 'selected' : '';
                manData += `<option value='${put.man_id}' ${s}>${put.manager}</option>`;
            }
        }
        for (let ix = 1; ix < 101 ; ix ++) {
            const s = row.adult_member === ix ? 'selected' : '';
            adtData += `<option value='${ix}' ${s}>${ix}</option>`;
        }
        for (let ix = 0; ix < 21 ; ix ++) {
            const s1 = row.child_member === ix ? 'selected' : '';
            chdData += `<option value='${ix}' ${s1}>${ix}</option>`;
            const s2 = row.infant_member === ix ? 'selected' : '';
            infData += `<option value='${ix}' ${s2}>${ix}</option>`;
        }
        for (const [k,v] of Object.entries(arrCountryCode)) {
            const tmp = v.split('/');
            if (tmp[2] !== "대한민국") {
                const s = tmp[2] === row.country ? 'selected': '';
                countryData += `<option value="${tmp[2]}" ${s}>${tmp[2]}`;
            }
        }
        for (let ix = 0 ; ix < 24 ; ix ++) {
            const s1 = ix == (row.start_time || '').slice(0,2) ? 'selected' : '';
            startHour += `<option value='${ix}' ${s1}>${ix}</option>`;
            const s2 = ix == (row.arrive_time || '').slice(0,2) ? 'selected' : '';
            returnHour += `<option value='${ix}' ${s2}>${ix}</option>`;
        }
        for (let ix = 0 ; ix < 60 ; ix = ix + 5) {
            const s1 = ix == (row.start_time || '').slice(2) ? 'selected' : '';
            startMinute  += `<option value='${ix}' ${s1}>${ix}</option>`;
            const s2 = ix == (row.arrive_time || '').slice(2) ? 'selected' : '';
            returnMinute += `<option value='${ix}' ${s2}>${ix}</option>`;
        }
        let insureType = '';
        if (row.paxData || row.members > 0) {
            const rows = JSON.parse(row.paxData && row.paxData.trim() !== '' ? row.paxData : '[]');
            let   len  = rows.length || 0;
            const members = Number(row.members) ;
            
            // 데이터베이스에서 직접 insure_type 조회 (paxData에 없을 경우 대비)
            let paxTypeMap = {};
            if (uid) {
                try {
                    sqlText = `select minor_num, insure_type from insure_rev_pax where uid_minor = @uid`;
                    sqlResult = await pool.request().input('uid', sql.Int, uid).query(sqlText);
                    for (const paxRow of sqlResult.recordset || []) {
                        const typeValue = paxRow.insure_type;
                        if (typeValue !== null && typeValue !== undefined) {
                            paxTypeMap[paxRow.minor_num] = String(typeValue).trim();
                        }
                    }
                } catch (err) {
                    console.error('Error fetching insure_type:', err);
                }
            }
            
            if (members > len) {
                for (let ix = len + 1 ; ix < members + 1 ; ix ++) {
                    rows.push({minor_num : ix});
                }
            }
            for (const put of rows) {
                const minor       = put.minor_num;
                const token       = put.token || '';
                const kname       = put.kname || '';
                const sex         = (put.sex   || '').trim();
                const jumin       = aes128Decrypt(aviaSecurityKey,(put.jumin || ''));
                const jumin2      = aes128Decrypt(aviaSecurityKey,(put.jumin2 || ''));
                const email       = put.email || '';
                const tel         = aes128Decrypt(aviaSecurityKey,(put.tel || ''));
                let   insure_amt  = put.insure_amt || 0;
                const com_amt     = put.insure_com_amt || 0;
                // paxData에서 가져오거나, 없으면 DB에서 직접 조회한 값 사용
                let   insure_type = (put.insure_type || '').toString().trim();
                if (!insure_type || insure_type === "") {
                    insure_type = 'f';
                }

                if (row.status == 1 ) {
                    if (insure_type === "d") insureType = "2";
                    else if (insure_type === "h") insureType = "3";
                    else insureType = "1"; 
                    rs = await insureAutoCheck (pool,{birth:jumin,sex:sex,sdate: row.start_day+row.start_time,rdate: row.arrive_day+row.arrive_time,type:insureType});
                    insure_amt = rs.AMT || 0;
                }

                kr_down = put.auth_url ? `<td style='border-bottom:1px solid #dee2e6;'><a href='${put.auth_url}' target='_blank'>국문다운</a></td>` : '';
                en_down = put.auth_url_en ? `<td style='border-bottom:1px solid #dee2e6;'><a href='${put.auth_url_en}' target='_blank'>국문다운</a></td>` : '';
                re_issue = (row.status === "3" && !kr_down && !en_down) ? `<td style='border-bottom:1px solid #dee2e6;' class='ac' colspan='2'><span class='btn_slim btn_red' onClick="return insureBuyOne('${minor}')">계약재생성</span></td>` : '';
                memberData += `
                    <input type='hidden' id='tminor_${minor}' name ='minor[]' value='${minor}'/>
                    <input type='hidden' id='ttoken_${minor}' name ='ttoken[]' value='${token}'/>
                    <tr>
                        <td style='border-bottom:1px solid #dee2e6;'><input type='text' placeholder='한글또는영문'		 id='tkname_${minor}'		name='tkname[]'  value='${kname}' class='form-control form-control-sm d-inline'></td>
                        <td style='border-bottom:1px solid #dee2e6;'><input type='text' placeholder='생년월일 6자리'		onChange='birthCheck(this)' id='tjumin_${minor}'		name='tjumin[]'  value='${jumin}' class='form-control form-control-sm d-inline' maxlength='6'></td>
                        <td style='border-bottom:1px solid #dee2e6;'><input type='text' placeholder='주민등록뒷자리 7자리' id='tjumin2_${minor}' onChange="return sChange('${minor}')"	name='tjumin2[]' value='${jumin2}' class='form-control form-control-sm d-inline' maxlength='7'></td>
                        <td style='border-bottom:1px solid #dee2e6;'><input type='text' placeholder='핸드폰번호'	 id='ttel_${minor}'		name='ttel[]'	 value='${tel}' class='form-control form-control-sm d-inline'></td>
                        <td style='border-bottom:1px solid #dee2e6;'><input type='text' placeholder='이메일'		 id='temail_${minor}'		name='temail[]'	 value='${email}' class='form-control form-control-sm d-inline'></td>
                        <td style='border-bottom:1px solid #dee2e6;'>
                            <select name='tinsure_type[]' id='tinsure_type_${minor}'>
                                <option value='' >선택하세요</option>
                                <option value='c' ${insure_type === 'c' ? 'selected' : ''}>아동</option>
                                <option value='f' ${insure_type === 'f' ? 'selected' : ''}>알뜰</option>
                                <option value='d' ${insure_type === 'd' ? 'selected' : ''}>기본</option>
                                <option value='h' ${insure_type === 'h' ? 'selected' : ''}>고급</option>
                                <option value='s' ${insure_type === 's' ? 'selected' : ''}>실버</option>
                            </select>
                        </td>
                        <td style='border-bottom:1px solid #dee2e6;'>
                            <select name='tsex[]' id='tsex_${minor}'>
                                <option value='m' ${sex === 'm' ? 'selected' : ''}>남성</option>
                                <option value='w' ${sex === 'w' ? 'selected' : ''}>여성</option>
                            </select>
                        </td>
                        <td style='border-bottom:1px solid #dee2e6;'><input type='number' placeholder='보험료' name='tinsure_amt[]'  id='tinsure_amt_${minor}' readonly value='${insure_amt}'  class='form-control form-control-sm d-inline'   ></td>
                        <td style='border-bottom:1px solid #dee2e6;' class='none'><input type='number' placeholder='커미션' name='tinsure_com_amt[]'  id='tinsure_com_amt_${minor}' readonly value='${com_amt}'  class='form-control form-control-sm d-inline none'   ></td>
                        ${kr_down}
                        ${en_down}
                        ${re_issue}
                    </tr>
                `;
            }
        }
        modes      = mode;
        let none   = '';
        let sData = '', iData = '' , selHTML = '', actionButton = '';
        if (row.status === '1' || !row.status) {
            actionButton = `<span class='btn_basic btn_yellow '  onCLick='return insure_cal()' >보험료확인</span>`;
        } else if (row.status === '2') {
            actionButton  = `<span class='btn_basic btn_red'     onCLick='return insure_del()' >보험료계산초기화</span>`;
            actionButton += `<span class='btn_basic btn_yellow ' onCLick='return insure_buy()' >보험구매</span>`;
            none = 'none';
        } else if (row.status === '3' || row.status === 'E') {
            actionButton = `<span class='btn_basic btn_yellow '  onCLick='return insure_cancel()'>보험료취소</span>`;
            none = 'none';
        }
        htmlData   = `
            <form name="frmDetail" id="frmDetail" method="post" >
                <input type="hidden" name="mode"		value="save">
                <input type="hidden" name="uid"			value="${uid}">
                <input type="hidden" name="orgMode"		value="${mode}">
                <div class="border regis-box shadow-sm menuArea" >
                <div class="row w-90 p-3">
                    <div class="col">
                    <table class="oyeTable">
                        <tr>
							<th scope="" class="  nowrap " style="">신청여행사</th>
							<td class=" " >
                                <input type='text' list='site_code' id='siteCode' name='site_code' autocomplete='off' value='${row.site_code || ''}' ${modRead} class='form-control fl wh100' onchange="setSiteName(this.value)">
                                <datalist id='site_code'>${siteData}</datalist>
                                <div class='pat10' id='siteName'>${row.site_name || ''}</div>
							</td>
							<th scope="row" class=" nowrap" style="">담당자</th>
							<td class="">
                                <select class='form-control ' name='manager_id' id='manager_id'  >>
								    <option value=''></option>
                                    ${manData}
							    </select>
							<th scope="row" class=" nowrap" style="">상태</th>
							<td class="">
                                <select name='status' class='form-control form-control-sm wh100' >
                                    <option value=''></option>
                                    ${statusData}
                                </select>
							</td>
						</tr>
                        <tr>
							<th scope="row" class="">인원</th>
							<td class="" >
                                Adt 
                                <select name="adult_member" class=" form-smooth wh60" style="background-color:#fff">
                                    ${adtData}
                                </select>
                                Chd 
                                <select name="child_member" class=" form-smooth wh60" style="background-color:#fff">
                                    ${chdData}
                                </select>
                                Inf 
                                <select name="infant_member" class=" form-smooth wh60" style="background-color:#fff">
                                    ${infData}
                                </select>
                            </td>
                            <th scope="row" class="">여행지역</th>
							<td class=" borderBottom" colspan="">
								<select name="country" class="form-control form-control-sm">
									<option value="">선택하세요</option>
									${countryData}
								</select>
							</td>
                            <th scope="row" class=" nowrap" style="">실손여부</th>
							<td class="">
								<select name="ip_loss" class="form-control form-control-sm">
                                    <option value="">선택</option>	
                                    <option value="L" ${row.ip_loss === "L" ? 'selected' : ''}>실손</option>
									<option value="N" ${row.ip_loss === "N" ? 'selected' : ''}>비포함</option>
								</select>
							</td>
                        </tr>
                        <tr>
							<th scope="row" class="">출발일</th>
							<td class=" borderBottom" >
								<input type="" name="start_day"  id="start_day"  class="form-control mt-2 form-control-sm  d-inline wh200" value="${row.start_day || ''}" 
                                ${ (row.status < 3 || !row.status) ? 'onClick="datePick(\'start_day\')"' : '' }
                                style="background-color:#fff;" autoComplete="off" readonly>
							</td>
							<th scope="row" class="">귀국일</th>
							<td class=" borderBottom">
								<input type="" name="arrive_day" id="arrive_day"  class="form-control mt-2 form-control-sm  d-inline wh200" value="${row.arrive_day || ''}"  
                                ${ (row.status < 3 || !row.status) ? 'onClick="datePick(\'arrive_day\')"' : ''}
                                style="background-color:#fff;" autoComplete="off" readonly>
							</td>
                            <th scope="row" class="">커미션</th>
                            <td class=" borderBottom" colspan="">
                                <input type='text' name='commission' value='0' readonly class='form-control fl wh50'>%
                            </td>
                        </tr>
                        <tr>
							<th scope="row" class="hh40">출발시간</th>
							<td class=" borderBottom" >
								<select name="start_hour" class="form-smooth wh80" id="start_hour" style="background-color:#fff">
									${startHour}
								</select>
								시
								<select name="start_min" class="form-smooth wh80" id="start_min" style="background-color:#fff">
                                    ${startMinute}
								</select>
								분
							</td>
							<th scope="row" class="">도착시간</th>
							<td class=" borderBottom" colspan="3">
								<select name="arrive_hour" class="form-smooth wh80" id="arrive_hour" style="background-color:#fff">
                                    ${returnHour}
								</select>
								시
								<select name="arrive_min" class="form-smooth wh80" id="arrive_min" style="background-color:#fff">
                                    ${returnMinute}
								</select>
								분
							</td>
						</tr>
                    </table>
                    <table class="whp100">
                        <tr><td>
                            <p>	※ 진행순서 : 기본정보입력(대기) -> 보험료확인(접수) -> 보험구매(완료) -- 보험구매시 예치금에서 금액이 차감됩니다 <br / >
                            ※ 여행날짜와 명단을 입력하면 금액은 즉시 확인이 되며, '보험료확인'후는 초기화후 수정이 가능합니다. <br / >
                            ※ <span class='cored'>아동의 경우 꼭 아동을 선택하세요</span><br / >
                            ※ <span class='cored'>구매시에는 핸드폰및 이메일이 필수 입니다.</span><br / >
                            ※ <span class='cored'>명단 수정은 '보험료계산초기화' 후에 수정이 가능합니다.</span><br / >

                            </p>
                            <h3>회원정보
                                <div class="fr">
                                    ${actionButton}
                                </div>
                            </h3>
                        </td></tr>
                    </table>
                    <table class="table regis-hotel-xs"  id="paxArea">
                        <tr>
                            <td class="regis-hotel-td4 border-rt-1 ">성명</td>
                            <td class="regis-hotel-td4 border-rt-1 ">생년월일</td>
                            <td class="regis-hotel-td4 border-rt-1 ">주민등록뒷자리</td>
                            <td class="regis-hotel-td4 border-rt-1">핸드폰번호</td>
                            <td class="regis-hotel-td4 border-rt-1 wh200">이메일</td>
                            <td class="regis-hotel-td4 border-rt-1">플랜</td>
                            <td class="regis-hotel-td4 border-rt-1">성별</td>
                            <td class="regis-hotel-td4 border-rt-1">보험료</td>
                            <td class="regis-hotel-td4 border-rt-1 none">커미션</td>
                            <td class="regis-hotel-td4 border-rt-1 nowrap">국문다운</td>
                            <td class="regis-hotel-td4 border-rt-1 nowrap">영문다운</td>
                        </tr>
                        ${memberData}

                        <tr>
                            <td colspan= "7"class="regis-hotel-td4 border-rt-1" style="text-align:right;">총 금액</td>
                            <td colspan= "4" class="regis-hotel-td4 border-rt-1" style="text-align:left;"> ${row.allAmt}원</td>
                        </tr>
                    </table>
                    </div>
                </div>
                <div class="row w-70 regis-btn ">
                    <div class="col-12 ac" style="margin-bottom:20px;">
                        <span type="button" class="btn btn-yellow ${none}" href="javascript://" onCLick="return inputCheck()" style="width:50%;font-size:19px !important;padding-top:10px;padding-bottom:13px;">${buttonName}</span>
                    </div>
                </div>
                </div>
            </form>
        `;
    } else if (mode === "excel") {
        titleData  = `<i class="fas fa-edit" style="color:#777;font-size:16px;"></i> 항공사 BIN 엑셀 업로드`;
        htmlData   = `
            <form name="frmDetail" id="frmDetail" method="post" enctype="multipart/form-data">
                <input type="hidden" name="mode"		value="excelSave">
                <input type="hidden" name="uid"			value="${uid}">
                <input type="hidden" name="orgMode"		value="${mode}">
                <div class="border regis-box shadow-sm menuArea" >
                <div class="row w-90 p-3">
                    <div class="col">
                    <table class="table regis-hotel">
                        <tr>
							<th scope="row" class="regis-hotel-td1" style="width:90px;line-height:30px;">항공사코드</th>
							<td class="regis-hotel-td1 al">
								<input name="aircode" type="text" maxlength='2' class="form-control form-control-sm wh50" value=""> KE/ OZ / 7C 등
							</td>
						</tr>
						<tr>
							<th scope="row" class="regis-hotel-td1" style="width:90px;line-height:30px;">엑셀파일</th>
							<td class="regis-hotel-td1"><input name="pic" type="file"  class="form-control form-control-sm" value="">
								<br>순서 : 3코드 / 2코드 / Bin 카드넘버 / 카드명 / 빈넘버 (총 5칸)
							</td>
						</tr>
                    </table>
                    </div>
                </div>
                <div class="row w-70 regis-btn ">
                    <div class="col-12 ac" style="margin-bottom:20px;">
                        <span type="button" class="btn btn-yellow " onCLick="return excelCheck()" style="width:50%;font-size:19px !important;padding-top:10px;padding-bottom:13px;">${buttonName}</span>
                    </div>
                </div>
                </div>
            </form>
        `;
    } else if (mode === "del") {
        sqlText = `delete from ${mainTable} where uid = @uid`;
        sqlResult = await pool.request().input('uid',sql.Int , uid).query(sqlText);
    } else if (mode === "insureReset") {
        sqlText = `update ${mainTable} set status = '1' where uid = @uid`;
        sqlResult = await pool.request().input('uid',sql.Int , uid).query(sqlText);
        
    } else if (mode === "cal") {
        const members = Number(data.adult_member) + Number(data.child_member) + Number(data.infant_member);
        const insConn = new insureService();
        const table1 = 'insure_rev_pax';
        
        // 메인 테이블에서 데이터 조회
        sqlText = `select * from ${mainTable} where uid = @uid`;
        sqlResult = await pool.request().input('uid', sql.Int, uid).query(sqlText);
        row = sqlResult.recordset[0] || {};
        
        let commission = (row.commission || 0) * 0.01;
        if (!commission) commission = '0.00';
        
        // 보험자 정보 조회
        sqlText = `select * from ${table1} where uid_minor = @uid order by minor_num`;
        sqlResult = await pool.request().input('uid', sql.Int, uid).query(sqlText);
        const paxList = sqlResult.recordset || [];
        let allAmt = 0;
        for (const put of paxList) {
            let tel = (put.tel || '').trim();
            let jumin = (put.jumin || '').trim();
            let jumin2 = (put.jumin2 || '').trim();
            let sex = (put.sex || '').trim();
            let token = (put.token || '').trim();
            let minor_num = put.minor_num;
            let insure_type = (put.insure_type || 'f').trim();
            
            // 복호화
            tel = aes128Decrypt(aviaSecurityKey, tel);
            jumin = aes128Decrypt(aviaSecurityKey, jumin);
            jumin2 = aes128Decrypt(aviaSecurityKey, jumin2);
            
            // 보험료 계산 데이터 준비
            const pData = {
                ip_loss: row.ip_loss || '', // 실손 L:포함 N:비포함
                start_date: cutDate(row.start_day || ''),
                start_time: String(row.start_time || '').replace(/[^0-9]/g, '').slice(0, 4).padStart(4, '0') + '00',
                end_date: cutDate(row.arrive_day || ''),
                end_time: String(row.arrive_time || '').replace(/[^0-9]/g, '').slice(0, 4).padStart(4, '0') + '00',
                jumin: jumin,
                sex: sex,
                country: row.country || '',
                commission: commission,
                tasf: 0
            };
            
            // 토큰 처리
            if (token !== "") {
                pData.token = token;
            } else {
                const res = await insConn.getToken();
                token = res.access_token || '';
                pData.token = token;
            }
            //console.log(token)
    
            
            // 2023-08-30 토큰 생성오류시 예외처리
            if (!pData.token || pData.token === "") {
                msg = '보험료 계산오류입니다, 초기화 후 다시해주시길 바랍니다.';
            }
            
            if (!msg) {
                    
                // 보험료 계산
                //console.log(pData);
                const insureData = await insConn.getInsureAmount(pData);
                //console.log(insureData)
                if (insureData.result === "ERROR") {
                    const errorMsg = insureData.msg || '';
                    //return res.send(`<script> alert('${errorMsg}\\n\\n수정후 다시 시도 하세요'); </script>`);
                    msg = errorMsg + '<br><br>수정후 다시 시도 하세요';
                }
                
                // 보험료 정보 추출
                //console.log(insure_type)
                let amt = insureData[`price_${insure_type}`] || 0;
                let com_amt = insureData[`cms_${insure_type}`] || 0;
                //let insure_type = insureData.insure_type || '';
                
                // 2024-10-07 추가
                if (amt == 0 && insureData.price_c > 0) {
                    amt = insureData.price_c;
                    insure_type = "c";
                } else if (amt == 0 && insureData.price_s > 0) {
                    amt = insureData.price_s;
                }
                
                const total_amt = Number(amt) + Number(com_amt);
                allAmt += total_amt;
                
                // 보험자 정보 업데이트
                sqlText = `
                    update ${table1} set
                        token = @token,
                        insure_amt = @insure_amt,
                        insure_com_amt = @insure_com_amt,
                        insure_total_amt = @insure_total_amt,
                        insure_type = @insure_type
                    where uid_minor = @uid_minor and minor_num = @minor_num
                `;
                await pool.request()
                    .input('token', sql.NVarChar, token)
                    .input('insure_amt', sql.Int, amt)
                    .input('insure_com_amt', sql.Int, com_amt)
                    .input('insure_total_amt', sql.Int, total_amt)
                    .input('insure_type', sql.VarChar, insure_type)
                    .input('uid_minor', sql.Int, uid)
                    .input('minor_num', sql.Int, minor_num)
                    .query(sqlText);
            }
            
            // 보험료 계산시 상태 접수로 변경
            sqlText = `update ${mainTable} set allAmt = '${allAmt}', status = '2' where uid = @uid`;
            await pool.request().input('uid', sql.Int, uid).query(sqlText);
        }
    } else if (mode === "save") {
        if (orgMode === "input" && !uid) {
            uid = await uidNext(`${mainTable}`, pool );
            sqlText = `insert into ${mainTable} (uid,up_date) values (@uid,@up_date) `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).input('up_date',sql.NVarChar,NOWSTIME).query(sqlText);
        }
        if (!msg) {
            const start_hour  = data.start_hour || '0';
            const start_min   = data.start_min  || '0';
            const arrive_hour = data.arrive_hour || '23';
            const arrive_min  = data.arrive_min  || '59';
            const start_day   = deps.StrClear(data.start_day || '');
            const arrive_day  = deps.StrClear(data.arrive_day || '');
            const status      = (data.status || '').trim() === "" ? '1' : data.status;
            const start_time  = `${start_hour.padStart(2,'0')}${start_min.padStart(2,'0')}`;
            const arrive_time = `${arrive_hour.padStart(2,'0')}${arrive_min.padStart(2,'0')}`;
            const members = Number(data.adult_member) + Number(data.child_member) + Number(data.infant_member);
            sqlText = `
                update ${mainTable} set
                    site_code     = '${data.site_code || ''}',
                    members       = '${members || '0'}',
                    start_day     = '${start_day}',
                    arrive_day    = '${arrive_day}',
                    country	      = '${data.country || ''}',
                    status        = '${status}',
                    ip_loss	      = '${data.ip_loss || ''}',
                    adult_member  = '${data.adult_member || '1'}',
                    child_member  = '${data.child_member || '0'}',
                    infant_member = '${data.infant_member || '0'}',
                    commission    = '${data.commission || ''}' ,
                    start_time    = '${start_time || ''}',
                    arrive_time   = '${arrive_time || ''}',
                    manager_id	  = '${data.manager_id || ''}'
                where uid = @uid
            `;
            try {
                sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
                const tx = new sql.Transaction(pool);
                try {
                    await tx.begin(); 
                    const req       = new sql.Request(tx);
                    const insertReq = new sql.Request(tx);
                    const values    = [];
                    await req.query(`delete from insure_rev_pax where uid_minor = ${uid} `);
                    for (let ix = 0; ix < members; ix++) {
                        const minor  = ix + 1;
                        const kname  = (data.tkname?.[ix] || '').trim();
                        const jumin  = (data.tjumin?.[ix] || '').trim();
                        const jumin2 = (data.tjumin2?.[ix] || '').trim();
                        const tel    = (data.ttel?.[ix] || '').trim();
                        const email  = (data.temail?.[ix] || '').trim();
                        const itype  = (data.tinsure_type?.[ix] || '').trim();
                        const sex    = (data.tsex?.[ix] || '').trim();
                        const token  = (data.ttoken?.[ix] || '').trim();
                        const amt    = (data.tinsure_amt?.[ix] || 0);
            
                        const encTel    = aes128Encrypt(aviaSecurityKey, tel);
                        const encJumin  = aes128Encrypt(aviaSecurityKey, jumin);
                        const encJumin2 = aes128Encrypt(aviaSecurityKey, jumin2);
                        const p = `p${ix}`;  // p0, p1, p2 ...

                        insertReq.input(`${p}_uid`,    sql.Int,      uid);
                        insertReq.input(`${p}_minor`,  sql.Int,      minor);
                        insertReq.input(`${p}_kname`,  sql.NVarChar, kname);
                        insertReq.input(`${p}_jumin`,  sql.VarChar,  encJumin);
                        insertReq.input(`${p}_sex`,    sql.Char,     sex);
                        insertReq.input(`${p}_tel`,    sql.VarChar,  encTel);
                        insertReq.input(`${p}_amt`,    sql.Int,      amt);
                        insertReq.input(`${p}_itype`,  sql.Char,     itype);
                        insertReq.input(`${p}_token`,  sql.VarChar,  token);
                        insertReq.input(`${p}_jumin2`, sql.VarChar,  encJumin2);
                        insertReq.input(`${p}_email`,  sql.NVarChar, email);

                        values.push(
                            `(@${p}_uid, @${p}_minor, @${p}_kname, @${p}_jumin, @${p}_sex, @${p}_tel, @${p}_amt, @${p}_itype, @${p}_token, @${p}_jumin2, @${p}_email)`
                        );
                    }
                    if (values.length > 0) {
                        sqlText = `
                            INSERT INTO insure_rev_pax
                                (uid_minor, minor_num, kname, jumin, sex, tel,
                                 insure_amt, insure_type, token, jumin2, email)
                            VALUES
                                ${values.join(',\n            ')}
                        `;
                    
                        await insertReq.query(sqlText);
                    }
                    await tx.commit();
                } catch (err) {
                    msg = err;
                    console.log(err);
                }
            } catch (err) {
                msg = err;
                console.log(err);
            }
        }
    }
    if (msg) rs = 'no'; else rs = 'ok';
    res.json ({success: rs, errorMsg: msg , title: titleData , html: htmlData , uid: uid  });
}