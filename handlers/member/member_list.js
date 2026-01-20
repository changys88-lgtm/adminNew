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
        if (sFrom === "handphone") addQry += ` and (handphone = '${aes128Encrypt (aviaSecurityKey,sWord)}' ) `;
        else if (sFrom === "eng_name") addQry += ` and eng_name1+eng_name2 like '%${sWord}%' `;
        else addQry += ` and ${sFrom} like '%${sWord}%' `;
    }
        
    try {

        const pool = await deps.getPool();
        const totQuery = `
                select count(*) as total from  members as a (nolock)  
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
           
        `;

        const sqlText = `
            select 
                a.* ${fieldQry}
                from (
                select * from
                    (select a.uid , ROW_NUMBER() OVER (order by a.uid desc ) as RowNum
                        from 
                        members as a (nolock)  
                        where   
                        ${addQry}
                        
                    ) as db1
                where RowNum BETWEEN ${startRow} AND ${endRow}
                ) as main
                left outer join members as a (nolock) on main.uid = a.uid
                order by RowNum asc
            `;
        const result = await pool.request().query(sqlText);
        let   list = ``;
        for (let row of result.recordset) {
            let {uid, up_date , site_code, site_name , handphone , userid , username ,eng_name1 , eng_name2 , last_date , join_count , couponCnt
                , com_code , email
            } = row;            
            
            if ((handphone || '').length > 20)    handphone    = aes128Decrypt(aviaSecurityKey,handphone);
            font    = '';

            list += `
                <tr height="29" onmouseover="this.style.backgroundColor='#f3f3f3'" onmouseout="this.style.backgroundColor=''" bgcolor="#fff">
                    <td ><span class='btn_slim btn_yellow' onClick="return newReg('${uid}','modify')">${font}${uid}</span></td>
                    <td >${font}${site_code}</td>
                    <td >${font}${userid || ''}</td>
                    <td >${font}${username}</td>
                    <td >${font}${eng_name1 || ''} ${eng_name2 || ''}</td>
                    <td >${font}${deps.telNumber(handphone || '')}</td>
                    <td >${font}${email}</td>
                    <td >${font}${deps.cutDateTime(up_date,'S')}</td>
                    <td >${font}${deps.cutDateTime(last_date,'S')}</td>
                    <td >${font}${deps.numberFormat(join_count)}</td>
                    <td >${font}${couponCnt || ''}</td>
                    <td >${font}${com_code}</td>
                    <td >${font}<span class='btn_slim btn_red' onClick="return delMem('${uid}','${username}')">Del</span></td>
                </tr>
            `;
        };
        if (!list) list = `<tr><td colspan='20' class='ac hh50'>데이터가 없습니다.</td></tr>`;

        const listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr>
                    <th>No</th>
                    <th>거래처코드</th>
                    <th>아이디</th>
                    <th>한글이름</th>
                    <th>영문이름</th>
                    <th>핸드폰</th>
                    <th>이메일</th>
                    <th>등록일</th>
                    <th>접속일</th>
                    <th>로긴</th>
                    <th>쿠폰</th>
                    <th>소셜</th>
                    <th>삭제</th>
                </tr>
                ${list}
            </table>
        `;
        res.json({ success : 'ok', listData: listHTML , pageData: pageHTML , totalCount: totalRowCount });
    } catch (err) {
        console.error('에러:'+err);
        res.status(500).send('Database error');
    } finally {
        //await sql.close();
    }
	
};

