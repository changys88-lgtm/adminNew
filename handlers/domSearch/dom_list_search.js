const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { getPagination } = require('../../src/utils/paging'); 
const { arrInterType , arrInterGubun } = require('../../src/utils/airConst'); 

const cutDate     = deps.cutDate;
const cutDateTime = deps.cutDateTime;

const fieldQry = `
    a.* 
    ,b.site_name , b.fax_number
    ,d.air_code as air_code1,d.citycode as citycode1,d.in_date as in_date1,d.seat_status,d.air_class as class1 , e.air_class as class2  
    ,n.cashback,n.NaverTotalEventAmt,n.passive_pnr,n.email,n.selfcard_auth,n.tasf_req,n.jeju_id,n.Price_Key
    ,e.Locn_status as Locn_status2,e.in_date as in_date2,e.seat_status as seat_status2,e.citycode as citycode2,e.air_code as air_code2 ,e.OperatingAirline as OperatingAirline2
    ,d.Locn,e.Locn as Locn2,d.Locn_status,d.OperatingAirline
    ,c.username ,f.username as issue_name
    , dom.pnrAlpha , dom.pnrNumeric , dom.agentTL, dom2.pnrAlpha as pnrAlpha2
    ,n.add_baggage,n.atr_yes2,n.RecLoc2,n.cancel_relation,n.airPnr2,n.dom_dc
    ,k.eng_name1 + '/' + k.eng_name2 as paxName
    ,k.refund_res_time,k.ticket_number
`;

