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
    const start_date  = req.body.start_date || '';
    const end_date    = req.body.end_date || '';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const aes128Encrypt = deps.aes128Encrypt;
    const aes128Decrypt = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;
    let   sqlText   = '';
    let   sqlResult = '';
    let   add       = '';
    let   memData   = '';
    
    let addQry        = ` 1=1  `;

    if (GU1 === "0")    addQry += ` and (status = '' or status is null ) `;
    else if (GU1)       addQry += ` and status = '${GU1}' `;
    if (sWord )         addQry += ` and ${sFrom} like '%${sWord}%' `;
    if (GU2 )           addQry += ` and operator = '${GU2}' `;
    if (start_date)	    addQry += ` and start_date >= '${deps.StrClear(start_date)}' `;
    if (end_date)	    addQry += ` and end_date <= '${deps.StrClear(end_date)}' `;

    const joinQry = ` left outer join tblManager as b on a.operator = b.member_code `;
    try {

        const pool = await deps.getPool();

        if (b2bSiteCode) add = ` site_code = '${b2bSiteCode}' `; 
        else add = ` site_code = '' `; 
        sqlText = ` select distinct (operator) from invoice where ${add} order by operator asc `;
        sqlResult = await pool.request().query(sqlText);
        for (const row of sqlResult.recordset) {
            const { operator } = row;
            s = operator === GU2 ? 'selected' : '';
            memData += `<option value='${operator}' ${s}>${operator} `;
        }

        const totQuery = `
                select count(*) as total from  invoice as a (nolock)  
                ${joinQry}
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
            , b. username
        `;

        sqlText = `
            select 
                a.* ${fieldQry}
                from (
                select * from
                    (select a.uid , ROW_NUMBER() OVER (order by a.uid desc ) as RowNum
                        from 
                        invoice as a (nolock)  
                        ${joinQry}
                        where   
                        ${addQry}
                        
                    ) as db1
                where RowNum BETWEEN ${startRow} AND ${endRow}
                ) as main
                left outer join invoice as a (nolock) on main.uid = a.uid
                ${joinQry}
                order by RowNum asc
            `;
        const result = await pool.request().query(sqlText);
        let   list = ``;

        for (let row of result.recordset) {
            let {uid, up_date , doc_number , subject , username } = row;            
            
            
            font    = '';

            list += `
                <tr height="29" onmouseover="this.style.backgroundColor='#f3f3f3'" onmouseout="this.style.backgroundColor=''" bgcolor="#fff">
                    <td $clk>${font}<span href='javascript://' onClick="return newReg('${doc_number}','')">${doc_number}</span></td>
                    <td >${font}${subject}</td>
                    <td >${font}${username || ''}</td>
                    <td >${font}${deps.cutDateTime(up_date)}</td>
                    <td><span class='btn_basic btn_yellow' onClick="return newReg('${doc_number}','')">미리보기</a></td>
                    <td><span class='btn_basic btn_blue'   onClick="return newReg('${doc_number}','modify')">수정</a></td>
                    <td><span class='btn_slim btn_red'     onClick="return delReg('${uid}')">삭제</span></td>
                </tr>
            `;
        };
        if (!list) list = `<tr><td colspan='20' class='ac hh50'>데이터가 없습니다.</td></tr>`;

        const listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr>
                    <th>No</th>
                    <th>제목</th>
                    <th>작성자</th>
                    <th>등록일</th>
                    <th>미리보기</th>
                    <th>수정</th>
                    <th>삭제</th>
                </tr>
                ${list}
            </table>
        `;
        memData = `<select name="GU2" class="search_action_select" onchange="return formSearch(event)" ><option value="">작성자선택</option>${memData}</select>`;
        res.json({ success:'ok', listData: listHTML , pageData: pageHTML , totCount: totalRowCount , mems: memData});
    } catch (err) {
        console.error('에러:'+err);
        //res.status(500).send('Database error');
        res.json ({success:'no', msg: err});
    }
	
};

