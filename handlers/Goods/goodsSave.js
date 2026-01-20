//const { NVarChar } = require('mssql');
const deps = require('../../src/common/dependencies');
const { uidNext } = require('../../src/utils/idxFunction');
const { minorNext } = require('../../src/utils/database');
const { arrGoodsGubun , arrProductStatus , arrTourMeal , arrTourTransfer , arrMealType } = require('../../src/utils/airConst'); 

module.exports = async (req, res) => {
    const data        = req.body;
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const orgMode     = (data.orgMode || '').trim();   
    const pool        = await deps.getPool();
    let   mode        = (data.mode || '').trim();   
    let   uid         = data.uid  || '';
    let   tourNumber  = data.tourNumber  || '';
    let   minor       = data.minor  || '';
    let   cYear       = data.cYear  || '';
    let   cMonth      = data.cMonth || '';
    let   msg         = '';
    let   sqlText     = '';
    let   sqlResult   = '';
    let   rsCount     = '';
    let   titleData   = '';
    let   htmlData    = '';
    let   passSql     = '';
    let   year = '' , month = '';
    const table       = '';
    const sql         = deps.sql;
    const aes128Encrypt   = deps.aes128Encrypt;
    const aes128Decrypt   = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;
    const NOWSTIME        = deps.getNow().NOWSTIME;
    const NOWS            = deps.getNow().NOWS;
    if (uid && !tourNumber) tourNumber = uid;

    const ca1             = req.body.ca1 || '';
    const ca2             = req.body.ca2 || '';
    const ca3             = req.body.ca3 || '';
    const ca4             = req.body.ca4 || '';
    const GU2             = (req.body.GU2 || '').trim();
    const GU3             = (req.body.GU3 || '').trim();
    const GU4             = (req.body.GU4 || '').trim();
    let   GU2DATA         = '';
    let   GU3DATA         = '';
    let   GU4DATA         = '';
    let   ca1DATA         = '';
    let   ca2DATA         = '';
    let   ca3DATA         = '';
    let   ca4DATA         = '';
    let   html            = '';
    let   s               = '';
    let   modes           = '';
    let   lat             = '';
    let   lon             = '';
    let   siteName        = '';
    if (mode === "pullSel") {
        for (const [code,name] of Object.entries(arrGoodsGubun)) {
            s = (GU2 === code) ? 'selected' : '';
            html += `<option value='${code}' ${s}>${name}</option>`;
        }
        GU2DATA = `<select name="GU2" class="d-inline form-control form-control-sm wh100"  onChange="return formSearch(event)"><option value="">구분</option>${html}</select>`;
        
        sqlText = `select * from nationManager order by sort1,sort2,sort3,sort4 `;
        sqlResult = await pool.request().query(sqlText);
        for (const row of sqlResult.recordset) {
            let {cate1 ,cate2 , cate3 , cate4 , catename } = row;

            if (cate2 === '00' && cate3 === '00' && cate4 === '00') {
                s = (ca1 === cate1) ? "selected" : "";
                ca1DATA += `<option value='${cate1}' ${s}>${catename} ${cate1} `;
            } else if (cate1 === ca1 && cate2 !== '00' && cate3 === '00' && cate4 === '00' ) {
                s = (ca2 === cate2) ? "selected" : "";
                ca2DATA += `<option value='${cate2}' ${s}>${catename} ${cate2}`;
            } else if (cate1 === ca1 && cate2 === ca2 && cate3 !== '00' && cate4 === '00' ) {
                s = (ca3 === cate3) ? "selected" : "";
                ca3DATA += `<option value='${cate3}' ${s}>${catename} ${cate3}`;
            } else if (cate1 === ca1 && cate2 === ca2 && cate3 === ca3 && cate4 !== '00' ) {
                s = (ca4 === cate4) ? "selected" : "";
                ca4DATA += `<option value='${cate4}' ${s}>${catename} ${cate4}`;
            }
        }
        ca1DATA = `<select name="ca1" class="d-inline form-control form-control-sm wh100"   onChange="return formSearch(event)"><option value="">대륙</option>${ca1DATA}</select>`;
        ca2DATA = `<select name="ca2" class="d-inline form-control form-control-sm wh100"   onChange="return formSearch(event)"><option value="">국가</option>${ca2DATA}</select>`;
        ca3DATA = `<select name="ca3" class="d-inline form-control form-control-sm wh100"   onChange="return formSearch(event)"><option value="">도시</option>${ca3DATA}</select>`;
        ca4DATA = `<select name="ca4" class="d-inline form-control form-control-sm wh100"   onChange="return formSearch(event)"><option value="">지역</option>${ca4DATA}</select>`;

        sqlText = `select distinct  member_code , username from Products as a left outer join tblManager as b on a.operator = b.member_code where member_code is not null  `;
        sqlResult = await pool.request().query(sqlText);
        for (const row of sqlResult.recordset) {
            let { member_code , username } = row;
            s = (member_code === GU4) ? "selected" : "";
            GU4DATA += `<option value='${member_code}' ${s}> ${username} </option>`;
        }
        GU4DATA = `<select name="GU4" class="d-inline form-control form-control-sm wh100"   onChange="return formSearch(event)"><option value="">담당자</option>${GU4DATA}</select>`;

    } else if (mode.slice(0,5) === "Goods") {
        let tourGubunData   = '';
        let revStatusData   = '';
        let detailData      = '';
        let memData         = '';
        let buttonName      = '신규입력';
        let bmsUse          = '';
        if (tourNumber) {
            const fieldQuery = `
            ,mainData,detailData,HowToUse,notice,cancelRefund,contain,uncontain,customer,searchKey,address_1,address_2,tourName2,delivery_info,exchange_info,exchange_term,exchange_pay
            ,exchange_notinfo,guide_title,guide_info,exhibiPlace,exhibiScale,exhibiCountry,exhibiHomepage,shoppingNoption
            `;
            sqlText = `select a.* ${fieldQuery} ,  dd.buy_alram ,  dd.confirm_alram , dd.buy_alram_content , dd.confirm_alram_content from Products as a
                            left outer join Products_detail as b on a.tourNumber = b.tourNumber
                            left outer join Products_image as c on a.tourNumber = c.tourNumber
                            left outer join Products_alram as dd on a.tourNumber = dd.tourNumber
                       where a.tourNumber = @tourNumber`;
            sqlResult = await pool.request().input('tourNumber',sql.Int , tourNumber).query(sqlText);
            row = sqlResult.recordset?.[0];
            const gubun = (row.tourGubun < 20) ? Number(row.tourGubun) + 1 : row.tourGubun ;
            sqlText = "select * from CodeManager where gubun = @gubun order by sorting asc ";
            sqlResult  = await pool.request().input('gubun',sql.Int , gubun ).query(sqlText);
            const detailSet  = new Set(row.detailGubun.split(',').filter(Boolean).map(String));
            for (const put of sqlResult.recordset) {
                let { code, content } = put;
                const s     = detailSet.has(code) ? 'checked' : '';
                detailData += `<input class='' name='aDetail[]' type='checkbox' value='${code}' ${s}> ${content} &nbsp; &nbsp; ` ;
            }
            modes       = 'modify';
            buttonName  = '수정입력';
        } else {
            row = {};
            modes = 'input';
        }
        if (b2bSiteCode) {
            sqlText   = `select bmsUse from site where site_code = @site_code `;
            sqlResult = await pool.request().input('site_code',sql.NVarChar , b2bSiteCode).query(sqlText);
            bmsUse    = sqlResult.recordset?.[0]?.bmsUse;
        } else {
            bmsUse    = 'Y';
        }
        titleData = `<i class="fas fa-edit search-title-text">상품 상세(${row.tourName || ''} / ${row.tourNumber || ''})</i>  `;
        if (modes === "modify") {
            titleData += `
            <span class='btn_basic ${(mode === 'Goods')      ? 'btn_yellow' : 'btn_gray'}' onClick="return newReg ('${tourNumber}','Goods')      ">기본사항</span>
            <span class='btn_basic ${(mode === 'GoodsRule')  ? 'btn_yellow' : 'btn_gray'}' onClick="return newReg ('${tourNumber}','GoodsRule')  ">규정등록</span>
            <span class='btn_basic ${(mode === 'GoodsImg')   ? 'btn_yellow' : 'btn_gray'}' onClick="return newReg ('${tourNumber}','GoodsImg')   ">이미지관리</span>
            <span class='btn_basic ${(mode === 'GoodsDay')   ? 'btn_yellow' : 'btn_gray'}' onClick="return newReg ('${tourNumber}','GoodsDay')   ">일정표</span>
            <span class='btn_basic ${(mode === 'GoodsOpt')   ? 'btn_yellow' : 'btn_gray'}' onClick="return newReg ('${tourNumber}','GoodsOpt')   ">옵션설정</span>
            <span class='btn_basic ${(mode === 'GoodsStock') ? 'btn_yellow' : 'btn_gray'}' onClick="return newReg ('${tourNumber}','GoodsStock') ">재고관리</span>
            <span class='btn_basic ${(mode === 'GoodsPr')    ? 'btn_yellow' : 'btn_gray'}' onClick="return newReg ('${tourNumber}','GoodsPr')    ">요금관리</span>
            `;
        }
        const mendatory = "<i class='fas fa-star' style='color: red;' title='필수입력'></i>";
        if (mode === "Goods") {
            sqlText = `select * from tblManager where sale_manager = 'Y'  and resign = '' order by username `;
            sqlResult  = await pool.request().query(sqlText);
            for (const put of sqlResult.recordset) {
                let { username, member_code } = put;
                const s = (member_code === (row.operator || '').trim()) ? 'selected' : '';
                memData += `<option value='${member_code}' ${s}> ${username} `;
            }
            for (const [code,name] of  Object.entries(arrGoodsGubun)) {
                const s = (code === (row.tourGubun || '').trim()) ? 'selected' : '';
                tourGubunData += `<option value='${code}' ${s}>${name}</option>`;                
            }
            for (const [code,name] of  Object.entries(arrProductStatus)) {
                const s = (code === (row.revStatus || '').trim()) ? 'selected' : '';
                revStatusData += `<option value='${code}' ${s}>${name}</option>`;                
            }
            htmlData  = `
                <form name="frmDetail" id="frmDetail" method="post" action="/site/site_save" enctype="multipart/form-data">
                    <input type="hidden" name="mode"		value="${modes}">
                    <input type="hidden" name="uid"			value="${uid}">
                    <input type="hidden" name="tourNumber"	value="${tourNumber}">
                    <input type="hidden" name="orgMode"		value="${mode}">
                    <div >
                    
                    <div>
                        <div>
                        <table class="avn-form-table">
                            <tr class="avn-form-row">
                                <th scope="row"  class="avn-form-th" required>상품명  ${mendatory}</th>
                                <td class="avn-form-td">
                                    <input name="tourName" class="avn-input"   type="text" value="${row.tourName || ''}" >&nbsp;&nbsp;
                                    예명 : <input name="tourNameShort" class="avn-input" placeholder="짧은 상품명 " type="text" value="${row.tourNameShort || ''}" maxlength="20">
                                </td>
                                <th scope="row" class="avn-form-th">노출 순위</th>
                                <td class="avn-form-td">
                                    <input name="main_view" class="avn-input" type="text" value="${row.main_view || 0}" style="width:40px"> '0' 보다 큰수로 낮은수 부터 위에서 보임
                                </td>
                            </tr>
                            <tr class="avn-form-row">
                                <th  scope="row" class="avn-form-th">상품구분 ${mendatory}</th>
                                <td colspan="">
                                    <select name="tourGubun" class="avn-select">
                                        <option value="">상품 구분을 선택하세요
                                        ${tourGubunData}
                                    </select>
                                    <span class="avn-guide-text">※ 상품 구분 변경시에는 꼭 저장후 재로딩후 작업하시기 바랍니다. </span>
                                    <span class="avn-guide-text">※ 기타는 노출되지 않습니다.</span>
                                </td>
                                <th scope="row" class="avn-form-th">예약방법</th>
                                <td class="avn-form-td">
                                    <select name="revStatus" class="avn-select">
                                        ${revStatusData}
                                    </select>
                                </td>
                            </tr>
                            <tr class="avn-form-row">
                                <th scope="row" class="avn-form-th">소분류</th>
                                <td colspan="">
                                    ${detailData}
                                </td>
                                <th scope="row" class="avn-form-th">여권정보</th>
                                <td class="avn-form-td">
                                    <input name="passYN" type="checkbox" value="Y" ${((row.passYN || '') === "Y") ? "checked" : '' } >  예약시 필요함
                                </td>
                            </tr>
                            <tr id='siteCode' class="<?=$class?>">
                                <th scope="row" class="avn-form-th">업체소속</th>
                                <td class="avn-form-td">
                                    <input name='site_code' class="avn-input" type='text'  value='${row.site_code || ''}' onChange="siteCheck(this.value)" >
                                    <input name='saleSite'  class="avn-input" type='text'  value='${row.saleSite || ''}' readonly>
                                    <br>
                                    <div>
                                        <div ID='SiteSearch'></div>
                                    </div>
                                </td>
                                <th scope="row" class="avn-form-th">항공포함</th>
                                <td class="avn-form-td">
                                    <input name="airYN" class="avn-checkbox" type="checkbox" value="Y" ${((row.airYN || '') == "Y") ? "checked" : ''}> 항공포함 상품일때 필요함
                                </td>
                            </tr>
                            <tr class="avn-form-row">
                                <th scope="row" class="avn-form-th">지역 ${mendatory}
                                <input class="avn-btn" type="button" value="지역추가" onClick="addCity()">
                                </th>
                                <td class="avn-form-td">
                                    <ul class="avn-list" ID="CategoryArea">
                                    </ul>
                                </td>
                                
                                <th scope="row" class="avn-form-th">판매담당</th>
                                <td class="avn-form-td">
                                    <select name="operator">
                                        <option value=""> 선택하세요
                                        ${memData}
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="avn-form-th">출발지역
                                </th>
                                <td class="avn-form-td">
                                    <ul class="avn-list" ID="startCategoryArea">
                                    </ul>
                                </td>
                                <th scope="row" class="avn-form-th">도시코드</th>
                                <td class="avn-form-td">
                                    <input name="city_code" class="avn-input" type="text" maxlength="3" value="${row.city_code || ''}">  필요시 입력 (도착도시) BKK
                                </td>
                            </tr>
                            <tr class="avn-form-row">
                                <th scope="row" class="avn-form-th">계약금</th>
                                <td class="avn-form-td">
                                    <input name="depoType" class="avn-radio" type="radio" value="Y" ${((row.depoType ||'').trim() === "Y") ? "checked": '' }>가능
                                    <input name="depoAmount" class="avn-input" type="text" value="${row.depoAmount || 0}">
                                    &nbsp; &nbsp; &nbsp; 
                                    <input name="depoType" class="avn-radio" type="radio" value="F" ${((row.depoType ||'').trim() === "F") ? "checked": '' }>확정후 결제마감일전 완납
                                    &nbsp; &nbsp; &nbsp; 
                                    <input name="depoType" class="avn-radio" type="radio" value="N" ${((row.depoType ||'').trim() === "N") ? "checked": '' }>완납후 확정 가능
                                </td>
                                <th scope="row"  class="avn-form-th">카드 결제</th>
                                <td colspan="" ><input name="card_use" type="checkbox" value="Y" ${((row.card_use ||'').trim() === "Y") ? "checked": '' }> 카드 결제 가능</td>
                            </tr>
                            <tr class="avn-form-row">
                                <th scope="row"  class="avn-form-th">검색연관태그</th>
                                <td colspan=""><input name="searchKey" type="text"  value="${row.searchKey || ''}" placeholder="예) #검색#연관#태그"></td>
                                <th scope="row"  class="avn-form-th">상품EP</th>
                                <td colspan="" title='상품EP란 자사몰에서 판매하는 상품정보를 네이버쇼핑으로 전달하는 파일입니다. 해당 영역이 체크되어있다면 타업체에서 해당 상품을 네이버쇼핑에 노출시킬 수 있습니다.'>
                                    <input name="naver_ep" class="avn-checkbox" type="checkbox" value="Y" ${((row.naver_ep ||'').trim() === "N") ? "checked": '' } > 네이버 상품 EP 노출 여부
                                </td>
                            </tr>
                            <tr class="avn-form-row">
                                <th scope="row"  class="avn-form-th">기간설정</th>
                                <td colspan="3" class="avn-form-td">
                                    <div class="avn-form-group">
                                        <div class="avn-form-item">
                                        <i class="fas fa-clock" style="color:#777;"></i> 판매기간 
                                        <input name="sale_term1" id="sale_term1" class="avn-input" type="text"  style="width:100px;" readonly onClick="datePick('sale_term1')" value="${deps.cutDate(row.sale_term1 || '')}">
                                        -
                                        <input name="sale_term2" id="sale_term2" class="avn-input" type="text" style="width:100px;" readonly onClick="datePick('sale_term2')" value="${deps.cutDate(row.sale_term2 || '')}">
                                        </div>
                                        <div>
                                        <i class="fas fa-clock" style="color:#777;"></i> 이용기간 
                                        <input name="use_term1" id="use_term1" class="avn-input" type="text" style="width:100px;" readonly onClick="datePick('use_term1')" value="${deps.cutDate(row.use_term1 || '')}">
                                        -
                                        <input name="use_term2" id="use_term2" class="avn-input" type="text"  style="width:100px;" readonly onClick="datePick('use_term2')" value="${deps.cutDate(row.use_term2 || '')}">
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr class="avn-form-row">
                                <th scope="row"  class="avn-form-th">주소1</th>
                                <td colspan="" ><input name="address" class="avn-input" type="text" value="${row.address || ''}"></td>
                                <th scope="row"  class="avn-form-th">주소2</th>
                                <td colspan=""><input name="address2" class="avn-input" type="text"  value="${row.address2 || ''}"></td>
                            </tr>
                            <tr class="avn-form-row">
                                <th scope="row"  class="avn-form-th">좌표 등록</th>
                                <td colspan="3" class="avn-form-td">
                                    <i class="fas fa-globe" style="color:#777;"></i> 위도&nbsp;&nbsp;<input name="latitude"  type="text" style="width:120px;" value="${row.latitude || ''}">&nbsp;&nbsp;&nbsp;&nbsp;
                                    <i class="fas fa-globe" style="color:#777;"></i> 경도&nbsp;&nbsp;<input name="longitude" type="text" style="width:120px" value="${row.longitude || ''}">
                                    &nbsp; &nbsp; <input type="button" value="좌표 가져 오기" onClick="googlePick('${tourNumber || ''}')">
                                </td>
                            </tr>
                        </table>
                        </div>
                    </div>
                    <div class="avn-form-footer">
                        <div class="avn-form-footer-item">
                            <span class="avn-btn" type="button" href="javascript://" onCLick="return inputCheck()">${buttonName}</span>
                        </div>
                    </div>
                    <div class="avn-form-map" id="map_canvas_trip" >
                        <div class="avn-form-map-item">Loading...</div>
                    </div>
                </form>
            `;
            lat      = row.latitude  || '';
            lon      = row.longitude || '';
            siteName = row.saleSite  || '';

        } else if (mode === "GoodsRule") {
            let infData = chdData = adtData = s = revAvail = '';
            for (let ix = 1; ix < 19 ; ix ++) {
                if (ix < 5) {
                    s = Number(row.inf_limit || 1) === ix ? 'selected'  : '';
                    infData += `<option value='${ix}' ${s}> ${ix}미만`;
                }
                if (ix < 18) {
                    s = Number(row.chd_limit || 2) === ix ? 'selected'  : '';
                    chdData += `<option value='${ix}' ${s}> ${ix}미만`;
                }
                s = Number(row.adt_limit || 12) === ix ? 'selected'  : '';
                adtData += `<option value='${ix}' ${s}> ${ix}이상`;
            }
            for (let ix = 0; ix <= 10; ix++) {
                const txt = (ix === 0) ? '당일가능' : `${ix}일전`;
                const s = Number(row.rev_avail || '') === ix ? ' selected' : '';
                revAvail += `<option value="${ix}"${s}>${txt}</option>`;
            }
            htmlData  = `
                <form class="avn-form" name="frmDetail" id="frmDetail" method="post" action="/site/site_save" enctype="multipart/form-data">
                    <input class="avn-input" type="hidden" name="mode"		value="${modes}">
                    <input class="avn-input" type="hidden" name="uid"			value="${uid}">
                    <input class="avn-input" type="hidden" name="tourNumber"	value="${tourNumber}">
                    <input class="avn-input" type="hidden" name="orgMode"		value="${mode}">
                    <div class="avn-form-wrap">
                        <div>
                            <table class="avn-form-table">
                                <tr class="avn-form-row">
                                    <th scope="row" style="width:130px;" required>상품명  ${mendatory}</th>
                                    <td class="avn-form-td">
                                        <input name="tourName" type="text" readonly value="${row.tourName || ''}" >&nbsp;&nbsp;
                                        예명 : <input name="tourNameShort" placeholder="짧은 상품명 " readonly type="text" value="${row.tourNameShort || ''}" maxlength="20">
                                    </td>
                                    <th scope="row" class="avn-form-th">노출 순위</th>
                                    <td class="avn-form-td">
                                        <input name="main_view" class="avn-input" type="text" readonly value="${row.main_view || 0}" style="width:40px"> '0' 보다 큰수로 낮은수 부터 위에서 보임
                                    </td>
                            </tr>
                            <tr class="avn-form-row">
                                <th  colspan="4" class="avn-form-th"><h5 class="avn-form-title">- 포함 불포함</h5></th>
                            </tr>   
                            <tr class="avn-form-row">
                                <th scope="row" class="avn-form-th">포함사항 ${mendatory}	</th>
                                <td colspan="3" class="avn-form-td"><textarea name="contain" class="avn-textarea" id="contain" type="text"  onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${row.contain || ''}</textarea></td>
                            </tr>
                            <tr class="avn-form-row">
                                <th scope="row" class="avn-form-th">불포함사항 ${mendatory}	</th>
                                <td colspan="3" class="avn-form-td"><textarea name="uncontain" class="avn-textarea" id="uncontain" type="text"  onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${row.uncontain || ''}</textarea></td>
                            </tr>
                            <tr class="avn-form-row">
                                <th colspan="1" class="avn-form-th"><h5 class="avn-form-title">- 유의사항</h5></th>
                                <td colspan="3" class="avn-form-td">	
                                    <input name="noticeUse" class="avn-radio" type="radio" value="Y" ${((row.noticeUse || '').trim() === "Y")? 'checked' : ''} > 계약서 노출
                                    <input name="noticeUse" class="avn-radio" type="radio" value="N" ${((row.noticeUse || '').trim() === "N")? 'checked' : ''} > 계약서 미노출
                                    &#8251;&#8251; 노출 체크시에만 계약서에서 보입니다 &#8251;&#8251;
                                </td>
                            </tr>
                            <tr class="avn-form-row">
                                <th scope="row" class="avn-form-th">유의사항 ${mendatory}	</th>
                                <td colspan="3" class="avn-form-td"><textarea name="notice" class="avn-textarea" id="notice" type="text"  onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${row.notice || ''}</textarea></td>
                            </tr>
                            <tr class="avn-form-row">
                                <th  colspan="4" class="avn-form-th"><h5 class="avn-form-title">- 취소환불</h5></th>
                            </tr>
                            <tr class="avn-form-row">
                                <th scope="row" class="avn-form-th">취소환불 ${mendatory}
                                </th>
                                <td colspan="3" class="avn-form-td"><textarea name="cancelRefund" class="avn-textarea" id="cancelRefund" type="text"  onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${row.cancelRefund || ''}</textarea></td>
                            </tr>
                            <tr class="avn-form-row">
                                <th  colspan="4" class="avn-form-th"><h5 class="avn-form-title">- 쇼핑 & 선택관광</h5></th>
                            </tr>
                            <tr class="avn-form-row">
                                <th scope="row" class="avn-form-th">쇼핑및옵션	</th>
                                <td colspan="3" class="avn-form-td"><textarea name="shoppingNoption" class="avn-textarea" id="shoppingNoption" type="text"  onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${row.shoppingNoption || ''}</textarea></td>
                            </tr>
                            <tr class="avn-form-row">
                                <th  colspan="4" class="avn-form-th"><h5 class="avn-form-title">- 모객정보</h5></th>
                            </tr>

                            <tr class="avn-form-row">
                                <th scope="row" class="avn-form-th">모객정보
                                </th>
                                <td colspan="3" class="avn-form-td"><textarea name="customer" class="avn-textarea" id="customer" type="text"  onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${row.customer || ''}</textarea></td>
                            </tr>
                            <tr class="avn-form-row">
                                <th scope="row" class="avn-form-th">나이제한</th>
                                <td class="avn-form-td">
                                    <div class="avn-form-group">
                                    유아
                                    <select name="inf_limit" class="avn-select" style="width:90px;" >
                                        ${infData}
                                    </select>&nbsp;&nbsp;&nbsp;&nbsp;
                                    소아
                                    <select name="chd_limit" class="avn-select" style="width:90px;" >
                                        ${chdData}
                                    </select>&nbsp;&nbsp;&nbsp;&nbsp;
                                    성인
                                    <select name="adt_limit" class="avn-select" style="width:90px;" >
                                        ${adtData}
                                    </select>
                                    </div>
                                </td>
                                <th scope="row" class="avn-form-th">예약가능일</th>
                                <td class="avn-form-td">
                                    <select name="rev_avail" class="avn-select" style="width:90px;" >
                                        ${revAvail}
                                    </select>
                                </td>
                            </tr>
                            <tr class='${(!bmsUse) ? 'avn-form-row-none' : 'avn-form-row'}'>
                                <th scope="row"  class="avn-form-th">알림톡설정</th>
                                <td colspan="3" class="avn-form-td">
                                    <div class="avn-form-group">
                                        <div class="avn-form-item">
                                            <i ></i> 구매알림 <input name="buy_alram"  type="text" class="form-control form-control-sm" style="width:90px;" value="${row.buy_alram || ''}"> 다이렉트샌드 설정 번호
                                        </div>
                                        <div class="avn-form-item">
                                            <i ></i> 확정알림 <input name="confirm_alram" class="avn-input" type="text" style="width:90px;" value="${row.confirm_alram || ''}"> 다이렉트샌드 설정 번호
                                        </div>
                                    </div>
                                    <div class="avn-form-group">
                                        <div class="avn-form-item">
                                        <div class="avn-form-item">
                                            <textarea name="buy_alram_content" class="avn-textarea" type="text"  onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${row.buy_alram_content || ''}</textarea>
                                        </div>
                                        <div class="avn-form-item">
                                            <textarea name="confirm_alram_content" class="avn-textarea" type="text"  onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${row.confirm_alram_content || ''}</textarea>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </table>
                        </div>
                    </div>
                    <div class="avn-form-footer">
                        <div class="avn-form-footer-item">
                            <span class="avn-btn" type="button" href="javascript://" onCLick="return modifyCheck()">${buttonName}</span>
                        </div>
                    </div>
                    <div class="avn-form-map" id="map_canvas_trip" >
                        <div class="avn-form-map-item">Loading...</div>
                    </div>
                </form>
                        <div class="avn-form-footer">
                            <div class="avn-form-footer-item">
                            <span type="button" href="javascript://" onCLick="return modifyCheck()">${buttonName}</span>
                        </div>
                    </div>
                    </div>
                </form>
            `;
        } else if (mode === "GoodsImg") {
            sqlText = `select * from Products_images where tourNumber = @tourNumber order by sorting `;
            sqlResult = await pool.request().input('tourNumber',sql.Int , tourNumber).query(sqlText);
            const arrImg = [];
            for (const put of sqlResult.recordset) {
                let { gubun , fileurl , sorting , uid } = put;
                gubun   = gubun.trim();
                fileurl = fileurl.trim();
                const tmp = fileurl.split(".");
                if (fileurl) {
                    if (!arrImg[gubun]) arrImg[gubun] = '';
                    arrImg[gubun]  += `
                        <div class="avn-form-img-item" style='border:2px solid #fff;position:relative;'>
                            <div class="avn-form-img-item-inner" style='position:;z-index:1;'>
                                <img class="avn-form-img-item-img" src='${deps.bbsImgName}/TRIP/${tourNumber}/${tmp[0]}_M.${tmp[1]}' width=200 height=200 > 
                                <div class="avn-form-img-item-close" style='position:absolute;z-index:999;top:10px;left:170px'>
                                    <a class="avn-form-img-item-close-link" href='javascript://' onClick="return imgDel_new('${tourNumber}','${uid}')"><i class='fas fa-times fa-2x' style='color: red'></i></a>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }
            htmlData  = `
                <form class="avn-form" name="frmDetail" id="frmDetail" method="post" action="/site/site_save" enctype="multipart/form-data">
                    <input class="avn-input" type="hidden" name="mode"		value="${modes}">
                    <input class="avn-input" type="hidden" name="uid"			value="${uid}">
                    <input class="avn-input" type="hidden" name="tourNumber"	value="${tourNumber}">
                    <input class="avn-input" type="hidden" name="orgMode"		value="${mode}">
                    <div class="avn-form-wrap">
                    <div class="avn-form-table">
                        <div>
                            <table class="avn-form-table">
                                <tr>
                                    <th scope="row" style="width:130px;" required>상품명  ${mendatory} ${mendatory}</th>
                                    <td class="avn-form-td">
                                        <input name="tourName" class="avn-input" type="text" readonly value="${row.tourName || ''}" >&nbsp;&nbsp;
                                        예명 : <input name="tourNameShort" class="avn-input" placeholder="짧은 상품명 " readonly type="text" value="${row.tourNameShort || ''}" maxlength="20">
                                    </td>
                                    <th scope="row" class="avn-form-th">노출 순위</th>
                                    <td class="avn-form-td">
                                        <input name="main_view" class="avn-input" type="text" readonly value="${row.main_view || 0}" style="width:40px"> '0' 보다 큰수로 낮은수 부터 위에서 보임
                                    </td>
                            </tr>
                            <tr>
								<th scope="row" class="avn-form-th">대표이미지<?=$requiredInputHTML?><br>사이즈(800x800)
								  <a href="javascript:img_sort('','${tourNumber}','','AA');" class="btn btn-outline-gray btn-sm ">sort</a></th>
								<td colspan="3" class="avn-form-td">
									<div ID="ImagesArea1" class="avn-form-img-area" style='position:relative'>${arrImg['AA'] || ''}</div>
									<div id="fine-uploader-gallery" class="avn-form-img-uploader" style="clear:both;"></div>
								</td>
							</tr>
                            <tr>
								<th scope="row" class="avn-form-th">상세안내 ${mendatory}}
								</th>
								<td colspan="3" class="avn-form-td"><textarea name="detailData" class="avn-textarea" type="text"  onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${row.detailData || ''}</textarea></td>
							</tr>
							<tr class="avn-form-row">
								<th scope="row" class="avn-form-th">상세이미지 ${mendatory}
								  <a href="javascript:img_sort('','${tourNumber}','','AB');" class="btn btn-outline-gray btn-sm ">sort</a> </th>
								<td colspan="3" class="avn-form-td">
									<span> * 이미지는 자동으로 리사이징 됩니다</span><small> * 이미지는 독립적으로 실행이 됩니다. </small>
									<div ID="ImagesArea2" class="avn-form-img-area" style='position:relative'>${arrImg['AB'] || ''}</div>
									<div id="fine-uploader-gallery2" class="avn-form-img-uploader" style="clear:both;"></div>
									
								</td>
							</tr>
                        </table>
                        </div>
                    </div>
                    <div class="avn-form-footer">
                        <div class="avn-form-footer-item">
                            <span class="avn-btn" type="button" href="javascript://" onCLick="return modifyCheck()">${buttonName}</span>
                        </div>
                    </div>
                    <div class="avn-form-map" id="map_canvas_trip" class="avn-form-map-item">
                        <div class="avn-form-map-item" class="avn-form-map-item-loading">Loading...</div>
                    </div>
                </form>
                        <div class="avn-form-footer">
                            <div class="avn-form-footer-item">
                            <span class="avn-btn" type="button" href="javascript://" onCLick="return modifyCheck()">${buttonName}</span>
                        </div>
                    </div>
                    </div>
                </form>
            `;
        } else if (mode === "GoodsDay") {
            function airSegPush (ii=1, put=[]) {
                return `
                <tr class="avn-form-row">
                    <td class="avn-form-td">${ii}</td>
                    <td class="avn-form-td"><input type='number' class="avn-input" style='width:50px;text-transform:  ' name='aDepCount[]' id='aDepCount_${ii}'   value='${put.dep_count || ''}'></td>
                    <td class="avn-form-td"><input type='text' class="avn-input" style='width:100px;text-transform: uppercase' name='aFlight[]'  maxlength='6' id='aFlight_${ii}'    value='${put.air_flight || ''}'></td>
                    <td class="avn-form-td"><input type='text' class="avn-input" style='width:100px;text-transform: uppercase' name='aCabin[]'   maxlength='1' id='aCabin_${ii}'     value='${put.cabin || ''}'></td>
                    <td class="avn-form-td"><input type='text' class="avn-input" class="avn-input" style='width:100px;text-transform: uppercase' name='aDepCity[]' maxlength='3' title='3코드로 입력 ICN ' id='aDepCity_${ii}'   value='${put.dep_city || ''}'></td>
                    <td class="avn-form-td"><input type='text' class="avn-input" class="avn-input" style='width:100px;text-transform: uppercase' name='aDepTime[]' maxlength='5' id='aDepTime_${ii}'   value='${put.dep_time || ''}'></td>
                    <td class="avn-form-td"><input type='text' class="avn-input" class="avn-input" style='width:100px;text-transform: uppercase' name='aArrCity[]' maxlength='3' title='3코드로 입력 SPN ' id='aArrCity_${ii}'   value='${put.arr_city || ''}'></td>
                    <td class="avn-form-td"><input type='text' class="avn-input" class="avn-input" style='width:100px;text-transform: uppercase' name='aArrTime[]' maxlength='5' id='aArrTime_${ii}'   value='${put.arr_time || ''}'></td>
                    <td class="avn-form-td"><input type='text' class="avn-input" class="avn-input" style='width:100px;text-transform: uppercase' name='aFitTime[]' maxlength='4' id='aArrGMT_${ii}'   value='${put.fitTime || ''}' placeholder='예) 120'></td>
                    <td class="avn-form-td"><input type='checkbox' class="avn-checkbox"  name='aArrNext_${ii}' id='aArrNext_${ii}'   value='Y' ${(put.arr_nextday || '') === "Y" ? 'checked' : ''}></td>
                    <td class="avn-form-td"><input type='text' class="avn-input" class="avn-input" style='width:100px;text-transform: uppercase' name='aBaggage[]' id='aBaggage_${ii}'   value='${put.baggage || ''}'></td>
                </tr>
                `;
            }
            function daySegPush (ik,ix,put=[]) {
                let img1   = put.daily_attr1 || '';
                let img2   = put.daily_attr2 || '';
                let img3   = put.daily_attr3 || '';
                let img4   = put.daily_attr4 || '';
                let IMG1   = img1 ? `<img src='${deps.bbsImgName}/TRIP/${tourNumber}/${img1.replace(/(\.[^./?]+)(\?.*)?$/, '_S$1$2')}' >` : '';
                let IMG2   = img2 ? `<img src='${deps.bbsImgName}/TRIP/${tourNumber}/${img2.replace(/(\.[^./?]+)(\?.*)?$/, '_S$1$2')}' >` : '';
                let IMG3   = img3 ? `<img src='${deps.bbsImgName}/TRIP/${tourNumber}/${img3.replace(/(\.[^./?]+)(\?.*)?$/, '_S$1$2')}' >` : '';
                let IMG4   = img4 ? `<img src='${deps.bbsImgName}/TRIP/${tourNumber}/${img4.replace(/(\.[^./?]+)(\?.*)?$/, '_S$1$2')}' >` : '';
                let delImg = '';
                let button = '';
                if (ik === put.mNum) {
                    button = `<span class='avn-btn avn-btn-yellow cursor' onClick="addClick('${ik}','$  {ix}')">추가</span>`;
                }
                if (ik > 1) button += `<br><span class='avn-btn avn-btn-red cursor' onClick="return delClick('${ik}','${ix}')">삭제</span>`;
                return  `
                    <div class='avn-form-cell'>
                        <ul class="avn-form-list">
                        <ul class="avn-form-list-item">
                            <li style='width:25%' class="avn-form-list-item-item"><input name='daily${ix}_title[]' type='text' maxlength='50'  class='form-control form-control-sm hh50' value='${put.daily_title || ''}'></li>
                            <li style='width:50%' class="avn-form-list-item-item"><textarea name='daily${ix}_content[]' type='text' maxlength='600' onfocus="lineCheck(this)" onkeyup="lineCheck(this)" class='form-control form-control-sm ' value=''>${put.daily_content || ''}</textarea></li>
                            <li style='width:20%'>
                                <ul class="avn-form-list-item-list">
                                    <li id='reviewImg${ik}_${ix}_1' class="avn-form-list-item-list-item" onClick="picCheck('${ik}','${ix}','1','${img1}')">${IMG1}</li>
                                    <li id='reviewImg${ik}_${ix}_2' class="avn-form-list-item-list-item" onClick="picCheck('${ik}','${ix}','2','${img2}')">${IMG2}</li>
                                    <li id='reviewImg${ik}_${ix}_3' class="avn-form-list-item-list-item" onClick="picCheck('${ik}','${ix}','3','${img3}')">${IMG3}</li>
                                    <li id='reviewImg${ik}_${ix}_4' class="avn-form-list-item-list-item" onClick="picCheck('${ik}','${ix}','4','${img4}')">${IMG4}</li>
                                    ${delImg}
                                </ul>
                                <input type='file' class="avn-input" name='DailyDataImg${ik}_${ix}_1' accept='image/*' value='' ID='DailyDataImg${ik}_${ix}_1' onchange="setThumbnail(event,'${ik}','${ix}','1');">
                                <input type='file' class="avn-input" name='DailyDataImg${ik}_${ix}_2' accept='image/*' value='' ID='DailyDataImg${ik}_${ix}_2' onchange="setThumbnail(event,'${ik}','${ix}','2');">
                                <input type='file' class="avn-input" name='DailyDataImg${ik}_${ix}_3' accept='image/*' value='' ID='DailyDataImg${ik}_${ix}_3' onchange="setThumbnail(event,'${ik}','${ix}','3');">
                                <input type='file' class="avn-input" name='DailyDataImg${ik}_${ix}_4' accept='image/*' value='' ID='DailyDataImg${ik}_${ix}_4' onchange="setThumbnail(event,'${ik}','${ix}','4');">
                            </li>
                            <li id='DailyAdd${ik}_${ix}' class="avn-form-list-item-list-item">${button}</li>
                        </ul>
                    </div>
                `;
            }
            function dayPush (ix=1,etc='') {
                const aEtc = etc.split('/');
                non = ix === 1 ? "" : "none";
                let mealData1 = '', mealData2 =  '', mealData3 = '' , transferData = '';
                let s = '';
                for (const [k,v] of Object.entries(arrTourMeal)) {
                    s = aEtc[4] === k ? 'selected' : '';
                    mealData1 += `<option value='${k}' ${s}> ${v}</option>`;
                    s = aEtc[5] === k ? 'selected' : '';
                    mealData2 += `<option value='${k}' ${s}> ${v}</option>`;
                    s = aEtc[6] === k ? 'selected' : '';
                    mealData3 += `<option value='${k}' ${s}> ${v}</option>`;
                }
                for (const [k,v] of Object.entries(arrTourTransfer)) {
                    s = aEtc[12] === k ? 'selected' : '';
                    transferData += `<option value='${k}' ${s}> ${v}</option>`;
                }
                
                return `
                <tr style='display:${non}' class='avn-form-row avn-form-row-${ix}'>
					<th scope='row' colspan='' class="avn-form-th">조식</th>
					<td class="avn-form-td"><input name='break_${ix}'  type='checkbox' value='Y' ${aEtc[1] === "Y"? 'checked' : ''}> 제공</label></td>
					<td colspan="2" class="avn-form-td">
						<select name='break_meal_${ix}' class="avn-select">
							<option value=''>선택해주세요</option>
							${mealData1}
						</select>
						<br/>
						<input type='text' class="avn-input" name='etc_break_${ix}'  style ='margin-top:5px;' value='${aEtc[13] || ''}' >
					</td>
					<th scope='row' colspan='' class="avn-form-th">중식</th>
					<td class="avn-form-td"><input name='lunch_${ix}'  type='checkbox' value='Y' ${aEtc[2] === "Y"? 'checked' : ''}> 제공</label></td>
					<td colspan="2" class="avn-form-td">
						<select name='lunch_meal_${ix}' class="avn-select">
							<option value=''>선택해주세요</option>
							${mealData2}
						</select>

						<br/>
						<input type='text' class="avn-input" name='etc_lunch_${ix}'  style ='margin-top:5px;' value='${aEtc[14] || ''}' >
						
					</td>
					<th scope='row' colspan='' class="avn-form-th">석식</th>
					<td class="avn-form-td"><input name='dinner_${ix}'  type='checkbox' value='Y' ${aEtc[3] === "Y"? 'checked' : ''}> 제공</label></td>
					<td colspan="2" class="avn-form-td">
						<select name='dinner_meal_${ix}' class="avn-select">
							<option value=''>선택해주세요</option>
							${mealData3}
						</select>
						<br/>   
						<input type='text' class="avn-input" name='etc_dinner_${ix}'  style ='margin-top:5px;' value='${aEtc[15] || ''}' >
					</td>
				</tr>
				<tr style='display:${non}' class='avn-form-row avn-form-row-${ix}'>
					<th scope='row' class="avn-form-th" colspan=''>숙박정보</th>
					<td colspan='3' class="avn-form-td">
						<input type='text' class="avn-input" list='beginHotelList1_${ix}' autocomplete='off'  name='etc_${ix}'  value='${aEtc[0] || ''}'>
						<datalist id='beginHotelList1_${ix}' class="avn-datalist">$hotelData</datalist>
					</td>

					<th scope='row' class="avn-form-th" colspan=''>차량선택</th>
					<td colspan="3" class="avn-form-td">
						<select name='transfer_${ix}' class="avn-select" value='${aEtc[12] || ''}'>
							<option value=''>선택해주세요</option>
							${transferData}
						</select>
						
					</td>

					<td colspan='4' class="avn-form-td">검색에 없을때: 숙박시설은 현재 미정이며,  출발 2일전까지 SMS로 안내드리겠습니다.</td>
				</tr>
				<tr style='display:${non}' class='avn-form-row avn-form-row-${ix}'>
					<th scope='row' class="avn-form-th" colspan="2">여행지정보</th>
					<td colspan="2" class="avn-form-td">
						<input type='text' class="avn-input" list='beginTourList1_${ix}' autocomplete='off' onFocus="listCheck('Tour','beginTourList1_${ix}')"  name='beginTourList1_${ix}'  value='${aEtc[7] || ''}' >
						<datalist id='beginTourList1_${ix}' class="avn-datalist"></datalist>
					</td>
					<td colspan="2" class="avn-form-td">
						<input type='text'  list='beginTourList2_${ix}' autocomplete='off' onFocus="listCheck('Tour','beginTourList2_${ix}')" class='form-control form-control-sm d-inline tourCodeCls'  name='beginTourList2_${ix}'  value='${aEtc[8] || ''}' >
						<datalist id='beginTourList2_${ix}' class="avn-datalist"></datalist>
					</td>
					<td colspan="2" class="avn-form-td">
						<input type='text' class="avn-input" list='beginTourList3_${ix}' autocomplete='off' onFocus="listCheck('Tour','beginTourList3_${ix}')" class='form-control form-control-sm d-inline tourCodeCls'  name='beginTourList3_${ix}'  value='${aEtc[9] || ''}' >
						<datalist id='beginTourList3_${ix}' class="avn-datalist"></datalist>
					</td>
					<td colspan="2" class="avn-form-td">
						<input type='text' class="avn-input" list='beginTourList4_${ix}' autocomplete='off' onFocus="listCheck('Tour','beginTourList4_${ix}')" class='form-control form-control-sm d-inline tourCodeCls'  name='beginTourList4_${ix}'  value='${aEtc[10] || ''}' >
						<datalist id='beginTourList4_${ix}' class="avn-datalist"></datalist>
					</td>
					<td colspan="2" class="avn-form-td">
						<input type='text' class="avn-input" list='beginTourList5_${ix}' autocomplete='off' onFocus="listCheck('Tour','beginTourList5_${ix}')" class='form-control form-control-sm d-inline tourCodeCls'  name='beginTourList5_${ix}'  value='${aEtc[11] || ''}' >
						<datalist id='beginTourList5_${ix}' class="avn-datalist"></datalist>
					</td>
					<td colspan="" class="avn-form-td">
						미등록시 신청
					</td>
				</tr>
                `;
            }
            let addButton  = '';
            let typeData   = '';
            let tabData    = '';
            let dailyData  = '';
            let on         = '';
            let non        = '';
            let airsegData = '';
            let dayTypes   = data.dayTypes || 'A';
            let airseg_Cnt = row.airseg_Cnt || '';
            let daily_Cnt  = row.daily_Cnt || '';
            sqlText = `select distinct (dayType) from Products_topaz_daily where tourNumber = @tourNumber  `;
            sqlResult = await pool.request().input('tourNumber',sql.Int,tourNumber).query(sqlText);
            for (const put of sqlResult.recordset) {
                let {dayType } = put;
                on =  ((data.dayTypes || 'A') === dayType) ?  'on' : '';
                typeData +=`<li class="Tabitem2 ${on} cursor"   onClick="return typeChange('${tourNumber}','${dayType}')"> ${dayType} Style</li>`;
            }

            if (airseg_Cnt > 0) {
                sqlText = ` select * from Products_air where tourNumber = @tourNumber and dayType = @dayTypes order by minor_num  `;
                sqlResult = await pool.request().input('tourNumber',sql.Int,tourNumber).input('dayTypes',sql.NVarChar,dayTypes).query(sqlText);
                let cnt = 1;
                for (const put of sqlResult.recordset) {
                    airsegData += airSegPush (cnt , put);
                    cnt ++;
                }
                for (let ix = cnt ; ix <= airseg_Cnt ; ix ++) {
                    airsegData += airSegPush (ix , []);
                }
                airsegData = `
                    <table class="avn-form-table">
                        <tr class="avn-form-row">
                            <th class="avn-form-th">세그</th>
                            <th class="avn-form-th">일차</th>
                            <th class="avn-form-th">항공편</th>
                            <th class="avn-form-th">클래스(캐빈)</th>
                            <th class="avn-form-th">출발지역</th>
                            <th class="avn-form-th">출발시간</th>
                            <th class="avn-form-th">도착지역</th>
                            <th class="avn-form-th">도착시간</th>
                            <th class="avn-form-th">비행시간<br><small>분단위입력</small></th>
                            <th class="avn-form-th">+1</th>
                            <th class="avn-form-th">수하물</th>
                        </tr>
                        ${airsegData}
                    </table>
                `;
            }
            if (daily_Cnt > 0) {
                sqlText = ` select p.* , MAX(p.minor_num2) OVER ( PARTITION BY p.tourNumber, p.dayType, p.minor_num ) AS mNum from
                                Products_topaz_daily as p where tourNumber = @tourNumber and dayType = @dayTypes order by minor_num , minor_num2 `;
                sqlResult = await pool.request().input('tourNumber',sql.Int,tourNumber).input('dayTypes',sql.NVarChar,dayTypes).query(sqlText);
                const arrSub = [];
                const daySub = {};
                for (const put of sqlResult.recordset) {
                    let { minor_num , minor_num2 , etc_data } = put;
                    arrSub[minor_num] = (arrSub[minor_num] || '') + daySegPush(minor_num2, minor_num, put);
                    if (minor_num2 == 1) {
                        //if (!daySub[minor_num]) daySub[minor_num] = '';
                        daySub[minor_num] = dayPush(minor_num,etc_data);
                    }
                }
                for (let ix = 1 ; ix <= daily_Cnt ; ix ++) { 
                    on  = ix === 1 ? "on" : "";
                    non = ix === 1 ? "" : "none";
                    tabData += `<li class="avn-tab-item ${on} cursor" ID='dailyBox_${ix}' onClick="return dailyShow('${ix}')">${ix}일차</li>`;
                    dailyData += daySub[ix] || '';
                    dailyData += `
                        <tr style='display:${non}' class='DailyData DailyData_${ix}'>
                            <td colspan="12" class="avn-form-td">
                                <div class="avn-form-td-box-item">
                                    <div class="avn-form-td-box-item-title">타이틀 (50자)<small>최소 2자 </small></div>
                                    <div class="avn-form-td-box-item-content">내용 (300자) 그 이상 입력시 (추가)버튼을 이용해주세요</div>
                                    <div class="avn-form-td-box-item-image">이미지 ( 340 x 250 ) <br>가능확장자 : png, jpg, jpeg </div>
                                    <div class="avn-form-td-box-item-add">추가</div>
                                </div>
                                <div id='DailyDataDetail_${ix}' class="avn-form-td-box-item-detail">
                                    ${arrSub[ix] || ''}
                                </div>
                            </td>
                        </tr>
                    `;
                }
            }
            htmlData  = `
                <form class="avn-form" name="frmDetail" id="frmDetail" method="post" action="/site/site_save" enctype="multipart/form-data">
                    <input class="avn-input" type="hidden" name="mode"		value="${modes}">
                    <input class="avn-input" type="hidden" name="uid"			value="${uid}">
                    <input class="avn-input" type="hidden" name="tourNumber"	value="${tourNumber}">
                    <input class="avn-input" type="hidden" name="orgMode"		value="${mode}">
                    <input class="avn-input" type="hidden" name="dayTypes"  	value="${dayTypes}">
                    <input class="avn-input" type="hidden" name="DailyCnt"	id = "DailyCnt"  value="${row.daily_Cnt || '1'}">
                    <input class="avn-input" type="hidden" name="AirSegCnt"	id = "AirSegCnt" value="${row.airseg_Cnt || '0'}">
                    <div class="avn-form-wrap">
                    <div class="avn-form-wrap-item">
                        <div class="avn-form-wrap-item-content">
                        <table class="avn-form-table">
                            <tr class="avn-form-row">
                                <th scope="row" style="width:130px;" required>상품명  ${mendatory} ${mendatory}</th>
                                <td class="avn-form-td">
                                    <input class="avn-input" name="tourName" type="text" readonly value="${row.tourName || ''}" >&nbsp;&nbsp;
                                    예명 : <input class="avn-input" name="tourNameShort" placeholder="짧은 상품명 " readonly type="text" value="${row.tourNameShort || ''}" maxlength="20">
                                </td>
                                <th scope="row" class="avn-form-th">노출 순위</th>
                                <td class="avn-form-td">
                                    <input class="avn-input" name="main_view" type="text" readonly value="${row.main_view || 0}" style="width:40px"> '0' 보다 큰수로 낮은수 부터 위에서 보임
                                </td>
                            </tr>
                            <tr class="avn-form-row">
							<th scope='row' colspan='' class="avn-form-th">상세일정</th>
                                <td colspan='4' class="avn-form-td">
                                    <input class="avn-input avn-input-sm" name='daily_Cnt' type='text' value='${row.daily_Cnt || 0} ' > 
                                    &nbsp;&nbsp;&nbsp;
                                    항공일정
                                    <input class="avn-input avn-input-sm" name='airseg_Cnt' type='text' value='${row.airseg_Cnt || 0}' > 
                                    &nbsp;&nbsp;&nbsp;
                                    <span class="avn-btn avn-btn-yellow cursor" type="button" onclick="return dailyCntChange('${tourNumber}')">상세/항공 일정 수정</span>
                                    ${addButton}
                                </td>
						    </tr>
                            <tr class="avn-form-row">
                                <th  colspan='2' class="avn-form-th"><h5 class="avn-form-h5">1. 항공일정 - ⓐ  </h5></th>
                                <td colspan='2' class="avn-form-td"> 
                                    <span class="avn-btn avn-btn-yellow cursor" type="button" onClick="return typeAdd('')">신규일정표 생성</span>
                                </td>
                            </tr>
                            <tr class="avn-form-row">
                                <td colspan='4' class="avn-form-td">
                                <div ID='' class="avn-form-ul">
                                    <ul class="avn-form-ul-item">
                                        ${typeData}
                                    </ul>
                                </div>
                                <div ID='' class="avn-form-table">
                                    ${airsegData}
                                </div>
                                </td>
                            </tr>
                            <tr class="avn-form-row">
                                <th  colspan='2' class="avn-form-th"><h5 class="avn-form-h5">2. 상세일정 - ⓑ (데일리) </h5></th>
                                <td colspan='2' class="avn-form-td"><H4 class="avn-form-h4">미리보기는 저장후 반영됩니다.</H4></td>
                            </tr>
                            <tr class="avn-form-row">
                                <td colspan='4' class="avn-form-td">
                                <div ID='topArea' class="avn-form-ul">
                                    <ul class="avn-form-ul-item">
                                        ${tabData}
                                    </ul>
                                    <ul class="avn-form-ul-item" style='width:120px !important;'>
                                        <span class="avn-btn avn-btn-yellow cursor" type="button" onClick="return dailyPre('')">미리보기</span>
                                    </ul>
                                </div>
                                </td>
                            </tr>
                            <tr class="avn-form-row">
                                <td colspan="4" class="avn-form-td">
                                <div class="avn-form-table">
                                    ${dailyData}
                                </div>
                                </td>
                            </tr>
                        </table>
                        </div>
                    </div>
                    <div class="avn-form-wrap-item">
                        <div class="avn-form-wrap-item-content">
                            <span class="avn-btn avn-btn-yellow cursor" type="button" onCLick="return modifyCheck()">${buttonName}</span>
                        </div>
                    </div>
                    </div>
                </form>
            `;
        } else if (mode === "GoodsOpt") {
            let opData  = '';
            let s       = '';
            let d       = '';
            let minor   = data?.minor || '';
            let oRow    = [];
            let mealTypeData = '';
            let colsize = 'col-6';
            let modNone = '';
            let keyData = '';
            sqlText = `select roomType , optionDel , minor_num from Products_option where tourNumber = @tourNumber order by sorting,minor_num `;
            sqlResult = await pool.request()
                    .input('tourNumber',sql.Int     ,tourNumber)
                    .query(sqlText);
            for (const put of sqlResult.recordset) {
                let {roomType , optionDel , minor_num } = put;
                if (!minor) minor = minor_num; // 초기 데이터
                d = optionDel === "Y" ? "[삭제] " : '';
                s = minor == minor_num ? 'selected' : ''; 
                opData += `<option value='${minor_num}' ${s}>(${minor_num}) ${d}${roomType} </option>`;
            }
            if (!opData) opData = "<option value=''> 등록된 옵션이 없습니다 </option>";
            
            if (minor) {
                sqlText = `select a.*,b.cancel_limit from Products_option as a left outer join Products_option_detail as b on a.tourNumber = b.tourNumber and a.minor_num = b.minor_num
                             where a.tourNumber = @tourNumber and a.minor_num = @minor `;
                sqlResult = await pool.request()
                    .input('tourNumber',sql.Int     ,tourNumber)
                    .input('minor'     ,sql.Int     ,minor)
                    .query(sqlText);
                oRow = sqlResult?.recordset?.[0];
            } else {
                colsize = 'col-12';
                modNone = 'none';
            }

            sqlText = `select minor_num as minor_num2  , titles from Products_option_stock_name where tourNumber = @tourNumber order by minor_num `;
            sqlResult = await pool.request()
                    .input('tourNumber',sql.Int     ,tourNumber)
                    .query(sqlText);
            for (const put of sqlResult.recordset) {
                let {minor_num2 , titles } = put;
                s = oRow.stock_key == minor_num2 ? 'selected' : ''; 
                keyData += `<option value='${minor_num2}' ${s}>(${minor_num2}) ${titles} </option>`;
            }

            const aMeal = new Set(
                (Array.isArray(oRow.mealType) ? oRow.mealType : String(oRow.mealType ?? '').split(','))
                  .map(s => s.trim())
                  .filter(Boolean)
            );
            for (const [k,v] of Object.entries(arrMealType)) {
                const s    = aMeal.has(k) ? 'checked' : '';
                mealTypeData += `
                    <div class="avn-form-wrap-item">
                        <label class="avn-form-label">
                            <input type='checkbox' class="avn-input" name='aMealType[]' ID='mealType${k}' value='${k}' ${s}> ${v}
                        </label>
                    </div>
                `;
            }
            htmlData  = `
                <form name="frmDetail" id="frmDetail" method="post" enctype="multipart/form-data">
                    <input type="hidden" name="mode"		value="${modes}">
                    <input type="hidden" name="uid"			value="${uid}">
                    <input type="hidden" name="tourNumber"	value="${tourNumber}">
                    <input type="hidden" name="orgMode"		value="${mode}">
                    <input type="hidden" name="minor"		value="${minor}">
                    <div class="avn-form-wrap">
                    <div class="avn-form-wrap-item">
                        <div class="avn-form-wrap-item-content">
                        <table class="avn-form-table">
                            <tr>
                                <th scope="row" style="width:130px;" class="avn-form-th">옵션등록현황  </th>
                                <td class="avn-form-td">
                                    <select class="avn-select" onChange='minorChange(this.value)'>
                                        ${opData}
                                    </select>
                                </td>
                                <th scope="row" style="" class="avn-form-th">재고선택</th>
                                <td class="avn-form-td">
                                    <select class="avn-select" name="stock_key">
                                        ${keyData}
                                    </select>
                                </td>
                            </tr>
                            <tr class="avn-form-row">
								<th scope="row" style="line-height:30px;" class="avn-form-th">옵션타입 ${mendatory}</th>
								<td colspan="3" class="avn-form-td">
									<input class="avn-input" name="roomType" type="text" value="${oRow.roomType || ''}" style="background-color:#f7f7f7;width:45%">
								</td>
							</tr>
                            <tr class="avn-form-row">
								<th scope="row" style="line-height:30px;" class="avn-form-th">항공편</th>
								<td colspan="3" class="avn-form-td">
									<input class="avn-input" name="airType" type="text" value="${oRow.airType || ''}" style="background-color:#f7f7f7;width:45%">
								</td>
							</tr>
                            <tr class="avn-form-row">
								<th scope="row" style="line-height:40px;" class="avn-form-th">가격정보</th>
								<td style="border-bottom:1px solid #ddd" colspan="" class="avn-form-td">
									소비자판매가
									<input class="avn-input" name="salePrice" type='text' style="background-color:#f7f7f7;" value="${oRow.salePrice || ''}">
									&nbsp; &nbsp;
									공급자입금가
									<input class="avn-input" name="inputPrice" type='text' style="background-color:#f7f7f7;" value="${oRow.inputPrice || ''}">
									<font color=red>※ 필요시 입력</font>
								</td>
								<th scope="row" style="line-height:40px;" class="avn-form-th">소개 페이지</th>
								<td style="line-height:25px;" colspan="" class="avn-form-td">
									<input class="avn-input" name="info_page" type="text" value="${oRow.info_page || ''}" style="background-color:#f7f7f7;" title="회원제" >
								</td>
							</tr>
                            <tr class="avn-form-row">
								<th scope="row" style="line-height:40px;" class="avn-form-th">인원구성 ${mendatory}</th>
								<td style="line-height:25px;" colspan="1" class="avn-form-td">
									<div>
										<div>
                                            <label><input class="avn-checkbox" ID='adt_ok' type='checkbox' name='adt_ok' value='Y' ${(oRow.adt_ok || '') === "Y" ? 'checked' : ''}>성인</label>
										</div>
										<div>
                                            <label><input class="avn-checkbox" ID='chd_ok' type='checkbox' name='chd_ok' value='Y' ${(oRow.chd_ok || '') === "Y" ? 'checked' : ''}>소아</label>
										</div>
										<div>
                                            <label><input class="avn-checkbox" ID='inf_ok' type='checkbox' name='inf_ok' value='Y' ${(oRow.inf_ok || '') === "Y" ? 'checked' : ''}>유아</label>
										</div>
										&nbsp;
										최소 구매 인원:
										<input class="avn-input" name="min_member" type="text" value="${oRow.min_member || ''}" style="background-color:#f7f7f7;width:40px;" >명
									</div>
								</td>
							</tr>
                            <tr class="avn-form-row">
								<th scope="row" style="line-height:40px;" class="avn-form-th">밀 옵션</th>
								<td style="line-height:25px;" colspan="3" class="avn-form-td">
									<div class="avn-form-wrap-item">
										${mealTypeData}
									</div>
								</td>
							</tr>
                            <tr class="avn-form-row">
								<th scope="row" style="line-height:40px;" class="avn-form-th">노출 설정 ${mendatory} </th>
								<td style="line-height:25px;" colspan="3" class="avn-form-td">
									<input class="avn-checkbox" name="exposure_check" type='checkbox' ${(oRow.exposure_check || '') === "Y" ? 'checked' :''} value="Y">&nbsp;&nbsp;( 체크시 노출 됩니다.)
									&nbsp; &nbsp; &nbsp;
									노출 순서:
									<input class="avn-input" name="sorting" type='number' placeholder="낮은순으로 노출이 됩니다." class="form-control form-control-sm wh50" style="background-color:#f7f7f7;" value="${oRow.sorting || ''}"> ※ 낮은순으로 노출이 됩니다.
								</td>
							</tr>
                            <tr class="avn-form-row">
								<th scope="row" style="line-height:40px;" class="avn-form-th">결제 마감일 ${mendatory}</th>
								<td style="line-height:25px;" colspan="3" class="avn-form-td">
									<input class="avn-input" name="cancel_limit" type='number' style="background-color:#f7f7f7;" value="${oRow.cancel_limit || ''}"> ※ 예) 출발(투숙) 3일전까지 취소 가능
								</td>
							</tr>
                        </table>
                        </div>
                    </div>
                    <div class="avn-form-wrap-item">
                        <div class=" ${colsize}" class="avn-form-wrap-item  -content">
                            <span class="avn-btn avn-btn-yellow cursor" type="button" href="javascript://" onCLick="return optionCheck('input')" style="width:50%;padding-top:10px;font-size:19px !important;padding-bottom:13px;">신규 입력</span>
                        </div>
                        <div class="avn-form-wrap-item-content" style="text-align:center; display : ${modNone}">
                            <span class="avn-btn avn-btn-yellow cursor" type="button" href="javascript://" onCLick="return optionCheck('modify')"  style="width:50%;padding-top:10px;font-size:19px !important;padding-bottom:13px;">수정 입력</span>
                        </div>    
                    </div>
                    </div>
                </form>
                    
            `;
        } else if (mode === "GoodsPr") {
            let opData  = '';
            let s       = '';
            let d       = '';
            let minor   = data?.minor || '';
            let cMode   = data?.cMode || '';
            let oRow    = [];
            let modNone = '';
            let list1           = '';
            let stock   = '';
            let titles  = '';
            
            sqlText = `select roomType , optionDel , minor_num from Products_option where tourNumber = @tourNumber order by minor_num `;
            sqlResult = await pool.request()
                    .input('tourNumber',sql.Int     ,tourNumber)
                    .query(sqlText);
            for (const put of sqlResult.recordset) {
                let {roomType , optionDel , minor_num } = put;
                if (!minor) minor = minor_num; // 초기 데이터
                d = optionDel === "Y" ? "[삭제] " : '';
                s = minor == minor_num ? 'selected' : ''; 
                opData += `<option value='${minor_num}' ${s}>(${minor_num}) ${d}${roomType} </option>`;
            }
            if (!opData) opData = "<option value=''> 등록된 옵션이 없습니다 </option>";
            
            if (minor) {
                sqlText = `select a.*,b.cancel_limit,s.titles from Products_option as a left outer join Products_option_detail as b on a.tourNumber = b.tourNumber and a.minor_num = b.minor_num
                left outer join Products_option_stock_name as s on a.stock_key = s.minor_num
                where a.tourNumber = @tourNumber and a.minor_num = @minor `;
                sqlResult = await pool.request()
                    .input('tourNumber',sql.Int     ,tourNumber)
                    .input('minor'     ,sql.Int     ,minor)
                    .query(sqlText);
                oRow   = sqlResult?.recordset?.[0];
                stock  = oRow?.stock_key || '';
                titles = oRow?.titles    || '';
            } 
            if (!cYear  ) year  = NOWSTIME.slice(0,4); else year  = cYear;
            if (!cMonth ) month = NOWSTIME.slice(4,6); else month = cMonth;
            if (cMode === "Next") {
                month ++;
                if (month > 12) {
                    year ++;
                    month = 1;
                }
            } else if (cMode === "Pre") {
                month --;
                if (month < 1) {
                    year --;
                    month = 12;
                }
            }
            const searchDate = `${year}${String(month).padStart(2, '0')}`;
            const aData = {};
            sqlText = `
                SELECT * FROM businessCenter WITH (NOLOCK)
                WHERE start_date LIKE '${searchDate}%' and place = 'ANN'
            `;
            sqlResult = await pool.request().query(sqlText);
            for (const row of sqlResult.recordset) {
                let {cycle , start_date , end_date , cycleType, cycle_day , cycle_week} = row;
                if (start_date === end_date) deps.arrPush(aData , start_date , row);
            }

            sqlText = `select * from Products_option_price where tourNumber = @tourNumber and sale_date like '${searchDate}%' `;
            sqlResult = await pool.request().input('tourNumber',sql.Int,tourNumber).query(sqlText);
            for (const row of sqlResult.recordset) {
                let {sale_date , sale_price} = row;
                row.place = 'PRICE';
                deps.arrPush(aData , sale_date , row);
            }

            sqlText = `select b.start_day , a.adult_member , a.child_member from orderSheet as a left outer join orderSheet_minor as b on a.order_num = b.order_num
                    where b.tourNumber = @tourNumber and b.start_day like '${searchDate}%' and a.status != '9' and b.option_code = @minor `;
            sqlResult = await pool.request().input('tourNumber',sql.Int,tourNumber).input('minor',sql.Int,minor).query(sqlText);
            for (const row of sqlResult.recordset) {
                let {start_day , sale_price} = row;
                row.place = 'SALE';
                deps.arrPush(aData , start_day , row);
            }
            if (stock) {
                sqlText = `select * from Products_option_stock as a 
                where a.tourNumber = @tourNumber and a.sale_date like '${searchDate}%' and a.minor_num = @stock `;
                sqlResult = await pool.request().input('tourNumber',sql.Int,tourNumber).input('stock',sql.Int,stock).query(sqlText);
                for (const row of sqlResult.recordset) {
                    let {sale_date } = row;
                    row.place = 'STOCK';
                    deps.arrPush(aData , sale_date , row);
                }   
            }

            let   firstWeeks = new Date(Date.UTC(year, Number(month)  - 1, 1)).getUTCDay();
            let   lastdays   = new Date(Date.UTC(year, month, 0)).getUTCDate();
            
            const weeks = [];
            let   w     = [];
            for (let i = 0; i < Number(firstWeeks); i++) w.push(null);
            for (let d = 1; d <= Number(lastdays); d++) {
                w.push(d);
                if (w.length === 7) { weeks.push(w); w = []; }
            }
            if (w.length > 0) weeks.push(w);
            const dayClass = { 0: 'cored', 6: 'coblue' };
            for (let ix = 0 ; ix < weeks.length ; ix ++) {
                list1 += `<tr>`;
                for (let ii = 0 ; ii < 7 ; ii ++) {
                    wCls = dayClass[ii] || '';
                    curData = year+String(month).padStart(2,0)+String(weeks[ix][ii]).padStart(2,0)
                    let cls = cls2 = '';
                    let link = '';
                    let Anniversary = '';
                    let salePrice = '', saleStock = '' , Stock = '' , remain = '';
                    if (Array.isArray(aData[curData])) {
                        for (const row of aData[curData]) {
                            let { place , subject , sale_price , adult_member , child_member , stocks } = row;
                                 if (place === "ANN")   Anniversary = (subject || '').trim();
                            else if (place === "PRICE") salePrice   = sale_price;
                            else if (place === "SALE")  saleStock   = (adult_member || 0) + (child_member || 0);
                            else if (place === "STOCK") Stock       = (stocks || 0) ;
                        }
                    }
                    const day = weeks[ix][ii] || '';
                    let sub = '';
                    remain = Stock - saleStock;
                    if (day) {
                        sub = `
                            판매가 : ${deps.numberFormat(salePrice)} <br>
                            재고   : ${deps.numberFormat(Stock)}<br>
                            판매   : ${deps.numberFormat(saleStock)}<br>
                            잔여   : ${deps.numberFormat(remain)}<br>
                        `;
                    }
                    list1 += `
                        <td class="avn-form-td" height='100%' valign='top' class='${wCls} $close day-scroll' style='font-size:13px;border:1px solid #d7d7d7' ID='Table_${curData}'>
                            <table class="avn-form-table" border=0 width='100%' height='100%'>
                            <tbody>
                                <tr class="avn-form-row">
                                    ${day} <span>${Anniversary}</span>
                                </tr>
                                <tr class="avn-form-row">
                                    <td class="avn-form-td" valign='top'>
                                        <span ${link}></span>
                                    </td>
                                </tr> 
                                <tr class="avn-form-row"><td class="avn-form-td">
                                    ${sub}  
                                </td></tr>
                            </tbody>
                            </table>
                        </td>
                    `;
                }
                list1 += `</tr>`;
            }
            
            htmlData  = `
                <form class="avn-form" name="frmDetail" id="frmDetail" method="post" enctype="multipart/form-data">
                    <input class="avn-input" type="hidden" name="mode"		value="${modes}">
                    <input class="avn-input" type="hidden" name="uid"			value="${uid}">
                    <input class="avn-input" type="hidden" name="tourNumber"	value="${tourNumber}">
                    <input class="avn-input" type="hidden" name="orgMode"		value="${mode}">
                    <input class="avn-input" type="hidden" name="minor"		value="${minor}">
                    <input class="avn-input" type="hidden" name="cMode"		value="${cMode}">
                    <div class="avn-form-wrap">
                    <div class="avn-form-wrap-item">
                        <div class="avn-form-wrap-item-content">
                        <table class="avn-form-table">
                            <tr class="avn-form-row">
                                <th scope="row" style="width:130px;" class="avn-form-th">옵션  </th>
                                <td class="avn-form-td">
                                    <select class="avn-select" onChange='minorChange(this.value)'>
                                        ${opData}
                                    </select>
                                </td>
                                <th scope="row" style="" class="avn-form-th">재고명</th>
                                <td class="avn-form-td">${titles}</td>
                            </tr>
                            
                        </table>
                        <table class="avn-form-table" width='100%' border='0' cellspacing='0' cellpadding='0' style='background-color:#;' class='tableNone'>
                            <tr class="avn-form-row">
                                <td class="avn-form-td"></td>
                                <td class="avn-form-td">
                                    <a class="avn-btn avn-btn-yellow cursor" type="button" href="javascript://" onClick="return businessChange('Pre')">
                                        <span class="avn-icon"><i class='fas fa-chevron-left fa-2x'></i></span>
                                    </a>
                                </td>
                                <td class="avn-form-td">
                                    <span class="avn-text" style='display:inline-block; font-size:2rem; font-weight:500; color:#555' onClick="return businessChange('')">${year}년 ${month}월</span>
                                </td>
                                <td class="avn-form-td">
                                    <a class="avn-btn avn-btn-yellow cursor" type="button" href="javascript://" onClick="return businessChange('Next')">
                                        <span class="avn-icon"><i class='fas fa-chevron-right fa-2x'></i></span>
                                    </a>
                                </td>
                                <td class="avn-form-td">
                                </td>
                            </tr>
                        </table>
                        <table class="avn-form-table" width='100%' border='0' cellspacing='0' cellpadding='0' style='background-color:#;' class='tableNone'>
                            <thead>
                                <tr class="avn-form-row" style='background:#eee;' align='center'>
                                    <th class="avn-form-th" style='border-left:1px solid #dee2e6;'>일</th>
                                    <th class="avn-form-th">월</th>
                                    <th class="avn-form-th">화</th>
                                    <th class="avn-form-th">수</th>
                                    <th class="avn-form-th">목</th>
                                    <th class="avn-form-th">금</th>
                                    <th class="avn-form-th" style='border-right:1px solid #dee2e6;'>토</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${list1}
                            </tbody>
                        </table>
                        </div>
                    </div>
                    <div class="avn-form-wrap-item">
                        <div class="avn-form-wrap-item-content">
                        <div style="text-align:center; display : ${modNone}">
                            <span class="avn-btn avn-btn-yellow cursor" type="button" href="javascript://" onCLick="return optionCheck('modify')"  style="width:50%;padding-top:10px;font-size:19px !important;padding-bottom:13px;">수정 입력</span>
                        </div>    
                    </div>  
                    </div>
                </form>
                    
            `;
        } else if (mode === "GoodsStock") {
            let opData  = '';
            let s       = '';
            let d       = '';
            let minor   = data?.minor || '';
            let cMode   = data?.cMode || '';
            let oRow    = [];
            let modNone = '';
            let list1           = '';
            let stock   = '';
            sqlText = `select * from Products_option_stock_name where tourNumber = @tourNumber order by minor_num `;
            sqlResult = await pool.request()
                    .input('tourNumber',sql.Int     ,tourNumber)
                    .query(sqlText);
            for (const put of sqlResult.recordset) {
                let { titles , minor_num } = put;
                if (!minor) minor = minor_num; // 초기 데이터
                s = minor == minor_num ? 'selected' : ''; 
                opData += `<option value='${minor_num}' ${s}>(${minor_num}) ${titles} </option>`;
            }
            if (!opData) opData = "<option value=''> 등록된 재고가 없습니다 </option>";
            
            if (!cYear  ) year  = NOWSTIME.slice(0,4); else year  = cYear;
            if (!cMonth ) month = NOWSTIME.slice(4,6); else month = cMonth;
            if (cMode === "Next") {
                month ++;
                if (month > 12) {
                    year ++;
                    month = 1;
                }
            } else if (cMode === "Pre") {
                month --;
                if (month < 1) {
                    year --;
                    month = 12;
                }
            }
            const searchDate = `${year}${String(month).padStart(2, '0')}`;
            const aData = {};
            sqlText = `
                SELECT * FROM businessCenter WITH (NOLOCK)
                WHERE start_date LIKE '${searchDate}%' and place = 'ANN'
            `;
            sqlResult = await pool.request().query(sqlText);
            for (const row of sqlResult.recordset) {
                let {cycle , start_date , end_date , cycleType, cycle_day , cycle_week} = row;
                if (start_date === end_date) deps.arrPush(aData , start_date , row);
            }

            if (minor) {
                sqlText = `select b.start_day , a.adult_member , a.child_member from orderSheet as a left outer join orderSheet_minor as b on a.order_num = b.order_num
                    where b.tourNumber = @tourNumber and b.start_day like '${searchDate}%' and a.status != '9' and b.option_code = @minor `;
                sqlResult = await pool.request().input('tourNumber',sql.Int,tourNumber).input('minor',sql.Int,minor).query(sqlText);
                for (const row of sqlResult.recordset) {
                    let {start_day , sale_price} = row;
                    row.place = 'SALE';
                    deps.arrPush(aData , start_day , row);
                }
                sqlText = `select * from Products_option_stock as a 
                where a.tourNumber = @tourNumber and a.sale_date like '${searchDate}%' and a.minor_num = @minor `;
                sqlResult = await pool.request().input('tourNumber',sql.Int,tourNumber).input('minor',sql.Int,minor).query(sqlText);
                for (const row of sqlResult.recordset) {
                    let {sale_date } = row;
                    row.place = 'STOCK';
                    deps.arrPush(aData , sale_date , row);
                }   
            }

            let   firstWeeks = new Date(Date.UTC(year, Number(month)  - 1, 1)).getUTCDay();
            let   lastdays   = new Date(Date.UTC(year, month, 0)).getUTCDate();
            
            const weeks = [];
            let   w     = [];
            for (let i = 0; i < Number(firstWeeks); i++) w.push(null);
            for (let d = 1; d <= Number(lastdays); d++) {
                w.push(d);
                if (w.length === 7) { weeks.push(w); w = []; }
            }
            if (w.length > 0) weeks.push(w);
            const dayClass = { 0: 'cored', 6: 'coblue' };
            for (let ix = 0 ; ix < weeks.length ; ix ++) {
                list1 += `<tr>`;
                for (let ii = 0 ; ii < 7 ; ii ++) {
                    wCls = dayClass[ii] || '';
                    curData = year+String(month).padStart(2,0)+String(weeks[ix][ii]).padStart(2,0)
                    let cls = cls2 = '';
                    let link = '';
                    let Anniversary = '';
                    let salePrice = '', saleStock = '' , Stock = '' , remain = '';
                    if (Array.isArray(aData[curData])) {
                        for (const row of aData[curData]) {
                            let { place , subject , sale_price , adult_member , child_member , stocks } = row;
                                 if (place === "ANN")   Anniversary = (subject || '').trim();
                            else if (place === "PRICE") salePrice   = sale_price;
                            else if (place === "SALE")  saleStock   = (adult_member || 0) + (child_member || 0);
                            else if (place === "STOCK") Stock       = (stocks || 0) ;
                        }
                    }
                    const day = weeks[ix][ii] || '';
                    let sub = '';
                    remain = Stock - saleStock;
                    if (day) {
                        sub = `
                            재고   : <input type='text' class='wh40 week_${ii}' name='Date_${curData}' id='date_${curData}' value="${Stock}"><br>
                            판매   : ${deps.numberFormat(saleStock)}<br>
                            잔여   : ${deps.numberFormat(remain)}<br>
                        `;
                    }
                    list1 += `
                        <td class="avn-form-td" height='100%' valign='top' class='${wCls} day-scroll' style='font-size:13px;border:1px solid #d7d7d7' ID='Table_${curData}'>
                            <table class="avn-form-table" border=0 width='100%' height='100%' class=' hhm40 day-scroll-table'>
                            <tbody>
                                <tr class="avn-form-row">
                                    ${day} <span class="avn-text">${Anniversary}</span>
                                </tr>
                                <tr class="avn-form-row">
                                    <td class="avn-form-td" valign='top'>
                                        <span class="avn-text" ${link}></span>
                                    </td>
                                </tr> 
                                <tr class="avn-form-row"><td class="avn-form-td">
                                    <span class="avn-text">${sub}</span>  
                                </td></tr>
                            </tbody>
                            </table>
                        </td>
                    `;
                }
                list1 += `</tr>`;
            }
            
            htmlData  = `
                <form class="avn-form" name="frmDetail" id="frmDetail" method="post" enctype="multipart/form-data">
                    <input class="avn-input" type="hidden" name="mode"		value="${modes}">
                    <input class="avn-input" type="hidden" name="uid"			value="${uid}">
                    <input class="avn-input" type="hidden" name="tourNumber"	value="${tourNumber}">
                    <input class="avn-input" type="hidden" name="orgMode"		value="${mode}">
                    <input class="avn-input" type="hidden" name="minor"		value="${minor}">
                    <input class="avn-input" type="hidden" name="cMode"		value="${cMode}">
                    <div class="avn-form-wrap">
                    <div class="avn-form-wrap-item">
                        <div class="avn-form-wrap-item-content">
                        <table class="avn-form-table">
                            <tr class="avn-form-row">
                                <th scope="row" style="width:130px;" class="avn-form-th">옵션  </th>
                                <td class="avn-form-td">
                                    <select class="avn-select" onChange='minorChange(this.value)'>
                                        ${opData}
                                    </select>
                                </td>
                                <th scope="row" style="" class="avn-form-th">신규재고명</th>
                                <td class="avn-form-td">
                                    <input class="avn-input" type='text' name='newStockName' value="">
                                </td>
                                <td class="avn-form-td">
                                    <span class="avn-btn avn-btn-blue cursor" type="button" onClick="newStock()">재고생성</span>
                                </td>
                            </tr>
                            
                        </table>
                        <table class="avn-form-table" width='100%' border='0' cellspacing='0' cellpadding='0' style='background-color:#;' class='tableNone'>
                            <tr class="avn-form-row">
                                <td class="avn-form-td">
                                </td>
                                <td class="avn-form-td">
                                    <a class="avn-btn avn-btn-yellow cursor" type="button" href="javascript://" onClick="return calChange('Pre')">
                                        <span class="avn-icon"><i class='fas fa-chevron-left fa-2x'></i></span>
                                    </a>
                                    <span class="avn-text" style='display:inline-block; font-size:2rem; font-weight:500; color:#555' >${year}년 ${month}월</span>
                                    <a class="avn-btn avn-btn-yellow cursor" type="button" href="javascript://" onClick="return calChange('Next')">
                                        <span class="avn-icon"><i class='fas fa-chevron-right fa-2x'></i></span>
                                    </a>
                                </td>
                                <td class="avn-form-td">
                                </td>
                                <td class="avn-form-td"></td>
                                <td class="avn-form-td">
                                    <label><input class="avn-checkbox" type='checkbox' id='week_A' value='A' class='lm5'           onClick="weekCheckAll()"> 전체 </label>
                                    <label><input class="avn-checkbox" type='checkbox' id='week_0' value='0' class='lm5 WeekCheck' onClick="weekCheck()"> 일 </label>
                                    <label><input class="avn-checkbox" type='checkbox' id='week_1' value='1' class='lm5 WeekCheck' onClick="weekCheck()"> 월 </label>
                                    <label><input class="avn-checkbox" type='checkbox' id='week_2' value='2' class='lm5 WeekCheck' onClick="weekCheck()"> 화 </label>
                                    <label><input class="avn-checkbox" type='checkbox' id='week_3' value='3' class='lm5 WeekCheck' onClick="weekCheck()"> 수 </label>
                                    <label><input class="avn-checkbox" type='checkbox' id='week_4' value='4' class='lm5 WeekCheck' onClick="weekCheck()"> 목 </label>
                                    <label><input class="avn-checkbox" type='checkbox' id='week_5' value='5' class='lm5 WeekCheck' onClick="weekCheck()"> 금 </label>
                                    <label><input class="avn-checkbox" type='checkbox' id='week_6' value='6' class='lm5 WeekCheck' onClick="weekCheck()"> 토 </label>
                                </td>
                                <td class="avn-form-td">
                                    재고:
                                    <input class="avn-input" type='text' name='stock' value="">
                                    <span class="avn-btn avn-btn-yellow cursor" type="button" onClick="stockConfirm()">적용</span>
                                </td>
                                <td class="avn-form-td">
                                    <span class="avn-btn avn-btn-yellow cursor" type="button" onClick="stockSave()">재고저장</span>
                                </td>
                            </tr>
                        </table>
                        <table class="avn-form-table" width='100%' border='0' cellspacing='0' cellpadding='0' style='background-color:#;' class='tableNone'>
                            <thead>
                                <tr class="avn-form-row" style='background:#eee;' align='center'>
                                    <th class="avn-form-th" style='border-left:1px solid #dee2e6;'>일</th>
                                    <th class="avn-form-th">월</th>
                                    <th class="avn-form-th">화</th>
                                    <th class="avn-form-th">수</th>
                                    <th class="avn-form-th">목</th>
                                    <th class="avn-form-th">금</th>
                                    <th class="avn-form-th" style='border-right:1px solid #dee2e6;'>토</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${list1}
                            </tbody>
                        </table>
                        </div>
                    </div>
                    <div class="avn-form-wrap-item">
                        <div class="avn-form-wrap-item-content">
                        <div class="avn-form-wrap-item-content" style="text-align:center; display : none">
                        <div style="text-align:center; display : none">
                            <span href="javascript://" onCLick="return stockCheck('modify')"  style="width:50%;padding-top:10px;font-size:19px !important;padding-bottom:13px;">수정 입력</span>
                        </div>    
                    </div>
                    </div>
                </form>
                    
            `;
        }
    } else if (mode === "input") {
        if (orgMode === "Goods") {
            sqlText    = `select (isnull(max(tourNumber),9999) + 1) as num from Products`;
            sqlResult  = await pool.request().query(sqlText);
            tourNumber = sqlResult.recordset?.[0]?.num;
            sqlText    = `insert into Products (tourNumber,up_date,tourGubun) values (@tourNumber,@NOWSTIME,@tourGubun) `;
            sqlResult  = await pool.request()
                        .input('tourNumber',sql.Int     ,tourNumber)
                        .input('NOWSTIME'  ,sql.NVarChar,NOWSTIME)
                        .input('tourGubun' ,sql.NVarChar,data.tourGubun || '')
                        .query(sqlText);
            sqlText = `insert into Products_detail (tourNumber) values (@tourNumber) `;
            sqlResult = await pool.request()
                        .input('tourNumber',sql.Int     ,tourNumber)
                        .query(sqlText);
        } else if (orgMode === "GoodsOpt") {
            sqlText   = `select (isnull(max(minor_num),0) + 1) as num from Products_option where tourNumber = @tourNumber `;
            sqlResult = await pool.request().input('tourNumber',sql.Int      ,tourNumber).query(sqlText);
            minor     = sqlResult.recordset?.[0]?.num;
            sqlText    = `insert into Products_option (tourNumber,minor_num,roomType) values (@tourNumber,@minor,@roomType) `;
            sqlResult  = await pool.request()
                        .input('tourNumber',sql.Int      ,tourNumber)
                        .input('minor'     ,sql.Int      ,minor)
                        .input('roomType'  ,sql.NVarChar ,data.roomType)
                        .query(sqlText);
            sqlText = `insert into Products_option_detail (tourNumber,minor_num) values (@tourNumber,@minor) `;
            sqlResult = await pool.request()
                        .input('tourNumber',sql.Int     ,tourNumber)
                        .input('minor'     ,sql.Int     ,minor)
                        .query(sqlText);
        }
        mode = "modify";
    } 
    if (mode === "modify") {
        if (orgMode === "Goods") {
            try {
                const detailGubun = data.aDetail?.join(',');
                const thema       = data.aThema?.join(',');
                const proChannel  = data.aPro?.join(',');
                const facilities  = data.facs?.join(',');
                const rooms       = data.aRoom?.join(',');
                const tel_number  = (data.tel_number || '') ? aes128Encrypt(aviaSecurityKey,data.tel_number) : '';
                const check_in    = (data.check_in || '')   ? deps.StrClear(check_in) : ''
                const check_out   = (data.check_out || '')  ? deps.StrClear(check_out) : ''
                sqlText = `update Products set 
                        tourNameEng					= '${data.tourNameEng || ''}',
                        tourNameShort				= '${data.tourNameShort || ''}',
                        detailGubun					= '${detailGubun || ''}',
                        thema						= '${thema || ''}',
                        proChannel					= '${proChannel || ''}',
                        site_code					= '${data.site_code || '' }',
                        saleSite					= '${data.saleSite || ''}',
                        tel_number					= '${tel_number || ''}',
                        email						= '${data.email || ''}',
                        category1					= '${data.cate1_1 || ''}',
                        category2					= '${data.cate2_1 || ''}',
                        category3					= '${data.cate3_1 || ''}',
                        category4					= '${data.cate4_1 || ''}',
                        hotel_grade					= '${data.hotel_grade || ''}',
                        check_in					= '${check_in}',
                        check_out					= '${check_out}',
                        revStatus					= '${data.revStatus || ''}',
                        latitude					= '${data.latitude || ''}',
                        longitude					= '${data.longitude || ''}',
                        modify_date					= '${NOWSTIME}',
                        main_view					= '${data.main_view || '0'}',
                        tourGubun					= '${data.tourGubun || ''}',
                        sale_term1					= '${deps.StrClear(data.sale_term1 || '')}',
                        sale_term2					= '${deps.StrClear(data.sale_term2 || '')}',
                        use_term1					= '${deps.StrClear(data.use_term1 || '')}',
                        use_term2					= '${deps.StrClear(data.use_term2 || '')}',
                        card_use					= '${data.card_use || ''}',
                        naver_ep					= '${data.naver_ep || ''}',
                        operator					= '${data.operator || ''}',
                        facilities					= '${facilities || ''}',
                        rooms						= '${rooms}',
                        city_code					= '${data.city_code || ''}',
                        depoType					= '${data.depoType || ''}',
                        depoAmount					= '${data.depoAmount || '0'}',
                        passYN						= '${data.passYN || ''}',
                        airYN						= '${data.airYN || ''}',
                        address						= '${data.address || ''}',
			            address2					= '${data.address2 || ''}'
                    where tourNumber			    = @tourNumber
                `;
                await pool.request().input('tourNumber',sql.Int,tourNumber).query(sqlText);
                sqlText = `update Products_detail set 
                                searchKey					= '${data.searchKey || ''}'
                            where tourNumber = @tourNumber`;
                await pool.request().input('tourNumber',sql.Int,tourNumber).query(sqlText);
            } catch (err) {
                console.log(err);
                msg = err;
            }
        } else if (orgMode === "GoodsRule") {
            await pool.request()
                .input('tourNumber', sql.Int, tourNumber)
                .query(`
                    IF NOT EXISTS (
                        SELECT 1 FROM Products_detail WITH (UPDLOCK, HOLDLOCK) WHERE tourNumber = @tourNumber
                    )
                    INSERT INTO Products_detail (tourNumber) VALUES (@tourNumber);
                `);
            await pool.request()
                .input('tourNumber', sql.Int, tourNumber)
                .query(`
                    IF NOT EXISTS (
                        SELECT 1 FROM Products_alram WITH (UPDLOCK, HOLDLOCK) WHERE tourNumber = @tourNumber
                    )
                    INSERT INTO Products_alram (tourNumber) VALUES (@tourNumber);
                `);
            
            try {
                const updateQry = [];
                if (Object.prototype.hasOwnProperty.call(data, 'mainData'))          updateQry.push (` mainData		     = N'${data.mainData}' `);
                if (Object.prototype.hasOwnProperty.call(data, 'detailData'))        updateQry.push (` detailData    	 = N'${data.detailData}' `);
                if (Object.prototype.hasOwnProperty.call(data, 'HowToUse'))          updateQry.push (` HowToUse          = N'${data.HowToUse}' `);
                if (Object.prototype.hasOwnProperty.call(data, 'notice'))            updateQry.push (` notice            = N'${data.notice}' `);
                if (Object.prototype.hasOwnProperty.call(data, 'cancelRefund'))      updateQry.push (` cancelRefund      = N'${data.cancelRefund}' `);
                if (Object.prototype.hasOwnProperty.call(data, 'contain'))           updateQry.push (` contain           = N'${data.contain}' `);
                if (Object.prototype.hasOwnProperty.call(data, 'uncontain'))         updateQry.push (` uncontain         = N'${data.uncontain}' `);
                if (Object.prototype.hasOwnProperty.call(data, 'customer'))          updateQry.push (` customer          = N'${data.customer}' `);
                if (Object.prototype.hasOwnProperty.call(data, 'shoppingNoption'))   updateQry.push (` shoppingNoption   = N'${data.shoppingNoption}' `);
                if (Object.prototype.hasOwnProperty.call(data, 'delivery_info'))     updateQry.push (` delivery_info     = N'${data.delivery_info}' `);
                if (Object.prototype.hasOwnProperty.call(data, 'exchange_info'))     updateQry.push (` exchange_info     = N'${data.exchange_info}' `);
                if (Object.prototype.hasOwnProperty.call(data, 'exchange_term'))     updateQry.push (` exchange_term     = N'${data.exchange_term}' `);
                if (Object.prototype.hasOwnProperty.call(data, 'exchange_pay'))      updateQry.push (` exchange_pay      = N'${data.exchange_pay}' `);
                if (Object.prototype.hasOwnProperty.call(data, 'exchange_notinfo'))  updateQry.push (` exchange_notinfo  = N'${data.exchange_notinfo}' `);
                if (Object.prototype.hasOwnProperty.call(data, 'guide_title'))       updateQry.push (` guide_title       = N'${data.guide_title}' `);
                if (Object.prototype.hasOwnProperty.call(data, 'guide_info'))        updateQry.push (` guide_info        = N'${data.guide_info}' `);
                if (Object.prototype.hasOwnProperty.call(data, 'exhibiPlace'))       updateQry.push (` exhibiPlace       = N'${data.exhibiPlace}' `);
                if (Object.prototype.hasOwnProperty.call(data, 'exhibiScale'))       updateQry.push (` exhibiScale       = N'${data.exhibiScale}' `);
                if (Object.prototype.hasOwnProperty.call(data, 'exhibiCountry'))     updateQry.push (` exhibiCountry     = N'${data.exhibiCountry}' `);
                if (Object.prototype.hasOwnProperty.call(data, 'exhibiHomepage'))    updateQry.push (` exhibiHomepage    = N'${data.exhibiHomepage}' `);
                sqlText = `update Products_detail set ${updateQry.join(',')} where tourNumber = @tourNumber`;
                await pool.request().input('tourNumber',sql.Int,tourNumber).query(sqlText);
                sqlText = `update Products set 
                                    noticeUse = '${data.noticeUse || ''}' ,
                                    adt_limit = '${data.adt_limit || ''}',
                                    chd_limit = '${data.chd_limit || ''}',
                                    inf_limit = '${data.inf_limit || ''}',
                                    rev_avail = '${data.rev_avail || ''}'
                            where tourNumber = @tourNumber`;
                await pool.request().input('tourNumber',sql.Int,tourNumber).query(sqlText);
                
                sqlText = `update Products_alram set 
                                buy_alram               = '${data.buy_alram             || ''}',
                                confirm_alram           = '${data.confirm_alram         || ''}',
                                buy_alram_content       = '${data.buy_alram_content     || ''}',
                                confirm_alram_content   = '${data.confirm_alram_content || ''}'
                            where tourNumber = @tourNumber`;
                await pool.request().input('tourNumber',sql.Int,tourNumber).query(sqlText);
            }catch (err) {
                console.log(err);
                msg = err;
            }
        } else if (orgMode === "GoodsImg") {
            try {
                const updateQry = [];
                if (Object.prototype.hasOwnProperty.call(data, 'detailData'))        updateQry.push (` detailData    	 = N'${data.detailData}' `);
                
                sqlText = `update Products_detail set ${updateQry.join(',')} where tourNumber = @tourNumber`;
                await pool.request().input('tourNumber',sql.Int,tourNumber).query(sqlText);
                
            }catch (err) {
                console.log(err);
                msg = err;
            }
        } else if (orgMode === "GoodsDay") {
            function buildEtc(scope, ix) {
                const keys = [
                  'etc', 'break', 'lunch', 'dinner',
                  'break_meal', 'lunch_meal', 'dinner_meal',
                  'beginTourList1', 'beginTourList2', 'beginTourList3', 'beginTourList4', 'beginTourList5',
                  'transfer', 'etc_break', 'etc_lunch', 'etc_dinner'
                ];
              
                const sanitize = v => String(v ?? '').replace(/\//g, ''); // PHP의 str_replace("/", "", ...)
                return keys.map(k => sanitize(scope[`${k}_${ix}`])).join('/'); // PHP와 동일하게 빈값이면 '//' 생김
            }
            const dbTable   = "Products_topaz_daily";
            const airTable  = "Products_air";
            const DailyCnt  = Number(data.DailyCnt || '1');
            const AirSegCnt = Number(data.AirSegCnt || '');
            const dayTypes  = data.dayTypes || 'A';
            let key     = '';
            let title   = '';
            let content = '';
            for (let ix = 1 ; ix < DailyCnt + 1; ix ++) {
                key = `daily${ix}_title`;   
                const aTitle   = data?.[key] ?? [];
                key = `daily${ix}_content`;   
                const aContent = data?.[key] ?? [];
                const etcData  = buildEtc(data, ix);
                for (let ik = 1; ik <= aTitle.length; ik++) {
                    title   = aTitle[ik-1];
                    content = aContent[ik-1];
                    sqlText = ` INSERT INTO ${dbTable} (tourNumber, dayType, minor_num, minor_num2)
                                SELECT @tourNumber, @dayType, @ix, @ik
                                WHERE NOT EXISTS (
                                    SELECT 1 FROM ${dbTable} WITH (UPDLOCK, HOLDLOCK)
                                    WHERE tourNumber=@tourNumber AND dayType=@dayType AND minor_num=@ix AND minor_num2=@ik
                                )
                    `;
                    await pool.request()
                                .input('tourNumber', sql.Int, Number(tourNumber))
                                .input('dayType',    sql.NVarChar, dayTypes)
                                .input('ix',         sql.Int, Number(ix))
                                .input('ik',         sql.Int, Number(ik))
                                .query(sqlText);
                    const addQry = (ik === 1) ? ` etc_data = '${etcData}', ` : '';
                    sqlText = `update ${dbTable} 
                                set 
                                ${addQry}
                                daily_title   = @daily_title,
                                daily_content = @daily_content
                                WHERE tourNumber=@tourNumber AND dayType=@dayType AND minor_num=@ix AND minor_num2=@ik
                       `;
                    await pool.request()
                                .input('daily_title', sql.NVarChar, title)
                                .input('daily_content', sql.NVarChar, content)
                                .input('tourNumber', sql.Int, Number(tourNumber))
                                .input('dayType',    sql.NVarChar, dayTypes)
                                .input('ix',         sql.Int, Number(ix))
                                .input('ik',         sql.Int, Number(ik))
                                .query(sqlText);
                    
                         
                }
            }
            if (AirSegCnt > 0) {
                let minor = 0;
                const upper = (v) => (v ?? '').toString().trim().toUpperCase();
                for (let ix = 0; ix < AirSegCnt ; ix ++) {
                    minor = ix + 1;
                    sqlText = ` INSERT INTO ${airTable} (tourNumber, dayType, minor_num)
                                SELECT @tourNumber, @dayType, @minor
                                WHERE NOT EXISTS (
                                    SELECT 1 FROM ${airTable} WITH (UPDLOCK, HOLDLOCK)
                                    WHERE tourNumber=@tourNumber AND dayType=@dayType AND minor_num=@minor
                                )
                    `;
                    await pool.request()
                                .input('tourNumber', sql.Int, Number(tourNumber))
                                .input('dayType'   , sql.NVarChar, dayTypes)
                                .input('minor'     , sql.Int, Number(minor))
                                .query(sqlText);
                    sqlText = `
                        UPDATE ${airTable} SET
                            air_flight = @air_flight,
                            cabin      = @cabin,
                            dep_count  = @dep_count,
                            dep_city   = @dep_city,
                            dep_time   = @dep_time,
                            arr_city   = @arr_city,
                            arr_time   = @arr_time,
                            arr_nextday= @arr_nextday,
                            baggage    = @baggage,
                            fitTime    = @fitTime
                        WHERE tourNumber = @tourNumber AND dayType    = @dayType AND minor_num  = @minor
                    `;

                    await pool.request()
                        .input('air_flight', sql.NVarChar, upper(data.aFlight[ix]))
                        .input('cabin',      sql.NVarChar, (data.aCabin[ix] ?? '').toString())
                        //.input('dep_date',   sql.NVarChar, deps.StrClear(data.aDepDate[ix]))
                        .input('dep_count',  sql.NVarChar, (data.aDepCount[ix] ?? '').toString())
                        .input('dep_city',   sql.NVarChar, upper(data.aDepCity[ix]))
                        .input('dep_time',   sql.NVarChar, deps.StrClear(data.aDepTime[ix]))
                        //.input('arr_date',   sql.NVarChar, deps.StrClear(data.aArrDate[ix]))
                        .input('arr_city',   sql.NVarChar, upper(data.aArrCity[ix]))
                        .input('arr_time',   sql.NVarChar, deps.StrClear(data.aArrTime[ix]))
                        .input('arr_nextday',sql.NVarChar, (data?.[`aArrNext_${minor}`] ?? '').toString())
                        .input('baggage',    sql.NVarChar, upper(data.aBaggage[ix]))
                        .input('fitTime',    sql.NVarChar, deps.StrClear(data.aFitTime[ix]))
                        .input('tourNumber', sql.NVarChar, tourNumber) 
                        .input('dayType',    sql.NVarChar, dayTypes)
                        .input('minor',      sql.Int,      Number(minor))
                        .query(sqlText);
                    
                }
            }
        } else if (orgMode === "GoodsOpt") {
            try {
                sqlText = `update Products_option set
            
                            adt_ok				= '${data.adt_ok || '' }',
                            chd_ok				= '${data.chd_ok || '' }',
                            inf_ok				= '${data.inf_ok || '' }',
                            mealType			= '${data.ealType || '' }',
                            start_time			= '${data.start_time || '' }',
                            time_range			= '${data.time_range || '' }',
                            force_tl			= '${data.force_tl || '' }',
                            limit_use			= '${data.limit_use || '' }',
                            limit_max			= '${data.limit_max || '' }',
                            limit_text			= '${data.limit_text || '' }',
                            min_member			= '${data.min_member || '' }',
                            exposure_check		= '${data.exposure_check || '' }',
                            sorting				= '${data.sorting || '' }',
                            private_pickup		= '${data.private_pickup || '' }',
                            salePrice			= '${data.salePrice || '' }',
                            inputPrice			= '${data.inputPrice || '' }',
                            stock_key			= '${data.stock_key || '' }',
                            yesGolfCode			= '${data.yesGolfCode || '' }',
                            yesGolfCode2		= '${data.yesGolfCode2 || '' }',
                            info_page			= '${data.info_page || '' }' ,
                            stockIgn			= '${data.stockIgn || '' }',
                            airType             = '${data.airType || '' }'
                        where tourNumber = @tourNumber and minor_num = @minor
                `;
                await pool.request()
                            .input('tourNumber', sql.Int     , tourNumber) 
                            .input('minor',      sql.Int     , minor)
                            .query(sqlText);

                sqlText = `update Products_option_detail set
                            cancel_limit		= '${data.cancel_limit || ''}'
                        where tourNumber = @tourNumber and minor_num = @minor
                `;
                await pool.request()
                            .input('tourNumber', sql.Int     , tourNumber) 
                            .input('minor',      sql.Int     , minor)
                            .query(sqlText);
            } catch (err) {
                msg = err;
                console.log(err);
            }
        }
    } else if (mode === "imgDel") {
        sqlText = `select fileurl from Products_images where tourNumber = @tourNumber and uid=@uid `;
        sqlResult = await pool.request()
                        .input('tourNumber',sql.Int,tourNumber)
                        .input('uid',sql.Int,uid)
                        .query(sqlText)
        // 이미지 삭제 작업은 추루에 진행
    } else if (mode === "segChange") {
        sqlText = `update Products set daily_Cnt = @daily , airseg_Cnt = @airseg  where tourNumber = @tourNumber`;
        await pool.request()
            .input('tourNumber',sql.Int,tourNumber)
            .input('daily',sql.Int,data.daily_Cnt)
            .input('airseg',sql.Int,data.airseg_Cnt)
            .query(sqlText);
    } else if (mode === "AddStyle") {
        try {
            sqlText = ` SELECT MAX(dayType) AS maxDayType FROM Products_topaz_daily WHERE tourNumber = @tourNumber `;
            sqlResult = await pool.request().input('tourNumber',sql.Int,tourNumber).query(sqlText)
            const maxDayType  = (sqlResult.recordset[0]?.maxDayType ?? '').toString().trim();
            const nextDayType = maxDayType.length > 0 ? String.fromCharCode(maxDayType.charCodeAt(0) + 1) : 'A';
            sqlText = `
                insert into Products_air (tourNumber, dayType , minor_num, air_flight, cabin, dep_date, dep_city, dep_time, dep_GMT, arr_date, arr_city, arr_time, arr_GMT, baggage, dep_count, arr_nextday, fitTime)
                select 
                tourNumber, '${nextDayType}', minor_num, air_flight, cabin, dep_date, dep_city, dep_time, dep_GMT, arr_date, arr_city, arr_time, arr_GMT, baggage, dep_count, arr_nextday, fitTime
                from Products_air where tourNumber = @tourNumber and dayType = '${maxDayType}'
            `;
            sqlResult = await pool.request().input('tourNumber',sql.Int,tourNumber).query(sqlText);
            sqlText = `
                insert into Products_topaz_daily (tourNumber, dayType, minor_num, minor_num2, daily_title, daily_content, etc_data, daily_attr1, daily_attr2, daily_attr3, daily_attr4, daily_attr5)
                select 
                tourNumber, '${nextDayType}', minor_num, minor_num2, daily_title, daily_content, etc_data, daily_attr1, daily_attr2, daily_attr3, daily_attr4, daily_attr5
                from Products_topaz_daily where tourNumber = @tourNumber and dayType = '${maxDayType}'
            `;
            sqlResult = await pool.request().input('tourNumber',sql.Int,tourNumber).query(sqlText);
        } catch (err) {
            msg = err;
            console.log(err);
        }
    } else if (mode === "lineDel") {
        try {
            sqlText = `select * from Products_topaz_daily where tourNumber = @tourNumber and minor_num = @minor_num and minor_num2 = @minor_num2 and dayType = @dayType `;
            sqlResult = await pool.request()
                .input('tourNumber',sql.Int       ,tourNumber)
                .input('minor_num' ,sql.Int       ,data.minor_num)
                .input('minor_num2',sql.Int       ,data.minor_num2)
                .input('dayType'   ,sql.NVarChar  ,data.dayType)
                .query(sqlText);
            // 나중에 이미지 삭제 로직 추가 하여야 함.
            

            sqlText = `delete from Products_topaz_daily where tourNumber = @tourNumber and minor_num = @minor_num and minor_num2 = @minor_num2 and dayType = @dayType `;
            sqlResult = await pool.request()
                .input('tourNumber',sql.Int      ,tourNumber)
                .input('minor_num' ,sql.Int      ,data.minor_num)
                .input('minor_num2',sql.Int      ,data.minor_num2)
                .input('dayType'   ,sql.NVarChar ,data.dayTypes)
                .query(sqlText);
        } catch (err) {
            msg = err;
            console.log(err);
        }
    } else if(mode === "newStockSave") {
        try {
            sqlText = `select isnull(max(minor_num),0) + 1 as minor from Products_option_stock_name where tourNumber = @tourNumber `;
            sqlResult = await pool.request().input('tourNumber',sql.Int,tourNumber).query(sqlText);
            minor = sqlResult.recordset?.[0]?.minor;
            
            sqlText = `insert into Products_option_stock_name values (@tourNumber , @minor , @name) `;
            sqlResult = await pool.request()
                .input('tourNumber',sql.Int,tourNumber)
                .input('minor',sql.Int,minor)
                .input('name',sql.NVarChar,data.newStockName)
                .query(sqlText);
        } catch (err) {
            msg = err;
            console.log(err);
        }
    } else if(mode === "stockSave") {
        try {
            let updates = [];
            for (const [key, value] of Object.entries(data)) {
                if (key.startsWith('Date_') && value !== '' ) {
                    const date = key.replace('Date_', ''); // ex) 20251001
                    const stocks = Number(value);

                    // 업데이트용 SQL 구문 (필요에 따라 table명과 조건 수정)
                    updates.push(`
                        if exists (
                            select 1 from Products_option_stock
                            where sale_date = '${date}' AND tourNumber = @tourNumber and minor_num = @minor
                        )
                        UPDATE Products_option_stock
                            SET stocks = ${stocks}
                            WHERE sale_date = '${date}' AND tourNumber = @tourNumber and minor_num = @minor 
                        else 
                        insert into Products_option_stock (tourNumber, minor_num , stocks, sale_date) values (
                            @tourNumber , @minor , '${stocks}' ,'${date}'
                        )
                    `);
                }
            }
            if (updates.length > 0) {
                const sqlText = updates.join('; ');
                await pool.request()
                    .input('tourNumber', sql.Int, tourNumber)
                    .input('minor', sql.Int, minor)
                    .query(sqlText);
            }
        } catch (err) {
            msg = err;
            console.log(err);
        }
    }
    if (msg) rs = 'no'; else rs = 'ok';
    res.json ({success: rs, errorMsg: msg , title: titleData , html: htmlData 
          , GU2 : GU2DATA      
          , GU3 : GU3DATA      
          , GU4 : GU4DATA      
          , ca1 : ca1DATA      
          , ca2 : ca2DATA      
          , ca3 : ca3DATA      
          , ca4 : ca4DATA      
          , la  : lat
          , lo  : lon
          , name: siteName
          , minor: minor
          , year : year
          , month: month
    
    });
}