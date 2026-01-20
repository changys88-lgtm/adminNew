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
    const mainTable   = 'refundList';
    const pool        = await deps.getPool();
    
    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }
    
    if (GU1 !== "")		    addQry += ` and GiveTake = '${GU1}' `;

    try {
        const fieldQry = `
            a.* , b.username as refName, c.gubun_code, c.out_site, c.finish_date, c.void as void2 , d.content
        `;

        const joinQry = `
            left outer join tblManager as b on a.operator=b.member_code 
            left outer join money_act as c on a.out_number = c.ticket_num 
            left outer join money_act_minor as d on c.ticket_num = d.ticket_num and d.minor_num = '1'
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
        let  gubun_code_name = '';
        for (const row of result.recordset) {
            let { 
                up_date  , d_account_name , refund_amount , out_number , content , out_site , order_num , finish_date , refName
                , gubun_code , money_type , confirm  
                
            } = row;
            let bgcolor = 'fff' , font = '';
            if (gubun_code === "1") gubun_code_name = "<font color=red>입금</font>"; else gubun_code_name = "<font color=blue>지출</font>";
           
            rows += `
                <tr  HEIGHT=29  onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor='#${bgcolor}'" bgcolor='#${bgcolor}'>
                    <td ><span class='btn_slim btn_yellow' onClick="return modMoney('${out_number}','${gubun_code}','${money_type}')">${out_number}</span></td>
                    <td class='$color'>${deps.cutDateTime(up_date,'S')}</td>
                    <td class='$color'>${gubun_code_name}</td>
                    <td class='$color'>${content}</td>
                    <td class='$color'>${d_account_name}<br>${out_site} <font color='red'>${confirm || ''}</font></td>
                    <td class='ac $color' style='padding-left:10px;'>${order_num}</td>
                    <td class='ar $color'>${deps.numberFormat(refund_amount)}</td>
                    <td class='$color'>${refName || ''}</td>
                    <td class='$color'>${deps.cutDate(finish_date)}</td>
                </tr>
            `;
            ix ++;
        };

        if (!rows) {
            rows = `<tr><td colspan='20' class='ac hh50'>검색된 데이터가 없습니다.</td></tr>`;
        }
        listHTML = `
            <table class='table table-light text-center mt-3' border=1 bordercolor='#ddd' style='border-bottom:1px solid #ddd;' id='dtBasic'>
                <tr style='background-color:#eee;'>
                    <th >전표번호</th>
                    <th >작성일</th>
                    <th >구분</th>
                    <th >상세 내용</th>
                    <th >거래처</th>
                    <th >결의서내용</th>
                    <th >금액</th>
                    <th >작성자</th>
                    <th >처리일</th>
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

