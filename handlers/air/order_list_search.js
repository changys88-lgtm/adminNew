const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { getPagination } = require('../../src/utils/paging'); 
const { arrInterType , arrInterGubun } = require('../../src/utils/airConst'); 

const cutDate     = deps.cutDate;
const cutDateTime = deps.cutDateTime;

// ,d.Locn_status as Locn_status1,d.in_date as in_date1,d.seat_status as seat_status1,d.citycode as citycode1,d.air_code as air_code1, d.air_class as class1 , d.Locn as Locn1
// ,e.Locn_status as Locn_status2,e.in_date as in_date2,e.seat_status as seat_status2,e.citycode as citycode2,e.air_code as air_code2, e.air_class as class2 , e.Locn as Locn2
// ,g.Locn_status as Locn_status3,g.in_date as in_date3,g.seat_status as seat_status3,g.citycode as citycode3,g.air_code as air_code3, g.air_class as class3 , g.Locn as Locn3 
// ,h.Locn_status as Locn_status4,h.in_date as in_date4,h.seat_status as seat_status4,h.citycode as citycode4,h.air_code as air_code4, h.air_class as class4 , h.Locn as Locn4 
// ,j.Locn_status as Locn_status5,j.in_date as in_date5,j.seat_status as seat_status5,j.citycode as citycode5,j.air_code as air_code5, j.air_class as class5 , j.Locn as Locn5 
// ,o.Locn_status as Locn_status6,o.in_date as in_date6,o.seat_status as seat_status6,o.citycode as citycode6,o.air_code as air_code6, o.air_class as class6 , o.Locn as Locn6  
//,COALESCE(w.wincleSum, 0) AS wincleSum
const fieldQry = `
    a.* 
    
    ,b.site_name , b.fax_number
    ,n.cashback,n.NaverTotalEventAmt,n.passive_pnr,n.email,n.selfcard_auth,n.tasf_req,n.bspSiteCode,n.issueCommSite,n.tkConfirm,n.customPrice,n.ref_operator,n.searchGrade
    ,c.username ,f.username as issue_name 
    
    ,n.add_baggage,n.atr_yes2,n.RecLoc2,n.cancel_relation,n.airPnr2 , n.QuoteDate , n.VenderRemark , n.org_order
    ,k.eng_name1 + '/' + k.eng_name2 as paxName

    ,COALESCE(dt.datCnt, 0) AS datCnt
    ,COALESCE(s.masterSite, '') AS masterSite
    ,COALESCE(pm.paySum, 0) AS paySum
    ,COALESCE(qc.quoteCount, 0) AS quoteCount
    ,COALESCE(ma.outDate, '') AS outDate
    , case when n.ticket_num != '' then (select top 1 finish_date from money_act where ticket_num = ( select ticket_num from interline_minor where uid_minor = a.uid)) else '' end as outDate    
`;

