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
    const sWord2      = req.body.sWord2   || '';
    const sFrom2      = req.body.sFrom2   || '';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const pool        = await deps.getPool();
    const sql         = deps.sql;
    const mainTable   = 'airline_binNumber';

    let   sqlText     = '';
    let   sqlResult   = '';
    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }
    if (sWord2 && sFrom2 ) {
        addQry +=  ` and ${sFrom2} like '%${sWord2}%' `;
    }

    //if (GU1  != "")       addQry         += ` and air_group = '${GU1}' `;
    //if (GU2  != "")       addQry         += ` and countryName = '${GU2}' `;
    //if (GU3  != "")       addQry         += ` and mainCity = '${GU3}' `;

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
                uid  , aircode , aircode2 , binCode , binCompany , binCompanyName , bin_number , up_date
            } = row;
            
            rows += `
                <tr  HEIGHT=29  onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor='#FFFFFF'" bgcolor="#fff">
                    <td ><span class='btn_slim btn_yellow' onClick="return newReg('${uid}','modify')" class='cursor'>${font}${uid} </span></td>
                    <td >${font}${aircode || ''}</td>
                    <td >${font}${aircode2 || ''}</td>
                    <td >${font}${binCode || ''}</td>
                    <td >${font}${binCompany || ''}</td>
                    <td >${font}${binCompanyName || ''}</td>
                    <td >${font}${bin_number || ''}</td>
                    <td >${font}${deps.cutDateTime(up_date)}</td>
                    <td >${font}<span class='btn_slim btn_red' ondblClick="return binDel('${uid}')">Del</span></td>
                </tr>
            `;
            ix ++;
        };

        if (!rows) {
            rows = `<tr><td colspan='20' class='ac hh50'>검색된 데이터가 없습니다.</td></tr>`;
        }

        listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr>
                    <th>No</th>
                    <th>2코드</th>
                    <th>3코드</th>
                    <th>Card Bin</th>
                    <th>Bin Company</th>
                    <th>명칭</th>
                    <th>Bin 넘버</th>
                    <th>등록일</th>
                    <th>삭제</th>
                </tr>
                ${rows}
            </table>
        `;

        res.json({success:'ok', listData: listHTML , pageData: pageHTML , totalCount: totalRowCount   });
    } catch (err) {
        console.error('에러:'+err);
        res.status(500).send('Database error');
    }
	
};

