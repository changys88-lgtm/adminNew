const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { getPagination } = require('../../src/utils/paging'); 
const { arrNotice } = require('../../src/utils/airConst'); 


//left outer join interline as a (nolock) on main.uid = a.uid   
const joinQry = `
`;
module.exports = async (req, res) => {
    let   start_date  = req.body.start_date || '';
    let   end_date    = req.body.end_date || '';
    let   GU1         = req.body.GU1     || '';
    let   GU2         = req.body.GU2     || '';
    let   GU3         = req.body.GU3     || '';
    let   distance    = req.body.distance     || '';
    const gubun       = req.body.gubun   || '';
    const page        = req.body.page    || '1';
    const listCount   = req.body.listCount;
    const sWord       = req.body.sWord   || '';
    const sFrom       = req.body.sFrom   || '';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const pool        = await deps.getPool();
    const sql         = deps.sql;
    const mainTable   = 'price_management';

    let   sqlText     = '';
    let   sqlResult   = '';
    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }

    if (GU1  != "")       addQry         += ` and air_group = '${GU1}' `;
    if (GU2  != "")       addQry         += ` and countryName = '${GU2}' `;
    if (GU3  != "")       addQry         += ` and mainCity = '${GU3}' `;
    if (distance === "Y") addQry         += ` and and ( distanceType = '' or distanceType is null ) `;

    try {
        
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
                uid , airCode , bspSiteCode ,  departure_city , arrive_city , sale_term1 , sale_term2 , dep_date1 , dep_date2 , airClass
                , adt_amt , site_code , site_name , usage 
            } = row;
            
            rows += `
                <tr class='' >
                    <td ><span class='btn_slim btn_yellow' onClick="return newReg('${uid}','modify')" >${font}${uid} </span></td>
                    <td >${font}${airCode || ''}</td>
                    <td >${font}${bspSiteCode || ''}</td>
                    <td >${font}${departure_city || ''}</td>
                    <td >${font}${arrive_city || ''}</td>
                    <td >${font}${deps.cutDate(sale_term1 || '')} - ${deps.cutDate(sale_term2 || '')}</td>
                    <td >${font}${deps.cutDate(dep_date1 || '')}  - ${deps.cutDate(dep_date2 || '')}</td>
                    <td >${font}${airClass || ''}</td>
                    <td >${font}${adt_amt || ''}</td>
                    <td >${font}${site_code || ''} ${site_name || ''}</td>
                    <td >${font}${usage || ''}</td>
                </tr>
            `;
            ix ++;
        };

        listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr >
                    <th >No</th>
                    <th >항공</th>
                    <th >등록업체</th>
                    <th >출발</th>
                    <th >도착</th>
                    <th >판매기간</th>
                    <th >출발기간</th>
                    <th >클래스</th>
                    <th >금액</th>
                    <th >거래처</th>
                    <th >사용</th>
                </tr>
                ${rows}
            </table>
        `;

        res.json({success : 'ok', listData: listHTML , pageData: pageHTML , totalCount: totalRowCount   });
    } catch (err) {
        console.error('에러:'+err);
        res.status(500).send('Database error');
    }
	
};

