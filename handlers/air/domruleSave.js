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
    const mainTable       = 'Domestic.dbo.DomGalileoFareRule';

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
                                <th scope="row" class="" style="width:130px;" required>제목  </th>
                                <td class="" colspan="3">
                                    ${row.subject || ''}
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="" style="">등록구분</th>
                                <td>
                                    ${arrNotice[row.gubun1 || '']}
                                </td>
                                <th scope="row" class="" style="">등록자</th>
                                <td>
                                    ${row.username || ''}
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="" style="">노출위치</th>
                                <td colspan=''>
                                    ${view || ''}
                                </td>
                                <th scope="row" class="" style="width:90px;line-height:30px;">팝업사이즈</th>
                                <td class="" colspan="">
                                    ${row.size1 || ''} x ${row.size2 || ''}
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="" style="width:90px;line-height:30px;">팝업기간</th>
                                <td class="" colspan="">
                                    ${deps.cutDate(row.term1 || '')} - 
                                    ${deps.cutDate(row.term2 || '')}
                                </td>
                                <th scope="row" class="" style="width:90px;line-height:30px;">팝업사용</th>
                                <td class="">${row.popup === "Y" ? ' 사용' : ''}</td>
                            </tr>
                            <tr>
                                <th scope="row" class="" style="width:90px;line-height:30px;">링크주소</th>
                                <td class="" colspan="3">${row.link_url || ''}</td>
                            </tr>
                            <tr>
                                <th scope="row" class="" style="">내용</th>
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
            titleData  = `<i class="fas fa-edit search-title-text"> 국내선 규정 관리 등록</i>`;
            viewPos    = '';
        } else {
            buttonName = '수정입력';
            titleData  = `<i class="fas fa-edit search-title-text"> 국내선 규정 관리 수정 <span class='font13'>(${uid || ''}) </span></i>`;
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
            const fromDate    = put.fromDate ?? '';
            const fromMinute  = put.fromMinute ?? '';
            const untilDate   = put.untilDate ?? '';
            const untilMinute = put.untilMinute ?? '';
            const refundS     = put.refundS || '';
            const refundE     = put.refundE || '';
            const refundY     = put.refundY || '';
            const refundC     = put.refundC || '';
            aData.push({ minor_num, fromDate, fromMinute, untilDate, untilMinute, refundS, refundE, refundY, refundC });
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
                        <input name='fromDate_${ii}'     type='text' maxlength='10' class=' wh50' value='${aData[ix]?.fromDate ?? ''}' placeholder='언제부터 일' title='언제부터 날수 입력'>  
                        <input name='fromMinute_${ii}' type='text' maxlength='10' class=' wh50' value='${aData[ix]?.fromMinute ?? ''}' placeholder='언제부터 분' title='언제부터 분으로 입력'>  
                    </td>
                    <td>
                        <input name='untilDate_${ii}'   type='text' maxlength='10' class=' wh50' value='${aData[ix]?.untilDate ?? ''}' placeholder='언제부터 일' title='언제까지 날수 입력'>  
                        <input name='untilMinute_${ii}' type='text' maxlength='10' class=' wh50' value='${aData[ix]?.untilMinute ?? ''}' placeholder='언제부터 분' title='언제까지 분으로 입력'>  
                    </td>
                    <td>
                        <input name='refundS_${ii}'  type='text' maxlength='10' class=' wh80' value='${aData[ix]?.refundS || ''}' placeholder='패널티 금액 입력' title='패널티 금액 입력'>  
                    </td>
                    <td>
                        <input name='refundE_${ii}'  type='text' maxlength='10' class=' wh80' value='${aData[ix]?.refundE || ''}' placeholder='패널티 금액 입력' title='패널티 금액 입력'>  
                    </td>
                    <td>
                        <input name='refundY_${ii}' type='text' maxlength='10' class=' wh80' value='${aData[ix]?.refundY || ''}' placeholder='패널티 금액 입력' title='패널티 금액 입력'>  
                    </td>
                    <td>
                        <input name='refundC_${ii}' type='text' maxlength='10' class=' wh80' value='${aData[ix]?.refundC || ''}' placeholder='패널티 금액 입력' title='패널티 금액 입력'>  
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
                <div class="" >
                <div class="">
                    <div class="">
                    <table class="search-view-table">
                        <tr>
							<th scope="row" class=" pat5" >항공편</th>
							<td class=" " >
								<input name="carrierCode" type="text" maxlength="2" class=" wh40" value="${row.carrierCode || ''}" placeholder="KE">  
							</td>
						</tr>
						<tr>
							<th scope="row" class=" wh80 pat5" >요금 규정</th>
							<td class=" ">
								<textarea name="fareRule"  type="text"  class=" search_action_search_input hh100" >${row.fareRule || ''}</textarea>
							</td>
						</tr>
						<tr>
							<th scope="row" class=" wh80 pat5" >환불 규정</th>
							<td class=" ">
								<textarea name="refundRule"  type="text"  class=" search_action_search_input hh100" >${row.refundRule || ''}</textarea>
							</td>
						</tr>
						<tr>
							<th scope="row" class=" wh80 pat5" >수화물 규정</th>
							<td class=" ">
								<textarea name="baggage"  type="text"  class=" search_action_search_input hh50" >${row.baggage || ''}</textarea>
							</td>
						</tr>
						<tr>
							<th scope="row" class=" wh80 pat5" >환불 상세</th>
							<td class=" ">
								<table class="search-view-table ">
									<tr >
										<th class="hh20">No</th>
										<th class="hh20">언제부터</th>
										<th class="hh20">언제까지</th>
										<th class="hh20">특가석</th>
										<th class="hh20">할인석</th>
										<th class="hh20">일반석</th>
										<th class="hh20">비지니스</th>
									</tr>
									${subData}
								</table>
							</td>
						</tr>
                        
                    </table>
                    </div>
                </div>
                <div class="row w-70 regis-btn ">
                    <div class="col-12 ac" style="margin-bottom:20px;">
                        <span type="button" class="btn btn-yellow " href="javascript://" onCLick="return inputCheck()" style="width:50%;font-size:19px !important;padding-top:10px;padding-bottom:13px;">${buttonName}</span>
                    </div>
                </div>
                </div>
            </form>
        `;
    } else if (mode === "delete") {
        sqlText = `delete from ${mainTable} where uid = @uid `;
        sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
        sqlText = `delete from ${mainTable}_refund where uid_minor = @uid `;
        sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
    } else if (mode === "save") {
        if (orgMode === "input" && !uid) {
        
            uid = await uidNext(`${mainTable}`, pool );
            sqlText = `insert into ${mainTable} (uid,up_date) values (@uid,@NOWSTIME) `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).input('NOWSTIME',sql.NVarChar,NOWSTIME).query(sqlText);
        
        }
        if (!msg) {
             
            sqlText = `
                update ${mainTable} set
                    carrierCode		= '${data.carrierCode || ''}',
                    fareRule		= '${(data.fareRule || '').replace(/'/g, "''")}',
                    refundRule		= '${(data.refundRule || '').replace(/'/g, "''")}',
                    baggage			= '${(data.baggage || '').replace(/'/g, "''")}'
                where uid = @uid
            `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);

            sqlText = `delete from ${mainTable}_refund where uid_minor = @uid `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
        
            for (let ix = 0 ; ix < 8 ; ix ++) {
                const minor       = ix + 1;
                const fromDate    = data[`fromDate_${minor}`] || '';
                const fromMinute  = data[`fromMinute_${minor}`] || '';
                const untilDate   = data[`untilDate_${minor}`] || '';
                const untilMinute = data[`untilMinute_${minor}`] || '';
                const refundS     = data[`refundS_${minor}`] || '';
                const refundE     = data[`refundE_${minor}`] || '';
                const refundY     = data[`refundY_${minor}`] || '';
                const refundC     = data[`refundC_${minor}`] || '';

                sqlText = `insert into ${mainTable}_refund (uid_minor,minor_num,fromDate,fromMinute,untilDate,untilMinute,refundS,refundE,refundY,refundC) `;
                sqlText += ` values (@uid,@minor,@fromDate,@fromMinute,@untilDate,@untilMinute,@refundS,@refundE,@refundY,@refundC)`;
                sqlResult = await pool.request()
                    .input('uid',sql.Int,uid)
                    .input('minor',sql.Int,minor)
                    .input('fromDate',sql.NVarChar,fromDate)
                    .input('fromMinute',sql.NVarChar,fromMinute)
                    .input('untilDate',sql.NVarChar,untilDate)
                    .input('untilMinute',sql.NVarChar,untilMinute)
                    .input('refundS',sql.NVarChar,refundS)
                    .input('refundE',sql.NVarChar,refundE)
                    .input('refundY',sql.NVarChar,refundY)
                    .input('refundC',sql.NVarChar,refundC)
                    .query(sqlText);
            }
            
        }
    }
    if (msg) rs = 'no'; else rs = 'ok';
    res.json ({success: rs, errorMsg: msg , title: titleData , html: htmlData , uid: uid  });
}