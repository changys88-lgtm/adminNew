const deps = require('../../src/common/dependencies');
const { getPagination } = require('../../src/utils/paging'); 
const { arrBankCode } = require('../../src/utils/airConst'); 

module.exports = async (req, res) => {
    const GU1         = req.body.GU1 || '';
    const GU2         = req.body.GU2 || '';
    const GU3         = req.body.GU3 || '';
    const GU4         = req.body.GU4 || '';
    let   page        = req.body.page || '1';
    const cancel      = req.body.cancel || '1';
    const listCount   = req.body.listCount || 1;
    const sWord       = req.body.sWord.trim() || '';
    const sFrom       = req.body.sFrom || '';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const aes128Encrypt = deps.aes128Encrypt;
    const aes128Decrypt = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;
    
    let addQry        = ` 1=1  `;

    if (GU1 )    addQry += ` and gubun = '${GU1}' `;
    if (sWord )  {
        if (sFrom === "telephone") addQry += ` and (tel_number = '${aes128Encrypt (aviaSecurityKey,sWord)}' or manager_tel = '${aes128Encrypt (aviaSecurityKey,sWord)}' or manager_tel2 = '${aes128Encrypt (aviaSecurityKey,sWord)}') `;
        else if (sFrom === "man_id") addQry += ` and (select count(*) from site_manager where site_code = a.site_code and man_id like '%${sWord}%' ) > 0  `;
        else if (sFrom === "domain") addQry += ` ( TempDomain like '%${sWord}%' or TempDomain1 like '%${sWord}%' or TempDomain2 like '%${sWord}%' or TempDomain3 like '%${sWord}%' or TempDomain4 like '%${sWord}%') `;
        else addQry += ` and ${sFrom} like '%${sWord}%' `;
    }
        
    try {

        const pool = await deps.getPool();
        const totQuery = `
                select count(*) as total from  site as a (nolock)  
                where
                ${addQry}
            `;
        const result2 = await pool.request().query(totQuery);
        const totalRowCount = result2.recordset[0].total;
        if (totalRowCount < listCount) page = 1;
        const { startRow, endRow, pageHTML } = getPagination({
            tot_row: totalRowCount,
            page: page ,
            listCount: listCount
        });
        
        const fieldQry = `
            , (select count(*) from site_manager where site_code = a.site_code) as userCount     
            , (select count(*) from interline where site_code = a.site_code and in_status < '4' ) as revCnt 
            , (select count(*) from interline where site_code = a.site_code and in_status = '4' ) as issCnt 
            , (select count(*) from interline where site_code = a.site_code and in_status = '9' ) as cxlCnt 
        `;

        const sqlText = `
            select 
                a.* ${fieldQry}
                from (
                select * from
                    (select a.uid , ROW_NUMBER() OVER (order by a.uid desc ) as RowNum
                        from 
                        site as a (nolock)  
                        where   
                        ${addQry}
                        
                    ) as db1
                where RowNum BETWEEN ${startRow} AND ${endRow}
                ) as main
                left outer join site as a (nolock) on main.uid = a.uid
                order by RowNum asc
            `;
        const result = await pool.request().query(sqlText);
        let   list = ``;
        const arraySettleGroup = [];
        for (let row of result.recordset) {
            let {uid, up_date , site_code, site_name , manager , tel_number , userCount , BSP_USE, saleChannel , deposit_bank , deposit_account , LoginDate
                , sale_manager , deposit , revCnt , issCnt , cxlCnt , LoginCount
            } = row;            
            if (LoginDate) LoginDate = '<br>'+deps.cutDateTime(LoginDate,'S'); else LoginDate = '';
            if (tel_number.length > 20)    tel_number    = aes128Decrypt(aviaSecurityKey,tel_number);
            font    = '';

            list += `
                <tr height="29" onmouseover="this.style.backgroundColor='#f3f3f3'" onmouseout="this.style.backgroundColor=''" bgcolor="#fff">
                    <td ><span class="action_btn_primary" onClick="return newReg('${uid}')">${font}${uid}</span></td>
                    <td ><span class="action_btn_primary" onClick="return newReg('${uid}')">${font}${site_code}</span></td>
                    <td >${site_name}</td>
                    <td >${font}${deps.telNumber(tel_number)}</td>
                    <td >${font}${manager}</td>
                    <td >${font}${userCount}</td>
                    <td >${font}${BSP_USE || ''}</td>
                    <td >${font}${saleChannel}</td>
                    <td >${font}${arrBankCode[deposit_bank] || ''} ${deps.BankAnySplit(deposit_account)}</td>
                    <td >${font}${sale_manager}</td>
                    <td >${font}${deps.cutDateTime(up_date,'S')} ${LoginDate}</td>
                    <td >${font}${deps.numberFormat(deposit)}</td>
                    <td >${font}${deps.numberFormat(revCnt)}</td>
                    <td >${font}${deps.numberFormat(issCnt)}</td>
                    <td >${font}${deps.numberFormat(cxlCnt)}</td>
                    <td >${font}${deps.numberFormat(LoginCount)}</td>
                </tr>
            `;
        };
        if (!list) list = `<tr><td colspan='20' class='ac hh50'>데이터가 없습니다.</td></tr>`;

        const listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr>
                    <th>No</th>
                    <th>거래처코드</th>
                    <th>거래처명</th>
                    <th>연락처</th>
                    <th>담당자</th>
                    <th>사용자수</th>
                    <th>BSP</th>
                    <th>판매채널</th>
                    <th>전용계좌</th>
                    <th>영업담당</th>
                    <th>등록일</th>
                    <th>잔액</th>
                    <th>대기</th>
                    <th>발권</th>
                    <th>취소</th>
                    <th>로그인</th>
                </tr>
                ${list}
            </table>
        `;
        res.json({ success:'ok', listData: listHTML , pageData: pageHTML, totalCount: totalRowCount  });
    } catch (err) {
        //console.error('에러:'+err);
        //res.status(500).send('Database error');
        res.json ({success:'no', msg: err});
    } finally {
        //await sql.close();
    }
	
};

