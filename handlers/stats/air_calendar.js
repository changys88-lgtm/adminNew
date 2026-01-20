const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { accumulateDayRow , buildDayHTML} = require('../../src/utils/stats'); 


//left outer join interline as a (nolock) on main.uid = a.uid   
module.exports = async (req, res) => {
    const data        = req.body;
    let   start_date  = req.body.start_date || '';
    let   end_date    = req.body.end_date || '';
    const cMode       = req.body.cMode || '';
    let   GU1         = req.body.GU1     || '';
    let   GU2         = req.body.GU2     || '';
    let   GU3         = req.body.GU3    || '';
    let   GU4         = req.body.GU4    || '';
    let   GU5         = req.body.GU5    || '';
    const gMode       = req.body.gMode  || '';
    const page        = req.body.page    || '1';
    const listCount   = req.body.listCount || 20;
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
    let   list1       = '';
    let   year        = '';
    let   month       = '';
    let   wCls        = '';
    let   curData     = '';
    let   sub         = '';
    let   sub2        = '';
    let   link        = '';
    let   Anniversary = '';
    const dayClass = { 0: 'cored', 6: 'coblue' };
    
    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }
    const search_key = GU5 === "DAY" ? `${cYear}${cMonth.padStart(2,'0')}` : cYear;
    if (GU1 === "ISSUE")	    addQry += ` and a.issue_date like '${search_key}%' `;
    else if (GU1 === "ORDER")	addQry += ` and a.order_date like '${search_key}%' `;
    else if (GU1 === "DEP")	    addQry += ` and d.in_date like '${search_key}%' `;

    if (GU4 === "Inter")	    addQry += ` and atr_yes != 'DOM' `; else addQry += ` and atr_yes = 'DOM' `;

    try {

        if (!cYear  ) year  = NOWSTIME.slice(0,4); else year  = cYear;
        if (!cMonth ) month = NOWSTIME.slice(4,6); else month = cMonth;
        if (cMode === "Next") {
            month ++;
            if (month > 12) {
                year ++;
                month = 1;
            }
        } else if (cMode === "Pre") {
            month --;
            if (month < 1) {
                year --;
                month = 12;
            }
        }

        let   firstWeeks = new Date(Date.UTC(year, Number(month)  - 1, 1)).getUTCDay();
        let   lastdays   = new Date(Date.UTC(year, month, 0)).getUTCDate();
        
        const weeks = [];
        let   w     = [];
        for (let i = 0; i < Number(firstWeeks); i++) w.push(null);
        for (let d = 1; d <= Number(lastdays); d++) {
            w.push(d);
            if (w.length === 7) { weeks.push(w); w = []; }
        }
        if (w.length > 0) weeks.push(w);

        const fieldQry = `
            a.uid, a.issue_date, a.order_date
			,d.air_code , d.in_date
			,a.adult_member, a.child_member, a.infant_member
			,a.air_amount, a.child_amount, a.infant_amount
			,a.adult_tax, a.child_tax, a.infant_tax
			,a.total_amount, a.in_status
        `;

        const joinQry = `
            left outer join interline_routing (nolock) as d on a.uid = d.uid_minor and d.minor_num = '1' 
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
        
        // aData 초기화
        const aData = {
            TOT: 0,
            DAY: {}
        };
        const aAirCode = {};
        
        let   tot = 0;
        for (const row of result.recordset) {
            const total_amount = Number(row.total_amount || row.total_sales || 0);
            aData.TOT += total_amount;
            
            const adult_member = Number(row.adult_member || 0);
            const child_member = Number(row.child_member || 0);
            const infant_member = Number(row.infant_member || 0);
            const member = adult_member + child_member + infant_member;
            
            const air_amount = Number(row.air_amount || 0);
            const child_amount = Number(row.child_amount || 0);
            const infant_amount = Number(row.infant_amount || 0);
            const air_amt = (air_amount * adult_member) + (child_amount * child_member) + (infant_amount * infant_member);
            
            const adult_tax = Number(row.adult_tax || 0);
            const child_tax = Number(row.child_tax || 0);
            const infant_tax = Number(row.infant_tax || 0);
            const tax = (adult_tax * adult_member) + (child_tax * child_member) + (infant_tax * infant_member);
        
            let key = '';
            if (GU1 === "ISSUE") {
                key = String(row.issue_date || '');
            } else if (GU1 === "ORDER") {
                key = String(row.order_date || '');
            } else if (GU1 === "DEP") {
                key = String(row.in_date || '');
            }
        
            const gubun = key.length >= 8 ? key.substring(6, 8) : '';
        
            const air_code = String(row.air_code || '');
            const air = air_code.substring(0, 2);
            aAirCode[air] = 1;

            if (!aData) aData = { TOTAL: 0, AIRAMT: 0, TAXAMT: 0, MEMBER: 0, ORDERS: 0 };
            aData["TOTAL"] += total_amount;
            aData["AIRAMT"] += air_amt;
            aData["TAXAMT"] += tax;
            aData["MEMBER"] += member;
            aData["ORDERS"] ++;
            
            if (!aData[gubun]) aData[gubun] = { TOTAL: 0, AIRAMT: 0, TAXAMT: 0, MEMBER: 0, ORDERS: 0 };
            aData[gubun]["TOTAL"] += total_amount;
            aData[gubun]["AIRAMT"] += air_amt;
            aData[gubun]["TAXAMT"] += tax;
            aData[gubun]["MEMBER"] += member;
            aData[gubun]["ORDERS"] ++;
            
            if (!aData[gubun][air]) aData[gubun][air] = { TOTAL: 0, AIRAMT: 0, TAXAMT: 0, MEMBER: 0, ORDERS: 0 };
            aData[gubun][air]["TOTAL"] += total_amount;
            aData[gubun][air]["AIRAMT"] += air_amt;
            aData[gubun][air]["TAXAMT"] += tax;
            aData[gubun][air]["MEMBER"] += member;
            aData[gubun][air]["ORDERS"] ++;

            tot++;
        }
        //console.log(aData)
        for (let ix = 0 ; ix < weeks.length ; ix ++) {
            list1 += `<tr>`;
            for (let ii = 0 ; ii < 7 ; ii ++) {
                wCls = dayClass[ii] || '';
                const day = String(weeks[ix][ii]).padStart(2,0);
                curData = year+String(month).padStart(2,0)+String(weeks[ix][ii]).padStart(2,0)
                sub = '';
                if (aData[day]) {
                    for (const air of Object.keys(aAirCode)) {
                        const mem = aData[day][air]?.MEMBER || 0;
                        const amt = aData[day][air]?.TOTAL || 0;
                        if (mem > 0 && amt > 0) {
                            sub += `
                                <tr>    
                                    <td class=' al  '>${air} (${mem})</td>
                                    <td class=' ar '>${deps.numberFormat(amt)}</td>
                                </tr>
                            `;
                        }
                    }
                    const mem = aData[day]?.MEMBER || 0;
                    const amt = aData[day]?.TOTAL || 0;
                    if (sub !== '') {
                        sub += `
                            <tr>    
                                <td class=' al  '><b>TOT (${mem})</b></td>
                                <td class=' ar '><b>${deps.numberFormat(amt)}</b></td>
                            </tr>
                        `;
                    }
                }
            
                list1 += `
                    <div class="day">
                        <table class='search-table2'>
                        <tbody class=''>
                            <tr>
                                <td class='al'>${weeks[ix][ii] || ''}</td>
                            </tr>
                           
                            ${sub}
                        </tbody>
                        </table>
                    </div>
                `;
            }
            list1 += `</tr>`;
        }

        const listHTML = `
            
            <div class="calendar-week">
                <div class="sun">일</div>
                <div>월</div>
                <div>화</div>
                <div>수</div>
                <div>목</div>
                <div>금</div>
                <div class="sat">토</div>
            </div>
            <div class="calendar-grid"  id="calendarGrid">
                 ${list1}
            </div>
        `;
        /*
        cData = `<select name="cYear"  class="d-inline form-control form-control-sm">`;
        for (let cnt = 2020 ; cnt < YY+1 ; cnt ++ ) {
            const s = cnt == cYear ? 'selected' : '';
            cData += `<option value='${cnt}' ${s}> ${cnt} 년`;
        }
        cData += '</select>';

        mData = `<select name="cMonth"  class="d-inline form-control form-control-sm">`;
        for (let cnt = 1 ; cnt < 13 ; cnt ++ ) {
            const s = cnt == cMonth ? 'selected' : '';
            mData += `<option value='${cnt}' ${s}> ${cnt} 월`;
        }
        mData += '</select>';
        */

        res.json({success : 'ok', listData: listHTML , totalCount: tot });
    } catch (err) {
        console.error('에러:'+err.stack);
        res.status(500).send('Database error');
    }
	
};



