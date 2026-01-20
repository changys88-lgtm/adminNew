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
    const mainTable   = 'vavs.dbo.VACS_VACT';
    const pool        = await deps.getPool();
    
    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }
    
    if (GU1 === "Y")		    addQry += " and reg_il != '' ";
    else if (GU1 === "N")		addQry += " and reg_il = '' ";

    try {
        const fieldQry = `
            a.* , c.site_name
        `;

        const joinQry = `
            left outer join site as c on a.site_code = c.site_code
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
                (select a.acct_no , ROW_NUMBER() OVER (order by a.acct_no desc ) as RowNum
                    from 
                    ${mainTable} as a (nolock)  
                    ${joinQry}
                    where   
                    ${addQry}
                    
                ) as db1
            where RowNum BETWEEN ${startRow} AND ${endRow}
            ) as main
            left outer join ${mainTable} as a (nolock) on main.acct_no = a.acct_no
            ${joinQry}
            
            order by RowNum asc
        `;
        //console.log(baseQuery)
        const result = await pool.request().query(baseQuery);
        let   rows = ``;
        let ix = 0 ;
        for (const row of result.recordset) {
            let { 
                uid , bank_cd , cmf_nm , acct_no , gubun_name , acct_st , tr_amt , tramt_cond , trmc_cond , trbegin_il , trbegin_si , trend_il , trend_si , site_code , reg_il , site_name
            } = row;
            let bgcolor = 'fff' , font = '';
            
                 if (acct_st === "0") acct_st = "할당전";
            else if (acct_st === "1") acct_st = "할당";
            else if (acct_st === "9") acct_st = "해지";
            
                 if (tramt_cond === "0") tramt_cond = "조건없음";
            else if (tramt_cond === "1") tramt_cond = "금액=실금액";
            else if (tramt_cond === "2") tramt_cond = "금액>=실입금액";
            else if (tramt_cond === "3") tramt_cond = "금액<=실입금액";

                 if (trmc_cond === "0") trmc_cond = "1계좌 1수납(이중입금금지)";
            else if (trmc_cond === "1") trmc_cond = "1계좌 여러수납";

            rows += `
                <tr  HEIGHT=29  onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor='#${bgcolor}'" bgcolor='#${bgcolor}'>
                    <td >${font}${arrBankCode[String(bank_cd)] || ''} ${bank_cd}</td>
                    <td >${font}${deps.BankAnySplit(acct_no)}<br>${cmf_nm || ''}</td>
                    <td >${font}${acct_st}</td>
                    <td >${font}${deps.numberFormat(tr_amt)}</td>
                    <td >${font}${tramt_cond}</td>
                    <td >${font}${trmc_cond}</td>
                    <td >${font}${deps.cutDate(trbegin_il || '')} <br> ${deps.cutTime(trbegin_si || '')}</td>
                    <td >${font}${deps.cutDate(trend_il || '')} <br> ${deps.cutTime(trend_si || '')}</td>
                    <td >${font} ${site_code || ''} <br> ${site_name || ''}</td>
                    <td >${font} ${deps.cutDate(reg_il)}</td>
                </tr>
            `;
            ix ++;
        };

        if (!rows) {
            rows = `<tr><td colspan='20' class='ac hh50'>검색된 데이터가 없습니다.</td></tr>`;
        }
        listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr >
                    <th>은행</th>
                    <th>계좌번호/통장표기명</th>
                    <th>상태</th>
                    <th>총거래금액</th>
                    <th>거래조건</th>
                    <th>수납회차</th>
                    <th>입금가능일</th>
                    <th>입금마감일</th>
                    <th>지정업체</th>
                    <th>등록일</th>
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

