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
    const mainTable   = 'interlineFareRule';

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
            a.*  , refund.refundData
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
            outer apply (
                select (
                    select minor_num , fromDate, fromMinute, untilDate, untilMinute, distance1, distance2, distance3 
                    from interlineFareRule_refund where uid_minor = main.uid and fromDate != '' order by minor_num for json path
                ) as refundData
            ) as refund
            order by RowNum asc
        `;
        //console.log(baseQuery)
        const result = await pool.request().query(baseQuery);
        let   rows = ``;
        let   ix = 0 ;
        let   font = '';
        for (const row of result.recordset) {
            let { 
                uid , carrierCode , airClass , issue_term1 , issue_term2 , fareRule , refundRule , up_date , refundData
            } = row;
            
            rows += `
                <tr class='' >
                    <td  onClick="return newReg('${uid}','modify')" class='cursor'>${font}${uid}</td>
                    <td >${font}${carrierCode}</td>
                    <td >${font}${airClass}</td>
                    <td >${font}${deps.cutDate(issue_term1 || '')} ~ ${deps.cutDate(issue_term2 || '')}</td>
                    <td >${font}${fareRule} <br> ${refundRule}</td>
                    <td >${font}${JSON.parse(refundData).map(item => `${item.fromDate} ~ ${item.untilDate} = ${item.distance1}/${item.distance2}/${item.distance3}`).join('<br>')}</td>
                    <td >${font}${deps.cutDateTime(up_date || '')}</td>
                    <td><span class='btn_basic btn_yellow cursor nowrap' onClick="return newReg('${uid}','modify')">수정</span></td>
                    <td><span class='btn_basic btn_red cursor nowrap' onClick="return funcDel('${uid}')">Del</span></td>
                </tr>
            `;
            ix ++;
        };

        listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr >
                    <th >No</th>
					<th >항공</th>
					<th >클래스</th>
					<th >발권일</th>
					<th >FARE</th>
					<th >REFUND (일자,단.중.장)</th>
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

