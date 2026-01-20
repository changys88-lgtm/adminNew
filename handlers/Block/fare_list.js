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
    const mainTable   = 'fareManagement';

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
            , ( select sum(availSeat) from seatMaster_day where uid_minor = a.uid and siteCode = '' ) as availSeat
            , isnull((select sum(adult_member + child_member )  from interline as ai 
                left outer join interline_routing as air on ai.uid = air.uid_minor 
                where ai.in_status < 9 and air.air_code = a.air_code + a.air_flight 
                and ai.atr_yes = 'C'  and air.GoodCode = a.uid
            ) ,0) as useSeat
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
        let   term = '';
        let   InterRoundName = [];
        for (const row of result.recordset) {
            let { 
                uid , usage , gubun , air_code , air_flight , air2 , dayNight , usePattern , routing , term1 , term2 , term3 , term4 
                , term5 , term6 , term7 , term8 , term9 , term10 , term11 , term12 , use_week , sub1 , sub2 , sub3 , availSeat , useSeat
                , sale_term1 , sale_term2 , issue_term1 , issue_term2
            } = row;
            weeks = "";
            for (let wCnt = 0 ; wCnt < use_week.length ; wCnt ++) {
                const week = use_week.substr(wCnt,1);
                weeks += deps.arrWeekName(week) + " ";
            }

            term = deps.cutDate(term1) + " ~ "  + deps.cutDate(term2);
            if (term3)  term += "<br>" + deps.cutDate(term3) + " ~ " + deps.cutDate(term4);
            if (term5)  term += "<br>" + deps.cutDate(term5) + " ~ " + deps.cutDate(term6);
            if (term7)  term += "<br>" + deps.cutDate(term7) + " ~ " + deps.cutDate(term8);
            if (term9)  term += "<br>" + deps.cutDate(term9) + " ~ " + deps.cutDate(term10);
            if (term11) term += "<br>" + deps.cutDate(term11) + " ~ " + deps.cutDate(term12);
            rows += `
                <tr class='' onmouseover="this.style.backgroundColor='#f0f0f0'" onmouseout="this.style.backgroundColor=''" bgcolor="#fff">
                    <td ><span class='btn_slim btn_yellow' onClick="return newReg('${uid}','modify')" class='cursor'>${font}${uid}</span></td>
                    <td >${font}${usage || ''}</td>
                    <td >${font}${InterRoundName[gubun] || ''}</td>
                    <td >${font}${air_code} ${air_flight} ${air2 || ''}</td>
                    <td >${font}${dayNight}N${usePattern || ''}D</td>
                    <td >${font}${routing || ''}</td>
                    <td >${font}${term || ''}</td>
                    <td >${font}${deps.cutDate(sale_term1)} ~ ${deps.cutDate(sale_term2)} <br> ${deps.cutDate(issue_term1)} ~ ${deps.cutDate(issue_term2)}</td>
                    <td >${font}${weeks || ''}</td>
                    <td>${font}${deps.numberFormat(sub1 || 0)}</td>
                    <td>${font}${deps.numberFormat(sub2 || 0)}</td>
                    <td>${font}${deps.numberFormat(sub3 || 0)}</td>
                    <td><span class='btn_basic btn_blue'   onClick="return funcMod('${uid}')" >좌석수정</span></td>
                    <td><span class='btn_basic btn_yellow' onClick="return funcView('${uid}')">모객현황</span></td>
                    <td><span class='btn_basic btn_red'    onClick="return funcDel('${uid}')">Del</span></td>
                </tr>
            `;
            ix ++;
        };

        listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr >
                    <th class=''>No</th>
					<th class=''>FIT</th>
					<th class=''>구간</th>
					<th class=''>항공편</th>
					<th class=''>패턴</th>
					<th class=''>운항도시</th>
					<th class=''>요금기간</th>
					<th class=''>판매기간 / 발권기간</th>
					<th class=''>운항요일</th>
					<th class=''>요금</th>
					<th class=''>좌석수</th>
					<th class=''>모객수</th>
					<th class=''>좌석수정</th>
					<th class=''>모객현황</th>
					<th class=''>삭제</th>
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

