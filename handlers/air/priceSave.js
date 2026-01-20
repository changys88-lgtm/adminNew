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
    const mainTable       = 'price_management';

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
                        <table class="">
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
            titleData  = `<i class="fas fa-edit search-title-text"> 지역별 요금 등록</i>`;
            viewPos    = '';
        } else {
            buttonName = '수정입력';
            titleData  = `<i class="fas fa-edit search-title-text"> 지역별 요금 수정 <span class='font13'>(${uid || ''}) </span></i>`;
            sqlText   = ` select * from ${mainTable} where uid = @uid `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
            row       = sqlResult.recordset?.[0];
        }
        modes      = mode;
       
        htmlData   = `
            <form name="frmDetail" id="frmDetail" method="post" enctype="multipart/form-data">
                <input type="hidden" name="mode"		value="save">
                <input type="hidden" name="uid"			value="${uid}">
                <input type="hidden" name="orgMode"		value="${mode}">
                <div class="border regis-box shadow-sm menuArea" >
                <div class="row w-90 p-3">
                    <div class="col">
                    <table class="search-view-table">
                        <tr>
                            <th scope="row" class="" >항공사</th>
                            <td class="">
                                <input type="text" class=" wh50 upper" name="airCode" value="${row.airCode || ''}" required> 2코드 (KE,OZ)
                            </td>
                            <th scope="row" class="" >사용여부</th>
                            <td class="">
                                <input type="radio"  name="usage" value=""  ${(row.usage === '') ? 'checked' :'' }  > 사용안함.
                                <input type="radio"  name="usage" value="Y" ${(row.usage === 'Y') ? 'checked' :'' } > 사용한다.
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" class="" >출발지역</th>
                            <td class="">
                                <input type="text" class="form-control form-control-sm wh80 upper" name="departure_city" value="${row.departure_city || ''}"> ICN,GMP
                            <th scope="row" class="" >도착지역</th>
                            <td class="">
                                <input type="text" class="form-control form-control-sm wh80 upper" name="arrive_city" value="${row.arrive_city || ''}"> PEK,SHA
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" class="" >판매시작일</th>
                            <td class="">
                                <input type="text" class="form-control form-control-sm wh150" name="sale_term1"  onClick="datePick('sale_term1')" id="sale_term1" value="${deps.cutDate(row.sale_term1 || '')}" required>
                            <th scope="row" class="" >판매마감일</th>
                            <td class="">
                                <input type="text" class="form-control form-control-sm wh150" name="sale_term2"  onClick="datePick('sale_term2')" id="sale_term2" value="${deps.cutDate(row.sale_term2 || '')}" required>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" class="" >출발시작일</th>
                            <td class="">
                                <input type="text" class=" wh150" name="dep_date1"  onClick="datePick('dep_date1')" id="dep_date1" value="${deps.cutDate(row.dep_date1 || '')}" required>
                            <th scope="row" class="" >출발마감일</th>
                            <td class="">
                                <input type="text" class=" wh150" name="dep_date2"  onClick="datePick('dep_date2')" id="dep_date2" value="${deps.cutDate(row.dep_date2 || '')}" required>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" class="">클래스</th>
                            <td class="" colspan="3"><input type="text" class=" wh200" name="airClass" value="${row.airClass || ''}"> ',' 로 중복 등록 가능</td>
                        </tr>
                        <tr>
                            <th scope="row" class="" >해당거래처</th>
                            <td class="" colspan="3"><input type="text" class=" wh100" name="site_code" value="${row.site_code || ''}"> 한거래처만 등록하세요</td>
                        </tr>
                        <tr>
                            <th scope="row" class="" >성인금액</th>
                            <td class="" colspan="3"><input type="text" class=" wh100" name="adt_amt" value="${row.adt_amt || ''}" required> 10000 , 2% , -5000 , -2% 가능</td>
                        </tr>
                        <tr>
                            <th scope="row" class="" >소아금액</th>
                            <td class="" colspan="3"><input type="text" class=" wh100" name="chd_amt" value="${row.chd_amt || ''}"> </td>
                        </tr>
                        <tr>
                            <th scope="row" class="" >유아금액</th>
                            <td class="" style="border-bottom:1px solid #ddd;" colspan="3"><input type="text" class=" wh100" name="inf_amt" value="${row.inf_amt || ''}"> </td>
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
            let bspSiteCode;
            bspSiteCode = b2bSiteCode ? b2bSiteCode : 'OY00170';
             
            sqlText = `
                update ${mainTable} set
                    airCode        	= '${data.airCode || ''}',
                    departure_city	= '${data.departure_city || ''}',
                    arrive_city	    = '${data.arrive_city || ''}',
                    sale_term1	    = '${deps.StrClear(data.sale_term1 || '')}',
                    sale_term2  	= '${deps.StrClear(data.sale_term2 || '')}',
                    dep_date1	    = '${deps.StrClear(data.dep_date1 || '')}',
                    dep_date2	    = '${deps.StrClear(data.dep_date2 || '')}',
                    airClass	    = '${data.airClass || ''}',
                    usage	        = '${data.usage || ''}',
                    site_code	    = '${data.site_code || ''}',
                    modify_date	    = '${NOWSTIME}',
                    adt_amt	        = '${data.adt_amt || ''}',
                    chd_amt	        = '${data.chd_amt || ''}',
                    inf_amt	        = '${data.inf_amt || ''}',
                    bspSiteCode	    = '${bspSiteCode || ''}'
                where uid = @uid
            `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
        }
    }
    if (msg) rs = 'no'; else rs = 'ok';
    res.json ({success: rs, errorMsg: msg , title: titleData , html: htmlData , uid: uid  });
}