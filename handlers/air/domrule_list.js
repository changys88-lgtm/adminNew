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
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const pool        = await deps.getPool();
    const sql         = deps.sql;
    const mainTable   = 'Domestic.dbo.DomGalileoFareRule';

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
                uid , carrierCode , fareRule , refundRule , up_date , baggage
            } = row;
            
            rows += `
                <tr class='cursor' >
                    <td  onClick="return newReg('${uid}','modify')" class='cursor'>${font}${uid}</td>
                    <td >${font}${carrierCode}</td>
                    <td >${font}<div style='width:300px; overflow:hidden ; height:50px;'>${fareRule}</div></td>
                    <td >${font}<div style='width:300px; overflow:hidden ; height:50px;'>${refundRule}</div></td>
                    <td >${font}<div style='width:200px; overflow:hidden ; height:50px;'>${baggage}</div></td>
                    <td >${font}${deps.cutDateTime(up_date || '')}</td>
                    <td><span class='btn_basic btn_yellow' onClick="return newReg('${uid}','modify')">수정</span></td>
                    <td><span class='btn_basic btn_red' onClick="return funcDel('${uid}')">Del</span></td>
                </tr>
            `;
            ix ++;
        };
        if (!ix) rows = `<tr><td colspan='8' class='ac hh50'>검색된 데이터가 없습니다.</td></tr>`;
        listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr >
                    <th >No</th>
					<th >항공</th>
					<th >FARE</th>
					<th >REFUND</th>
					<th >수화물</th>
					<th >등록일</th>
					<th >수정</th>
					<th >삭제</th>
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

