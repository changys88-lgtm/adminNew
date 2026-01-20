const {mainInterQuery } = require('../../src/utils/database');
const deps = require('../../src/common/dependencies');
function dsrSegData(row) {
    const safe = v => (v || '').toString(); 
  
    const city_code   = safe(row.city_code);
    const start_day   = safe(row.start_day);
    const air_type    = safe(row.air_type);
    const air         = safe(row.air);
    const start_time  = safe(row.start_time);
    const arr_time    = safe(row.arr_time);
    const cls         = safe(row.class);     
    const status      = safe(row.status);
    const baggage     = safe(row.baggage);
    const not_valid   = safe(row.not_valid);
  
    for (let aCount = 1; aCount < 18; aCount++) {
        const idx0 = aCount - 1;
        row[`city_code${aCount}`]        = city_code  .slice(idx0 * 3, idx0 * 3 + 3);
        row[`start_day${aCount}`]        = start_day  .slice(idx0 * 8, idx0 * 8 + 8);
        row[`air_type${aCount}`]         = air_type   .slice(idx0 * 4, idx0 * 4 + 4);
        row[`air${aCount}`]              = air        .slice(idx0 * 2, idx0 * 2 + 2);
        row[`start_time${aCount}`]       = start_time .slice(idx0 * 4, idx0 * 4 + 4);
        row[`arrive_time${aCount}`]      = arr_time   .slice(idx0 * 4, idx0 * 4 + 4);
        row[`class${aCount}`]            = cls        .slice(idx0 * 1, idx0 * 1 + 1);
        row[`status${aCount}`]           = status     .slice(idx0 * 2, idx0 * 2 + 2);
        row[`baggage${aCount}`]          = baggage    .slice(idx0 * 3, idx0 * 3 + 3);
        row[`not_valid_before${aCount}`] = not_valid  .slice(idx0 * 10, idx0 * 10 + 5);
        row[`not_valid_after${aCount}`]  = not_valid  .slice(idx0 * 10 + 5, idx0 * 10 + 10);
    }
    return row;
}

function remainDays(str,NOW="") {
	if (NOW == "") NOW = deps.getNow().NOWS;
	const remain = Math.ceil((deps.makeTime(str)-NOW) / 86400);
    return remain;
}

