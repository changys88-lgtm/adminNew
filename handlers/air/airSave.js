const deps = require('../../src/common/dependencies');
const { arrGdsData } = require('../../src/utils/airConst'); 
const { uidNext } = require('../../src/utils/idxFunction')

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
    const mainTable       = 'airLine_code';

    let   html            = '';
    let   s               = '';
    let   modes           = '';
    let   row             = {};
    let   buttonName      = '신규입력';
    if (mode === "view") {
            sqlText   = ` select * from notice where uid = @uid `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
            row       = sqlResult.recordset?.[0];
            let img = '';
            img += row.att_file   ? `<br><a href='${deps.bbsImgName}/notice/${row.att_file}'  ><img src='${deps.bbsImgName}/notice/${row.att_file}' width='600'><br>${row.att_file}</a>  ` : '';
            img += row.att_file_2 ? `<br><a href='${deps.bbsImgName}/notice/${row.att_file_2}'>${row.att_file_2}</a>` : '';
            titleData = `<i class="fas fa-edit" style="color:#777;font-size:16px;"></i> 공지사항 보기<span class='font15'>(${row.uid || ''}) </span>`;
            const view = row.viewPos
                            .replace('A','관리자 ')
                            .replace('B','파트너 ')
                            .replace('C','고객 ');
            
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
                                <th  class="" style="width:130px;" required>제목  </th>
                                <td class="" colspan="3">
                                    ${row.subject || ''}
                                </td>
                            </tr>
                            <tr>
                                <th  class="" style="">등록구분</th>
                                <td>
                                    ${arrNotice[row.gubun1 || '']}
                                </td>
                                <th  class="" style="">등록자</th>
                                <td>
                                    ${row.username || ''}
                                </td>
                            </tr>
                            <tr>
                                <th  class="" style="">노출위치</th>
                                <td colspan=''>
                                    ${view || ''}
                                </td>
                                <th  class="" style="width:90px;line-height:30px;">팝업사이즈</th>
                                <td class="" colspan="">
                                    ${row.size1 || ''} x ${row.size2 || ''}
                                </td>
                            </tr>
                            <tr>
                                <th  class="" style="width:90px;line-height:30px;">팝업기간</th>
                                <td class="" colspan="">
                                    ${deps.cutDate(row.term1 || '')} - 
                                    ${deps.cutDate(row.term2 || '')}
                                </td>
                                <th  class="" style="width:90px;line-height:30px;">팝업사용</th>
                                <td class="">${row.popup === "Y" ? ' 사용' : ''}</td>
                            </tr>
                            <tr>
                                <th  class="" style="width:90px;line-height:30px;">링크주소</th>
                                <td class="" colspan="3">${row.link_url || ''}</td>
                            </tr>
                            <tr>
                                <th  class="" style="">내용</th>
                                <td class='border-bottom' colspan="3">
                                    ${row.content}
                                    ${img}
                                </td>
                            </tr>
                            
                            
                        </table>
                        </div>
                    </div>
                    <div class="regis-btn ">
                        <div class="action_area_center">
                            <span type="button" class="btn btn-yellow " onCLick="return newReg('${uid}','modify')" style="width:50%;font-size:19px !important;padding-top:10px;padding-bottom:13px;">수정하기</span>
                        </div>
                    </div>
                    </div>
                </form>
            `;
        
    } else if (mode === "input" || mode === "modify") {
        if (mode === "input") {
            buttonName = '신규입력';
            titleData  = `<i class="fas fa-edit search-title-text"> 항공사 코드 등록</i>`;
            viewPos    = '';
        } else {
            buttonName = '수정입력';
            titleData  = `<i class="fas fa-edit search-title-text"> 항공사 코드 수정 <span class='font13'>(${uid || ''}) </span></i>`;
            sqlText   = ` select * from ${mainTable} where uid = @uid `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
            row       = sqlResult.recordset?.[0];
        }
        modes      = mode;
        let sData = '', iData = '' , selHTML = '';
        for (const [k,v] of Object.entries(arrGdsData)) {
            const s1 = k === (row.SearchGDS || '').trim() ? 'selected' : '';
            const s2 = k === (row.GDS || '').trim() ? 'selected' : '';
            sData += ` <option value='${k}' ${s1}> ${v} </option>`;
            iData += ` <option value='${k}' ${s2}> ${v} </option>`;
        }
        sqlText = ` select site_code ,site_name from site where BSP_USE = 'Y' `;
        sqlResult = await pool.request().query(sqlText);
        for (const put of sqlResult.recordset) {
            let {site_code ,site_name } = put;
            const s = site_code === row.issueSite ? 'selected' : '';
            selHTML += `<option value='${site_code}' ${s}> ${site_name} </option>`;
        }
        htmlData   = `
            <form name="frmDetail" id="frmDetail" method="post" enctype="multipart/form-data">
                <input type="hidden" name="mode"		value="save">
                <input type="hidden" name="uid"			value="${uid}">
                <input type="hidden" name="orgMode"		value="${mode}">
                <div class="border regis-box shadow-sm menuArea" >
                <div class="row w-90 p-3">
                    <div class="col">
                    <table class="table regis-hotel">
                        <tr>
                            <th  class="" >2코드</th>
                            <td class=""><input name="code_2" type="text"  class="form-control form-control-sm wh100" value="${row.code_2 || ''}"></td>
                            <th  class="" >3코드</th>
                            <td class=""><input name="code_3"  type="text"  class="form-control form-control-sm wh100" value="${row.code_3 || ''}" ></td>
                        </tr>
                        <tr>
                            <th  class="" >한글</th>
                            <td class="" colspan=""><input name="name" type="text" maxlength="20" class="form-control form-control-sm wh150" value="${row.name || ''}"></td>
                            <th  class="" >영문</th>
                            <td class="" colspan=""><input name="eng_name" type="text" maxlength="50" class="form-control form-control-sm wh150" value="${row.eng_name || ''}"></td>
                        </tr>
                        <tr>
                            <th  class="" >검색GDS</th>
                            <td class="" colspan="" style="">
                                <select name="SearchGDS" class="search_action_select">
                                    <option value=''>선택하세요
                                    ${sData}
                                </select>
                            </td>
                            <th  class="" >발권GDS</th>
                            <td class="" colspan="" style="">
                                <select name="GDS" class="search_action_select">
                                    <option value=''>선택하세요
                                    ${iData}
                                </select>
                            </td>
                        </tr>

                        <tr>
                            <th  class="" style="line-height:30px;">발권BSP</th>
                            <td class="" colspan="">
                                <select name="issueSite"  class="search_action_select">
                                    <option value="">선택 하세요
                                    ${selHTML}
                                </select>
                            </td>
                            <td colspan="2" class="cored">지정시 발권BSP 최우선 지정 (지역 무관)</td>
                        </tr>

                        <tr>
                            <th  class="" >콜센터</th>
                            <td class="" colspan=""><input name="callCenter" type="text"  class="search_action_input " value="${row.callCenter || ''}"></td>
                            <th  class="" >발권기번호</th>
                            <td class="" colspan=""><input name="issueNum" type="text"  class="search_action_input wh40" value="${row.issueNum || ''}"> 해당시에만 입력하세요</td>
                        </tr>
                        <tr>
                            <th  class="" >단체담당자</th>
                            <td class="" colspan=""><input name="group_manager" type="text"  class="search_action_input " value="${row.group_manager || ''}"></td>
                            <th  class="" >단체이메일</th>
                            <td class="" colspan=""><input name="group_email" type="text"  class="search_action_input " value="${row.group_email || ''}"> </td>
                        </tr>
                        <tr>
                            <th  class="" >탑승카운터</th>
                            <td class="" colspan="3"><textarea name="bordingCounter" type="text"  class="search_action_input ">${row.bordingCounter || ''}</textarea></td>
                        </tr>
                        <tr>
                            <th  class="" >퍼스트</th>
                            <td class="" colspan=""><input name="sFirst" type="text"  class="search_action_input " value="${row.sFirst || ''}" placeholder=",구분자로 클래스 입력"></td>
                            <th  class="" >비지니스</th>
                            <td class="" colspan=""><input name="sBusiness" type="text"  class="search_action_input " value="${row.sBusiness || ''}" placeholder=",구분자로 클래스 입력"> </td>
                        </tr>
                        <tr>
                            <th  class="" >추가 화물</th>
                            <td class="" colspan="3">
                                1. 
                                <input name="bag_class1" type="text"  class="search_action_input wh120"  value="${row.bag_class1 || ''}" placeholder="C,D 입력">
                                    
                                <input name="bag_size1"  type="text"  class="search_action_input wh300 " value="${row.bag_size1 || ''}"  placeholder="2PC 46KG">
                                <br>
                                2. 
                                <input name="bag_class2" type="text"  class="search_action_input wh120"  value="${row.bag_class2 || ''}" placeholder="Y,H ">
                                    
                                <input name="bag_size2"  type="text"  class="search_action_input wh300 " value="${row.bag_size2 || ''}"  placeholder="1PC 23KG">
                                <br>
                                3. 
                                <input name="bag_class3" type="text"  class="search_action_input wh120"  value="${row.bag_class3 || ''}" placeholder=", 구분">
                                    
                                <input name="bag_size3"  type="text"  class="search_action_input wh300 " value="${row.bag_size3 || ''}"  placeholder="0PC">
                                <br>
                                <span class='cored'>위의 정보와 일치시 주문서의 추가 화물정보에 우선 기입 된다.(초기 저상시에만)</span>
                            </td>
                            
                        </tr>

                        <tr>
                            <th  class="" >VI 여부</th>
                            <td class="" colspan="3">
                                <label><input name="viSend" type="checkbox" value="Y" ${(row.viSend || '') === 'Y' ? 'checked' : ''}> VI 지급가능</label>
                                &nbsp; &nbsp; &nbsp; &nbsp; 
                                <label><input name="viType" type="radio" value="D"    ${(row.viType || '') === 'D' ? 'checked' : ''}> 국내출발만</label>
                                &nbsp; &nbsp; 
                                <label><input name="viType" type="radio" value="A"    ${(row.viType || '') === 'A' ? 'checked' : ''}> 모든출발</label>
                            </td>
                        </tr>
                        <tr>
                            <th  class="" >Comm 반올림</th>
                            <td class="" colspan="">
                                <label><input name="comm_round" type="radio" value="1" ${(row.comm_round || '') === '1' ? 'checked' : ''} > 반올림</label>
                                &nbsp; &nbsp; 
                                <label><input name="comm_round" type="radio" value="2" ${(row.comm_round || '') === '2' ? 'checked' : ''} > 올림</label>
                                &nbsp; &nbsp; 
                                <label><input name="comm_round" type="radio" value="3" ${(row.comm_round || '') === '3' ? 'checked' : ''} > 버림</label>
                            </td>
                            <th  class="" >당일발권제한</th>
                            <td class="" colspan=""><input name="issueLimit" type="number" placeholder="3"  class="search_action_input wh40" value="${row.issueLimit || ''}"> 시간 이상만 예약</td>
                        </tr>
                        <tr>
                            <th  class="" >리이슈 </th>
                            <td class="" colspan="">
                                <input name="reSearch" type="checkbox" value="Y" ${(row.reSearch || '') === 'Y' ? 'checked' : ''} >리이슈 가능
                                / 택스코드:<input name="reissueTax" type="text"  class="search_action_input wh40 ac"  value="${row.reissueTax || ''}"  title="리이슈시 항공사에저 지정된 택스코드"> OD
                            </td>
                            <th  class="" >항공사 그룹 </th>
                            <td class="" colspan="">
                                <select name="air_group"  class="search_action_select">
                                    <option value="">선택 하세요
                                    <option value="F" ${(row.air_group || '') === 'F' ? 'selected' : ''} > Full Carrier
                                    <option value="L" ${(row.air_group || '') === 'L' ? 'selected' : ''} > LCC (Low Cost Carrier)
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th  class="" >Direct Api</th>
                            <td class="" style="" colspan="3">
                                <input name="directApi" type="checkbox" value="Y" ${(row.directApi || '') === 'Y' ? 'checked' : ''}> 사용
                                지역:<input name="useRoute" type="text"  class="search_action_input whp50"  value="${row.useRoute || ''}"> ICN/SIN/SGN/LAX
                            </td>
                        </tr>
                        <tr>
                            <th  class="" >동시발권인원</th>
                            <td class="" colspan="" style=""><input name="max_member" type="text"  class="search_action_input wh60"  placeholder="9" value="${row.max_member || ''}"> 최대 7명</td>
                            <th  class="" >동시발권세그</th>
                            <td class="" colspan="" style=""><input name="max_seg" type="text"  class="search_action_input wh60"     placeholder="18" value="${row.max_seg || ''}"> 최대 16세그</td>
                        </tr>
                        <tr>
                            <th  class=" cored" >발권금지인원</th>
                            <td class=" cored" colspan="3" style=""><input name="issue_limit" type="text"  class="search_action_input wh60"  placeholder="9" value="${(row.issue_limit || '').trim()}"> 
                            같은일정의 최대 발권 인원수 지정(미지정시 제한없음 , 예약컨펌에서 제한됨)</td>
                        </tr>
                        <tr>
                            <th  class="" >강제TL</th>
                            <td class="" colspan="3" style=""><input name="force_TL" type="text"  class="search_action_input wh60"  placeholder="2" value="${row.force_TL || ''}"> 예약후 입력시간까지발권, 미입력시 GDS 기준</td>
                        </tr>
                        <tr>
                            <th  class="" >카드발권</th>
                            <td class="" colspan="" style=""><input name="cardNo" type="checkbox" value="Y" ${(row.cardNo || '') === 'Y' ? 'checked' : ''}> 카드발권이 안될때 체크</td>
                            <th  class="" >FOID</th>
                            <td class="" colspan="" style=""><input name="FOID" type="checkbox" value="Y" ${(row.FOID || '') === 'Y' ? 'checked' : ''} > FOID 지정</td>
                        </tr>
                        <tr>
                            <th  class="" >자동발권불가</th>
                            <td class="" colspan="" style=""><input name="autoIssueNo" type="checkbox" value="Y"  ${(row.autoIssueNo || '') === 'Y' ? 'checked' : ''} > 자동발권불가시</td>
                            <th  class="" >불가사유</th>
                            <td class="" colspan="" style=""><input name="noReason" type="text"  class="search_action_input "  value="${row.noReason || ''}"></td>
                        </tr>
                        <tr>
                            <th  class="" >판매금지</th>
                            <td class="" colspan="3" style=""><input name="sale_ban" type="checkbox" value="Y" ${(row.sale_ban || '') === 'Y' ? 'checked' : ''}> 판매금지 (검색이 되어도 노출이 제한된다)</td>
                        </tr>
                        
                    </table>
                    </div>
                </div>
                <div class="regis-btn ">
                    <div class="col-12 ac" style="margin-bottom:20px;">
                        <span type="button" class="btn btn-yellow " onCLick="return inputCheck()" style="width:50%;font-size:19px !important;padding-top:10px;padding-bottom:13px;">${buttonName}</span>
                    </div>
                </div>
                </div>
            </form>
        `;
    } else if (mode === "save") {
        if (orgMode === "input" && !uid) {
            sqlText = `select count(*) as cnt from airLine_code where code_2 = '${data.code_2}'`;
            sqlResult = await pool.request().query(sqlText);
            cnt = sqlResult.recordset?.[0]?.cnt;
            if (cnt > 0 ) {
                msg = '이미 등록된 항공사입니다.';
            } else {
                uid = await uidNext(`${mainTable}`, pool );
                sqlText = `insert into ${mainTable} (uid) values (@uid) `;
                sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
            }
        }
        if (!msg) {
            sqlText = `
                update ${mainTable} set
                    code_2			= '${data.code_2 || ''}',
                    code_3			= '${data.code_3 || ''}',
                    name			= '${data.name || ''}',
                    eng_name		= '${data.eng_name || ''}',
                    SearchGDS		= '${data.SearchGDS || ''}',
                    GDS			    = '${data.GDS || ''}',
                    issueNum		= '${data.issueNum || ''}',
                    issueSite		= '${data.issueSite || ''}',
                    usage			= '${data.usage || ''}',
                    callCenter		= '${data.callCenter || ''}',
                    bordingCounter	= '${data.bordingCounter || ''}',
                    sFirst			= '${data.sFirst || ''}',
                    sBusiness		= '${data.sBusiness || ''}',
                    cardNo			= '${data.cardNo || ''}',
                    group_manager	= '${data.group_manager || ''}',
                    group_email		= '${data.group_email || ''}',
                    air_group		= '${data.air_group || ''}',
                    bag_class1		= '${data.bag_class1 || ''}',
                    bag_size1		= '${data.bag_size1 || ''}',
                    bag_class2		= '${data.bag_class2 || ''}',
                    bag_size2		= '${data.bag_size2 || ''}',
                    bag_class3		= '${data.bag_class3 || ''}',
                    bag_size3		= '${data.bag_size3 || ''}',
                    max_member		= '${data.max_member || ''}',
                    max_seg			= '${data.max_seg || ''}',
                    issueLimit		= '${data.issueLimit || ''}',
                    force_TL		= '${data.force_TL || ''}',
                    reissueTax		= '${data.reissueTax || ''}',
                    FOID			= '${data.FOID || ''}',
                    autoIssueNo		= '${data.autoIssueNo || ''}',
                    noReason		= '${data.noReason || ''}',
                    issue_limit		= '${data.issue_limit || ''}',
                    sale_ban		= '${data.sale_ban || ''}',
                    viSend			= '${data.viSend || ''}', 
                    viType			= '${data.viType || ''}', 
                    directApi		= '${data.directApi || ''}', 
                    useRoute		= '${data.useRoute || ''}' , 
                    comm_round		= '${data.comm_round || ''}',
                    reSearch		= '${data.reSearch || ''}' 
                where uid = @uid
            `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
        }
    }
    if (msg) rs = 'no'; else rs = 'ok';
    res.json ({success: rs, errorMsg: msg , title: titleData , html: htmlData , uid: uid  });
}