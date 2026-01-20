const deps = require('../../src/common/dependencies');
const { roundUp } = require('../../src/utils/numberSum'); 


//left outer join interline as a (nolock) on main.uid = a.uid   
module.exports = async (req, res) => {
    let   start_date  = req.body.start_date || '';
    let   end_date    = req.body.end_date || '';
    let   GU1         = req.body.GU1     || '';
    let   GU2         = req.body.GU2     || '';
    let   GU3         = req.body.GU3    || '';
    let   GU4         = req.body.GU4    || '';
    let   GU5         = req.body.GU5    || '';
    let   GU6         = req.body.GU6    || '';
    const gMode       = req.body.gMode  || '';
    const page        = req.body.page    || '1';
    const listCount   = req.body.listCount;
    const sWord       = req.body.sWord || '';
    const sFrom       = req.body.sFrom || '';
    const GDS         = req.body.GDS  || ['G','A','S','E','ATR'];
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const mainTable   = 'AirTickets';
    const pool        = await deps.getPool();
    const bankOwner   = 'OYE';
    const sTime       = deps.StrClear(start_date);	
    const eTime       = deps.StrClear(end_date);
    let   totalRowCount = 0;
    let addQry        = ` crs_gubun in ('${GDS.join("','")}') `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }
    
    if (sTime) {
        if (GU6 === "downdate") addQry += ` and a.downdate >= '${sTime}'  `;
        else addQry += ` and substring(b.start_day,1,8) >= '${sTime}' `;
    }
    
    if (eTime != "") {
        if (GU6 === "downdate") addQry += ` and a.downdate <= '${eTime}' `;
        else addQry += ` and substring(b.start_day,1,8) <= '${eTime}' `;
    }
    

    try {
        const fieldQry = `
            a.*,b.*,c.refund_amount,c.refund_air,c.refund_company,c.re_nnet,c.re_net , c.re_tax1,c.re_tax2,c.re_tax3,c.re_tax4,c.re_tax5,c.re_used_amt
        `;

        const joinQry = `
            left outer join AirTickets_minor as b on a.air_line_code = b.air_line_code and a.ticket_number = b.ticket_number
            left outer join air_refund as c on a.air_line_code = c.air_line_code and a.ticket_number = c.ticket_number and a.ticket_type = 'R' 
        `;
        
        const baseQuery = `
            select 
                ${fieldQry}
            from 
                ${mainTable} as a (nolock)  
                ${joinQry}
            where   
                ${addQry}
            order by a.downdate desc
        `;
        //console.log(baseQuery)
        const result = await pool.request().query(baseQuery);
        
        // aData 초기화
        const aData = {
            D: { ISSUE:  0, SALEAMT: 0, ISSUEAMT: 0, SETTLE: 0, BENEFIT: 0, MARK: 0, ISSUECOMM: 0, OUTCOMM: 0, SALECARD: 0, SALECASH: 0, NNET: 0, VOID: 0, TASF: 0, COMM: 0, DC: 0 },
            R: { REFUND: 0, SALEAMT: 0, ISSUEAMT: 0, SETTLE: 0, BENEFIT: 0, MARK: 0, AIRCOMM: 0, COMPANYCOMM: 0, SALECARD: 0, SALECASH: 0, NNET: 0, ISSUECOMM: 0, OUTCOMM: 0, TASF: 0 },
            M: { ISSUE:  0, SALEAMT: 0, ISSUEAMT: 0, SETTLE: 0, BENEFIT: 0, MARK: 0, ISSUECOMM: 0, OUTCOMM: 0, SALECARD: 0, SALECASH: 0, NNET: 0, TASF: 0, COMM: 0, DC: 0 },
            F: { ISSUE:  0, SALEAMT: 0, ISSUEAMT: 0, SETTLE: 0, BENEFIT: 0, MARK: 0, ISSUECOMM: 0, OUTCOMM: 0, SALECARD: 0, SALECASH: 0, NNET: 0, TASF: 0, COMM: 0, DC: 0 },
            T: { ISSUE:  0, SALEAMT: 0, ISSUEAMT: 0, SETTLE: 0, BENEFIT: 0, MARK: 0, ISSUECOMM: 0, OUTCOMM: 0, SALECARD: 0, SALECASH: 0, NNET: 0, TASF: 0, COMM: 0, DC: 0 }
        };
        
        let issue_date = '';
        
        for (const row of result.recordset) {
            const start_day = String(row.start_day || '');
            const startDate = start_day.substring(0, 8);
            
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
            
            let total_normal = inter_normal + dome_normal + away_normal;
            let total_sales = inter_sales + dome_sales + away_sales;
            let total_input = inter_input + dome_input + away_input;
            let total_net = inter_net + dome_net + away_net;

            let mark = 0;
            let air_comm = 0;
            let tax_amount = 0;
            let comm_amount = total_sales - total_input;
            
            const commission_code = Number(row.commission_code || 0);
            if (commission_code > 0) {
                air_comm = roundUp(total_normal * commission_code / 100, 1);
            }
            mark = total_sales - (total_net + air_comm);

            const re_tax1 = Number(row.re_tax1 || 0);
            const re_tax2 = Number(row.re_tax2 || 0);
            const re_tax3 = Number(row.re_tax3 || 0);
            const re_tax4 = Number(row.re_tax4 || 0);
            const re_tax5 = Number(row.re_tax5 || 0);
            const re_tax = re_tax1 + re_tax2 + re_tax3 + re_tax4 + re_tax5;

            for (let tCount = 1; tCount < 12; tCount++) {
                const code = String(row[`tax_code${tCount}`] || '');
                const amt = Number(row[`tax_amount${tCount}`] || 0);
                if (code !== "VT") tax_amount += amt;
            }
            
            const conjunction = String(row.conjunction || '');
            let vat_amount  = 0;
            let card_amount = Number(row.card_amount || 0);
            let cash_amount = 0;
            let total_nnet  = 0;
            let benefit     = 0;
            let comm_link   = "";
            
            if (conjunction === "C") {
                total_sales = tax_amount = comm_amount = vat_amount = card_amount = cash_amount = total_nnet = benefit = 0;
                comm_link = "";
            }
            
            total_nnet   = total_net + tax_amount;
            total_sales  = total_sales + tax_amount;
            total_net    = total_net + tax_amount;
            total_normal = total_normal + tax_amount;
            cash_amount  = total_normal;
            
            if (comm_amount < 100) {
                comm_amount = vat_amount = 0;
            } else {
                const vat_use = String(row.vat_use || '');
                if (vat_use === "Y") {
                    vat_amount = comm_amount / 10;
                } else {
                    vat_amount = 0;
                }
            }
            
            const air = String(row.air || row.air_code || '').slice(0, 2);
            const air_type = String(row.air_type || '').slice(0, 4);
            const start_time = String(row.start_time || '').slice(0, 4);
            
            const ticket_type = String(row.ticket_type || '');
            
            // D 데이터 처리
            if (/S|N|I|E/i.test(ticket_type)) {
                aData.D.ISSUE     ++;
                aData.D.SALEAMT   += total_sales;
                aData.D.ISSUEAMT  += total_normal;
                aData.D.SETTLE    += total_sales - comm_amount;
                aData.D.BENEFIT   += mark + air_comm - comm_amount;
                aData.D.MARK      += mark;
                aData.D.ISSUECOMM += air_comm;
                aData.D.OUTCOMM   += comm_amount;

                if (card_amount > 0) {
                    aData.D.SALECARD += total_sales;
                    aData.D.NNET     -= air_comm; // 2023-06-02 카드만 커미션 빼기
                    cash_amount      -= card_amount;
                } else {
                    aData.D.NNET     += total_net;
                    aData.D.SALECASH += cash_amount;
                }
                if (card_amount > 0 && cash_amount > 0) {
                    aData.D.SALECASH += cash_amount;
                    aData.D.NNET     += cash_amount;
                }
            }
            
            if (/V/i.test(ticket_type)) {
                aData.D.VOID         ++;
            }
            
            if (/R/i.test(ticket_type)) {
                const re_nnet        = Number(row.re_nnet || 0);
                const refund_air     = Number(row.refund_air || 0);
                const refund_company = Number(row.refund_company || 0);
                const re_net         = Number(row.re_net || 0);
                const re_used_amt    = Number(row.re_used_amt || 0);
                const refund_amount  = Number(row.refund_amount || 0);
                const card_type      = String(row.card_type || '');
                
                aData.R.REFUND      ++;
                aData.R.SALEAMT     += total_sales;
                aData.R.ISSUEAMT    += total_normal;
                aData.R.NNET        += re_nnet + re_tax - refund_air;
                aData.R.AIRCOMM     += refund_air;
                aData.R.COMPANYCOMM += refund_company;
                aData.R.MARK        += re_net - re_nnet - re_used_amt; 
                aData.R.BENEFIT     += refund_company;
                aData.R.SETTLE      += refund_amount;
                if (card_type !== "") {
                    aData.R.SALECARD += total_net;
                } else {
                    aData.R.SALECASH += total_net;
                }
            }

            // M 데이터 처리
            if (/S|N|I|E/i.test(ticket_type)) {
                aData.M.ISSUE     ++;
                aData.M.SALEAMT   += total_sales;
                aData.M.ISSUEAMT  += total_normal;
                aData.M.SETTLE    += total_sales - comm_amount;
                aData.M.BENEFIT   += mark + air_comm - comm_amount;
                aData.M.MARK      += mark;
                aData.M.ISSUECOMM += air_comm;
                aData.M.OUTCOMM   += comm_amount;
                if (card_amount > 0) {
                    aData.M.SALECARD += total_net;
                    aData.M.NNET     -= air_comm; // 2023-06-02 카드만 커미션 빼기
                } else {
                    aData.M.NNET     += total_net;
                    aData.M.SALECASH += cash_amount;
                }
                if (card_amount > 0 && cash_amount > 0) {
                    aData.M.SALECASH += cash_amount;
                    aData.M.NNET     += cash_amount;
                }
            }

            // T 데이터 처리
            if (/S|N|I|E/i.test(ticket_type)) {
                aData.T.ISSUE     ++;
                aData.T.SALEAMT   += total_sales;
                aData.T.ISSUEAMT  += total_normal;
                aData.T.SETTLE    += total_sales - comm_amount;
                aData.T.BENEFIT   += mark + air_comm - comm_amount;
                aData.T.MARK      += mark;
                aData.T.ISSUECOMM += air_comm;
                aData.T.OUTCOMM   += comm_amount;
                if (card_amount > 0) {
                    aData.T.SALECARD += total_net;
                    aData.T.NNET     -= air_comm;
                } else {
                    aData.T.SALECASH += total_net;
                    aData.T.NNET     += cash_amount;
                }
                if (card_amount > 0 && cash_amount > 0) {
                    aData.T.SALECASH += cash_amount;
                    aData.T.NNET += cash_amount;
                }
            }
            totalRowCount ++;

        };

        listHTML = `
            <span>※ 총 발권 합계 (기준/발권일)</span>
			<table class='search-table' id='dtBasic'>
				<tr >
					<th rowspan="2">발권</th>
					<th rowspan="2">VOID</th>
					<th rowspan="2">판매금액</th>
					<th rowspan="2">발권금액</th>
					<th >CARD</th>
					<th rowspan="2">B/NET</th>
					<th rowspan="2">정산금</th>
					<th >발권COM</th>
					<th rowspan="2">TASF</th>
					<th rowspan="2">수수료</th>
					<th rowspan="2">Mark Up</th>
					<th rowspan="2">DC</th>
					<th rowspan="2">순이익</th>
				</tr>
				<tr style="background-color:#eee;">
					<th >CASH</th>
					<th >지급COM</th>
				</tr>
				<tr >
					<td rowspan="2">${deps.numberFormat(aData.D.ISSUE || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.D.VOID || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.D.SALEAMT || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.D.ISSUEAMT || 0)}</td>
					<td >${deps.numberFormat(aData.D.SALECARD || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.D.NNET || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.D.SETTLE || 0)}</td>
					<td >${deps.numberFormat(aData.D.ISSUECOMM || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.D.TASF || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.D.COMM || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.D.MARK || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.D.DC || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.D.BENEFIT || 0)}</td>
				</tr>
				<tr >
					<td >${deps.numberFormat(aData.D.SALECASH || 0)}</td>
					<td >${deps.numberFormat(aData.D.OUTCOMM || 0)}</td>
				</tr>
			</table>

			<span>※ 환불 합계</span>
			<table class='search-table' id='dtBasic'>
				<tr >
					<th rowspan="2">환불</th>
					<th rowspan="2">환불 판매금액</th>
					<th rowspan="2">환불 발권금액</th>
					<th >CARD</th>
					<th rowspan="2">B/NET</th>
					<th rowspan="2">정산금</th>
					<th >발권COM</th>
					<th rowspan="2">TASF</th>
					<th >항공 수수료</th>
					<th rowspan="2">환불손차</th>
					<th rowspan="2">환불수익</th>
				</tr>
				<tr >
					<th >CASH</th>
					<th >지급COM</th>
					<th >여행 수수료</th>
				</tr>
				<tr >
					<td rowspan="2">${deps.numberFormat(aData.R.REFUND || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.R.SALEAMT || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.R.ISSUEAMT || 0)}</td>
					<td >${deps.numberFormat(aData.R.SALECARD || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.R.NNET || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.R.SETTLE || 0)}</td>
					<td >${deps.numberFormat(aData.R.ISSUECOMM || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.R.TASF || 0)}</td>
					<td >${deps.numberFormat(aData.R.AIRCOMM || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.R.MARK || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.R.BENEFIT || 0)}</td>
				</tr>
				<tr >
					<td >${deps.numberFormat(aData.R.SALECASH || 0)}</td>
					<td >${deps.numberFormat(aData.R.OUTCOMM || 0)}</td>
					<td >${deps.numberFormat(aData.R.COMPANYCOMM || 0)}</td>
				</tr>
			</table>



			<span>※ 월별 누적 내역(${deps.cutDate(issue_date)})</span>
			<table class='search-table' id='dtBasic'>
				<tr >
					<th rowspan="2">구분</th>
					<th rowspan="2">발권</th>
					<th rowspan="2">판매금액</th>
					<th rowspan="2">발권금액</th>
					<th >CARD</th>
					<th rowspan="2">B/NET</th>
					<th rowspan="2">정산금</th>
					<th >발권COM</th>
					<th rowspan="2">TASF</th>
					<th rowspan="2">수수료</th>
					<th rowspan="2">Mark Up</th>
					<th rowspan="2">DC</th>
					<th rowspan="2">순이익</th>
				</tr>
				<tr >
					<th >CASH</th>
					<th >지급COM</th>
				</tr>
				<tr >
					<td rowspan="2">B2B</td>
					<td rowspan="2">${deps.numberFormat(aData.M.ISSUE || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.M.SALEAMT || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.M.ISSUEAMT || 0)}</td>
					<td >${deps.numberFormat(aData.M.SALECARD || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.M.NNET || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.M.SETTLE || 0)}</td>
					<td >${deps.numberFormat(aData.M.ISSUECOMM || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.M.TASF || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.M.COMM || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.M.MARK || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.M.DC || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.M.BENEFIT || 0)}</td>
				</tr>
				<tr >
					<td >${deps.numberFormat(aData.M.SALECASH || 0)}</td>
					<td >${deps.numberFormat(aData.M.OUTCOMM || 0)}</td>
				</tr>
				<tr >
					<td rowspan="2">직판</td>
					<td rowspan="2">${deps.numberFormat(aData.F.ISSUE || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.F.SALEAMT || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.F.ISSUEAMT || 0)}</td>
					<td >${deps.numberFormat(aData.F.SALECARD || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.F.NNET || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.F.SETTLE || 0)}</td>
					<td >${deps.numberFormat(aData.F.ISSUECOMM || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.F.TASF || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.F.COMM || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.F.MARK || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.F.DC || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.F.BENEFIT || 0)}</td>
				</tr>
				<tr >
					<td >${deps.numberFormat(aData.F.SALECASH || 0)}</td>
					<td >${deps.numberFormat(aData.F.OUTCOMM || 0)}</td>
				</tr>
				<tr >
					<td rowspan="2">합계</td>
					<td rowspan="2">${deps.numberFormat(aData.T.ISSUE || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.T.SALEAMT || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.T.ISSUEAMT || 0)}</td>
					<td >${deps.numberFormat(aData.T.SALECARD || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.T.NNET || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.T.SETTLE || 0)}</td>
					<td >${deps.numberFormat(aData.T.ISSUECOMM || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.T.TASF || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.T.COMM || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.T.MARK || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.T.DC || 0)}</td>
					<td rowspan="2">${deps.numberFormat(aData.T.BENEFIT || 0)}</td>
				</tr>
				<tr >
					<td >${deps.numberFormat(aData.T.SALECASH || 0)}</td>
					<td >${deps.numberFormat(aData.T.OUTCOMM || 0)}</td>
				</tr>
			</table>
        `;
        let pageHTML = '';
        res.json({ success : 'ok', listData: listHTML , pageData: pageHTML , totalCount: totalRowCount });
    } catch (err) {
        console.error('에러:'+err);
        res.status(500).send('Database error');
    }
	
};

