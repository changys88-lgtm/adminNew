const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { accumulateDayRow , buildDayHTML} = require('../../src/utils/stats'); 
const air_list = require('./air_list');


//left outer join interline as a (nolock) on main.uid = a.uid   
module.exports = async (req, res) => {
    const data        = req.body;
    let   start_date  = req.body.start_date || '';
    let   end_date    = req.body.end_date || '';
    let   GU1         = req.body.GU1     || '';
    let   GU2         = req.body.GU2     || '';
    let   GU3         = req.body.GU3    || '';
    let   GU4         = req.body.GU4    || '';
    let   GU5         = req.body.GU5    || '';
    const gMode       = req.body.gMode  || '';
    const page        = req.body.page    || '1';
    const listCount   = req.body.listCount;
    const sWord       = req.body.sWord || '';
    const sFrom       = req.body.sFrom || '';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const mainTable   = 'interline';
    const pool        = await deps.getPool();
    let   YY          = deps.getNow().YY;
    let   MM          = deps.getNow().MM;
    let   cYear       = data.cYear  || YY;
    let   cMonth      = data.cMonth || MM;
    
    let addQry        = ` 1=1 and in_status = '4' `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }
    const search_key = GU5 === "DAY" ? `${cYear}${cMonth.padStart(2,'0')}` : cYear;
    if (GU1 === "ISSUE")	    addQry += ` and a.issue_date like '${search_key}%' `;
    else if (GU1 === "ORDER")	addQry += ` and a.order_date like '${search_key}%' `;
    else if (GU1 === "DEP")	    addQry += ` and d.in_date like '${search_key}%' `;

    if (GU4 === "Inter")	    addQry += ` and atr_yes != 'DOM' `; else addQry += ` and atr_yes = 'DOM' `;
    if (b2bSiteCode !== "")     addQry += ` and (a.site_code = '${b2bSiteCode}' or n.bspSiteCode = '${b2bSiteCode}' or b.master_site = '${b2bSiteCode}' )`; 

    try {
        const fieldQry = `
            a.* 
            ,b.site_name , b.fax_number
			,d.air_code,d.citycode,d.in_date,d.seat_status,d.air_class as class1   
        `;

        const joinQry = `
            left outer join site as b on a.site_code = b.site_code
            left outer join tblManager as c on a.operator = c.member_code
            left outer join interline_routing as d on a.uid = d.uid_minor and d.minor_num = '1' 
            left outer join tblManager as f on a.issue_manager = f.member_code
            left outer join interline_pax as k on a.uid = k.uid_minor and k.minor_num = '1' 
            left outer join interline_minor as n on a.uid = n.uid_minor 
        `;

        const baseQuery = `
        select 
            ${fieldQry}
            from ${mainTable} (nolock) as a 
            ${joinQry}
            where 
            ${addQry}
        `;
        //console.log(baseQuery)
        const result = await pool.request().query(baseQuery);
        let  rows = ``;
        let  tot = 0;
        let  cCnt = 0;
        let  aData = { TOT: 0, DAY: {} };
        let  aAirCode = {};
        let  aAir     = {};
        
        for (const row of result.recordset) {
            const total_amount  = Number(row.total_amount || 0);
            const adult_member  = Number(row.adult_member || 0);
            const child_member  = Number(row.child_member || 0);
            const infant_member = Number(row.infant_member || 0);
            const air_amount    = Number(row.air_amount || 0);
            const child_amount  = Number(row.child_amount || 0);
            const infant_amount = Number(row.infant_amount || 0);
            const adult_tax     = Number(row.adult_tax || 0);
            const child_tax     = Number(row.child_tax || 0);
            const infant_tax    = Number(row.infant_tax || 0);
            const in_status     = String(row.in_status || '');
            const issue_date    = String(row.issue_date || '');
            const order_date    = String(row.order_date || '');
            const in_date       = String(row.in_date || '');
            const air_code      = String(row.air_code || '');
            let  site_code     = String(row.site_code || '');
            const site_name     = String(row.site_name || '');
            
            aData.TOT       += total_amount;
            const member    = adult_member + child_member + infant_member;
            const air_amt   = (air_amount * adult_member) + (child_amount * child_member) + (infant_amount * infant_member);
            const tax       = (adult_tax * adult_member) + (child_tax * child_member) + (infant_tax * infant_member);
        
            let key = '';
            if (GU1 === "ISSUE") {
                key = issue_date;
            } else if (GU1 === "ORDER") {
                key = order_date;
            } else if (GU1 === "DEP") {
                key = in_date;
            }
        
            const gubun = GU5 === "DAY" ? key.substring(6, 8) : key.substring(4, 6);
            site_code   = site_code.trim().toUpperCase(); // 예약 사이트 코드
            if (!aAirCode[site_code]) aAirCode[site_code] = site_name;

            const air = air_code.substring(0, 2);
            if (!aAir[air]) aAir[air] = 1;
        
            if (!aData.DAY[air]) aData.DAY[air] = {};
            if (!aData.DAY[air][site_code]) {
                aData.DAY[air][site_code] = { TOTAL: 0, AIRAMT: 0, TAXAMT: 0, MEMBER: 0, ORDERS: 0 };
            }
            aData.DAY[air][site_code].TOTAL  += total_amount;
            aData.DAY[air][site_code].AIRAMT += air_amt;
            aData.DAY[air][site_code].TAXAMT += tax;
            aData.DAY[air][site_code].MEMBER += member;
            aData.DAY[air][site_code].ORDERS ++;
        
            if (!aData.DAY[air].TOTAL) {
                aData.DAY[air] = { TOTAL: 0, AIRAMT: 0, TAXAMT: 0, MEMBER: 0, ORDERS: 0 };
            }
            aData.DAY[air].TOTAL += total_amount;
            aData.DAY[air].AIRAMT += air_amt;
            aData.DAY[air].TAXAMT += tax;
            aData.DAY[air].MEMBER += member;
            aData.DAY[air].ORDERS++;
        
            if (!aData.DAY.TOTAL) {
                aData.DAY = { TOTAL: 0, AIRAMT: 0, TAXAMT: 0, MEMBER: 0, ORDERS: 0 };
            }
            aData.DAY.TOTAL  += total_amount;
            aData.DAY.AIRAMT += air_amt;
            aData.DAY.TAXAMT += tax;
            aData.DAY.MEMBER += member;
            aData.DAY.ORDERS++;
        
            if (!aData.DAY[site_code]) {
                aData.DAY[site_code] = { TOTAL: 0, AIRAMT: 0, TAXAMT: 0, MEMBER: 0, ORDERS: 0 };
            }
            aData.DAY[site_code].TOTAL += total_amount;
            aData.DAY[site_code].AIRAMT += air_amt;
            aData.DAY[site_code].TAXAMT += tax;
            aData.DAY[site_code].MEMBER += member;
            aData.DAY[site_code].ORDERS++;
            
            tot++;
        }


        const days = GU5 === "DAY" ? deps.getLastDays(Number(cYear), Number(cMonth)) : 12;
        
        const style1   = " style='left:0px;position: sticky;background-color: #eee;' ";
        const style2   = " style='right:0px;position: sticky;background-color: #eee;' ";
        
        const style2_1 = " style='right:0px;position: sticky;background-color: #eee;' ";
        const style2_2 = " style='right:60px;position: sticky;background-color: #eee;' ";
        const style2_3 = " style='right:150px;position: sticky;background-color: #eee;' ";
        const style2_4 = " style='right:240px;position: sticky;background-color: #eee;' ";
        
        const style3_1 = " style='top:0px; position:sticky; background-color: #eee; white-space: nowrap;' ";
        const style3_2 = " style='top:45px; position:sticky; background-color: #eee;white-space: nowrap;' ";

        let bgcolor = 'fff' , font = '';

        let listHTML = `<tr ${style3_1} ><th class='' ${style2_1} rowspan='2'>구분<br>단위:원</th>`;
        for (const air in aAir) {
            listHTML += `<th class='' colspan='4'>${air}</th>`;
        }
        listHTML += `<th class='' ${style2_1} colspan='4'>합계</th></tr><tr ${style3_2} >`;
        for (const air in aAir) {
            listHTML += `<th class='' >인원 </th><th class='' >항공료 </th><th class='' >택스 </th><th class='' >점유률 </th>`;
            cCnt ++;
        }
        listHTML += `
            <th ${style2_4} class='' >인원 </th>
            <th ${style2_3} class='' >항공료 </th>
            <th ${style2_2} class='' >택스 </th>
            <th ${style2_1} class='' >점유률 </th>
        `;
        listHTML += `</tr>`;

        for (const [site_code,site_name] of Object.entries(aAirCode)) {
            //listHTML += `<tr><td>${air} </td></tr>`;
            listHTML += `
                <tr HEIGHT=20 class='nowrap' onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor='#FFF'" >
                    <td ${style1}>${site_code}<BR>${site_name} </td>
                `;
            for (const air in aAir) {
                
                const key     = air;
                const air_ref = aData["DAY"]?.[key]?.[site_code]?.["REF"] || 0;
                const air_amt = aData["DAY"]?.[key]?.[site_code]?.["AIRAMT"] || 0;
                const air_tax = aData["DAY"]?.[key]?.[site_code]?.["TAXAMT"] || 0;
                const air_mem = aData["DAY"]?.[key]?.[site_code]?.["MEMBER"] || 0;
                const air_tot = aData["DAY"]?.[key]?.[site_code]?.["TOTAL"] || 0;
                let rate = 0;
                if (air_amt > 0 && air_tot > 0) rate = Math.round((air_amt/air_tot)*100,2);
                const avgPerPerson = air_mem > 0 ? (air_amt+air_tax)/air_mem : 0;
                listHTML += `
                    <td>${deps.numberFormat(air_mem)} </td>
                    <td class='ar'>${deps.numberFormat(air_amt)}<span class='cored font11 none'><br>${deps.numberFormat(avgPerPerson,-1)}</span><br><span class='cored font11'>${deps.numberFormat(air_ref)}</span></td>
                    <td class='ar'>${deps.numberFormat(air_tax)}</td>
                    <td class='ar'>${rate}</td>
                `;
            }
            const air_ref = aData["DAY"]?.[site_code]?.["REF"] || 0;
            const air_amt = aData["DAY"]?.[site_code]?.["AIRAMT"] || 0;
            const air_tax = aData["DAY"]?.[site_code]?.["TAXAMT"] || 0;
            const air_mem = aData["DAY"]?.[site_code]?.["MEMBER"] || 0;
            const air_tot = aData["DAY"]?.["AIRAMT"] || 0;
            let rate = 0;
            if (air_amt > 0 && air_tot > 0) rate = Math.round((air_amt/air_tot)*100,2);
            const avgPerPerson2 = air_mem > 0 ? (air_amt+air_tax)/air_mem : 0;
            listHTML += `
                <td ${style2_4}>${deps.numberFormat(air_mem)} </td>
                <td ${style2_3} class='ar'>${deps.numberFormat(air_amt)}<span class='cored font11 none'><br>${deps.numberFormat(avgPerPerson2,-1)}</span><br><span class='cored font11'>${deps.numberFormat(air_ref)}</span></td>
                <td ${style2_2} class='ar'>${deps.numberFormat(air_tax)}</td>
                <td ${style2_1} class='ar'>${rate}</td>
            `;
            listHTML += `</tr>`;
        }
        if (tot === 0) {
            listHTML += `
                <tr><td colspan='5' class='ac hh50'>검색된 데이터가 없습니다.</td></tr>
            `;
        }

        listHTML += `
            <tr style='background-color:#eee;white-space: nowrap;' >
                <th ${style1}>합 계</th>`;
            for (const air in aAir) {
                const dayData = aData["DAY"]?.[air] || {};
                listHTML += `
                    <th>${deps.numberFormat(dayData["MEMBER"] || 0)}</th>
                    <th>${deps.numberFormat(dayData["AIRAMT"] || 0)}</th>
                    <th>${deps.numberFormat(dayData["TAXAMT"] || 0)}</th>
                    <th></th>
                `;
            }
            listHTML += `
                <td ${style2_4}>${deps.numberFormat(aData["DAY"]["MEMBER"] || 0)} </td>
                <td ${style2_3} class='ar'>${deps.numberFormat(aData["DAY"]["AIRAMT"] || 0)}</td>
                <td ${style2_2} class='ar'>${deps.numberFormat(aData["DAY"]["TAXAMT"] || 0)}</td>
                <td ${style2_1} class='ar'>100%</td>
        `;
        listHTML += `</tr>`;

        listHTML = `
            <table class='table table-light text-center mt-3' border=1 bordercolor='#ddd' style="border-bottom:1px solid #ddd;" id='dtBasic'>
                ${listHTML}
            </table>
        `;

        res.json({success : 'ok', listData: listHTML , totalCount: tot });
    } catch (err) {
        console.error('에러:'+err.stack);
        res.status(500).send('Database error');
    }
	
};



