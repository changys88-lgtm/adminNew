const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { getPagination } = require('../../src/utils/paging'); 
const { arrNotice } = require('../../src/utils/airConst'); 


//left outer join interline as a (nolock) on main.uid = a.uid   

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
    const sWord2      = req.body.sWord2  || '';
    const sFrom2      = req.body.sFrom2  || '';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const pool        = await deps.getPool();
    const sql         = deps.sql;
    const mainTable   = 'airClass_list';

    let   sqlText     = '';
    let   sqlResult   = '';
    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }
    if (sWord2 && sFrom2 ) {
        addQry +=  ` and ${sFrom2} like '%${sWord2}%' `;
    }

    if (GU1  != "")       addQry         += ` and region = '${GU1}' `;
    if (GU2  != "")       addQry         += ` and countryName = '${GU2}' `;
    if (GU3  != "")       addQry         += ` and mainCity = '${GU3}' `;
    if (distance === "Y") addQry         += ` and and ( distanceType = '' or distanceType is null ) `;

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
        let   weeks = '';
        for (const row of result.recordset) {
            let { 
                uid , airCode , dep_city , arr_city , start_term1 , start_term2 , first , business , economy , up_date
            } = row;
            weeks = "";
            
            rows += `
                <tr class='' >
                    <td ><span class='btn_slim btn_yellow' onClick="return newReg('${uid}','modify')" class='cursor'>${font}${uid}</span></td>
                    <td >${font}${airCode}</td>
                    <td >${font}${dep_city}</td>
                    <td >${font}${arr_city}</td>
                    <td >${font}${deps.cutDate(start_term1)} ~ ${deps.cutDate(start_term2)} </td>
                    <td >${font}${first}</td>
                    <td >${font}${business}</td>
                    <td >${font}${economy}</td>
                    <td >${font}${deps.cutDateTime(up_date)}</td>
                    <td><span class='btn_basic btn_red' onClick="return funcDel('${uid}')">Del</span></td>
                </tr>
            `;
            ix ++;
        };

        listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr >
                    <th >No</th>
					<th >항공편</th>
					<th >출발도시</th>
					<th >도착도시</th>
					<th >운항일자</th>
					<th >퍼스트</th>
					<th >비지니스</th>
					<th >이코노미</th>
					<th >등록일</th>
					<th >삭제</th>
                </tr>
                ${rows}
            </table>
        `;

        res.json({success : 'ok', listData: listHTML , pageData: pageHTML , totalCount: totalRowCount   });
    } catch (err) {
        console.error('에러:'+err.stack);
        res.status(500).send('Database error');
    }
	
};

