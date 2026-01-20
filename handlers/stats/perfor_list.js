const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { accumulateDayRow , buildDayHTML} = require('../../src/utils/stats'); 


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
    let   GU6         = req.body.GU6    || '';
    let   GU7         = req.body.GU7    || '';
    const gMode       = req.body.gMode  || '';
    const page        = req.body.page    || '1';
    const listCount   = req.body.listCount;
    const sWord       = req.body.sWord || '';
    const sFrom       = req.body.sFrom || 'Air';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const mainTable   = 'AirTickets';
    const pool        = await deps.getPool();
    let   YY          = deps.getNow().YY;
    let   MM          = deps.getNow().MM;
    let   cYear       = data.cYear  || YY;
    let   cMonth      = data.cMonth || MM;
    
    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }

    if (b2bSiteCode !== "")	    addQry += ` and a.site_code = '${b2bSiteCode}' `;

    if (start_date != "") {
        if (GU5 == "start_day") addQry += ` and substring(b.start_day,1,8) >= '${deps.StrClear(start_date)}' `; 
        else if (GU5 == "return_day") addQry += ` and substring(b.start_day,9,8) >= '${deps.StrClear(start_date)}' `; 
        else addQry += ` and a.downdate >= '${deps.StrClear(start_date)}' `; 
    }
    if (end_date != "") {
        if (GU5 == "start_day") addQry += ` and substring(b.start_day,1,8) <= '${deps.StrClear(end_date)}' `; 
        else if (GU5 == "return_day") addQry += ` and substring(b.start_day,9,8) <= '${deps.StrClear(end_date)}' `; 
        else addQry += ` and a.downdate <= '${deps.StrClear(end_date)}' `; 
    }

    try {
        // 항공사별 클래스(F/C) 정보 로드
        let airData = {};
        const airSql = `select code_2 , sFirst , sBusiness from airline_code`;
        const airResult = await pool.request().query(airSql);
        for (const put of airResult.recordset) {
            const code2 = String(put.code_2 || '').trim();
            const sFirst = String(put.sFirst || '').trim();
            const sBusiness = String(put.sBusiness || '').trim();
            airData[code2] = { F: sFirst, C: sBusiness };
        }

        const fieldQry = `
            a.*  ,b.* , c.site_name
            , (select code_2 from airLine_code where code_3 = a.air_line_code) as mainAir
        `;

        let sqlText = ` select ${fieldQry} from ${mainTable} as a `;
        sqlText += ` left outer join AirTickets_minor as b on a.air_line_code = b.air_line_code and a.ticket_number = b.ticket_number and a.ticket_type in ('S','N','I','E','V') `;
        sqlText += ` left outer join site as c on a.site_code = c.site_code `;
        sqlText += ` left outer join airLine_code as al on a.air_line_code = al.code_3 `;
        if (GU7 != "") sqlText += ` left outer join interline_pax as pax on substring(pax.ticket_number,4,10) = a.ticket_number left outer join interline as inter on inter.uid = pax.uid_minor `;
        sqlText += ` where  ${addQry} and a.ticket_type in ('S','N','I','E','V') `;
        if (GU6 != "") sqlText += ` and (select bspSiteCode from interline_minor where uid_minor = (select top 1 uid_minor from interline_pax where ticket_number = a.air_line_code + a.ticket_number ) ) = '${GU6}' `; 
        if (GU7 != "") sqlText += ` and inter.ticket_type = '${GU7}' `;
        

        //console.log(sqlText)
        const result = await pool.request().query(sqlText);
        let   rows = ``;
        let   tot = 0;
        let  cData = '', mData = '';
        let  aData = { AIR: {}, COUNTER: {}, FLIGHT: {}, SITE: {} };
        let  aSite = {};
        let  totalSeg = 0;
        
        for (const row of result.recordset) {
            let airClass  = String(row.class || '').substring(0, 1);
            let air       = String(row.air || '').substring(0, 2);
            const mainAir = String(row.mainAir || '');
            if (mainAir !== "") air = mainAir; 
            const ticket_type = String(row.ticket_type || '');
            if (ticket_type !== "V") {
                let total_F = 0;
                let total_C = 0;
                let total_Y = 0;
                
                const inter_normal = Number(row.inter_normal || 0);
                const dome_normal  = Number(row.dome_normal || 0);
                const away_normal  = Number(row.away_normal || 0);
                const inter_sales  = Number(row.inter_sales || 0);
                const dome_sales   = Number(row.dome_sales || 0);
                const away_sales   = Number(row.away_sales || 0);
                const inter_input  = Number(row.inter_input || 0);
                const dome_input   = Number(row.dome_input || 0);
                const away_input   = Number(row.away_input || 0);
                const inter_net    = Number(row.inter_net || 0);
                const dome_net     = Number(row.dome_net || 0);
                const away_net     = Number(row.away_net || 0);
                
                const total_normal = inter_normal + dome_normal + away_normal;
                const total_sales  = inter_sales + dome_sales + away_sales;
                const total_input  = inter_input + dome_input + away_input;
                const total_net    = inter_net + dome_net + away_net;
        
                let tax_amount = 0;
                for (let tCount = 1; tCount < 6; tCount++) {
                    const code  = String(row[`tax_code${tCount}`] || '');
                    const amt   = Number(row[`tax_amount${tCount}`] || 0);
                    if (code !== "VT") tax_amount += amt;
                }
                
                // 왕복 세그 계산
                const segCount = Math.floor(row.air.length / 2);
        
                const air_type = String(row.air_type || '');
                const air_code = air+air_type.substring(0, 4);
        
                // airData 초기화 확인
                if (airData[air]) {
                    if (airData[air]["F"] && airData[air]["F"].indexOf(airClass) !== -1) {
                        total_F = total_normal;
                    } else if (airData[air]["C"] && airData[air]["C"].indexOf(airClass) !== -1) {
                        total_C = total_normal;
                    } else {
                        total_Y = total_normal;
                    }
                } else {
                    total_Y = total_normal;
                }
        
                let crs_gubun = String(row.crs_gubun || '').trim();
                if (!/G|A|S/i.test(crs_gubun)) crs_gubun = "T";
                totalSeg += segCount;
        
                // 초기화 함수
                const initDataObj = (obj, key) => {
                    if (!obj[key]) {
                        obj[key] = { SUM: 0, TOTAL_F: 0, TOTAL_C: 0, TOTAL_Y: 0, TOTAL: 0, INPUT: 0, TAX: 0, VOID: 0 };
                    }
                    return obj[key];
                };
        
                // AIR 데이터
                const airDataObj = initDataObj(aData.AIR, air);
                airDataObj.SUM++;
                airDataObj.TOTAL_F += total_F;
                airDataObj.TOTAL_C += total_C;
                airDataObj.TOTAL_Y += total_Y;
                airDataObj.TOTAL += total_normal;
                airDataObj.INPUT += total_input;
                airDataObj.TAX += tax_amount;
                if (!airDataObj[crs_gubun]) airDataObj[crs_gubun] = 0;
                airDataObj[crs_gubun] += segCount;
        
                const issue_manager = String(row.issue_manager || '') || "Auto";
                const site_code = String(row.site_code || '');
                const site_name = String(row.site_name || '');
                aSite[site_code] = site_name;
        
                // COUNTER 데이터
                const counterDataObj = initDataObj(aData.COUNTER, issue_manager);
                counterDataObj.SUM++;
                counterDataObj.TOTAL_F += total_F;
                counterDataObj.TOTAL_C += total_C;
                counterDataObj.TOTAL_Y += total_Y;
                counterDataObj.TOTAL += total_normal;
                counterDataObj.INPUT += total_input;
                counterDataObj.TAX += tax_amount;
                if (!counterDataObj[crs_gubun]) counterDataObj[crs_gubun] = 0;
                counterDataObj[crs_gubun] += segCount;
        
                // FLIGHT 데이터
                const flightDataObj = initDataObj(aData.FLIGHT, air_code);
                flightDataObj.SUM++;
                flightDataObj.TOTAL_F += total_F;
                flightDataObj.TOTAL_C += total_C;
                flightDataObj.TOTAL_Y += total_Y;
                flightDataObj.TOTAL += total_normal;
                flightDataObj.INPUT += total_input;
                flightDataObj.TAX += tax_amount;
                if (!flightDataObj[crs_gubun]) flightDataObj[crs_gubun] = 0;
                flightDataObj[crs_gubun] += segCount;
        
                const city_code = String(row.city_code || row.citycode || '');
                flightDataObj.ROUTING = city_code;
        
                // SITE 데이터
                const siteDataObj = initDataObj(aData.SITE, site_code);
                siteDataObj.SUM++;
                siteDataObj.TOTAL_F += total_F;
                siteDataObj.TOTAL_C += total_C;
                siteDataObj.TOTAL_Y += total_Y;
                siteDataObj.TOTAL += total_normal;
                siteDataObj.INPUT += total_input;
                siteDataObj.TAX += tax_amount;
                if (!siteDataObj[crs_gubun]) siteDataObj[crs_gubun] = 0;
                siteDataObj[crs_gubun] += segCount;
        
            } else {
                // VOID 처리
                if (!aData.AIR[air]) aData.AIR[air] = { SUM: 0, TOTAL_F: 0, TOTAL_C: 0, TOTAL_Y: 0, TOTAL: 0, INPUT: 0, TAX: 0, VOID: 0 };
                if (!aData.AIR[air].VOID) aData.AIR[air].VOID = 0;
                aData.AIR[air].VOID++;
                
                const issue_manager = String(row.issue_manager || '') || "Auto";
                if (!aData.COUNTER[issue_manager]) aData.COUNTER[issue_manager] = { SUM: 0, TOTAL_F: 0, TOTAL_C: 0, TOTAL_Y: 0, TOTAL: 0, INPUT: 0, TAX: 0, VOID: 0 };
                if (!aData.COUNTER[issue_manager].VOID) aData.COUNTER[issue_manager].VOID = 0;
                aData.COUNTER[issue_manager].VOID++;
                
                const air_type = String(row.air_type || '');
                const air_code = air+air_type.substring(0, 4);
                if (!aData.FLIGHT[air_code]) aData.FLIGHT[air_code] = { SUM: 0, TOTAL_F: 0, TOTAL_C: 0, TOTAL_Y: 0, TOTAL: 0, INPUT: 0, TAX: 0, VOID: 0 };
                if (!aData.FLIGHT[air_code].VOID) aData.FLIGHT[air_code].VOID = 0;
                aData.FLIGHT[air_code].VOID++;
                
                const site_code = String(row.site_code || '');
                if (!aData.SITE[site_code]) aData.SITE[site_code] = { SUM: 0, TOTAL_F: 0, TOTAL_C: 0, TOTAL_Y: 0, TOTAL: 0, INPUT: 0, TAX: 0, VOID: 0 };
                if (!aData.SITE[site_code].VOID) aData.SITE[site_code].VOID = 0;
                aData.SITE[site_code].VOID++;
            }



            tot ++;
        };

        let aSum = {};
        if (sFrom === "Air")		  aSum = aData["AIR"];
        else if (sFrom === "Flight")  aSum = aData["FLIGHT"];
        else if (sFrom === "Counter") aSum = aData["COUNTER"];
        else if (sFrom === "Site")    aSum = aData["SITE"];

        // 합계용 누적 변수 및 정렬용 버퍼
        let SUM = 0, TOTAL_F = 0, TOTAL_C = 0, TOTAL_Y = 0, TOTAL = 0, INPUT = 0, TAX = 0;
        const sumData = {};  // key: TOTAL 금액, value: tr HTML 배열
        let ix = 1;
        let font = '';

        for (const [rawKey, val] of Object.entries(aSum)) {
            let key = rawKey;
            let city = '';

            if (sFrom === "Flight") {
                const routing = String(val["ROUTING"] || '');
                if (routing.length >= 6) {
                    city = routing.substring(0,3) + "-" + routing.substring(3,6);
                }
            } else if (sFrom === "Site") {
                key += ` (${aSite[key] || ''})`;
            }

            const rowSum     = Number(val["SUM"]      || 0);
            const rowTF      = Number(val["TOTAL_F"]  || 0);
            const rowTC      = Number(val["TOTAL_C"]  || 0);
            const rowTY      = Number(val["TOTAL_Y"]  || 0);
            const rowTotal   = Number(val["TOTAL"]    || 0);
            const rowInput   = Number(val["INPUT"]    || 0);
            const rowTax     = Number(val["TAX"]      || 0);
            const rowG       = Number(val["G"]        || 0);
            const rowA       = Number(val["A"]        || 0);
            const rowS       = Number(val["S"]        || 0);
            const rowT       = Number(val["T"]        || 0);
            const rowVoid    = Number(val["VOID"]     || 0);

            const rowHtml = `
                <tr HEIGHT=29 onmouseover="this.style.backgroundColor='#f7f7f7'" onmouseout="this.style.backgroundColor='#ffffff'">
                    <td >${font}[NUM]</td>
                    <td >${font}${key} ${city}</td>
                    <td >${font}${deps.numberFormat(rowSum)}</td>
                    <td >${font}${deps.numberFormat(rowTF)}</td>
                    <td >${font}${deps.numberFormat(rowTC)}</td>
                    <td >${font}${deps.numberFormat(rowTY)}</td>
                    <td >${font}${deps.numberFormat(rowTotal)}</td>
                    <td >${font}${deps.numberFormat(rowInput)}</td>
                    <td >${font}${deps.numberFormat(rowTax)}</td>
                    <td >${font}${deps.numberFormat(rowG)}</td>
                    <td >${font}${deps.numberFormat(rowA)}</td>
                    <td >${font}${deps.numberFormat(rowS)}</td>
                    <td >${font}${deps.numberFormat(rowT)}</td>
                    <td >${font}${deps.numberFormat(rowVoid)}</td>
                </tr>
            `;

            const totalKey = rowTotal;
            if (!sumData[totalKey]) sumData[totalKey] = [];
            sumData[totalKey][ix] = rowHtml;

            SUM     += rowSum;
            TOTAL_F += rowTF;
            TOTAL_C += rowTC;
            TOTAL_Y += rowTY;
            TOTAL   += rowTotal;
            INPUT   += rowInput;
            TAX     += rowTax;
            ix ++;
        }

        // 정렬된 HTML로 변환 (총액 기준 내림차순)
        let listHTML = ``;
        const sortedTotals = Object.keys(sumData)
            .map(k => Number(k))
            .sort((a, b) => b - a);

        let rowNum = 1;
        for (const tKey of sortedTotals) {
            const rowsArr = sumData[tKey] || [];
            for (const html of rowsArr) {
                if (!html) continue;
                listHTML += html.replace('[NUM]', rowNum);
                rowNum++;
            }
        }

        if (!listHTML) {
            listHTML = `<tr><td colspan='20' class='ac hh50'>검색된 데이터가 없습니다.</td></tr>`;
        }

        listHTML = `
            <table class='table table-light text-center mt-3' border=1 bordercolor='#ddd' style='border-bottom:1px solid #ddd;' id='dtBasic'>
                <tr style='background-color:#eee;'>
                    <th class='border-bottom-0'>No</th>
                    <th class='border-bottom-0'>구분자</th>
                    <th class='border-bottom-0'>수량</th>
                    <th class='border-bottom-0'>퍼스트</th>
                    <th class='border-bottom-0'>비지니스</th>
                    <th class='border-bottom-0'>일반석</th>
                    <th class='border-bottom-0'>판매가</th>
                    <th class='border-bottom-0'>입금가</th>
                    <th class='border-bottom-0'>택스</th>
                    <th class='border-bottom-0'>Galileo</th>
                    <th class='border-bottom-0'>Sabre</th>
                    <th class='border-bottom-0'>Sell</th>
                    <th class='border-bottom-0'>Etc</th>
                    <th class='border-bottom-0'>Void</th>
                </tr>
                ${listHTML}
            </table>
        `;

        res.json({success : 'ok', listData: listHTML , totalCount: tot });
    } catch (err) {
        console.error('에러:'+err.stack);
        res.status(500).send('Database error');
    }
	
};



