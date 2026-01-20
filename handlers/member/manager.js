const deps = require('../../src/common/dependencies');
const { getPagination } = require('../../src/utils/paging'); 
const path    = require('path');

module.exports = async (req, res) => {
    const GU1         = req.body.GU1 || '';
    const GU2         = req.body.GU2 || '';
    const GU3         = req.body.GU3 || '';
    const GU4         = req.body.GU4 || '';
    const page        = req.body.page || '1';
    const cancel      = req.body.cancel || '1';
    const listCount   = req.body.listCount || 1;
    const sWord       = req.body.sWord.trim() || '';
    const sFrom       = req.body.sFrom || '';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    
    let addQry        = ` 1=1  `;

    if (GU1 ) addQry += ` and gubun = '${GU1}' `;
    if (sWord ) addQry += ` and ${sFrom} like '%${sWord}%' `;
    if (cancel ) addQry += ` and (resign is null or resign = '') `;
    
    try {

        const pool = await deps.getPool();
        const totQuery = `
                select count(*) as total from  tblManager as a (nolock)  
			    left outer join duty as du on a.working = du.code
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
        
        const sqlText = `
            select 
                b.* , du.duty_name 
                from (
                select * from
                    (select a.uid , ROW_NUMBER() OVER (order by a.uid desc ) as RowNum
                        from 
                        tblManager as a (nolock)  left outer join duty as du on a.working = du.code
                        where   
                        ${addQry}
                        
                    ) as db1
                where RowNum BETWEEN ${startRow} AND ${endRow}
                ) as main
                left outer join tblManager as b on main.uid = b.uid
                left outer join duty as du on b.working = du.code
                order by RowNum asc
            `;
        const result = await pool.request().query(sqlText);
        let   list   = ``;
        const arraySettleGroup = [];
        const STATIC_ROOT = path.resolve(__dirname, '../../public');
        const SIGN_DIR = path.join(STATIC_ROOT, 'images', 'sign');
        for (let row of result.recordset) {
            let {uid, up_date , member_code, username,  duty_name , eng_name , email , gmail , oyemail , settle_group , sale_manager , handphone , direct_phone } = row;            

            if ((handphone || '').length    > 20) handphone    = deps.aes128Decrypt(deps.getNow().aviaSecurityKey,handphone);
            if ((direct_phone || '').length > 20) direct_phone = deps.aes128Decrypt(deps.getNow().aviaSecurityKey,direct_phone);
            font    = '';
            const stamp    = `<img src='../images/sign/${member_code}.gif'>`;
            //const stamp    = `../images/sign/${encodeURIComponent(member_code)}.gif`;
            //const filePath = path.join(SIGN_DIR, `${member_code}.gif`);
            //const imgChk   = await deps.isFileCheck (filePath);
            //console.log(imgChk);
            gmail   = gmail ? "<br>"+gmail :''
            oyemail = oyemail ? "<br>"+oyemail :''
            list += `
                <tr height="29" onmouseover="this.style.backgroundColor='#f3f3f3'" onmouseout="this.style.backgroundColor=''" bgcolor="#fff">
                    <td ><span class='' onClick="return newReg('${uid}','modify')">${font}${uid}</span></td>
                    <td >${font}${member_code}</td>
                    <td >${stamp}</td>
                    <td >${font}${username}</td>
                    <td >${font}${duty_name || ''}</td>
                    <td >${font}${eng_name}</td>
                    <td >${font}${deps.telNumber(handphone)}</td>
                    <td >${font}${deps.telNumber(direct_phone)}</td>
                    <td >${font}${email} ${gmail} ${oyemail}</td>
                    <td >${font}${arraySettleGroup[settle_group] || ''}</td>
                    <td >${font}${sale_manager}</td>
                </tr>
            `;
        };
        if (!list) list = `<tr><td colspan='6' class='ac hh50'>데이터가 없습니다.</td></tr>`;

        const listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr  >
                    <th>No</th>
                    <th>관리자코드</th>
                    <th>도장</th>
                    <th>한글이름</th>
                    <th>직급</th>
                    <th>영문이름</th>
                    <th>핸드폰</th>
                    <th>직통번호</th>
                    <th>이메일</th>
                    <th>소속그룹</th>
                    <th>판매관리</th>
                </tr>
                ${list}
            </table>
        `;
        res.json({ success:'ok', listData: listHTML , pageData: pageHTML , totalCount: totalRowCount });
    } catch (err) {
        console.error('에러:'+err);
        //res.status(500).send('Database error');
        res.json({ success:'no', msg: err });
    }
	
};