async function interlineRefundCheck (pool, uid="") {
    if (!uid) return null;
	const mainRow = await mainInterQuery (pool, uid);
	const viewMode = "";
	if (mainRow.orgArrive.match(/ICN|GMP|PUS|CJU|CJJ/i)) SOTO = "Y"; else SOTO = "";
	const Air = mainRow.FirstAir.slice(0,2);
    
	const sql = ` select air_group from airLine_code where code_2 = '${Air}' `;
    const result = await pool.request().query(sql);
	const air_group = result.recordset[0]?.air_group || '';

	const sql1 = `select in_date , minor_num , air_class from interline_routing where uid_minor = '${uid}' order by minor_num `;
    const result1 = await pool.request().query(sql1);
    const aRemain = [];
    const aAirClass = [];
    let   orQry = "";
	for (const put of result1.recordset) {
		const { in_date, minor_num, air_class } = put;
		const remain = remainDays(in_date);
		aRemain.push(remain);
		aAirClass.push(air_class);
	}
    for (const cls of aAirClass) {
        if (orQry !== "") orQry += " or ";
        orQry += ` airClass like '%${cls}%' `;
    }

	if (mainRow.orgArrive == "") mainRow.orgArrive = mainRow.CityCode.slice(-3);// 자동 생성이 아닐때

	const sql2 = `select distanceType from airPort_code where portCode = '${mainRow.orgArrive}' `;
	const result2 = await pool.request().query(sql2);
	const distanceType = result2.recordset[0]?.distanceType || '';
	
	const issueDate = mainRow.issue_date.slice(0,8);
	const startDate = mainRow.FirstDate; // 2025-06-05 추가
    let   noshowFee = '';
    let   html1     = '';
    let   html2     = '';
    let   html3     = '';
    let   html4     = '';
    let   rRow      = {};
    let   refundAmt = 0;
    let   refCheck = "";
    let   refCheck2 = "";
    let   refundAmt2 = 0;

	const issueSql = ` and issue_term1 <= '${issueDate}' and issue_term2 >= '${issueDate}' `; // 2024-11-12 전체 검색으로 변경
	const startSql = ` and (( term1 <= '${startDate}' and term2 >= '${startDate}' ) or term1 = '' or term1 is null) `; // 2025-06-05 추가 입력이 되어 있을경우와 없우 체크
	const brandSql = mainRow.brandType  ? ` and airBrand = '${mainRow.brandType}' ` : ''; // 2024-10-14 브랜드 요금 추가
	if (air_group !== "L") {
		const sql3 = `
		select top 1 uid_minor as uid from interlineFareRule_refund where uid_minor in (
			select uid from interlineFareRule where carrierCode = '${Air}' and  (${orQry})  ${issueSql} ${brandSql} ${startSql}
		) and minor_num = 1 order by distance1 desc , distance2 desc  , distance3 desc
		`;
        const result3 = await pool.request().query(sql3);
		rRow = result3.recordset[0] || {};
	} else {
		const sql4 = `select * from interlineFareRule where carrierCode = '${Air}' and airClass like '%${mainRow.FirstCls}%' ${issueSql} ${startSql} `;
        const result4 = await pool.request().query(sql4);
		rRow = result4.recordset[0] || {};
	}
    
	if (distanceType !== "" && rRow.uid) {
		const sql5 = `select * from interlineFareRule_refund where uid_minor = '${rRow.uid}' order by minor_num `;
		const result5 = await pool.request().query(sql5);
		for (const put of result5.recordset) {
			const { fromDate ,untilDate , distance1, distance2, distance3 } = put;
			if (fromDate.trim() !== "") {
				const amt = distanceType === "1" ? distance1 : distance2 === "3" ? distance3 : 0;
				if (fromDate <= aRemain[0] && untilDate >= aRemain[0] && refCheck == "") {
					refundAmt = amt;
				}
                refCheck  = "Y";
				const amount = amt + 10000;
				html1 += `<td style='background-color:#eaeaea;height:25px;'><b>${fromDate}~${untilDate}</b></td>`;
				html2 += `<td>${deps.numberFormat(amount)} 원</td>`;
			}
		}
		noshowFee = rRow.refundRule || '';
	}
	if (aAirClass[1] !== "" && air_group == "L") {
		const sql6 = `select * from interlineFareRule where carrierCode = '${Air}' and airClass like '%${aAirClass[1]}%' ${issueSql} ${startSql} `;
		const result6 = await pool.request().query(sql6);
		const rRow2 = result6.recordset[0] || {};

		if (distanceType !== "" && rRow2.uid !== "") {
			const sql7 = `select * from interlineFareRule_refund where uid_minor = '${rRow2.uid}' order by minor_num `;
			const result7 = await pool.request().query(sql7);
			for (const put of result7.recordset) {
				const { fromDate, untilDate } = put;
				if (fromDate.trim() !== "") {
					const amt = distanceType === "1" ? distance1 : distance2 === "3" ? distance3 : 0;
					if (fromDate <= aRemain[1] && untilDate >= aRemain[1] && refCheck2 == "") {
						refundAmt2 += amt;
						refCheck2  = "Y";
					}
					const amount = amt + 10000;
					html3 += `<td style='background-color:#eaeaea;height:25px;'><b>${fromDate}~${untilDate}</b></td>`;
					html4 += `<td>${deps.numberFormat(amount)} 원</td>`;
				}
			}
			refundAmt += refundAmt2;
		}
	}
    if (SOTO === "Y" || mainRow.searchGrade === "LBR") refCheck = "";
    return [refCheck, html1, html2, refundAmt, noshowFee, air_group, html3, html4, rRow.uid];
}

module.exports = {
    dsrSegData ,
    interlineRefundCheck
};