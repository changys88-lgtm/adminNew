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
    const mainTable   = 'air_refund';
    const pool        = await deps.getPool();
    
    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }
    
    if (GU1 !== "")		    addQry += ` and GiveTake = '${GU1}' `;

    try {
        const fieldQry = `
            a.* 
            ,b.username,d.pax_name,d.dsr_type,d.grp_type,d.downdate,d.iatanumber,d.card_type,d.auth,e.sex,e.uid_minor as interline_uid, h.downdate as downdate2,j.start_day , k.site_name
	        , (select count(uid) from site_refund as d where a.air_line_code = air_line_code and a.ticket_number = ticket_number) as sCnt , m.treatment , m.defray
        `;

        const joinQry = `
            left outer join tblManager as b on a.operator=b.member_code 
            left outer join AirTickets as d on a.ticket_number = d.ticket_number and d.ticket_type = 'S' and d.air_line_code = a.air_line_code 
            left outer join interline_pax as e on e.ticket_number = a.air_line_code + a.ticket_number 
            left outer join interline as f on f.uid = e.uid_minor  
            left outer join AirTickets as h on a.ticket_number = h.ticket_number and h.ticket_type = 'R' and a.air_line_code = h.air_line_code 
            left outer join AirTickets_minor as j on j.ticket_number = d.ticket_number and d.air_line_code = j.air_line_code 
            left outer join site as k on a.site_code = k.site_code 
            left outer join money_act as m on a.out_number = m.ticket_num 
            left outer join interline_minor as mm on a.inter_uid = mm.uid_minor  
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
                (select a.uid , ROW_NUMBER() OVER (order by a.uid desc ) as RowNum
                    from 
                    ${mainTable} as a (nolock)  
                    ${joinQry}
                    where   
                    ${addQry}
                    
                ) as db1
            where RowNum BETWEEN ${startRow} AND ${endRow}
            ) as main
            left outer join ${mainTable} as a (nolock) on main.uid = a.uid
            ${joinQry}
            
            order by RowNum asc
        `;
        //console.log(baseQuery)
        const result = await pool.request().query(baseQuery);
        let   rows = ``;
        let  ix = 0 ;
        let  statusName = "";
        let  outHTML    = '';
        let  inHTML     = '';
        for (const row of result.recordset) {
            let { 
                up_date , uid , air_line_code , ticket_number , dsr_type , grp_type , pax_name , site_code , site_name , refund_amount , re_comm , refund_point , re_ok
                , interline_uid , username , amount , refund_company , status , downdate , sex , routing , auth , start_day , card_type , treatment , defrayName , out_number
            } = row;
            let bgcolor = 'fff' , font = '';
            
            
                 if (status === "1") statusName = "대기";
            else if (status === "2") statusName = "<font color=blue>완료</font>";
            else if (status === "3") statusName = `<a ondblClick="return pointClear('${uid}','${GU3}','REPOINT')"><font color=green>Clear</font></a>`;
            else if (status === "8") statusName = "<font color=red>VOID</font>";
            else if (status === "9") statusName = "<font color=brown>취소</font>";

            if (re_ok === "Y") outHTML = "<font color=brown>카드 reCall</font>";
            else if (out_number != "") {
                if (b2bMASTER == "Y") {
                    outHTML = `<a href=javascript:// onClick="return settleView('${out_number}','2')"><font color=blue>${defrayName}</font></a><br><font color='red'>${deps.cutDate(treatment)}</font>`;
                } else {
                    outHTML = `<font color='red'>${defrayName}<br>${treatment}</font>`;
                }
            }
            else outHTML = "대기";

            outHTML = '';
            inHTML = '';

            rows += `
                <tr  HEIGHT=29  onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor='#${bgcolor}'" bgcolor='#${bgcolor}'>
                    <td align=center >${font}<span class='btn_slim btn_yellow' onClick="return newReg('${uid}','modify')">${uid}</span></td>
                    <td align=center class='ac'>
                        <span  id='ref1_${uid}' ondblClick="return doubleChange('ref1_${uid}','ref2_${uid}')"  >${deps.cutDateTime(up_date,'S')}</span>
                        <span  id='ref2_${uid}'  style='display:none'><input type=text  class='wh120 ac' value='${up_date}' onChange="dataChange(this.value,'${uid}')"></span>
                        <br><font color=blue>${deps.cutDate(downdate)}</font>
                    </td>
                    <td align=center >${font} <span class='btn_slim btn_yellow' onClick="modTicket('${air_line_code}','${ticket_number}','R')">${air_line_code}-${ticket_number}</span> <font color='red'>${card_type}</font> <br>${deps.cutDate(start_day.slice(0,8))} </td>
                    <td align=center >${font}${dsr_type}${grp_type}/${sex}</td>
                    <td align=center >${font}${pax_name} <BR>${routing}</td>
                    <td align=center > ${font}${site_name}<br> ${site_code} </td>
                    <td align=right  >${font} ${deps.numberFormat(refund_amount)} ${re_comm}</td>
                    <td align=right  >${font} ${deps.numberFormat(refund_company)}</td>
                    <td align=right  >${font} ${refund_point}</td>
                    <td align=center >${username}</td>
                    <td align=center >${outHTML} ${inHTML} ${auth || ''}</td>
                    <td align=center ><a href=javascript:// onClick="return issueStart('${interline_uid}')"><font color='blue'>${interline_uid}</font></a> ${amount || ''} ${statusName}</td>
                    <td align=center ><a href=javascript:// onClick="return refundDel('${uid}')">삭제</a></td>
                </tr>
            `;
            ix ++;
        };

        if (!rows) {
            rows = `<tr><td colspan='20' class='ac hh50'>검색된 데이터가 없습니다.</td></tr>`;
        }
        listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr>
                    <th>No</th>
                    <th>접수일</th>
                    <th>티켓번호</th>
                    <th>구분</th>
                    <th>승객명</th>
                    <th>거래처</th>
                    <th>환불금액</th>
                    <th>수수료</th>
                    <th>Point</th>
                    <th>담당자</th>
                    <th>지출결의서</th>
                    <th>주문서</th>
                    <th>삭제</th>
                </tr>
                ${rows}
            </table>
        `;
        res.json({success : 'ok', listData: listHTML , pageData: pageHTML , totalCount: totalRowCount });
    } catch (err) {
        console.error('에러:'+err);
        res.status(500).send('Database error');
    }
	
};