//left outer join interline as a (nolock) on main.uid = a.uid   
const joinQry = `
    left outer join site as b (nolock) on a.site_code = b.site_code 
    left outer join tblManager as c (nolock) on a.operator = c.member_code 
    left outer join interline_routing as d (nolock) on a.uid = d.uid_minor and d.minor_num = '1'  
    left outer join interline_routing as e (nolock) on a.uid = e.uid_minor and e.minor_num = '2'  
    left outer join tblManager as f (nolock) on a.issue_manager = f.member_code
    left outer join interline_pax as k (nolock) on a.uid = k.uid_minor and k.minor_num = '1' 
    left outer join interline_minor as n (nolock) on a.uid = n.uid_minor 
    left outer join interline_domestic_rev as dom on a.uid = dom.uid_minor and dom.minor_num = 1
    left outer join interline_domestic_rev as dom2 on a.uid = dom2.uid_minor and dom2.minor_num = 2
`;
module.exports = async (req, res) => {
    let   start_date  = req.body.start_date || '';
    let   end_date    = req.body.end_date || '';
    let   GU1         = req.body.GU1     || '';
    let   GU2         = req.body.GU2     || '';
    let   GU10        = req.body.GU10    || '';
    let   GU11        = req.body.GU11    || '';
    const cancel      = req.body.cancel  || '';
    const page        = req.body.page    || '1';
    const listCount   = req.body.listCount;
    const sWord       = req.body.sWord || '';
    const sFrom       = req.body.sFrom || '';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const pool = await deps.getPool();

    let addQry        = ` atr_yes = 'DOM'  `;
    if (sWord && sFrom ) {
        if (sFrom === "a.uid") {
            addQry +=  ` and a.uid = '${sWord}' `;
            start_date = end_date = '';
        }
    }

    if (start_date  != "")  addQry         += ` and a.order_date >= '${start_date}000000' `;
    if (end_date    != "")  addQry         += ` and a.order_date <= '${end_date}235959' `;
    if (cancel      == "")  addQry         += ` and (in_status != '9')  `;
    if (b2bSiteCode != "")  addQry         += ` and a.site_code = '${b2bSiteCode}'`;
    if (GU10        != "")  addQry         += ` and (in_status = '${GU10}' ) `;
    if (GU11        != "")  addQry         += ` and (d.seat_status = '${GU11}' )`;

        try {
            
            const totQuery = `
                select count(*) as total from  interline as a (nolock)  
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
            
            const baseQuery = `
            select 
                ${fieldQry}
                from (
                select * from
                    (select a.uid , ROW_NUMBER() OVER (order by a.uid desc ) as RowNum
                        from 
                        interline as a (nolock)  
                        ${joinQry}
                        where   
                        ${addQry}
                        
                    ) as db1
                where RowNum BETWEEN ${startRow} AND ${endRow}
                ) as main
                left outer join interline as a (nolock) on main.uid = a.uid
                ${joinQry}
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
                let issue_name    = '';
                let order         = '';
                let QuoteDateHTML = '';
                let QuoteDate     = data.QuoteDate || '';
                let in_status     = data.in_status || '1';
                let issue_date    = data.issue_date;
                let NOWS          = deps.getNow().NOWS;
                let status        = data.status || '';
                let ticket_number = data.ticket_number || '';
                let issue_req     = data.issue_req;
                let atr_yes       = data.atr_yes;
                let quoteCount    = data.quoteCount;
                let RecLoc        = data.pnrAlpha || '';
                let RecLoc2        = data.pnrAlpha2 || '';
                let TL            = data.TL;
                let paxName       = data.paxName;
                let org_order     = data.org_order || '';
                let searchGrade   = data.searchGrade || '';
                let issueReqTime  = data.issue_req_time || '';
                let RecLocData    = RecLoc;
                let inStatusData  = '';
                let seatColor     = '';
                let Price_Key     = data.Price_Key || '';
                if (Price_Key) Price_Key = deps.aes128Decrypt(deps.getNow().aviaSecurityKey,Price_Key);
                
                if (RecLoc2) RecLocData += `<br>${RecLoc2}`;

                for (let i = 1; i <= 2; i++) {
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
                
                if (data.site_name != '') site_name = data.site_name || '';
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
	            else paxName = `<font color='brown'><div style=' white-space: nowrap; overflow: hidden; text-overflow: ellipsis;' title='${paxName}'>${paxName}</div></font>`;

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
                    <tr  onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor='#FFFFFF'" bgcolor='#FFFFFF'>
                        <td class="" style='background-color:${bgcolor2}'><a href="javascript://" onclick="return domStart('${uid}','status')" style="color:#222;font-weight:600;">${uid}</a> ${status} ${org_order} ${searchGrade}</td>
                        <td class="">${site_name}</td>
                        <td class="">${in_date}</td>
                        <td class="">${air_code}</td>
                        <td class="">${citycode}</td>
                        <td class="">${arrInterType[data.ticket_type] || ''}</td>
                        <td class="">${paxName} ${RecLocData} <br><span class="${seatColor}"> ${seat_status} </span></td>
                        <td class="">${members}</td>
                        <td class="">${data.total_amount?.toLocaleString() || 0} </td>
                        <td class="">${cutDateTime(TL,'S' || '')} <br> ${Price_Key}</td>
                        <td class="">${cutDateTime(data.order_date,'S' || '')} <br> ${cutDateTime(issue_date,'S' || '')}</td>
                        <td class="">${username}</td>
                        <td class="">${inStatusData || ''} <br> ${issue_name || ''}</td>
                        <td class=""></td>
                        <td class="">${order} ${QuoteDateHTML}</td>
                    </tr>
                `;
            });
            if (!rows) rows = `<tr><td colspan="15" class="ac hh50">데이터가 없습니다.</td></tr>`;
            listHTML = `
                <table class='search-table' id='dtBasic'>
                    <tr >
                        <th class="wh80">No.</th>
                        <th>거래처</th>
                        <th class="wh110">탑승일</th>
                        <th class="wh100">항공</th>
                        <th>구간</th>
                        <th class="wh50">구분</th>
                        <th>PNR</th>
                        <th class="wh50">승객</th>
                        <th>금액</th>
                        <th class="wh100">TL</th>
                        <th class="wh130">신청일 <br> 완료일</th>
                        <th class="wh100">예약<br>발권</th>
                        <th class="wh150">상태</th>
                        <th class="wh100">환불</th>
                        <th>발권</th>
                    </tr>
                    ${rows}
                </table>
            `;
            res.json({ success:'ok', listData: listHTML , pageData: pageHTML , totalCount: totalRowCount });
        } catch (err) {
            console.error('에러:'+err);
            res.status(500).send('Database error');
        } finally {
            //await sql.close();
        }
    //} 
	
};

