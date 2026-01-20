const deps = require('../../src/common/dependencies');
const { getPagination } = require('../../src/utils/paging'); 
const { arrGoodsGubun , arrProductStatus } = require('../../src/utils/airConst'); 

module.exports = async (req, res) => {
    const data          = req.body;
    const GU1           = req.body.GU1 || '';
    const GU2           = req.body.GU2 || '';
    const GU3           = req.body.GU3 || '';
    const GU4           = req.body.GU4 || '';
    const ca1           = req.body.ca1 || '';
    const ca2           = req.body.ca2 || '';
    const ca3           = req.body.ca3 || '';
    const ca4           = req.body.ca4 || '';
    let   page          = req.body.page || '1';
    let   uid           = req.body.uid  || '';
    let   tourNumber    = req.body.tourNumber  || '';
    const cancel        = req.body.cancel || '1';
    const listCount     = req.body.listCount || 1;
    const sWord         = (req.body.sWord || '').trim();
    const sFrom         = req.body.sFrom || '';
    const sWord2        = (req.body.sWord2 || '').trim();
    const sFrom2        = req.body.sFrom2 || '';
    const start_date    = req.body.start_date || '';
    const end_date      = req.body.end_date || '';
    const AviaLoginId   = req.cookies?.AviaLoginId || '';
    const b2bMASTER     = req.cookies?.b2bMASTER || '';
    const b2bSiteCode   = req.cookies?.b2bSiteCode || '';
    const aes128Encrypt = deps.aes128Encrypt;
    const aes128Decrypt = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;
    const pool        = await deps.getPool();
    const sql         = deps.sql;
    let   sqlText     = '';
    let   sqlResult   = '';
    let   add         = '';
    let   memData     = '';
    
    let   addQry        = ` 1=1 and (delCheck is Null or delCheck = '') `;

    if (GU1)            addQry += ` and detailGubun = '${GU1}' `;
    if (GU2 )           addQry += ` and tourGubun = '${GU2}' `;
    if (GU3 )           addQry += ` and detailGubun like '%${GU3}%' `;
    if (sWord )         addQry += ` and ${sFrom} like '%${sWord}%' `;
    if (sWord2 )        addQry += ` and ${sFrom2} like '%${sWord2}%' `;
    if (ca1    )        addQry += ` and (select count(*) from Products_city where tourNumber = a.tourNumber and category1 = '${ca1}' ) > 0 `;
    if (ca2    )        addQry += ` and (select count(*) from Products_city where tourNumber = a.tourNumber and category2 = '${ca2}' ) > 0 `;
    if (ca3    )        addQry += ` and (select count(*) from Products_city where tourNumber = a.tourNumber and category3 = '${ca3}' ) > 0 `;
    if (ca4    )        addQry += ` and (select count(*) from Products_city where tourNumber = a.tourNumber and category4 = '${ca4}' ) > 0 `;

    const joinQry = ` 
            left outer join tblManager as b (nolock) on a.operator = b.member_code
            left outer join site as c (nolock) on a.site_code = c.site_code 
            left outer join site_manager as d (nolock) on a.site_code = d.site_code and a.operator = d.man_id 
            left outer join Products_city as city on a.tourNumber = city.tourNumber and city.minor_num = 1
        `;
    try {

       
        const totQuery = `
                select count(*) as total from  Products as a (nolock)  
                ${joinQry}
                where
                ${addQry}
            `;
        const result2 = await pool.request().query(totQuery);
        const totalRowCount = result2.recordset[0].total;
        if (totalRowCount < listCount) page = 1;
        const { startRow, endRow, pageHTML } = getPagination({
            tot_row: totalRowCount,
            page: page ,
            listCount: listCount
        });
        
        const fieldQry = `
            , b.username , c.site_name, c.TempUse, c.TempDomain
            , (select catename from nationManager where cate1 = city.category1 and cate2 = city.category2 and cate3 = city.category3 and cate4 = '00' ) as cate_name 
            , (select count(*) from Products_option where tourNumber = a.tourNumber and exposure_check = 'Y') as optionCnt
        `;

        sqlText = `
            select 
                a.* ${fieldQry}
                from (
                select * from
                    (select a.tourNumber , ROW_NUMBER() OVER (order by a.tourNumber desc ) as RowNum
                        from 
                        Products as a (nolock)  
                        ${joinQry}
                        where   
                        ${addQry}
                        
                    ) as db1
                where RowNum BETWEEN ${startRow} AND ${endRow}
                ) as main
                left outer join Products as a (nolock) on main.tourNumber = a.tourNumber
                ${joinQry}
                order by RowNum asc
            `;
        const result = await pool.request().query(sqlText);
        let   list = ``;
        let   ix = 0;
        for (let row of result.recordset) {
            let {
                tourNumber, tourName,  tourGubun , revStatus , site_code , site_name , category1 , category2 , category3, category4  , cateName
                , searchKey , optionCnt , up_date , card_use , username , main_view , proChannel
            } = row;            
            
            const mainView = `<input name='main_view' class='mt-2' type='text' value='${main_view}' style='width:30px; text-align:center' onChange="return dataChange('${tourNumber}',this.value)"> `;
            font    = '';
            num     = totalRowCount-ix-((page-1)*listCount);
            list += `
                <tr height="29" onmouseover="this.style.backgroundColor='#f3f3f3'" onmouseout="this.style.backgroundColor='#FFFFFF'" bgcolor='#FFFFFF'>
                    <td >${font}<span class="btn_slim btn_yellow" onClick="return newReg('${tourNumber}','Goods')" >${num}</span></td>
                    <td >${font}${arrProductStatus[revStatus.trim()]}</td>
                    <td >${font}<a href='$urlLink' target='_blank'><i class='fa fa-search'></i></a><br>${site_code} <br>${site_name || ''}</td>
                    <td >${font}<span class="btn_slim btn_yellow" onClick="return newReg('${tourNumber}','Goods')" >${tourNumber}</span><br>${arrGoodsGubun[tourGubun]} </td>
                    <td >${font}${category1 || ''} ${category2 || ''} ${category3 || ''} ${category4 || ''}</td>
                    <td >${font}${cateName || ''}</td>
                    <td >${font}${tourName || ''} ${searchKey || ''}</td>
                    <td >${font}${optionCnt}</td>
                    <td >${font}${deps.cutDateTime(up_date,"S")}</td>
                    <td >${font}${card_use|| ''} </td>
                    <td >${font}${username || ''}</td>
                    <td title='낮은순으로 노출이 됩니다'>${font}${mainView}</td>
                    <td >${font}<input type='checkbox' $chk1 onChange="return dataChange1('${tourNumber}',this.checked, 'exposureCheck')"></td>
                    <td >${font}<input type='checkbox' $chk2 onChange="return dataChange1('${tourNumber}',this.checked, 'pushCheck')"></td>
                    <td >${font}${proChannel || ''}</td>
                </tr>
            `;
            ix ++;
        };
        if (!list) list = `<tr><td colspan='20' class="fas fa-edit notice-title-text">데이터가 없습니다.</td></tr>`;

        const listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr >
                    <th>No</th>
                    <th>상태</th>
                    <th>미리보기&nbsp;<i class="fa fa-search"></i></th>
                    <th>상품코드</th>
                    <th>카테고리</th>
                    <th>도시</th>
                    <th>상품명</th>
                    <th>상품타입 수	</th>
                    <th>등록일</th>
                    <th>카드</th>
                    <th>판매담당자 &nbsp;<i class="fas fa-user"></i></th>
                    <th>노출순서</th>
                    <th>노출</th>
                    <th>추천</th>
                    <th>채널</th>
                </tr>
                ${list}
            </table>
        `;
        
        res.json({ success:'ok', listData: listHTML , pageData: pageHTML , totalCount: totalRowCount });
    } catch (err) {
        console.error('에러:'+err);
        res.json ({success:'no', msg: err});
    }
	
};

