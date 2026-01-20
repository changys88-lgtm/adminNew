const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { getPagination } = require('../../src/utils/paging'); 
const { arrNotice } = require('../../src/utils/airConst'); 


module.exports = async (req, res) => {
    let   start_date  = req.body.start_date || '';
    let   end_date    = req.body.end_date || '';
    let   GU1         = req.body.GU1     || '';
    let   GU2         = req.body.GU2     || '';
    let   GU3         = req.body.GU3     || '';
    let   GU4         = req.body.GU4     || '';
    let   startNo     = req.body.startNo || '';
    const gubun       = req.body.gubun   || '';
    const page        = req.body.page    || '1';
    const listCount   = req.body.listCount;
    const sWord       = req.body.sWord   || '';
    const sFrom       = req.body.sFrom   || '';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const pool        = await deps.getPool();
    const sql         = deps.sql;
    const mainTable   = 'card_auth';

    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }

    if (start_date !== "")	addQry += ` and a.up_date >= '${deps.StrClear(start_date)}000000' `;
    if (end_date !== "")	addQry += ` and a.up_date <= '${deps.StrClear(end_date)}235959' `;
    if (GU1 === "Y")		addQry += ` and (settle_days = '' or settle_days is null) and a.resultcode = '0000' `;
    if (GU2 !== "")			addQry += ` and a.status = '${GU2} ' `;
    if (GU3 !== "")			addQry += ` and a.settle_status = '${GU3}' `;
    if (startNo === "Y")	addQry += ` and osm.start_day = '' `;
    
    try {
        const fieldQry = `
            a.* 
            , c.order_num , c.order_name ,c.handphone, c.site_code , c.total_amount , d.site_name
            , (select top 1 tourName from Products where tourNumber = (select top 1 tourNumber from orderSheet_minor where order_num = c.order_num )) as tourName , e.site_name as supply_site_name
        `;

        const joinQry = `
            left outer join orderSheet as c on a.order_uid = c.uid 
            left outer join orderSheet_minor as osm on c.order_num = osm.order_num and minor_num = '1' 
            left outer join site as d on c.site_code = d.site_code  
            left outer join site as e on c.supplySiteCode = e.site_code  
        `;
        const totQuery = `
            select count(*) as total from  
            ${mainTable} as a (nolock)  
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
        let   ix = 0 ;
        let   font = '';
        let   link = '';
        const cardAuthCode = {
            "1":"대기",
            "2":"완료",
            "3":"불가능",
            "9":"취소"
        };
        for (const row of result.recordset) {
            let { 
                uid , Owner , goods_name , site_name , supply_site_name , order_name , tourName , auth_account , auth_number , memo , result_code , order_uid 
                , order_num , total_amount , amount , installment , up_date , startDay , status , settle_status , TID , kakaopay_tid
                , interline_uid , interline_minor , atr_yes
            } = row;
            
            if (kakaopay_tid !== "") {
                Owner = "<br>Kakao";
                TID   = auth_account;
            }
            else Owner = "";

            if (order_num != "") order_num = `<br><span onClick="return goodStart('${order_num}')">${order_num}</span>`;
            if (order_uid !== "") {
                order_uid = `
                    <div ID='Order_${uid}' ondblClick="changeView('${uid}')">${order_uid}</div>
                    <div class='none' ID='OrderNew_${uid}'><input type='' class='form-smooth ac wh80' onChange="dataChange('orderChange','${uid}',this.value)" value='${order_uid}'></div>
                `;
            }
            if (interline_uid > 0) {
                order_uid = order_num = "";
                if (interline_minor > 0) interline_minor = " - " + interline_minor;
                order_uid = `<span onClick="return issueStart('${interline_uid}','${atr_yes}')">${interline_uid} ${interline_minor}</span>`;
            }

            rows += `
                <tr  HEIGHT=29  onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor='#FFFFFF'" bgcolor='#FFFFFF'>
                    <td >${font}${uid} ${Owner}</td>
                    <td >${font}${goods_name || ''}</td>
                    <td >${font}${site_name || ''}</td>
			        <td >${font}${supply_site_name || ''}</td>
                    <td >${font}${order_name || ''} <br>${tourName || ''}</td>
                    <td >${font}${auth_account || ''}<br>${TID || ''}</td>
                    <td >${font}${link}${auth_number || ''}</a><Br>${memo || ''}</td>
                    <td >${font}${result_code || ''}</td>
                    <td >${font}${order_uid || ''} ${order_num || ''}</td>
                    <td >${font}${deps.numberFormat(total_amount || 0)}</td>
                    <td >${font}${deps.numberFormat(amount || 0)}</td>
                    <td >${font}${installment}</td>
                    <td >${font}${deps.cutDateTime(up_date || '')} ${startDay || ''} </td>
                    <td >${font}${cardAuthCode[String(status).trim()] || ''} </td>
                    <td >${font}${settle_status || ''}</td>
                </tr>
            `;
            ix ++;
        };

        listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr >
                    <th>No</th>
					<th>구분</th>
					<th>거래처</th>
					<th>공급처</th>
					<th>주문정보</th>
					<th>거래번호</th>
					<th>승인번호</th>
					<th>결과코드</th>
					<th>정산번호</th>
					<th>판매금액</th>
					<th>결제금액</th>
					<th>할부</th>
					<th>등록일</th>
					<th>상태</th>
					<th>정산상태</th>
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

