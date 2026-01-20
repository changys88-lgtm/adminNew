const deps = require('../../src/common/dependencies');
const { getPagination } = require('../../src/utils/paging'); 

module.exports = async (req, res) => {
    let   start_date  = req.body.start_date || '';
    let   end_date    = req.body.end_date || '';
    const cancel      = req.body.cancel || '';
    let   page        = req.body.page || '1';
    const listCount   = req.body.listCount;
    const sWord       = req.body.sWord || '';
    const sFrom       = req.body.sFrom || '';
    const GU1         = req.body.GU1 || '';
    const GU2         = req.body.GU2 || '';
    const GU3         = req.body.GU3 || '';
    const GU4         = req.body.GU4 || '';
    const GU5         = req.body.GU5 || '';
    const GU6         = req.body.GU6 || '';
    const GU7         = req.body.GU7 || '';
    const GU8         = req.body.GU8 || '';
    const GU9         = req.body.GU9 || '';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const aes128Encrypt = deps.aes128Encrypt;
    const aes128Decrypt = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;

    //if (mode == "Notice") {
    let addQry        = ` 1=1  `;
    if (sWord && sFrom ) {
        if (sFrom === "a.uid") {
            addQry +=  ` and a.uid = '${sWord}' `;
            start_date = end_date = '';
        } else {
            addQry += ` and ${sFrom} like '%${sWord}%'`; 
        }
    }

    if (start_date  !== "") {
        start_date = deps.StrClear(start_date);
        if (GU6 === "start_day") addQry         += ` and c.start_day >= '${start_date}' `;
        else addQry         += ` and a.order_date >= '${start_date}000000' `;
    }
    if (end_date    !== "") {
        end_date = deps.StrClear(end_date);
        if (GU6 === "start_day") addQry         += ` and c.start_day <= '${end_date}' `;
        else addQry         += ` and a.order_date <= '${end_date}235959' `;
    }  
    if (b2bSiteCode !== "")   addQry         += ` and a.site_code = '${b2bSiteCode}'`;
    if (GU3 === "4")          addQry         += " and a.status in_status ('4','5') ";
    else if (GU3 === "T")     addQry         += " and a.order_num like 'T%' ";
    else if (GU3 !== "")      addQry         += ` and a.status = '${GU3}' `;
    if (GU3         !== "T")  addQry         += " and a.order_num not like 'T%'";
    if (GU9         === "Y")  addQry         += " and c.start_day != '' ";
    else if (GU9 === "N")     addQry         += " and c.start_day = '' ";
    if (cancel === "")        addQry         += " and a.status != '9' ";
    if (GU1 === "C")		  addQry         += " and a.status = '9' ";
    else if (GU1 !== "")      addQry         += ` and pay_finish = '${GU1}'  `;

    const joinQry = `
        left outer join tblManager as b (nolock)  on a.manager = b.member_code 
        left outer join orderSheet_minor as c (nolock)  on a.order_num = c.order_num and c.minor_num = '1' 
        left outer join Products as d (nolock)  on c.tourNumber = d.tourNumber 
        left outer join site as f (nolock)  on a.site_code = f.site_code 
        left outer join site as g (nolock)  on d.site_code = g.site_code 
        left outer join site_manager as pm (nolock)  on a.partner_manager = pm.man_id and a.site_code = pm.site_code
        left outer join Products_option as po on c.tourNumber = po.tourNumber and c.option_code = po.minor_num
    `;


    const pool = await deps.getPool();
    
    const totQuery = `
        select count(*) as total from  ordersheet as a (nolock)  
        ${joinQry}
        where
        ${addQry}
    `;
    //console.log(totQuery);
    const result2 = await pool.request().query(totQuery);
    const totalRowCount = result2.recordset[0].total;
    if (totalRowCount < listCount) page = 1;
    const { startRow, endRow, pageHTML } = getPagination({
        tot_row: totalRowCount,
        page: page ,
        listCount: listCount
    });
    let memoQry = '';
    if (b2bSiteCode) memoQry = " and (out_ok != 'N' or out_ok is null ) ";
    const fieldQry = `
        , ( select count(*) from dat_table where db_name = a.order_num ${memoQry} ) as memoCnt
        , ( select count(*) from couponData where order_num = a.order_num ) as couponCount
        , ( select sum(amount) from couponData where order_num = a.order_num ) as couponAmount
        , ( 

        isnull((select sum(amount) from ordersheet_payment as a1 left outer join money_act as b1 on a1.ticket_num = b1.ticket_num  where a1.order_num = a.order_num and b1.account != '1400' and b1.void is null),0) 
        + isnull((select sum(amount) from card_auth as ca where order_uid = a.uid  and ( a.site_code != 'OY00999' or a.site_code is null ) and (result_code = '0000' or result_code = 'O') and (settle_ignore = '' or settle_ignore is null)),0)
        
        ) as sumInput 
        , (select sum(total_price) from orderSheet_outsite where order_num = a.order_num) as add_amount
        , (select sum(c1.amount) from ordersheet_payment as a1 inner join money_act as b1 on a1.ticket_num = b1.ticket_num inner join money_act_minor as c1 on b1.ticket_num = c1.ticket_num and c1.sub_items = 'PGC' where a1.order_num = a.order_num and b1.account != '1400' and b1.void is null) as cardComm
        , f.site_name, g.site_code as  supplier_site_code, g.site_name as supplier_site_name
        , pm.manager as partnerManager , d.tourName
        , c.start_day , c.currency , c.sub_pro_name , c.tourNumber
        , po.roomType
    `;
    const inputQry = `
        , case when total_input > 0 then total_input
          when room_count = 0 and terms > 1 then ( select Sum(terms * input_price * adult_member ) from ordersheet_minor where order_num = a.order_num ) 
          when terms = 0 then ( select Sum( input_price * adult_member ) from ordersheet_minor where order_num = a.order_num ) 
          else ( select Sum(room_count * terms * input_price) from ordersheet_minor where order_num = a.order_num ) end as input_amount 
    `;

    let Sorting = '';
    let order1  = '';
    if (GU8 === "start1") {
        Sorting = "start_day";
        order1 = "asc";
    } else if (GU8 === "start2") {
        Sorting = "start_day";
        order1 = "desc";
    }else if (GU8 === "start3"){
        Sorting = "startchkdate";
        order1 = "desc";
    } else {
        Sorting = "a.order_num";
        order1 = "desc";
    }
    
    const sqlQuery = `
            select * from
                (select a.uid , ROW_NUMBER() OVER (order by ${Sorting} ${order1} ) as RowNum
                    from 
                    ordersheet as a (nolock) ${joinQry}
                    where ${addQry}
                ) as db1
            where RowNum BETWEEN ${startRow} AND ${endRow}
            `;
    const sqlResult = await pool.request().query(sqlQuery);
    const aUid = [];
    for (const sqlRow of sqlResult.recordset) {
        const uid = sqlRow.uid;
        aUid.push(uid);
    }
    //console.log(aUid);

    const baseQuery = `
        select
            a.*   ${fieldQry} ${inputQry}
            from 
            ordersheet as a (nolock) ${joinQry}
        where a.uid in (${aUid.join(',')}) order by ${Sorting} ${order1}
    `;
        
    //console.log(baseQuery)
    const result = await pool.request().query(baseQuery);
    let   list = ``;
    
    for (let row of result.recordset) {
        let {
            order_num , uid ,  couponCount , order_date , tourName , site_name , order_name , handphone , start_day , username
            , currency , total_amount , couponAmount , input_amount , status , pay_finish , booking_number , partnerManager , sub_pro_name
            , roomType , tourNumber , adult_member , child_member, infant_member , orderPos , memoCnt ,supplier_site_name
        } = row;
        if ((handphone || '').length > 20) handphone    = aes128Decrypt(aviaSecurityKey,handphone);
        let managerName = '';
        if (partnerManager) managerName = partnerManager;
        else if (b2bMASTER === "Y") managerName = username;
        font = '';
        currency = currency?.length > 1 ? currency += '<br>' : ''; 
        if (couponCount > 0) couponCount = "ⓒ"; else couponCount = "";
        if (sub_pro_name) tourName = sub_pro_name;
        member = `ADT${adult_member}`;
        (child_member  > 0) ? member += `/CHD${child_member}`  : '';
        (infant_member > 0) ? member += `/INF${infant_member}` : '';
        let memo = '';
        (memoCnt > 0) ? memo = `<span class='btn btn-yellow-sm ' style='height:20px;padding:0 10px 0 10px !important' href='javascript://' onClick="return memoList('${order_num}')" >메모 ${memoCnt}</span>` : '';
        list += `
            <tr height="29" onmouseover="this.style.backgroundColor='#f3f3f3'" onmouseout="this.style.backgroundColor=''" bgcolor="#ffffff">
                <td >${font} <input type='checkbox' class='CheckData' value='${order_num}' name='changeData[]' id='pick_${order_num}' /></td>
                <td class=""><span class='btn_slim btn_yellow nowrap' onClick="return newReg('${order_num}')">${order_num}</span> <br> ${uid} ${couponCount}</td>
                <td class="">${deps.cutDateTime(order_date,'S')} <br> ${orderPos} <br> ${site_name}</td>
                <td class="al"><b>${tourName}</b> <br>${roomType} (${tourNumber})<br>${member} ${memo} <br> ${supplier_site_name}</td>
                <td class="">${order_name}</td>
                <td class="">${deps.telNumber(handphone)}</td>
                <td class="">${deps.cutDate(start_day)}</td>
                <td class="">${currency} ${deps.numberFormat(total_amount - couponAmount)}</td>
                <td class="">${currency} ${deps.numberFormat(input_amount)}</td>
                <td class="">${status}</td>
                <td class="">${pay_finish || ''} </td>
                <td class="" ID='LimitTime_${uid}'></td>
                <td class="">${booking_number || ''}</td>
                <td class="">${managerName || ''}</td>
            </tr>
        `;
    };

    listHTML = `
        <table class='search-table' id='dtBasic'>
            <tr >
                <th class="border-bottom-0 th-sm wh40"><input type="checkbox" id="cbx_chkAll" /></th>
                <th class="wh120">No</th>
                <th  class='border-bottom-0 th-sm'>구매일</th>
                <th  class='border-bottom-0 th-sm'>상품명</th>
                <th  class='border-bottom-0 th-sm'>구매자명</th>
                <th  class='border-bottom-0 th-sm'>연락처</th>
                <th  class='border-bottom-0 th-sm'>이용일</th>
                <th  class='border-bottom-0 th-sm'>판매가</th>
                <th  class='border-bottom-0 th-sm'>원가</th>
                <th  class='border-bottom-0 th-sm'>상태</th>
                <th  class='border-bottom-0 th-sm'>결제</th>
                <th  class='border-bottom-0 th-sm'>TL</th>
                <th  class='border-bottom-0 th-sm'>컨펌번호</th>
                <th  class='border-bottom-0 th-sm'>담당자</th>
            </tr>
            ${list}
        </table>
    `;
    res.json({ success:'ok', listData: listHTML , pageData: pageHTML , totalCount: totalRowCount  });
	
};

