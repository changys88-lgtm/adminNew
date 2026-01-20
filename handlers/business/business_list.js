const deps = require('../../src/common/dependencies');
const { getPagination } = require('../../src/utils/paging'); 
const { arrBankCode } = require('../../src/utils/airConst'); 

module.exports = async (req, res) => {
    const cYear       = req.body.cYear || '';
    const cMonth      = req.body.cMonth || '';
    const cMode       = req.body.cMode || '';
    const GU4         = req.body.GU4 || '';
    let   page        = req.body.page || '1';
    const cancel      = req.body.cancel || '1';
    const listCount   = req.body.listCount || 1;
    const sWord       = (req.body.sWord || '').trim();
    const sFrom       = req.body.sFrom || '';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const aes128Encrypt   = deps.aes128Encrypt;
    const aes128Decrypt   = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;
    const pool            = await deps.getPool();
    const NOWSTIME        = deps.getNow().NOWSTIME;
    let   addQry          = ` 1=1  `;
    let   year            = '';
    let   month           = '';
    let   sqlText         = '';
    let   sqlResult       = '';
    let   listHTML        = '';
    let   sub             = '';
    let   sub2            = '';
    let   list1           = '';
    let   list2           = '';
    let   curData         = '';
    let   Anniversary     = '';
    let   wCls            = '';
    let   siteQry         = '';
        
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
        
        const searchDate = `${year}${String(month).padStart(2, '0')}`;
        if (b2bMASTER === "Y") siteQry = `and auth = 'Y' `;
        else siteQry = `and operator like '${b2bSiteCode}%' and auth='${b2bMASTER}' `;
        sqlText = `
            SELECT * FROM businessCenter WITH (NOLOCK)
            WHERE
            ( 
                ISNULL(cycle,'') = '' AND start_date LIKE '${searchDate}%' )
                OR 
                ( cycle = 'Y' AND cycle_month = ${month} )
                OR
                ( cycle IN ('M','W') 
            )
            ${siteQry}
            order by place , start_date , uid asc
        `;
        sqlResult = await pool.request().query(sqlText);
        const aData = {};
        for (const row of sqlResult.recordset) {
            let {cycle , start_date , end_date , cycleType, cycle_day , cycle_week} = row;
            cycle      = cycle.trim();
            start_date = start_date.trim();
            end_date   = end_date.trim();
            cycleType  = cycleType.trim();
            if (cycle === "") {
                if (start_date === end_date) deps.arrPush(aData , start_date , row);
                else {
                    const st1 = deps.makeTime(start_date,'unix');
                    const st2 = deps.makeTime(end_date,'unix');
                    for (let ix = st1 ; ix <= st2 ; ix = ix + 86400) {
                        const ymd = deps.timeFromUnix(ix).slice(0,8);
                        deps.arrPush(aData , ymd , row);
                    }
                }
            } else if (cycle === "M") {
                if (cycleType == "M") start_date = String(`${searchDate}${String(cycle_day).padStart(2,0)}`);
                else {
                    //date = date("Ymd", strtotime("{$fYear}-{$fMonth}-01 $cycle_week_order $weekArrayLongEng[$cycle_week]"));
                }
                deps.arrPush(aData , start_date , row);
            } else if (cycle === "W") {
                for (let ix = 1 ; ix < 7 ; ix ++) {
                    start_date = (deps.WeekdayOfMonth(year, month , cycle_week, ix) || '').slice(0,8);
                    if (start_date) deps.arrPush(aData , start_date , row);
                }
            }
        }
        let link = '';
        const dayClass = { 0: 'cored', 6: 'coblue' };
        for (let ix = 0 ; ix < weeks.length ; ix ++) {
            for (let ii = 0 ; ii < 7 ; ii ++) {
                wCls = dayClass[ii] || '';
                curData = year+String(month).padStart(2,0)+String(weeks[ix][ii]).padStart(2,0)
                let sub = '', sub2 = '' , sub3 = '' , sub4 = '';
                let cls = '' , cls2 = '' , cls3 = '' , title = '';
                if (!Array.isArray(aData[curData])) aData[curData] = [];
                let Anniversary = '';
                for (const row of aData[curData]) {
                    let {start_time , end_time , uid , order_num , haif , app_nam , memo}  = row;
                    let place  = (row.place || '').trim();
                    let subject = (row.subject || '').trim();
                    if (place === "ALL") {
                        place = `<i class="fas fa-check"></i>`; 
                        title = "하루종일";
                        cls3  = "blue";
                        cls   = 'cowhite';
                    } else if (place === "OUT") {
                        place = "♧"; 
                        title = "외부";
                        cls3  = "orange";
                        cls   = "brown";
                        subject += ` ${deps.cutTime(start_time)} - ${deps.cutTime(end_time)}`;
                    } else if (place === "IN") {
                        place = "♣"; 
                        title = "회의실";
                        cls   = "brown";
                        subject += ` ${deps.cutTime(start_time)} - ${deps.cutTime(end_time)}`;
                    } else if (place === "MIL") {
                        place   = `<i class="fas fa-utensils"></i>`; 
                        title   = "점심";
                        cls     = "";
                        cls3    = 'blue';
                    } else if (place === "ANN") {
                        place   = ""; 
                        title   = "";
                        cls     = "";
                        cls3    = 'red';
                        Anniversary = subject;
                        subject = "";
                    } else if (place === "BIN") {
                        cls2  = "bsppink";
                    } else if (place === "BOU") {
                        cls2  = "deposit";
                    } else if (place == "Money") { 
                        place = "<i class='fas fa-won-sign' style='font-size:0.9em;'></i> 입금 "; 
                        title = "입금관련";
                        cls   = "red";
                        start_time = "1700";
                        
                    } else if (place == "Vacation") {
                        haif	   = haif.trim();
                        start_time = "0900";
                        title      = "휴가";
            
                        if(haif === "AM"){
                            end_time   = "1400";
                            title      = "오전 반차";
                        }else if(haif === "PM"){
                            start_time = "1400";
                            end_time   = "1800";
                            title      = "오후 반차";
                        }
            
                        place     = `<i class='fas fa-umbrella-beach' style='font-size:0.9em;' ></i> ${app_name} `; 
                        subject += ` ${deps.cutTime(start_time)} - ${deps.cutTime(end_time)}`;
                    } else if (place == "SendMoney") {
                        place      = "<i class='fas fa-won-sign' style='font-size:0.9em;'></i> 송금"; 
                        title      = "송금관련";
                        start_time = "1700";
                        subject    = `${site_name} - ${total_price}` ;
                    } else {
                        cls3 = 'red';
                    }
                    if (uid) link = ` onClick="return newBusiness('','${uid}')" `;
                    if(place !== "BIN" && place !== "BOU") {
                        sub += `<tr><td class='ar tableNone ${cls3}'  colspan='2' title='${title}'><a href='javascript://' ${link}  class='${cls}'>${place} ${subject} </a></td></tr>`;
                        if (subject) sub3 += `<div class='event ${cls3}'  title='[${title}] ${memo}' ${link}  class='${cls}'>${place} ${subject} </div>`;
                    } else {
                        sub2 +=  ` <span class='${cls2} ${cls}' onClick="return newBusiness('','${uid}')">${subject}</span> `;
                    }
                }
                const s = !weeks[ix][ii] ? 'other-month' : '';
                list2 += `
                    <div class="day ${s}">
                        <span class="date" ondblClick="return newBusiness('${curData}','')">${weeks[ix][ii] || ''} ${Anniversary || ''}</span>
                        ${sub3}
                    </div>
                `;
            }
        }

        listHTML = `
            <div class="calendar-header">

                <div class="cal-left">
                    ※ 스케쥴관리
                </div>

                <div class="cal-center">
                    <button class="cal-btn prev" onClick="return businessChange('Pre')">‹</button>
                    <h2 class="cal-title" onClick="return businessChange('')">${year}년 ${month}월</h2>
                    <button class="cal-btn next" onClick="return businessChange('Next')">›</button>
                </div>

                <div class="cal-right">
                    <button type="button" class="cal-add" onClick="return newBusiness('','')">등록</button>
                </div>

            </div>    
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
                 ${list2}
            </div>
                   
    `;
        res.json({ success:'ok', listData: listHTML , cYear : year , cMonth : month  });
    } catch (err) {
        console.error('에러:'+err);
        //res.status(500).send('Database error');
        res.json ({success:'no', msg: err});
    }
	
};