// left outer join interline_routing as g (nolock) on a.uid = g.uid_minor and g.minor_num = '3'  
// left outer join interline_routing as h (nolock) on a.uid = h.uid_minor and h.minor_num = '4'  
// left outer join interline_routing as j (nolock) on a.uid = j.uid_minor and j.minor_num = '5'  
// left outer join interline_routing as o (nolock) on a.uid = o.uid_minor and o.minor_num = '6'  
const joinQry = `
    left outer join interline as a (nolock) on main.uid = a.uid   
    left outer join site as b (nolock) on a.site_code = b.site_code 
    left outer join tblManager as c (nolock) on a.operator = c.member_code 
    left outer join interline_routing as d (nolock) on a.uid = d.uid_minor and d.minor_num = '1'  
    left outer join interline_routing as e (nolock) on a.uid = e.uid_minor and e.minor_num = '2'  
    left outer join tblManager as f (nolock) on a.issue_manager = f.member_code
    left outer join interline_pax as k (nolock) on a.uid = k.uid_minor and k.minor_num = '1' 
    left outer join interline_minor as n (nolock) on a.uid = n.uid_minor 
    LEFT JOIN (    SELECT uid_minor, COUNT(*) AS datCnt                       FROM dat_table WITH (NOLOCK)           WHERE (db_name = 'interline' or (db_name = 'interline_p' and out_ok = 'Q') )  GROUP BY uid_minor) AS dt ON a.uid = dt.uid_minor
    LEFT JOIN (    SELECT site_code, MAX(master_site) AS masterSite           FROM site WITH (NOLOCK)                GROUP BY site_code) AS s ON a.site_code = s.site_code
    LEFT JOIN (    SELECT inter_uid, SUM(visual_amt) AS paySum                FROM interline_payment WITH (NOLOCK)   WHERE void IS NULL    GROUP BY inter_uid) AS pm ON a.uid = pm.inter_uid
    LEFT JOIN (    SELECT uid_minor, COUNT(*) AS quoteCount                   FROM interline_quote WITH (NOLOCK)     GROUP BY uid_minor) AS qc ON a.uid = qc.uid_minor
    LEFT JOIN (    SELECT im.uid_minor, MAX(ma.finish_date) AS outDate        FROM money_act AS ma WITH (NOLOCK)     INNER JOIN interline_minor AS im WITH (NOLOCK) ON ma.ticket_num = im.ticket_num    GROUP BY im.uid_minor) AS ma ON a.uid = ma.uid_minor AND n.ticket_num != ''
    `;
    //LEFT JOIN (    SELECT uid_minor, MAX(carbon_order_price) AS wincleSum     FROM interline_wincle WITH (NOLOCK)    WHERE void IS NULL    GROUP BY uid_minor) AS w ON a.uid = w.uid_minor

const outerTable = `
	OUTER APPLY (
		SELECT
			COUNT(*)                                        AS paxTotal,
			SUM(CASE WHEN refund_req = 'Y' THEN 1 ELSE 0 END) AS refundReq,
			SUM(CASE WHEN refund_res = 'Y' THEN 1 ELSE 0 END) AS refundRes,
			SUM(CASE WHEN ticket_number IS NOT NULL AND ticket_number <> '' THEN 1 ELSE 0 END) AS ticketCount,
			SUM(CASE WHEN method_type = '2' THEN 1 ELSE 0 END) AS cardCnt,
			SUM(CASE WHEN mileage IS NOT NULL AND mileage <> '' THEN 1 ELSE 0 END) AS mileageCnt,
			SUM(CASE WHEN mileageStatus = 'HK' THEN 1 ELSE 0 END) AS mileageOkCnt,
			MAX(CASE WHEN refund_res = 'Y' THEN refund_res_time ELSE '' END) AS refund_res_time  ,
			MAX(CASE WHEN ticket_number != '' THEN ticket_number ELSE '' END) AS ticketNumber  
		FROM interline_pax WITH (NOLOCK)
		WHERE uid_minor = a.uid
	) paxOuter
	OUTER APPLY (
		SELECT
			SUM(CASE WHEN gubun = '1' AND gubun2 = '4' THEN 1 ELSE 0 END) AS receiptCnt,
			SUM(CASE WHEN gubun = '4' AND gubun2 = '4' THEN 1 ELSE 0 END) AS baggageCnt,
			SUM(CASE WHEN gubun = '7' AND gubun2 = '4' THEN 1 ELSE 0 END) AS wheelChairCnt
		FROM onetoone WITH (NOLOCK)
		WHERE order_num = a.uid
	) oneOuter
    OUTER APPLY (
        SELECT (
            select 
            minor_num , Locn_status ,in_date ,seat_status ,citycode ,air_code , air_class , Locn
        FROM interline_routing WITH (NOLOCK)
        WHERE uid_minor = a.uid
        order by minor_num
        for json path
        ) as routeJson
    ) route
`;

