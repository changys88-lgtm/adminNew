const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { getPagination } = require('../../src/utils/paging'); 
const { arrBankCode } = require('../../src/utils/airConst'); 

const fieldQry = `
    a.* 
    , case when a.gubun_code = '6002' and a.ticket_num != '' then (select '<br>'+content from money_act_minor where ticket_num = a.ticket_num and minor_num = 1) else '' end as outData1  
    , case when a.gubun_code = '6002' and a.ticket_num != '' then (select '<br>'+content from money_act_minor where ticket_num = a.ticket_num and minor_num = 2) else '' end as outData2      
    , CASE WHEN a.journal='Y' THEN jm.minors_json ELSE NULL END AS journal_details
`;

//left outer join interline as a (nolock) on main.uid = a.uid   
const joinQry = `
    left outer join VisualBank_minor as m on a.uid = m.uid_minor and m.minor_num = 1 
`;
module.exports = async (req, res) => {
    const data          = req.body;
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
    const pool        = await deps.getPool();

    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        if (sFrom ===  "site_code")                         addQry += ` and ( (b.site_code like '%${sWord}%' or a.site_code like '%${sWord}%' ) ) `;
        else if (sFrom ===  "name")                         addQry += ` and (d.site_name like '%${sWord}%' ) `;
        else if (sFrom ===  "a.uid" || sFrom ===  "in_amt") addQry += ` and (${sFrom} = '${sWord}' ) `;
        else if (sFrom ===  "error")                        addQry += ` and (a.result_code != '0000' or a.not_accept = '1') `;
        else if (sFrom ===  "content")                      addQry += ` and (select count(*) from money_act_minor where ticket_num = a.ticket_num and minor_num in ('1','2') and content like '%${sWord}%') > 0 `;
        else                                                addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }

    if (start_date  != "")  addQry         += ` and a.bn_day >= '${deps.StrClear(start_date)}' `;
    if (end_date    != "")  addQry         += ` and a.bn_day <= '${deps.StrClear(end_date)}' `;
    if (b2bSiteCode != "")  addQry         += ` and a.site_code = '${b2bSiteCode}'`;

    try {
        
        const totQuery = `
            select count(*) as total from  VisualBank as a (nolock)  
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
                    VisualBank as a (nolock)  
                    ${joinQry}
                    where   
                    ${addQry}
                    
                ) as db1
            where RowNum BETWEEN ${startRow} AND ${endRow}
            ) as main
            left outer join VisualBank as a (nolock) on main.uid = a.uid
            ${joinQry}
            OUTER APPLY (
                SELECT (
                    SELECT vmin.*,       e.tourName
                    FROM VisualBank_minor AS vmin
                    LEFT JOIN orderSheet AS c         ON vmin.order_num = c.uid
                    LEFT JOIN orderSheet_minor AS d   ON c.order_num = d.order_num
                    LEFT JOIN products AS e           ON d.tourNumber = e.tourNumber
                    WHERE vmin.uid_minor = a.uid  ORDER BY vmin.minor_num
                    FOR JSON PATH
                ) AS minors_json
            ) jm 
            order by RowNum asc
        `;
        //console.log(baseQuery)
        const result = await pool.request().query(baseQuery);
        let   rows = ``;
        let ix = 0 ;
        for (const row of result.recordset) {
            let { 
                uid , bn_day , bn_hi , gubun_name , in_amt , in_person , acc_date , outData1 , outData2 , bank_code , other_in , v_account , gubun_code , journal , journal_details
            } = row;
            let link = '' , bgcolor = 'fff' , font = '' , val = '' , func = '' , site_name = '' , status2 = '' , addRow = '' ;
            if (journal === "Y") {
                bgcolor = "DDDDDD"; 
                func = `<span onClick="return cancelJournal('${uid}','')"> <font color=red>분개</font></span> `;
            } else {
                bgcolor = "FFFFFF";
            }
            if (other_in === "Y") { // 수동 입금일 경우
                if (bank_code === "A1") v_account = "현금";
                site_name = "별도 입금";
            } else if (gubun_code === "1000") {
                site_name = "<font color='red'>통장 입금</font>";
            } else if (gubun_code === "6002") {
                site_name = "<font color='blue'>캐쉬 출금</font>";
            }    
            site_name += ` (${v_account})`;
            if (journal_details) {
                for (const item of JSON.parse(journal_details)) {
                    let { minor_num , tourName , order_num , amount , manager , acc_date } = item;
                    let func2 = '' , names = '' , ticket_num = '';
                    const indicate = (minor_num == 1) ? "└" : "";
                    if (!tourName) names = "일반 분개";
                    else {
                        //$sql = " select sale_price * terms from ordersheet_minor where order_num in (select order_num from ordersheet where online_order = '$order_num') ";
                        //if ($order_num) $sale_price = sqlQueryCount($sql,"");

                        names = ` 상품명 : ${tourName} ( ${order_num} ) `;
                    }
                    if (!manager) {
                        func2 = `<a href=javascript:// onClick="return MoneyProcess('${uid}-${minor_num}')"><font color=green>대기</font></a>`;
                    } else {
                        //$sql = "select ticket_num from money_act where (visual_number = '{$uid}-$minor_num'  or visual_number2 like '%{$uid}-$minor_num/%') and void is null order by ticket_num desc";
                        //$ticket_num = sqlQueryCount($sql,"$viewMode");
                        func2 = ` <a href=javascript:// onClick="return modMoney('${ticket_num}','1')"><font color=blue>완료</font></a> `;
                    }
                    addRow += `
                        <tr HEIGHT=29 class='cmn_trbgcolor_titlebg' onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor='#FFFFFF'">
                            <td  style='border-bottom:1px solid white;border-right:1px solid white;padding:0 12px 0 24px' bgcolor='#DDDDDD' class='ac'>${indicate}</td>
                            <td  align=left  colspan='' style='border-bottom:1px solid white;border-right:1px solid white;padding:0 12 0 24' bgcolor='#DDDDDD'>분개번호 : ${uid} - ${minor_num}</td>
                            <td  colspan='2' style='border-bottom:1px solid white;border-right:1px solid white' bgcolor='#DDDDDD'>${names}</td>
                            <td  style='border-bottom:1px solid white;border-right:1px solid white' bgcolor='#DDDDDD'>&nbsp;</td>
                            <td  style='border-bottom:1px solid white;border-right:1px solid white' bgcolor='#DDDDDD'>&nbsp;${deps.numberFormat(amount)}</td>
                            <td  style='border-bottom:1px solid white;border-right:1px solid white' bgcolor='#DDDDDD'>&nbsp;</td>
                            <td  style='border-bottom:1px solid white;border-right:1px solid white' bgcolor='#DDDDDD'>&nbsp;${manager}</td>
                            <td  style='border-bottom:1px solid white;border-right:1px solid white' bgcolor='#DDDDDD'>&nbsp;${deps.cutDateTime(acc_date || '','S')}</td>
                            <td  style='border-bottom:1px solid white;border-right:1px solid white' bgcolor='#DDDDDD'>&nbsp;${func2}</td>
                        </tr>
                    `;
                }
            }
            rows += `
                <tr  HEIGHT=29  onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor='#${bgcolor}'" bgcolor='#${bgcolor}'>
                    <td ondblClick="return clipSave('${val}')">${font}${uid}</td>
                    <td >${font}${deps.cutDate(bn_day)} ${deps.cutTime(bn_hi)}</td>
                    <td >${font}${arrBankCode["0"+bank_code]}</td>
                    <td colspan='3'>${font}${site_name}</td>
                    <td $Balance>${font} ${deps.numberFormat(in_amt)}</td>
                    <td class='ac'>${font}
                        <div id='BANK_$uid' $linkChange style='height:;'>${in_person} ${outData1} ${outData2}</div>
                        <div id='BANKEDIT_$uid' class='wh100' style='display:none;'><input onChange="dataChange ('${uid}','in_person',this.value) " class='form-control form-control-sm py-2 wh300' type='text' value='${in_person}' ></div>
                    </td>
                    <td >${font}${deps.cutDateTime(acc_date || '','S')}</td>
                    <td >${font}${status2 || ''}</td>
                    <td >${font}${func || ''} </td>
                </tr>
                ${addRow}
            `;
            ix ++;
        };

        listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr >
                    <th>넘버</th>
                    <th>입금날짜</th>
                    <th>은행</th>
                    <th colspan="3">계좌번호</th>
                    <th>입금액</th>
                    <th>예금주명</th>
                    <th>처리시간</th>
                    <th>취소</th>
                    <th>상태</th>
                </tr>
                ${rows}
            </table>
        `;
        res.json({ success:'ok', listData: listHTML , pageData: pageHTML , totalCount: totalRowCount });
    } catch (err) {
        console.error('에러:'+err);
        res.status(500).send('Database error');
    }
	
};

