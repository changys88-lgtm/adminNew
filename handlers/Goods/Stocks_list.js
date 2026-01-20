const deps = require('../../src/common/dependencies');
const { getPagination } = require('../../src/utils/paging'); 
const { arrGoodsGubun , arrProductStatus } = require('../../src/utils/airConst'); 

module.exports = async (req, res) => {
    const data          = req.body;
    const GU1           = req.body.GU1 || '';
    const GU2           = req.body.GU2 || '';
    const GU3           = req.body.GU3 || '';
    const GU4           = req.body.GU4 || '';
    const ca1           = req.body.ca1 || '';
    const ca2           = req.body.ca2 || '';
    const ca3           = req.body.ca3 || '';
    const ca4           = req.body.ca4 || '';
    let   page          = req.body.page || '1';
    let   uid           = req.body.uid  || '';
    let   tourNumber    = req.body.tourNumber  || '';
    const cancel        = req.body.cancel || '1';
    const listCount     = req.body.listCount || 1;
    const sWord         = (req.body.sWord || '').trim();
    const sFrom         = req.body.sFrom || '';
    const sWord2        = (req.body.sWord2 || '').trim();
    const sFrom2        = req.body.sFrom2 || '';
    const start_date    = req.body.start_date || '';
    const end_date      = req.body.end_date || '';
    const AviaLoginId   = req.cookies?.AviaLoginId || '';
    const b2bMASTER     = req.cookies?.b2bMASTER || '';
    const b2bSiteCode   = req.cookies?.b2bSiteCode || '';
    const aes128Encrypt = deps.aes128Encrypt;
    const aes128Decrypt = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;
    const pool        = await deps.getPool();
    const sql         = deps.sql;
    const selTourNumber = req.body.selTourNumber || '';
    const selMinor    = req.body.selMinor || '';
    const cYear       = req.body.cYear || '';
    const cMonth      = req.body.cMonth || '';
    const cMode       = req.body.cMode || '';
    const NOWSTIME    = deps.getNow().NOWSTIME;
    let   year        = '';
    let   month       = '';
    let   sqlText     = '';
    let   sqlResult   = '';
    let   add         = '';
    let   memData     = '';
    let   GU2DATA     = '';
    let   GU3DATA     = '';
    let   selTourNumberDATA     = '';
    let   selMinorDATA     = '';
    
    let   addQry        = ` 1=1 and (delCheck is Null or delCheck = '') `;

    if (GU1)            addQry += ` and detailGubun = '${GU1}' `;
    if (GU2 )           addQry += ` and tourGubun = '${GU2}' `;
    if (GU3 )           addQry += ` and detailGubun like '%${GU3}%' `;
    if (sWord )         addQry += ` and ${sFrom} like '%${sWord}%' `;
    if (sWord2 )        addQry += ` and ${sFrom2} like '%${sWord2}%' `;
    if (ca1    )        addQry += ` and (select count(*) from Products_city where tourNumber = a.tourNumber and category1 = '${ca1}' ) > 0 `;
    if (ca2    )        addQry += ` and (select count(*) from Products_city where tourNumber = a.tourNumber and category2 = '${ca2}' ) > 0 `;
    if (ca3    )        addQry += ` and (select count(*) from Products_city where tourNumber = a.tourNumber and category3 = '${ca3}' ) > 0 `;
    if (ca4    )        addQry += ` and (select count(*) from Products_city where tourNumber = a.tourNumber and category4 = '${ca4}' ) > 0 `;

    const joinQry = ` 
            left outer join tblManager as b (nolock) on a.operator = b.member_code
            left outer join site as c (nolock) on a.site_code = c.site_code 
            left outer join site_manager as d (nolock) on a.site_code = d.site_code and a.operator = d.man_id 
            left outer join Products_city as city on a.tourNumber = city.tourNumber and city.minor_num = 1
        `;
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

        const totQuery = `
                select count(*) as total from  Products as a (nolock)  
                ${joinQry}
                where
                ${addQry}
            `;
        const result2 = await pool.request().query(totQuery);
        const totalRowCount = result2.recordset[0].total;
        if (totalRowCount < listCount) page = 1;
        const { startRow, endRow, pageHTML } = getPagination({
            tot_row: totalRowCount,
            page: page ,
            listCount: listCount
        });
        
        const fieldQry = `
            , b.username , c.site_name, c.TempUse, c.TempDomain
            , (select catename from nationManager where cate1 = city.category1 and cate2 = city.category2 and cate3 = city.category3 and cate4 = '00' ) as cate_name 
            , (select count(*) from Products_option where tourNumber = a.tourNumber and exposure_check = 'Y') as optionCnt
        `;
        
        let aData = {};
        let list  = '';
        let sub   = '';
        let sub3  = '';
        let day   = '';
        let stock_key = '';
        if (selTourNumber && selMinor) {
            sqlText = ` select a.* from Products_option_stock as a  where tourNumber = '${selTourNumber}' 
                    and minor_num = (select stock_key from Products_option where tourNumber = '${selTourNumber}' and minor_num = '${selMinor}') `;
            sqlResult = await pool.request().query(sqlText);
            for (let row of sqlResult.recordset) {
                let { sale_date, sale_check, stocks, sale_confirm } = row;
                if (!aData[sale_date]) aData[sale_date] = {};
                aData[sale_date]["StockYN"] = sale_check;
                aData[sale_date]["Stock"]   = stocks;
                aData[sale_date]["Confirm"] = sale_confirm; 
            }
        } 

        const dayClass = { 0: 'cored', 6: 'coblue' };
        for (let ix = 0 ; ix < weeks.length ; ix ++) {
            for (let ii = 0 ; ii < 7 ; ii ++) {
                
                const s = !weeks[ix][ii] ? 'other-month' : '';

                const curData = year+String(month).padStart(2,0)+String(weeks[ix][ii]).padStart(2,0);
                sub3 = '';
                if (aData[curData]) {
                    let { StockYN, Stock, Confirm } = aData[curData];
                    let Sales = '';
                    sub = `
                        재고   : ${Stock} / 판매   : ${Sales}
                    `;
                    if(aData[curData]["StockYN"] == "Y") sub3 = `<span class='btn_slim btn_red nowrap' onClick="return stockEnd('${selTourNumber}','${stock_key}','${curData}','N')" style='padding:2px;'>마감해제</span>`;
                    else sub3 = `<span   class='btn_slim btn_gray nowrap' onClick="return stockEnd('${selTourNumber}','${stock_key}','${curData}','Y')" style='padding:2px;'>재고마감</span>`;

                    if(aData[curData]["Confirm"] == "Y") sub3 += `<span class='btn_slim btn_blue nowrap' onClick="return confirmEnd('${selTourNumber}','${stock_key}','${curData}','N')" style='margin-left:10px;'>출발확정</span>`;
                    else sub3 += `<span class='btn_slim btn_gray nowrap' onClick="return confirmEnd('${selTourNumber}','${stock_key}','${curData}','Y')" style='margin-left:10px;'>출발대기</span>`;
                }
                day = weeks[ix][ii] || '';
                if (!day) {
                    list += `<div class="day ${s}" >${day}</div>`;
                } else {
                    list += `
                        <div class="day ${s}" ID='Table_${curData}'>
                            <table border=0 width='100%'  class='search-table' onClick="return dataChange('${selTourNumber}','${selMinor}','${curData}','1')" >
                                <tr>
                                    <td class='al'>${day}</td>
                                    <td class='ar'><label>선택 <input type='checkbox' name='Chk_$curData' id='Chk_${curData}' value='Y' ></label></td>
                                </tr> 
                                <tr>
                                    <td class=' ar' colspan='2'>
                                        ${sub}
                                    </td>
                                </tr> 
                                <tr>
                                    <td class=' ' colspan='2'>
                                        ${sub3}
                                    </td>
                                </tr> 
                            </table>
                        </div>
                    `;
                }
            }
        }
        const listHTML = `
            <div class="calendar-header">

                <div class="cal-left">
                    
                </div>

                <div class="cal-center">
                    <button class="cal-btn prev" onClick="return calChange('Pre')">‹</button>
                    <h2 class="cal-title" onClick="return calChange('')">${year}년 ${month}월</h2>
                    <button class="cal-btn next" onClick="return calChange('Next')">›</button>
                </div>

                <div class="cal-right">
                    
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
                 ${list}
            </div>
        `;
        for (const [code,name] of Object.entries(arrGoodsGubun)) {
            s = (GU2 === code) ? 'selected' : '';
            GU2DATA += `<option value='${code}' ${s}>${name}</option>`;
        }
        GU2DATA = `<select name='GU2' class='search_action_select'>
            <option value=''>구분</option>
            ${GU2DATA}
        </select>`;
        GU3DATA = `<select name='GU3' class='search_action_select'>
            <option value=''>전체</option>
            ${GU3DATA}
        </select>`;

        addQry =  ` and 1=1 and (delCheck is Null or delCheck = '') `;
        if (GU2 )    addQry += " and tourGubun   = '$GU2' ";
        if (GU3 )    addQry += " and detailGubun = '$GU3' ";
        if (sWord )  addQry += " and a.tourName like '%$sWord%' ";
        const siteQry = b2bSiteCode ? ` and site_code = '${b2bSiteCode}' ` : '';
        sqlText = ` select tourNumber , tourName , tourGubun  from Products as a  where  a.tournumber != '' ${addQry} ${siteQry}  order by tourNumber desc `;
        sqlResult = await pool.request().query(sqlText);
        for (let row of sqlResult.recordset) {
            let { tourNumber, tourName, tourGubun } = row;
            s = (selTourNumber == tourNumber) ? 'selected' : '';
            selTourNumberDATA += `<option value='${tourNumber}' ${s}> ${tourName}(${tourNumber})</option>`;
        }
        
        if (selTourNumber) {
            sqlText = ` select minor_num , roomType from Products_option  where tourNumber = ${selTourNumber} order by minor_num `;
            sqlResult = await pool.request().query(sqlText);
            for (let row of sqlResult.recordset) {
                let { minor_num, roomType } = row;
                s = (selMinor == minor_num) ? 'selected' : '';
                selMinorDATA += `<option value='${minor_num}' ${s}> (${minor_num}) ${roomType} </option>`;
            }
        }
        selTourNumberDATA = `<select name='selTourNumber' class='search_action_select wh400'>
            <option value=''>전체</option>
            ${selTourNumberDATA}
        </select>`;
        selMinorDATA = `<select name='selMinor' class='search_action_select'>
            <option value=''>전체</option>
            ${selMinorDATA}
        </select>`;
        res.json({ success:'ok', listData: listHTML , GU2: GU2DATA , GU3: GU3DATA , selTourNumber: selTourNumberDATA , selMinor: selMinorDATA ,year: year , month: month , weeks: weeks  });
    } catch (err) {
        console.error('에러:'+err.stack);
        res.json ({success:'no', msg: err});
    }
	
};