module.exports = async (req, res) => {
    const data        = req.body;
    let   start_date  = deps.StrClear(req.body.start_date || '');
    let   end_date    = deps.StrClear(req.body.end_date || '');
    const cancel      = req.body.cancel || '';
    const page        = req.body.page || '1';
    const listCount   = req.body.listCount;
    const sWord       = req.body.sWord || '';
    const sFrom       = req.body.sFrom || '';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    //if (mode == "Notice") {
    let addQry        = ` atr_yes != 'DOM'  `;
    if (sWord && sFrom ) {
        if (sFrom === "a.uid") {
            addQry +=  ` and a.uid = '${sWord}' `;
            start_date = end_date = '';
        }
    }

    if (start_date  !== "")  addQry         += ` and a.order_date >= '${start_date}000000' `;
    if (end_date    !== "")  addQry         += ` and a.order_date <= '${end_date}235959' `;
    if (cancel      === "")  addQry         += ` and (in_status != '9')  `;
    if (b2bSiteCode !== "")  addQry         += ` and a.site_code = '${b2bSiteCode}'`;

        try {
            const pool = await deps.getPool();
            
            const totQuery = `
                select count(*) as total from  interline as a (nolock)  
                left outer join site as b (nolock) on a.site_code = b.site_code
                left outer join interline_minor as n (nolock) on a.uid = n.uid_minor  
                where
                ${addQry}
            `;
            //console.log(data)
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
                ${fieldQry} ,paxOuter.* , oneOuter.* , route.routeJson
                from (
                select * from
                    (select a.uid , ROW_NUMBER() OVER (order by a.uid desc ) as RowNum
                        from 
                        interline as a (nolock)  left outer join site as b (nolock) on a.site_code = b.site_code 
                        left outer join interline_minor as n (nolock) on a.uid = n.uid_minor   
                        where   
                        ${addQry}
                        
                    ) as db1
                where RowNum BETWEEN ${startRow} AND ${endRow}
                ) as main
                ${joinQry}
                ${outerTable}
                order by RowNum asc
            `;
            const result = await pool.request().query(baseQuery);
            let   rows = ``;

            result.recordset.forEach(row => {
                const data     = dataPick(row)
                let members = data.adult_member + data.child_member;
                if (data.infant_member > 0) members += '+'+data.infant_member;
                let uid           = data.uid;
                let in_date       = '';
                let air_code      = '';
                let citycode      = '';
                let site_name     = '';
                let seat_status   = '';
                let Locn          = '';
                let LocnStatus    = '';
                let issue_name    = '';
                let order         = '';
                let QuoteDateHTML = '';
                let QuoteDate     = data.QuoteDate || '';
                let in_status     = data.in_status || '1';
                let issue_date    = data.issue_date;
                let NOWS          = deps.getNow().NOWS;
                let status        = data.status || '';
                let ticket_number = data.ticketNumber;
                let issue_req     = data.issue_req;
                let atr_yes       = data.atr_yes;
                let quoteCount    = data.quoteCount;
                let RecLoc        = data.RecLoc || '';
                let TL            = data.TL;
                let paxName       = data.paxName;
                let org_order     = data.org_order || '';
                let searchGrade   = data.searchGrade || '';
                let issueReqTime  = data.issue_req_time || '';
                let RecLocData    = RecLoc;
                let inStatusData  = '';
                let seatColor     = '';
                
                /*
                for (let i = 1; i <= 6; i++) {
                  const inDateVal                = data[`in_date${i}`];
                  if (inDateVal)         in_date += (in_date ? '<br>' : '') + cutDate(inDateVal);
                  const airCodeVal               = data[`air_code${i}`];
                  if (airCodeVal)       air_code += (air_code ? '<br>' : '') + airCodeVal;
                  const cityCodeVal              = data[`citycode${i}`];
                  if (cityCodeVal)      citycode += (citycode ? '<br>' : '') + cityCodeVal;
                  const seatStatusVal            = data[`seat_status${i}`];
                  if (seatStatusVal !== "HK" && seatStatusVal) seatColor = ` cored `;
                  if (seatStatusVal) seat_status += (seat_status ? '/' : '') + seatStatusVal;
                }
                */

                let jData = JSON.parse(row.routeJson);
                //if (!Array.isArray(jData)) jData = [];
                for (const row of (jData ?? [])) {
                    in_date  += (in_date  ? '<br>' : '') + cutDate(row.in_date);
                    air_code += (air_code ? '<br>' : '') + row.air_code;
                    citycode += (citycode ? '<br>' : '') + (row.citycode).slice(0,3) + ' - ' + row.citycode.slice(3);
                    if (row.seat_status !== "HK" && row.seat_status) seatColor = ` cored `;
                    seat_status += (seat_status ? '/' : '') + row.seat_status;
                    Locn += (Locn ? '<br>' : '') + (row.Locn || '');
                    LocnStatus += (row.LOcn_status || '');
                }
                
                
                if (data.site_name != '') site_name = data.site_name;
                if (data.site_code != '') site_name += '<br>'+data.site_code;

                if (data.com_id === 'MOB') {
                    username = `<span><b>MOB</b></span>`;
                } else if (/(OYE|Auto|Flyeasy|Naver)/i.test(data.operator) || b2bMASTER == '') {
                    if (b2bSiteCode !== '') {
                        username = `<span><b>${data.site_manager2}</b></span>`;
                    } else {
                        username = `<span><b>${data.operator}</b></span>`;
                    }
                } else if (!data.username && in_status !== '9') {
                    username = `<div onclick="return acceptReq('${uid}', 'R')" class="btn_basic btn_gray cursor nowrap">접수</div>`;
                } else {
                    username = data.username;
                }
                

                if (data.issue_manager === "OYE") {
                    issue_name = `<font color="brown"><b>OYE</b></font>`;
                } else if (data.issue_name == "" && data.issue_req === "Y" && in_status !== "9" && in_status !== "4" && b2bMASTER == "Y") {
                    issue_name = `<div onclick="return acceptReq('${uid}','S')" class="btn_basic btn_blue cursor nowrap">접수</div>`;
                } else {
                    issue_name = data.issue_name;
                }
                let link3 = '';
                const issueDateStr = issue_date?.substring(0, 8);
                const nowStr = NOWS; 
               
                const isAG = /A|G/i.test(atr_yes);
                if (quoteCount === 0 && isAG && RecLoc && in_status < 4 && !seatColor) {
                    QuoteDateHTML = `<span onclick="priceReCheck('${uid}', 'parent')" class="btn_basic btn_red nowrap">요금미생성</span>`;
                } else if (TL < deps.getNow().NOWSTIME.substring(0, 12) && TL && in_status < 4 && !seatColor) {
                    QuoteDateHTML = `<span class="btn_basic btn_red nowrap">TL 초과</span>`;
                } else if (QuoteDate < deps.getNow().NOWS && in_status < "4" && in_status !== "A" && in_status !== "R" && QuoteDate && isAG == true  && !seatColor) {
                    QuoteDateHTML = `<span class="btn_basic btn_yellow nowrap" onclick="priceReCheck('${uid}', 'parent')" title="당일 발권 불가시 운임 수정 클릭해서 운임 재확인 하시고 자동 발권 해주세요">요금재확인</span>`;
                } else {
                    QuoteDateHTML = '';
                }

                if (in_status === "4") {
                    if (issueDateStr === nowStr || !ticket_number != '') {
                        link3 = `onclick="return ticketCheck('${uid}', '${status}')"`;
                    }

                    if (b2bMASTER == "Y") {
                        link3 = `onclick="return ticketCheck('${uid}', '${status}')"`; // 재발권 케이스
                    }

                    inStatusData = `<p class="btn_basic btn_out_blue wh100" ${link3}>
                                    ${arrInterGubun[in_status]}<br>${cutDateTime(issue_date, "S")}
                            </p>`;
                } else {
                    inStatusData = arrInterGubun[in_status];
                }

                const isTodayExpired = data.TL?.substring(0, 12) < deps.getNow().NOWSTIME.substring(0, 12); // 유효시간 비교용 함수
                if (!ticket_number && in_status === "4" && issue_req === "Y") {
                    order = `<span class='btn_basic btn_gray nowrap'> 발권요청<br>${cutDateTime(issueReqTime,'S')}</span>`;
                } else if (!ticket_number && ! data.issue_req_time) {
                    order = '';
                } else if (!ticket_number && issue_req === "Y") {
                    const cls = isTodayExpired ? "btn_red" : "btn_gray";
                    const issueCancel = b2bMASTER === "Y" ? `ondblclick="return issueReqCancel('${uid}')"` : "";
                    order = `<div class='btn_basic ${cls} mab6 nowrap' ${issueCancel}>발권요청<br>${cutDateTime(issueReqTime,'S')}</div>`;
                } else if (!ticket_number && site_manager && !issue_req) {
                    order = '';
                } else if (ticket_number && in_status !== "9") {
                    order = `<span href="javascript://" onclick="return issueConfirm2('${uid}')" class="btn_basic btn_blue nowrap">이티켓</span>`;
                } else if (in_status === "8") {
                    order = `<font color="red">취소 요청중</font>`;
                }

                if (paxName == "/") paxName = `<font color='brown'>${data.order_name}</font><br>`;
	            else paxName = `<font color='brown'><div style=' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' title='$paxName'>${paxName}</div></font>`;

                if (status == "RF") { // 갈릴레오 요금 기반 주문건
                    bgcolor2 = "#f87cf8";
                } else if (status.trim() != "") { // 갈릴레오 요금 기반 주문건
                    bgcolor2 = "#33FF00";
                } else {
                    bgcolor2 = "";
                }

                searchGrade = (searchGrade || '').length === 1 ? '' : `<br><span class="coblue">${searchGrade}</span>`;
                if (in_status === "1" && !RecLoc) RecLocData = `<span onClick="return pnrCreate('${uid}')" class='btn_basic btn_gray cursor nowrap'>PNR생성</span>`;
                //else if (RecLoc) RecLocData = `<span onClick="return pnrCheck('${uid}')" class='cursor nowrap'>${RecLoc}</span>`;
                
                seat_status = `<span onClick="return pnrCheck('${uid}','List')" class='cursor nowrap'>${seat_status}</span>`;
                rows += `
                    <tr  HEIGHT=29  onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor='#FFFFFF'" bgcolor='#FFFFFF'>
                        <td class="" style='background-color:${bgcolor2}'><a href="javascript://" onclick="return issueStart('${uid}','status')" style="color:#222;font-weight:600;">${uid}</a> ${status} ${org_order} ${searchGrade}</td>
                        <td class="">${atr_yes}</td>
                        <td class="">${site_name}</td>
                        <td class="">${in_date}</td>
                        <td class="">${air_code}</td>
                        <td class="">${citycode}</td>
                        <td class="">${arrInterType[data.ticket_type] || ''}</td>
                        <td class="">${paxName} ${RecLocData} <br><span class="${seatColor}"> ${seat_status} </span></td>
                        <td class="">${Locn}</td>
                        <td class="">${members}</td>
                        <td class="">${data.total_amount?.toLocaleString() || 0} </td>
                        <td class="">${cutDateTime(TL,'S' || '')}</td>
                        <td class="">${cutDateTime(data.order_date,'S' || '')} <br> ${cutDateTime(issue_date,'S' || '')}</td>
                        <td class="">${username}</td>
                        <td class="">${inStatusData || ''} <br> ${issue_name || ''}</td>
                        <td class=""></td>
                        <td class=""></td>
                        <td class="">${order} ${QuoteDateHTML}</td>
                    </tr>
                `;
            });

            if (!rows) rows = `<tr><td colspan="20" class="ac hh50">데이터가 없습니다.</td></tr>`;
            listHTML = `
                <table class='search-table' id='dtBasic'>
                    <tr >
                        <th class="wh80">No.</th>
                        <th>CRS</th> 
                        <th>거래처명</th> 
                        <th class="wh110">출발일</th>
                        <th class="wh103">항공</th>
                        <th class="wh100">일정</th>
                        <th class="wh100">구분</th>
                        <th>PNR</th>
                        <th>Seat</th>
                        <th class="wh50">승객</th>
                        <th>금액</th>
                        <th class="wh100">TL</th>
                        <th class="wh100">신청일 <br> 발권일</th>
                        <th class="wh80">접수<br>발권</th>
                        <th class="wh100">상태</th>
                        <th>C/T</th>
                        <th class="wh100">환불</th>
                        <th>발권</th>
                    </tr>
                    ${rows}
                </table>
            `;
            res.json({ success:'ok',listData: listHTML , pageData: pageHTML , totalCount: totalRowCount });
        } catch (err) {
            console.error('에러:'+err);
            res.status(500).send('Database error');
        } finally {
            //await sql.close();
        }
    //} 
	
};

