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
    const mainTable   = 'airflight_master';

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
        let   weeks = '';
        for (const row of result.recordset) {
            let { 
                uid , dep_code , arr_code , air_flight , use_date1 , use_date2 , use_week , use_time1 , use_time2 , flight_time
            } = row;
            weeks = "";
            for (let wCnt = 0 ; wCnt < use_week.length ; wCnt ++) {
                const week = use_week.substr(wCnt,1);
                weeks += deps.arrWeekName(week) + " ";
            }
            rows += `
                <tr class='' >
                    <td ><span class='btn_slim btn_yellow' onClick="return newReg('${uid}','modify')" class='cursor'>${font}${uid}</span></td>
                    <td >${font}${dep_code}</td>
                    <td >${font}${arr_code}</td>
                    <td >${font}${air_flight}</td>
                    <td >${font}${deps.cutDate(use_date1)} ~ ${deps.cutDate(use_date2)} </td>
                    <td >${font}${weeks} </td>
                    <td >${font}${deps.cutTime(use_time1)} </td>
                    <td >${font}${deps.cutTime(use_time2)} </td>
                    <td >${font}${flight_time} 분</td>
                    <td><span class='btn_basic btn_red' onClick="return funcDel('${uid}')">Del</span></td>
                </tr>
            `;
            ix ++;
        };

        listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr >
                    <th >No</th>
					<th >출발도시</th>
					<th >도착도시</th>
					<th >항공편</th>
					<th >운항일자</th>
					<th >운항요일</th>
					<th >출발시간</th>
					<th >도착시간</th>
					<th >운항시간</th>
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

