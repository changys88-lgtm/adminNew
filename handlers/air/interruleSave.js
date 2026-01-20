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
    const mainTable       = 'interlineFareRule';

    let   html            = '';
    let   s               = '';
    let   modes           = '';
    let   row             = {};
    let   buttonName      = '신규입력';
    if (mode === "view") {
            sqlText   = ` select * from ${mainTable} where uid = @uid `;
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
                                <th scope="row" class="regis-hotel-td1" style="width:130px;" required>제목  </th>
                                <td class="regis-hotel-td2" colspan="3">
                                    ${row.subject || ''}
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="">등록구분</th>
                                <td>
                                    ${arrNotice[row.gubun1 || '']}
                                </td>
                                <th scope="row" class="regis-hotel-td1" style="">등록자</th>
                                <td>
                                    ${row.username || ''}
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="">노출위치</th>
                                <td colspan=''>
                                    ${view || ''}
                                </td>
                                <th scope="row" class="regis-hotel-td1" style="width:90px;line-height:30px;">팝업사이즈</th>
                                <td class="regis-hotel-td2" colspan="">
                                    ${row.size1 || ''} x ${row.size2 || ''}
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="width:90px;line-height:30px;">팝업기간</th>
                                <td class="regis-hotel-td2" colspan="">
                                    ${deps.cutDate(row.term1 || '')} - 
                                    ${deps.cutDate(row.term2 || '')}
                                </td>
                                <th scope="row" class="regis-hotel-td1" style="width:90px;line-height:30px;">팝업사용</th>
                                <td class="regis-hotel-td2">${row.popup === "Y" ? ' 사용' : ''}</td>
                            </tr>
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="width:90px;line-height:30px;">링크주소</th>
                                <td class="regis-hotel-td2" colspan="3">${row.link_url || ''}</td>
                            </tr>
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="">내용</th>
                                <td class='border-bottom' colspan="3">
                                    ${row.content}
                                    ${img}
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
            titleData  = `<i class="fas fa-edit search-title-text"> 국제선 규정 관리 등록</i>`;
            viewPos    = '';
        } else {
            buttonName = '수정입력';
            titleData  = `<i class="fas fa-edit search-title-text"> 국제선 규정 관리 수정 <span class='font13'>(${uid || ''}) </span></i>`;
            sqlText   = ` select a.*  from ${mainTable} as a  where a.uid = @uid `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
            row       = sqlResult.recordset?.[0];
        }
        modes      = mode;
        let aData = [];   
        sqlText = `select * from ${mainTable}_refund where uid_minor = @uid order by minor_num`;
        sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
        for (const put of sqlResult.recordset) {
            const minor_num   = put.minor_num || '';
            const fromDate    = (put.fromDate ?? '').trim();
            const fromMinute  = (put.fromMinute ?? '').trim();
            const untilDate   = (put.untilDate ?? '').trim();
            const untilMinute = (put.untilMinute ?? '').trim();
            const distance1   = put.distance1 || '';
            const distance2   = put.distance2 || '';
            const distance3   = put.distance3 || '';
            aData.push({
                minor_num,
                fromDate,
                fromMinute,
                untilDate,
                untilMinute,
                distance1,
                distance2,
                distance3
            });
        }

        let subData = '';
        for (let ix = 0 ; ix < 8 ; ix ++) {
            const ii = ix + 1;
            subData     += `
                <tr>
                    <td >
                        ${ii}
                    </td>
                    <td>
                        <input name='fromDate_${ii}'     type='text' maxlength='10' class='form-control form-control-sm wh50' value='${aData[ix]?.fromDate || ''}' placeholder='언제부터 일' title='언제부터 날수 입력'>  
                        <input name='fromMinute_${ii}'   type='text' maxlength='10' class='form-control form-control-sm wh50' value='${aData[ix]?.fromMinute || ''}' placeholder='언제부터 분' title='언제부터 분으로 입력'>  
                    </td>
                    <td>
                        <input name='untilDate_${ii}'   type='text' maxlength='10' class='form-control form-control-sm wh50' value='${aData[ix]?.untilDate || ''}' placeholder='언제부터 일' title='언제까지 날수 입력'>  
                        <input name='untilMinute_${ii}' type='text' maxlength='10' class='form-control form-control-sm wh50' value='${aData[ix]?.untilMinute || ''}' placeholder='언제부터 분' title='언제까지 분으로 입력'>  
                    </td>
                    <td>
                        <input name='distance1_${ii}'  type='text' maxlength='10' class='form-control form-control-sm wh80' value='${aData[ix]?.distance1 || ''}' placeholder='패널티 금액 입력' title='패널티 금액 입력'>  
                    </td>
                    <td>
                        <input name='distance2_${ii}'  type='text' maxlength='10' class='form-control form-control-sm wh80' value='${aData[ix]?.distance2 || ''}' placeholder='패널티 금액 입력' title='패널티 금액 입력'>  
                    </td>
                    <td>
                        <input name='distance3_${ii}' type='text' maxlength='10' class='form-control form-control-sm wh80' value='${aData[ix]?.distance3 || ''}' placeholder='패널티 금액 입력' title='패널티 금액 입력'>  
                    </td>
                </tr>
            `;
        }

        htmlData   = `
            <form name="frmDetail" id="frmDetail" method="post" enctype="multipart/form-data">
                <input type="hidden" name="mode"		value="save">
                <input type="hidden" name="uid"			value="${uid}">
                <input type="hidden" name="orgMode"		value="${mode}">
                <input type="hidden" name="site_code"	value="${row.site_code || 'OY00170'}">
                <div class="border regis-box shadow-sm menuArea" >
                <div class="row w-90 p-3">
                    <div class="col">
                    <table class="search-view-table">
                        <tr>
							<th scope="row" class="regis-hotel-td1 pat5" >항공편</th>
							<td class=" " >
								<input name="carrierCode" type="text" maxlength="2" class=" wh40" value="${row.carrierCode || ''}" placeholder="KE">  예) KE
							</td>
							<th scope="row" class="regis-hotel-td1 pat5" >해당클래스</th>
							<td class=" " >
								<input name="airClass" type="text"  class=" wh100" value="${row.airClass || ''}" placeholder="Y,Q,E"> 예) Y,Q,E
							</td>
						</tr>
						<tr>
							<th scope="row" class="" style="line-height:30px;">발권일</th>
							<td class="" colspan="">
								<input name="issue_term1"  type="text" readonly onClick="datePick('issue_term1')" id="issue_term1" class=" wh100" value="${deps.cutDate(row.issue_term1 || '')}" >
								~
								<input name="issue_term2"  type="text" readonly onClick="datePick('issue_term2')" id="issue_term2" class=" wh100" value="${deps.cutDate(row.issue_term2 || '')}" >
							</td>
							<th scope="row" class=" pat5" >해당브랜드</th>
							<td class=" " >
								<input name="airBrand" type="text"  class=" wh100" value="${row.airBrand || ''}" placeholder="FLEX"> 예) FLEX
							</td>
						</tr>
						<tr>
							<th scope="row" class="" style="line-height:30px;">출발일</th>
							<td class="" colspan="3">
								<input name="term1"  type="text" readonly onClick="datePick('term1')" id="term1" class=" wh100" value="${deps.cutDate(row.term1 || '')}" >
								~
								<input name="term2"  type="text" readonly onClick="datePick('term2')" id="term2" class=" wh100" value="${deps.cutDate(row.term2 || '')}" >
								<span class="cored">* 필요시 입력</span>
							</td>
						</tr>
						<tr>
							<th scope="row" class=" wh80 pat5" >요금 규정</th>
							<td class=" " colspan="3">
								<textarea name="fareRule"  type="text"  class=" search_action_search_input hh50" >${row.fareRule || ''}</textarea>
							</td>
						</tr>
						<tr>
							<th scope="row" class=" wh80 pat5" >노쇼 안내</th>
							<td class=" " colspan="3">
								<textarea name="refundRule"  type="text"  class=" search_action_search_input hh50" >${row.refundRule || ''}</textarea>
							</td>
						</tr>
						<tr>
							<th scope="row" class=" wh80 pat5" >수화물 규정</th>
							<td class=" " colspan="3">
								<textarea name="baggage"  type="text"  class=" search_action_search_input hh50" >${row.baggage || ''}</textarea>
							</td>
						</tr>
						<tr>
							<th scope="row" class=" wh80 pat5" >환불 상세</th>
							<td class=" " colspan="3">
								<table class="search-view-table ">
									<tr >
										<th class="hh20">No</th>
										<th class="">언제부터</th>
										<th class="">언제까지</th>
										<th class="">단거리</th>
										<th class="">중거리</th>
										<th class="">장거리</th>
									</tr>
									${subData}
								</table>
							</td>
						</tr>
                        
                    </table>
                    </div>
                </div>
                <div class="regis-btn ">
                    <div class="ac">
                        <span type="button" class="btn btn-yellow " onCLick="return inputCheck()" style="width:50%;font-size:19px !important;padding-top:10px;padding-bottom:13px;">${buttonName}</span>
                    </div>
                </div>
                </div>
            </form>
        `;
    } else if (mode === "save") {
        if (orgMode === "input" && !uid) {
        
            uid = await uidNext(`${mainTable}`, pool );
            sqlText = `insert into ${mainTable} (uid,up_date) values (@uid,@NOWSTIME) `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).input('NOWSTIME',sql.Int,NOWSTIME).query(sqlText);
        
        }
        if (!msg) {
             
            sqlText = `
                update ${mainTable} set
                    carrierCode		= '${data.carrierCode || ''}',
                    airClass		= '${data.airClass || ''}',
                    airBrand		= '${(data.airBrand || '').toUpperCase()}',
                    fareRule		= '${(data.fareRule || '')}',
                    refundRule		= '${(data.refundRule || '')}',
                    baggage			= '${(data.baggage || '')}',
                    issue_term1		= '${deps.StrClear(data.issue_term1 || '')}',
                    issue_term2		= '${deps.StrClear(data.issue_term2 || '')}',
                    term1			= '${deps.StrClear(data.term1 || '')}',
                    term2			= '${deps.StrClear(data.term2 || '')}'
                where uid = @uid
            `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);

            sqlText = `delete from interlineFareRule_refund where uid_minor = @uid `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
        
            for (let ix = 0 ; ix < 8 ; ix ++) {
                const minor       = ix + 1;
                const fromDate    = data[`fromDate_${minor}`] || '';
                const fromMinute  = data[`fromMinute_${minor}`] || '';
                const untilDate   = data[`untilDate_${minor}`] || '';
                const untilMinute = data[`untilMinute_${minor}`] || '';
                const distance1   = data[`distance1_${minor}`] || '';
                const distance2   = data[`distance2_${minor}`] || '';
                const distance3   = data[`distance3_${minor}`] || '';

                sqlText = `insert into interlineFareRule_refund (uid_minor,minor_num,fromDate,fromMinute,untilDate,untilMinute,distance1,distance2,distance3) `;
                sqlText += ` values (@uid,@minor,@fromDate,@fromMinute,@untilDate,@untilMinute,@distance1,@distance2,@distance3)`;
                sqlResult = await pool.request()
                    .input('uid',sql.Int,uid)
                    .input('minor',sql.Int,minor)
                    .input('fromDate',sql.NVarChar,fromDate)
                    .input('fromMinute',sql.NVarChar,fromMinute)
                    .input('untilDate',sql.NVarChar,untilDate)
                    .input('untilMinute',sql.NVarChar,untilMinute)
                    .input('distance1',sql.NVarChar,distance1)
                    .input('distance2',sql.NVarChar,distance2)
                    .input('distance3',sql.NVarChar,distance3)
                    .query(sqlText);
            }
            
        }
    }
    if (msg) rs = 'no'; else rs = 'ok';
    res.json ({success: rs, errorMsg: msg , title: titleData , html: htmlData , uid: uid  });
}