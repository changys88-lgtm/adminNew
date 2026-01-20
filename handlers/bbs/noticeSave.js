const deps = require('../../src/common/dependencies');
const { arrNewsGubun , arrNotice } = require('../../src/utils/airConst'); 
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
            titleData = `<i class="fas fa-edit search-title-text">공지사항 보기 <span class='font13'>(${row.uid || ''}) </span></i> `;
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
                        <div class="col-12 ac" style="margin-bottom:20px;text-align:center;">
                            <span type="button" class="btn btn-yellow " href="javascript://" onCLick="return newReg('${uid}','modify')" style="width:50%;font-size:19px !important;padding-top:10px;padding-bottom:13px;">수정하기</span>
                        </div>
                    </div>
                    </div>
                </form>
            `;
        
    } else if (mode === "input" || mode === "modify") {
        if (mode === "input") {
            buttonName = '신규입력';
            titleData  = `<i class="fas fa-edit search-title-text">공지사항 등록</i> `;
            viewPos    = '';
        } else {
            buttonName = '수정입력';
            titleData  = `<i class="fas fa-edit search-title-text"> 공지사항 수정</i>`;
            sqlText   = ` select * from notice where uid = @uid `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
            row       = sqlResult.recordset?.[0];
            content   = row.content;
            viewPos   = row.viewPos;
        }
        modes      = mode;
        let guData = '';
        let s      = '';
        for (const [k,v] of Object.entries(arrNotice)) {
            const s = row.gubun1 == k ? 'selected' : '';
            guData += `<option value='${k}' ${s}> ${v} </option>`;
        }
        htmlData   = `
            <form name="frmDetail" id="frmDetail" method="post" enctype="multipart/form-data">
                <input type="hidden" name="mode"		value="save">
                <input type="hidden" name="uid"			value="${uid}">
                <input type="hidden" name="orgMode"		value="${mode}">
                <input type="hidden" name="content"		value="${row.content || ''}">
                <div class="border regis-box shadow-sm menuArea" >
                <div class="row w-90 p-3">
                    <div class="col">
                    <table class="table regis-hotel">
                        <tr>
                            <th scope="row" class="regis-hotel-td1" style="width:130px;" required>제목  </th>
                            <td class="regis-hotel-td2" colspan="3">
                                <input name="subject" type="text" placeholder='제목' class="form-control" value="${row.subject || ''}" >
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" class="regis-hotel-td1" style="">등록구분</th>
                            <td class="regis-hotel-td2">
                                <select name=gubun1 class="notice_action_select" >
                                    <option value=''> 선택하세요</option>
                                    ${guData}
                                </select>
                            </td>
                            <th scope="row" class="regis-hotel-td1" style="">등록자</th>
                            <td class="regis-hotel-td2">
                                <input name="username" type="text" placeholder='제목' class="form-control" value="${row.username || ''}" >
                            </td>
                        </tr>
                        <tr>    
                            <th scope="row" class="regis-hotel-td1" style="">노출위치</th>
                            <td class="regis-hotel-td2" colspan="">
                               <label><input type='checkbox' name='aView[]' value='A' ${(viewPos.indexOf('A') !== -1) ? 'checked' : ''}> 관리자 </label> &nbsp; &nbsp; 
                               <label><input type='checkbox' name='aView[]' value='B' ${(viewPos.indexOf('B') !== -1) ? 'checked' : ''}> 파트너 </label> &nbsp; &nbsp; 
                               <label><input type='checkbox' name='aView[]' value='C' ${(viewPos.indexOf('C') !== -1) ? 'checked' : ''}> 고객 </label>
                            </td>
                            <th scope="row" class="regis-hotel-td1" style="width:90px;line-height:30px;">팝업사이즈</th>
                            <td class="regis-hotel-td2" colspan="">
                                <input name="size1"  type="text" maxlength="4" class="form-control form-control-sm wh100" value="${(row.size1 || '').trim()}" placeholder="가로 사이즈" title="가로 사이즈"> x 
                                <input name="size2"  type="text" maxlength="4" class="form-control form-control-sm wh100" value="${(row.size2 || '').trim()}" placeholder="세로 사이즈" title="세로 사이즈">
                            </td>
                        </tr>
                        <tr>
							<th scope="row" class="regis-hotel-td1" style="width:90px;line-height:30px;">팝업기간</th>
							<td class="regis-hotel-td2" colspan="">
								<input name="term1" id="term1"  type="text" readonly onClick="return datePick('term1')" class="form-control form-control-sm wh90"  value="${deps.cutDate(row.term1 || '')}" > - 
								<input name="term2" id="term2"  type="text" readonly onClick="return datePick('term2')" class="form-control form-control-sm wh90"  value="${deps.cutDate(row.term2 || '')}" >
							</td>
							<th scope="row" class="regis-hotel-td1" style="width:90px;line-height:30px;">팝업사용</th>
							<td class="regis-hotel-td2"><label><input name="popup" type="checkbox" value="Y" ${row.popup === "Y" ? 'checked' : ''} > 팝업 공지로 지정함</label></td>
						</tr>
						<tr>
							<th scope="row" class="regis-hotel-td1" style="width:90px;line-height:30px;">링크주소</th>
							<td class="regis-hotel-td2" colspan="3"><input name="link_url" type="text" placeholder='링크주소' class="form-control" value="${row.link_url || ''}" ></td>
						</tr>
                        <tr>
                            <th scope="row" class="regis-hotel-td1" style="">내용</th>
                            <td class='border-bottom' colspan="3">
                                <textarea name="ir1" id="ir1" style="width:100%; height:280px; display:;"></textarea>
                            </td>
                        </tr>
                        
                        
                    </table>
                    </div>
                </div>
                <div class="row w-70 regis-btn ">
                    <div class="col-12 ac" style="margin-bottom:20px;text-align:center;">
                        <span type="button" class="btn btn-yellow " href="javascript://" onCLick="return inputCheck()" style="width:50%;font-size:19px !important;padding-top:10px;padding-bottom:13px;">${buttonName}</span>
                    </div>
                </div>
                </div>
            </form>
        `;
    } else if (mode === "save") {
        if (orgMode === "input" && !uid) {
            uid = await uidNext('notice', pool );
            sqlText = `insert into notice (uid,up_date) values (@uid,@NOWSTIME) `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).input('NOWSTIME',sql.NVarChar , NOWSTIME).query(sqlText);
        }
        const viewPos = aView ? aView.join('') : '';
        content = content.replace( /(?:\s*<p>\s*(?:<br\s*\/?>|&nbsp;|\u00A0)\s*<\/p>)+\s*$/iu,  ''  );
        sqlText = `
            update notice set
                userid    = '${b2bSiteCode}',
                gubun1    = '${gubun1}',
                subject   = '${subject}',
                content   = N'${content}',
                username  = '${username}',
                viewPos   = '${viewPos}',
                link_url  = '${data.link_url || ''}',
                term1     = '${deps.StrClear(data.term1    || '')}',
                term2     = '${deps.StrClear(data.term2    || '')}',
                size1     = '${data.size1    || ''}',
                size2     = '${data.size2    || ''}',
                popup     = '${data.popup    || ''}'
                
            where uid = @uid
        `;
        sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
    }
    
    if (msg) rs = 'no'; else rs = 'ok';
    res.json ({success: rs, errorMsg: msg , title: titleData , html: htmlData , con: content , uid: uid  });
}