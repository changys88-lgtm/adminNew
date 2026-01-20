const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { getPagination } = require('../../src/utils/paging'); 
const { arrNewsGubun } = require('../../src/utils/airConst'); 


module.exports = async (req, res) => {
    let   start_date  = req.body.start_date || '';
    let   end_date    = req.body.end_date || '';
    let   GU1         = req.body.GU1     || '';
    let   GU2         = req.body.GU2     || '';
    let   GU3         = req.body.GU3     || '';
    let   GU4         = req.body.GU4     || '';
    const gubun       = req.body.gubun   || '';
    const page        = req.body.page    || '1';
    const listCount   = req.body.listCount || 20;
    const sWord       = req.body.sWord   || '';
    const sFrom       = req.body.sFrom   || '';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const pool        = await deps.getPool();
    const sql         = deps.sql;
    const mainTable   = 'scanList';

    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }

    if (start_date != "") {
        addQry += ` and substring(a.up_date,1,8) >= '${deps.StrClear(start_date)}' `; 
    }
    if (end_date != "") {
        addQry += ` and substring(a.up_date,1,8) <= '${deps.StrClear(end_date)}' `; 
    }
    try {
        const joinQry = `
        `;
        const totQuery = `
            select count(*) as total from  ${mainTable} as a (nolock)  
            ${joinQry}
            where
            ${addQry}
        `;
        const result2 = await pool.request().query(totQuery);
        const totalRowCount = result2.recordset[0].total;
        const { startRow, endRow, pageHTML } = getPagination({
            tot_row: totalRowCount,
            page: page ,
            listCount: listCount
        });
        const fieldQry = `
            a.* 
        `;


        const baseQuery = `
        select 
            ${fieldQry}
            from (
            select * from
                (select a.uid , ROW_NUMBER() OVER (order by a.uid desc ) as RowNum
                    from 
                    ${mainTable} as a (nolock)  
                    ${joinQry}
                    where   
                    ${addQry}
                    
                ) as db1
            where RowNum BETWEEN ${startRow} AND ${endRow}
            ) as main
            left outer join ${mainTable} as a (nolock) on main.uid = a.uid
            ${joinQry}
            
            order by RowNum asc
        `;
        //console.log(baseQuery)
        const result = await pool.request().query(baseQuery);
        let   rows = ``;
        let   ix = 0 ;
        let   font = '';
        for (const row of result.recordset) {
            let { 
                uid , site_code , err_code , merchant_id , person_order , adt_chd , passport_no , sur_name , given_name , nationality , sex , birth_date , expiry_date , up_date
            } = row;
            rows += `
                <tr  HEIGHT=29  onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor='#FFFFFF'">
                    <td >${font}${uid}</td>
                    <td >${font}${site_code}</td>
                    <td >${font}${err_code}</td>
                    <td >${font}${merchant_id}</td>
                    <td >${font}${person_order}</td>
                    <td >${font}${adt_chd}</td>
                    <td >${font}${passport_no}</td>
                    <td >${font}${sur_name}</td>
                    <td >${font}${given_name}</td>
                    <td >${font}${nationality}</td>
                    <td >${font}${sex}</td>
                    <td >${font}${deps.cutDate(birth_date)}</td>
                    <td >${font}${deps.cutDate(expiry_date)}</td>
                    <td >${font}${deps.cutDateTime(up_date,"S")}</td>
                </tr>
            `;
            ix ++;
        };
        if (!ix) {
            rows = `<tr><td colspan='20' class='ac hh50'>검색된 데이터가 없습니다.</td></tr>`;
        }
        listHTML = `
       
			<table class='search-table' id='dtBasic'>
                <tr>
                    <th     >No</th>
					<th>거래처</th>
					<th>코드</th>
					<th>오더1</th>
					<th>오더2</th>
					<th>성인/소아</th>
					<th>여권번호</th>
					<th>성</th>
					<th>이름</th>
					<th>국적</th>
					<th>성별</th>
					<th>생일</th>
					<th>유효기간</th>
					<th>시간</th>
                </tr>
                ${rows}
            </table>
        `;
        res.json({ success : 'ok', listData: listHTML , pageData: pageHTML , totalCount: totalRowCount });
    } catch (err) {
        console.error('에러:'+err);
        res.status(500).send('Database error');
    }
	
};

