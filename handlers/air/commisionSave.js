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
    const mainTable       = 'airLine_comm';

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
                        <table class="search-view-table">
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
                    <div class="regis-btn ">
                        <div class=" ac" style="margin-bottom:20px;">
                            <span type="button" class="btn btn-yellow " onCLick="return newReg('${uid}','modify')" style="width:50%;font-size:19px !important;padding-top:10px;padding-bottom:13px;">수정하기</span>
                        </div>
                    </div>
                    </div>
                </form>
            `;
        
    } else if (mode === "input" || mode === "modify") {
        if (mode === "input") {
            buttonName = '신규입력';
            titleData  = `<i class="fas fa-edit search-title-text"> 항공사 발권 관리 등록</i>`;
            viewPos    = '';
        } else {
            buttonName = '수정입력';
            titleData  = `<i class="fas fa-edit search-title-text"> 항공사 발권 관리 수정 <span class='font13'>(${uid || ''}) </span></i>`;
            sqlText   = ` select a.* , b.site_name from ${mainTable} as a left outer join site as b on a.siteCode = b.site_code where a.uid = @uid `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
            row       = sqlResult.recordset?.[0];
        }
        modes      = mode;
        let siteData = '';   
        sqlText = `select site_code,site_name from site order by site_code`;
        sqlResult = await pool.request().query(sqlText);
        for (const put of sqlResult.recordset) {
            const siteCode = (put.site_code ?? '').trim();
            const site_name = (put.site_name ?? '').trim();
            const s = siteCode === row.siteCode ? 'selected' : '';
            siteData += `<option value='${siteCode}' ${s}> ${site_name}</option>`;
        }
        htmlData   = `
            <form name="frmDetail" id="frmDetail" method="post" enctype="multipart/form-data">
                <input type="hidden" name="mode"		value="save">
                <input type="hidden" name="uid"			value="${uid}">
                <input type="hidden" name="orgMode"		value="${mode}">
                <input type="hidden" name="site_code"	value="${row.site_code || 'OY00170'}">
                <div class="" >
                <div class="row w-90 p-3">
                    <div class="col">
                    <table class="search-view-table">
                        <tr>
							<th scope="row" class="" style=";">항공사 2코드</th>
							<td class=""><input name="airCode" type="text"  class=" wh100" value="${row.airCode || ''}"></td>
							<th scope="row" class="" style=";">발권클래스</th>
							<td class=""><input name="airClass" type="text"  class=" wh100" value="${row.airClass || ''}"></td>
						</tr>
						<tr>
							<th scope="row" class="" style=";">출발도시</th>
							<td class="">
								 <input name="dep_city"  type="text" maxlength="3"  class=" wh60" value="${row.dep_city || ''}" >
							</td>
							<th scope="row" class="" style=";">도착도시</th>
							<td class="">
								 <input name="arr_city"  type="text" maxlength="3" class=" wh60" value="${row.arr_city || ''}" >
							</td>
						</tr>
						<tr>
							<th scope="row" class="" style=";">발권커미션</th>
							<td class="" colspan="">
								<input name="commAmount"  type="text"  class=" wh100" value="${row.commAmount || ''}" >
							</td>
							<th scope="row" class="" style=";">지급커미션</th>
							<td class="" colspan="">
								<input name="outComm"  type="text"  class=" wh100" value="${row.outComm || ''}" >
							</td>
						</tr>
						<tr>
							<th scope="row" class="" style=";">거래처</th>
							<td class=" " colspan="3">
								<input type='text' list='siteCode' name='siteCode' value='${row.siteCode || ''}' tabindex='3' class=' wh100' onChange="siteCheck4(this.value)">
                                <datalist id='siteCode'>${siteData}</datalist>
								<input type='text' name='siteName' value='${row.site_name || ''}' tabindex='3' readonly  class=' ' style='width:174px'>
							</td>
						</tr>
						<tr>
							<th scope="row" class="" style=";">페어코드</th>
							<td class="" colspan="">
								<input name="fareCode"  type="text"  class=" wh100" value="${row.fareCode || ''}" >
							</td>
							<th scope="row" class="" style=";">투어코드</th>
							<td class="" colspan="">
								<input name="tourCode"  type="text"  class=" wh100" value="${row.tourCode || ''}" >
							</td>
						</tr>
						<tr>
							<th scope="row" class="" style=";">발권일</th>
							<td class="" colspan="">
								<input name="sale_term1"  type="text" readonly onClick="datePick('sale_term1')" id="sale_term1" class=" wh100" value="${deps.cutDate(row.sale_term1 || '')}" >
								-
								<input name="sale_term2"  type="text" readonly onClick="datePick('sale_term2')" id="sale_term2" class=" wh100" value="${deps.cutDate(row.sale_term2 || '')}" >
							</td>
							<th scope="row" class="" style=";">출발일</th>
							<td class="" colspan="">
								<input name="start_term1"  type="text" readonly onClick="datePick('start_term1')" id="start_term1"  class=" wh100" value="${deps.cutDate(row.start_term1 || '')}" >
								-
								<input name="start_term2"  type="text" readonly onClick="datePick('start_term2')" id="start_term2"  class=" wh100" value="${deps.cutDate(row.start_term2 || '')}" >
							</td>
						</tr>
						<tr>
							<th scope="row" class="" style=";">사용여부</th>
							<td class="" colspan=""><input name="usage" type="checkbox" value="Y" ${row.usage === "Y" ? "checked" : ""}> 사용 여부 지정</td>
							<th scope="row" class="" style=";">공동운항제외</th>
							<td class="" colspan=""><input name="shareExclude" type="checkbox" value="Y" ${row.shareExclude === "Y" ? "checked" : ""}> 사용 여부 지정</td>
						</tr>
                        
                    </table>
                    </div>
                </div>
                <div class="regis-btn ">
                    <div class=" ac" style="margin-bottom:20px;">
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
                    airCode        	= '${(data.airCode || '').toUpperCase()}',
                    dep_city	    = '${(data.dep_city || '').toUpperCase()}',
                    arr_city	    = '${(data.arr_city || '').toUpperCase()}',
                    sale_term1	    = '${deps.StrClear(data.sale_term1 || '')}',
                    sale_term2  	= '${deps.StrClear(data.sale_term2 || '')}',
                    start_term1	    = '${deps.StrClear(data.start_term1 || '')}',
                    start_term2  	= '${deps.StrClear(data.start_term2 || '')}',
                    airClass	    = '${(data.airClass || '').toUpperCase()}',
                    commAmount	    = '${data.commAmount || ''}',
                    outComm	        = '${data.outComm || ''}',
                    site_code	    = '${data.site_code || ''}',
                    siteCode        = '${data.siteCode || ''}',
                    fareCode	    = '${data.fareCode || ''}',
                    tourCode	    = '${data.tourCode || ''}',
                    usage	        = '${data.usage || ''}',
                    shareExclude	= '${data.shareExclude || ''}'
                where uid = @uid
            `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
        }
    }
    if (msg) rs = 'no'; else rs = 'ok';
    res.json ({success: rs, errorMsg: msg , title: titleData , html: htmlData , uid: uid  });
}