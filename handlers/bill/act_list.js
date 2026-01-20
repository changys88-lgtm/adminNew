const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { getPagination } = require('../../src/utils/paging'); 

const fieldQry = `
    a.* 
    , b.username , e.site_name ,e.confirm , f.username as username2 ,c.AccountName , g.up_date as sendDate
    ,(select top 1 content from money_act_minor where a.ticket_num = ticket_num and minor_num = '1' ) as content1 
    ,(select top 1 content from money_act_minor where a.ticket_num = ticket_num and minor_num = '2' ) as content2 
    , case when a.ticket_gubun = 'C' then ( select finish_date from money_act where ticket_num = a.p_ticket_num ) else '' end as p_finish_date 
`;

//left outer join interline as a (nolock) on main.uid = a.uid   
const joinQry = `
    left outer join tblManager as b on a.operator=b.member_code 
    left outer join BillAccount as c on a.account = c.AccountCode 
    left outer join site as e on a.out_site = e.site_code  
    left outer join tblManager as f on a.out_site = f.member_code  
    left outer join money_send as g on a.ticket_num = g.ticket_num 
    left outer join site_manager as z on a.operator= z.man_id 
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
    const pool = await deps.getPool();

    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        if (sFrom === "a.uid") {
            addQry +=  ` and a.uid = '${sWord}' `;
            start_date = end_date = '';
        } else {
            addQry +=  ` and ${sFrom} like '%${sWord}%' `;
        }
    }

    if (start_date  != "")  addQry         += ` and a.order_date >= '${start_date}000000' `;
    if (end_date    != "")  addQry         += ` and a.order_date <= '${end_date}235959' `;
    if (b2bSiteCode != "")  addQry         += ` and a.site_code = '${b2bSiteCode}'`;
    if (gMode === "3")      addQry         += ` and gubun_code = '2' and (defray != 'Y' or defray is null ) and void is null `;
    else if (gMode === "4") addQry         += ` and gubun_code = '2' and (defray != 'Y' or defray is null ) and void is null and out_yn = 'Y' `;
    else if (gMode === "5") addQry         += ` and account = '' `; 
    else if (gMode)         addQry         += ` and gubun_code = '${gMode}' `;    
        try {
            
            const totQuery = `
                select count(*) as total from  money_act as a (nolock)  
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
                    (select a.ticket_num , ROW_NUMBER() OVER (order by a.ticket_num desc ) as RowNum
                        from 
                        money_act as a (nolock)  
                        ${joinQry}
                        where   
                        ${addQry}
                        
                    ) as db1
                where RowNum BETWEEN ${startRow} AND ${endRow}
                ) as main
                left outer join money_act as a (nolock) on main.ticket_num = a.ticket_num
                ${joinQry}
                order by RowNum asc
            `;
            const result = await pool.request().query(baseQuery);
            let   rows = ``;
            let ix = 0 ;
            for (const row of result.recordset) {
                let { 
                    gubun_code , ticket_num , status , money_type , username , treatment , up_date , account, AccountName , total_amount , rate1 , finish_date
                    , rate_unit , members1 , amount1 , input_name , site_name , username2 , out_site , confirm , content1 , content2 , d_account_name , cach
                    , defray, ticket_gubun
                } = row;
                let color = '' , link = '' , acceptCheckbox = '', prepayButton = '' , sendDate = '' , read1 = '' , msg_rate = '' ;
                const gubun_code_name = (gubun_code === "1") ? "<span class='cored'>입금</span>" : "<span class='coblue'>지출</span>";
                if (rate1 > 1) msg_rate = `${amount1}${rate_unit}/${rate1}/${members1}`;
	            else msg_rate = "";
                let siteName = input_name;
                if (siteName === "") siteName = site_name;
                if (siteName === "") siteName = username2;
                if (siteName === "") siteName = username;
                let cashData = (cach === "Y") ?  "<br><span color=red>현금지급</span>" : "";
                defray = (defray === "Y") ? "<span class='coblue'>완료</span>" : "";
                let bgcolor = "FFFFFF";
                if (ticket_gubun !== "") {
                         if (ticket_gubun === "P") bgcolor = "DDD";
                    else if (ticket_gubun === "C") bgcolor = "EEE";
                }
                rows += `
                <tr  HEIGHT=29  onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor='#${bgcolor}'" bgcolor='#${bgcolor}'>
                        <td class='${color}'><span class='btn_slim btn_yellow' onClick="return newReg('${ticket_num}','${gubun_code}','${money_type}')">${ticket_num}</span> ${sendDate}</td>
                        <td class='${color}'><span title="${up_date}">${deps.cutDate(treatment)}</span></td>
                        <td class='${color}'>${gubun_code_name}</td>
                        <td class='${color}'>
                            <input type=text style='width:40px'  class=input01 value='${account}' tabindex='100' name=accountCode_${ticket_num} ${read1}
                             onkeyup="accountNext(this.value,'${ticket_num}','${ix}','${gubun_code}')" onChange="accountCheck(this.value,'${ticket_num}','${ix}','${gubun_code}')"> 
            
                            <input type=text  class=input01 value='${AccountName}' name=accountName_${ticket_num} readonly style='width:110px'></td>
                        <td class='${color}'>${siteName}<br>${out_site} <span class='cored'>${confirm || ''}</span></td>
                        <td class='${color}'>${d_account_name}</td>
                        <td class='al ${color}' style='padding-left:10px;'>${content1}<br>${content2 || ''}</td>
                        <td class='${color} ar'>${deps.numberFormat(total_amount)} <br>${msg_rate}</td>
                        <td class='${color}'>${username || ''}</td>
                        <td class='${color}'>${deps.cutDate(finish_date)}${cashData}</td>
                        <td class='${color}'>${link}${defray}${acceptCheckbox}${prepayButton}</a></td>
                    </tr>
                `;
                ix ++;
            };

            listHTML = `
                <table class='table table-light text-center mt-3' border=1 bordercolor='#ddd' style='border-bottom:1px solid #ddd;' id='dtBasic'>
                    <tr style='background-color:#eee;'>
                        <th width="90">전표번호</th>
                        <th width="90">작성일</th>
                        <th width="50">구분</th>
                        <th  width="200">계정</th>
                        <th >거래처</th>
                        <th >직접입력<br>예금주</th>
                        <th >결의서내용</th>
                        <th width="90">금액</th>
                        <th width="60">작성자</th>
                        <th width="110">처리일</th>
                        <th width="60" onClick="allCheck()">지출</th>
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

