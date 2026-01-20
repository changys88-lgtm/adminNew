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
    const mainTable       = 'airPort_code';

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
            titleData = `<i class="fas fa-edit search-title-text"> 공항코드 보기 <span class='font13'>(${row.uid || ''}) </span></i>`;
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
            titleData  = `<i class="fas fa-edit search-title-text"> 공항코드 등록</i>`;
            viewPos    = '';
        } else {
            buttonName = '수정입력';
            titleData  = `<i class="fas fa-edit search-title-text"> 공항코드 수정 <span class='font13'>(${uid || ''}) </span></i>`;
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
                <input type="hidden" name="content"		value="${row.content || ''}">
                <div class="border regis-box shadow-sm menuArea" >
                <div class="row w-90 p-3">
                    <div class="col">
                    <table class="table regis-hotel">
                        
                        <tr>
                            <th scope="row" class="regis-hotel-td1" style="line-height:30px;">공항코드</th>
                            <td class="regis-hotel-td2"><input name="portCode" type="text"  class="form-control form-control-sm wh100" value="${row.portCode || ''}"></td>
                            <th scope="row" class="regis-hotel-td1" style="line-height:30px;">그룹명칭</th>
                            <td class="regis-hotel-td2"><input name="groupName"  type="text"  class="form-control form-control-sm" value="${row.groupName || ''}" ></td>
                        </tr>
                        <tr>
                            <th scope="row" class="regis-hotel-td1" style="line-height:30px;">대륙명</th>
                            <td class="regis-hotel-td2"><input name="region"  type="text"  class="form-control form-control-sm" value="${row.region || ''}" ></td>
                            <th scope="row" class="regis-hotel-td1" style="line-height:30px;">대륙명(영문)</th>
                            <td class="regis-hotel-td2"><input name="region_en"  type="text"  class="form-control form-control-sm" value="${row.region_en || ''}" ></td>
                        </tr>
                        <tr>
                            <th scope="row" class="regis-hotel-td1" style="line-height:30px;">국가명</th>
                            <td class="regis-hotel-td2"><input name="countryName" type="text"  class="form-control form-control-sm" value="${row.countryName || ''}"></td>
                            <th scope="row" class="regis-hotel-td1" style="line-height:30px;">국가명(영문)</th>
                            <td class="regis-hotel-td2"><input name="countryName_en" type="text"  class="form-control form-control-sm" value="${row.countryName_en || ''}"></td>
                        </tr>
                        <tr>
                            <th scope="row" class="regis-hotel-td1" style="line-height:30px;">도시명</th>
                            <td class="regis-hotel-td2"><input name="cityName" type="text"  class="form-control form-control-sm" value="${row.cityName || ''}"></td>
                            <th scope="row" class="regis-hotel-td1" style="line-height:30px;">도시명(영문)</th>
                            <td class="regis-hotel-td2"><input name="cityName_en" type="text"  class="form-control form-control-sm" value="${row.cityName_en || ''}"></td>
                        </tr>
                        <tr>
                            <th scope="row" class="regis-hotel-td1" style="line-height:30px;">공항명</th>
                            <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input name="portName" type="text"  class="form-control form-control-sm" value="${row.portName || ''}"></td>
                            <th scope="row" class="regis-hotel-td1" style="line-height:30px;">공항명(영문)</th>
                            <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input name="portName_en" type="text"  class="form-control form-control-sm" value="${row.portName_en || ''}"></td>
                        </tr>
                        <tr>
                            <th scope="row" class="regis-hotel-td1" style="line-height:30px;">거리 구분</th>
                            <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan="3">
                                <label><input name="distanceType" type="radio" value="1" ${row.distanceType === '1' ? 'checked' : '' }>단거리</label> &nbsp; 
                                <label><input name="distanceType" type="radio" value="2" ${row.distanceType === '2' ? 'checked' : '' } >중거리</label> &nbsp; 
                                <label><input name="distanceType" type="radio" value="3" ${row.distanceType === '3' ? 'checked' : '' }>장거리</label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" class="regis-hotel-td1" style="line-height:30px;">선호항공사</th>
                            <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan="3"><input name="airLike" type="text"  class="form-control form-control-sm whp70" value="${row.airLike || ''}"> 예) KE/OZ/AA</td>
                        </tr>
                        <tr>
                            <th scope="row" class="regis-hotel-td1" style="line-height:30px;">선호경유지</th>
                            <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan="3"><input name="cityLike" type="text"  class="form-control form-control-sm whp70" value="${row.cityLike || ''}"> 예) NYC/LAX </td>
                        </tr>
                        <tr>
                            <th scope="row" class="regis-hotel-td1" style="line-height:30px;">주요도시</th>
                            <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input name="mainCity" type="checkbox" value="Y" ${row.mainCity === 'Y' ? 'checked' : '' } > 주요 도시 목록 노출</td>
                            <th scope="row" class="regis-hotel-td1" style="line-height:30px;">주소필수</th>
                            <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input name="addressReq" type="checkbox" value="Y" ${row.addressReq === 'Y' ? 'checked' : '' } > 도착지 주소 필수 입력</td>
                        </tr>
                        <tr>
                            <th scope="row" class="regis-hotel-td1" style="line-height:30px;">사용금지</th>
                            <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input name="usage" type="checkbox" value="Y" ${row.usage === 'Y' ? 'checked' : '' } > 노출이 제한 된다</td>
                            <th scope="row" class="regis-hotel-td1" style="line-height:30px;">정렬순서</th>
                            <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input name="sorting" type="text"  class="form-control form-control-sm wh50" value="${row.sorting || ''}"></td>
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
            uid = await uidNext(`${mainTable}`, pool );
            sqlText = `insert into ${mainTable} (uid) values (@uid) `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
        }
        sqlText = `
            update ${mainTable} set
                region			= '${data.region || ''}',
                groupName		= '${data.groupName || ''}',
                region_en		= '${data.region_en || ''}',
                countryName		= '${data.countryName || ''}',
                countryName_en	= '${data.countryName_en || ''}',
                cityName		= '${data.cityName || ''}',
                cityName_en		= '${data.cityName_en || ''}',
                portName		= '${data.portName || ''}',
                portName_en		= '${data.portName_en || ''}',
                portCode		= '${data.portCode || ''}',
                mainCity		= '${data.mainCity || ''}',
                sorting			= '${data.sorting || ''}',
                airLike			= '${data.airLike || ''}',
                cityLike		= '${data.cityLike || ''}',
                distanceType	= '${data.distanceType || ''}',
                addressReq      = '${data.addressReq || ''}',
                usage           = '${data.usage || ''}'
            where uid = @uid
        `;
        sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
    }
    
    if (msg) rs = 'no'; else rs = 'ok';
    res.json ({success: rs, errorMsg: msg , title: titleData , html: htmlData , uid: uid  });
}