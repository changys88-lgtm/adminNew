const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { getPagination } = require('../../src/utils/paging'); 

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
    const mainTable   = 'insure_rev';

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
        const joinQry = `
            left outer join site as b on a.site_code = b.site_code 
            left outer join insure_rev_pax as c on a.uid = c.uid_minor and c.minor_num = '1' 
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
            a.*  , b.site_name
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
        let   order = '';
        let   week1 = '';
        let   week2 = '';
        let   sName = '';
        for (const row of result.recordset) {
            let { 
                uid  , status , site_name , start_day , arrive_day , country , ip_loss , up_date , members , adult_member , child_member , infant_member , allAmt , Tasf , issue_req_time
            } = row;
            week1 = start_day ? deps.getWeek(deps.getWeekday(start_day || '')) : '';
            week2 = arrive_day ? deps.getWeek(deps.getWeekday(arrive_day || '')) : '';


            if (!status || status === "1" ) sName = "대기";
            else if (status === "2") sName = "<font color='#147c96'>접수";
            else if (status === "3") sName = "<font color='#196b9a'>완료";

            else if (status === "E") sName = "<font color='#f43944'>에러";
            else if (status === "8") sName = "<font color='#f43944'>환불";
            else if (status === "9") sName = "<font color='#f43944'>취소";
            else if (status === "3") sName = "<font color='#196b9a'>완료";

            if(ip_loss == 'L') ip_loss = '실손';
		    else ip_loss = '비포함';

            rows += `
                <tr  HEIGHT=29  onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor='#FFFFFF'">
                    <td class='esti num' style='font-size:12px'><span class='btn_slim btn_yellow' onClick="newReg('${uid}','modify')">${uid}</span></td>
                    <td class='esti' style='font-size:12px'>${sName || ''}</td>
                    <td class='esti ' style='font-size:12px'>${site_name || ''}</td>
                    <td class='esti ' style='font-size:12px;'>${deps.cutDate(start_day || '')} (${week1})</td>
                    <td class='esti ' style='font-size:12px;'>${deps.cutDate(arrive_day || '')} (${week2})</td>
                    <td class='esti' style='font-size:12px'>${country}</td>
                    <td class='esti date' style='font-size:12px; '>${deps.cutDateTime(up_date || '',"S")}</td>
                    <td class='esti' style='font-size:12px'>${ip_loss}</td>
                    <td class='esti' style='font-size:12px; '>${members}</td>
                    <td class='esti' style='font-size:12px; '>${adult_member}</td>
                    <td class='esti' style='font-size:12px; '>${child_member}</td>
                    <td class='esti' style='font-size:12px; '>${infant_member}</td>
                    <td class='esti' style='font-size:12px; '>${deps.numberFormat(allAmt || 0)}</td>
                    <td class='esti'>${Tasf || ''}</td>
                    <td class='esti' style='font-size:12px; '>${order}</td>
                </tr>
            `;
            ix ++;
        };

        if (!rows) {
            rows = `<tr><td colspan='20' class='ac hh50'>검색된 데이터가 없습니다.</td></tr>`;
        }

        listHTML = `
            <table class='table table-light text-center mt-3' border=1 bordercolor='#ddd' style='border-bottom:1px solid #ddd;' id='dtBasic'>
                <tr style='background-color:#eee;'>
                    <th class='start' style='font-size:13px'>No</th>
                    <th style='font-size:13px'>상태</th>
                    <th style='font-size:13px'>거래처</th>
                    <th style='font-size:13px'>출발일</th>
                    <th style='font-size:13px'>귀국일</th>
                    <th style='font-size:13px'>여행지</th>
                    <th style='font-size:13px'>등록일</th>
                    <th style='font-size:13px'>실손여부</th>
                    <th style='font-size:13px'>총인원</th>
                    <th style='font-size:13px'>성인</th>
                    <th style='font-size:13px'>아동</th>
                    <th style='font-size:13px'>유아</th>
                    <th style='font-size:13px'>총 보험료</th>
                    <th style='font-size:13px'>Tasf</th>
                    <th style='font-size:13px'>주문번호</th>
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

