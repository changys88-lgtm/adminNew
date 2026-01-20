const deps = require('../../src/common/dependencies');
const { getPagination } = require('../../src/utils/paging'); 

module.exports = async (req, res) => {
    const GU1         = req.body.GU1 || '';
    const GU2         = req.body.GU2 || '';
    const GU3         = req.body.GU3 || '';
    const GU4         = req.body.GU4 || '';
    const page        = req.body.page || '1';
    const listCount   = req.body.listCount || 1;
    const sWord       = req.body.sWord || '';
    const sFrom       = req.body.sFrom || '';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    
    let addQry        = ` db_name = 'LOGIN'  `;

    if (GU1 ) addQry += ` and uid_minor like '${deps.StrClear(GU1)}%' `;
    //if (!GU2 ) addQry += ` and site_code like '${GU2.trim()}%' `;
    if (GU3 ) addQry += ` and username like '%${GU3.trim()}%' `;
    if (GU4 ) addQry += ` and ip like '%${GU4.trim()}%' `;
    
    try {

        const pool = await deps.getPool();
        
        const sqlText = `
            select top ${listCount} * 
            from dat_table as a where ${addQry} order by up_date desc , minor_num desc
        `;
        const result = await pool.request().query(sqlText);
        const totalCount = result.recordset.length;
        let   list = ``;

        for (let row of result.recordset) {
            let {up_date , username , ip , read_time , memo , content} = row;            
           
            list += `
                <tr height="29" onmouseover="this.style.backgroundColor='#f3f3f3'" onmouseout="this.style.backgroundColor=''">
                    <td >${deps.cutDateTime(up_date)}</td>
                    <td >${username}</td>
                    <td class='al' >${content}</td>
                    <td >${read_time}</td>
                    <td >${ip}</td>
                    <td class='al'><div style='width:800px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' title='${memo}'>${memo}</div></td>
                </tr>
            `;
        };
        if (!list) list = `<tr><td colspan='6' class='ac hh50'>데이터가 없습니다.</td></tr>`;

        const listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr >
                    <th>로그 시간</th>
                    <th>아이디</th>
                    <th>결과</th>
                    <th>서버</th>
                    <th>아이피</th>
                    <th>User</th>
                </tr>
                ${list}
            </table>
        `;
        res.json({ success: 'ok', listData: listHTML , pageData: '' , totalCount: totalCount  });
    } catch (err) {
        console.error('에러:'+err);
        res.status(500).send('Database error');
    } finally {
        //await sql.close();
    }
	
};

