const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { getPagination } = require('../../src/utils/paging'); 
const { arrBankCode } = require('../../src/utils/airConst'); 


//left outer join interline as a (nolock) on main.uid = a.uid   
module.exports = async (req, res) => {
    let   start_date  = req.body.start_date || '';
    let   end_date    = req.body.end_date || '';
    let   GU1         = req.body.GU1     || '';
    let   GU2         = req.body.GU2     || '';
    let   GU3         = req.body.GU3    || '';
    let   GU4         = req.body.GU4    || '';
    const gMode       = req.body.gMode  || '';
    const page        = req.body.page    || '1';
    const listCount   = req.body.listCount;
    const sWord       = req.body.sWord || '';
    const sFrom       = req.body.sFrom || '';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const mainTable   = 'AirTickets';
    const pool        = await deps.getPool();
    const bankOwner   = 'OYE';
    const sTime       = deps.StrClear(start_date);	
    const eTime       = deps.StrClear(end_date);

    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }
    
    if (GU1 === 'ATRX')  addQry += ` and a.crs_gubun != 'ATR' `;
    else if (GU1 !== '') addQry += ` and a.crs_gubun = '${GU1}' `;

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
            a.* 
            ,b.city_code,b.start_day,b.air_type,b.air,b.start_time,b.class ,c.site_name,d.username ,e.uid_minor as orderNum ,va.uid as money_uid , va.tr_amt 
            ,( select top 1 amount from site_commlist where air_line_code = a.air_line_code and ticket_number = a.ticket_number and site_code = a.site_code and gubun = 'T' and void is null) as tasfAmount 
        `;

        const joinQry = `
            left outer join AirTickets_minor as b on a.air_line_code = b.air_line_code and a.ticket_number = b.ticket_number 
            left outer join site as c on a.site_code = c.site_code  
            left outer join tblManager as d on a.issue_manager = d.member_code  
            left outer join interline_pax as e on a.air_line_code + a.ticket_number = e.ticket_number 
            left outer join  vavs.dbo.vacs_ahst as va on e.uid_minor = va.airOrder and va.gubun in (51,52) and va.void is null and bankOwner = '${bankOwner}' 
            left outer join interline_minor as m on e.uid_minor = m.uid_minor 
            left outer join interline as g on g.uid = m.uid_minor 
        `;
        const totQuery = `
            select count(*) as total from  ${mainTable} as a (nolock)  
            ${joinQry}
            where
            ${addQry}
        `;
        //console.log(totQuery)
        const result2 = await pool.request().query(totQuery);
        const totalRowCount = result2.recordset[0].total;
        const { startRow, endRow, pageHTML } = getPagination({
            tot_row: totalRowCount,
            page: page ,
            listCount: listCount
        });
        const baseQuery = `
        select 
            ${fieldQry}
            from (
            select * from
                (select a.air_line_code,a.ticket_number,a.ticket_type,a.downdate , ROW_NUMBER() OVER (order by a.downdate desc ) as RowNum
                    from 
                    ${mainTable} as a (nolock)  
                    ${joinQry}
                    where   
                    ${addQry}
                    
                ) as db1
            where RowNum BETWEEN ${startRow} AND ${endRow}
            ) as main
            left outer join ${mainTable} as a (nolock) on main.air_line_code = a.air_line_code and  main.ticket_number = a.ticket_number  and a.ticket_type = main.ticket_type 
            ${joinQry}
            
            order by RowNum asc
        `;
        //console.log(baseQuery)
        const result = await pool.request().query(baseQuery);
        let  rows        = ``;
        let  invCnt      = 0 ;
        let  invHTML     = "";
        let  air1        = '';
        let  air_type1   = '';
        let  start_time1 = '';
        let  total_normal = 0, total_sales = 0,  total_input = 0, total_net = 0 , tax_amount = 0;
        let  vat_amount  = 0;
        let  comm_link   = '';
        let  issuing     = '';
        let  total_nnet  = '', cash_amount = '';
        let  link2       = '';
        for (const row of result.recordset) {
            let { 
                air_line_code , ticket_number , username , downdate , start_day , invoice_num , pnr , orderNum , ticket_type
                , site_code , site_name , air , air_type , start_time , city_code1 , city_code2 , city_code3 , city_code4 ,city_code
                , pax_name , conjunction , self_dc , benefit , money_uid , tr_amt
                , inter_normal ,  inter_sales , inter_input , inter_net , not_matching , tasfAmount , card_amount 
            } = row;
            let bgcolor = 'fff' , font = '' , link = '';
            
            
            if (invoice_num) invHTML = `<span type=button class='btn_basic btn_yellow'  onClick="return viewInvoice('${invoice_num}')">Invoice</span>`;
            else if (b2bMASTER == "Y") {
                invHTML = `<input type=checkbox name='aInvoice[]' class='aInvoice' id='aInvoice_${invCnt}' onClick="return invoiceCheck()" value='$DATA2' $dis2>`;
                invCnt ++;
            } else {
                invHTML = "";
            }
            air1        = air.slice(0,2);
            air_type1   = air_type.slice(0,4);
            start_time1 = deps.cutTime(start_time.slice(0,4));
            
            total_normal = inter_normal ;
            total_sales  = inter_sales  ;
            total_input  = inter_input  ;
            total_net    = inter_net    ;

            tax_amount  = 0;
            comm_amount = total_sales - total_input;
            for (let tCount = 1 ; tCount < 12 ; tCount ++) {
                code = row[`tax_code${tCount}`];
                amt  = Number(row[`tax_amount${tCount}`]);
                if (code !== "VT") tax_amount += amt || 0;
            }
            
            total_nnet	 = Number(total_net)   + tax_amount;
	        cash_amount	 = Number(total_input) + tax_amount ;

            if (conjunction === "C") {
                total_sales = tax_amount = comm_amount = vat_amount = card_amount = cash_amount = total_nnet = benefit = 0;
                comm_link = "";
            }
            
            if (conjunction === "N" && ticket_type === "N") issuing = `<br><div><span class='btn_basic btn_blue nowrap' onClick="return tPrint('${air_line_code}-${ticket_number}','${site_code}')">출력</span></div>`;
	        else  issuing = '';
            
            
            if (b2bMASTER === "Y") link2 = ` <span class='btn_slim btn_yellow' onClick="modTicket('${air_line_code}','${ticket_number}','${ticket_type}')">  ${deps.ticketSplit(ticket_number)} </span> `;
            else link2 = ` ${deps.ticketSplit(ticket_number)}`;
            
            if (orderNum) orderNum = `<span class='btn_slim btn_yellow' onClick="return issueStart ('${orderNum}')">${orderNum}</span>`;
            rows += `
                <tr  height="29" onmouseover="this.style.backgroundColor='#f3f3f3'" onmouseout="this.style.backgroundColor='#FFFFFF'" bgcolor='#FFFFFF'>
                    <td class='ac $addCls' >${invHTML}</td>
                    <td class='ac $addCls' >${orderNum} <br> ${pnr}</td>
                    <td class='ac $addCls' $delLink>${deps.cutDate(downdate || '')}<br>${deps.cutDate(start_day.slice(0,8))}</td>
                    <td class='ac $addCls' >${air_line_code}</td>
                    <td class='ac $addCls' style='background-color:$bgcolor2' >${link2} <br>${air1} ${air_type1} ${start_time1}</td>
                    <td class='ac $addCls' >${site_code}<br>${site_name}</td>
                    <td class='ac $addCls' >${link}${pax_name}</a><br>${city_code1 || ''} ${city_code2 || ''} ${city_code3 || ''} ${city_code4 || ''} ${city_code}</td>
                    <td class='ac $addCls' >${ticket_type}</td>
                    
                    <td class='ar $addCls par5' >${deps.numberFormat(total_sales)}<br>${deps.numberFormat(tax_amount)}</td>
                    <td class='ar $addCls par5' >${deps.numberFormat(comm_amount)}<br>${deps.numberFormat(vat_amount)}</a></td>
                    
                    <td class='ar $addCls par5' >${deps.numberFormat(cash_amount - vat_amount)}</a><br>${deps.numberFormat(total_nnet)} </td>
                    <td class='ar $addCls par5' >${deps.numberFormat(card_amount)}</td>
                    <td class='ar $addCls par5' >${deps.numberFormat(self_dc)}<br><span ID=BENEFIT_${air_line_code}${ticket_number}${ticket_type}>${deps.numberFormat(benefit + vat_amount)}</span></td>
                    
                    <td class='ac $addCls' >${deps.numberFormat(not_matching)}<br>${deps.numberFormat(tasfAmount)}</td>
                    <td class='ac $addCls' >${username || ''} ${issuing}</td>
                    
                    <td class='ac ' >${money_uid || ''}<br>${deps.numberFormat(tr_amt)}</td>
                </tr>
            `;
            invCnt ++;
        };

        if (!rows) {
            rows = `<tr><td colspan='20' class='ac hh50'>검색된 데이터가 없습니다.</td></tr>`;
        }
        listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr >
                    <th ><a href=javascript:// onClick="return ticketCheck2()" title='인보이스 생성'>iv</a></th>
                    <th >예약번호</th>
                    <th class="two">발권일<br>출발일</th>
                    <th >AIR</th>
                    <th class="two">TICKET NO<br>항공편</th>
                    <th >거래처</th>
                    <th >승객명</th>
                    <th >T</th>
                    <th  class='ar' class="two">판매가<br>TAX</th>
                    <th  class='ar' class="two">Comm<br>Vat</th>
                    <th  class='ar' class="two">입금가<br>NNET</th>
                    <th  class='ar' >승인금액</th>
                    <th  class='ar' class="two">D/C<br>순이익</th>
                    <th >미매칭<br>TASF</th>
                    <th >카운터</th>
                    <th  class='' class="two">입금</th>
                </tr>
                ${rows}
            </table>
        `;
        res.json({ success : 'ok', listData: listHTML , pageData: pageHTML , totalCount: totalRowCount });
    } catch (err) {
        console.error('에러:'+err);
        res.status(500).send('Database error');
    }
	
};

