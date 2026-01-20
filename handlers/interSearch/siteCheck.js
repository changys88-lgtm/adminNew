const deps = require('../../src/common/dependencies');
const { interSearchLogSave } = require('../../src/utils/database');

module.exports = async (req, res) => {
    //console.log(req.body);
    const keyword = req.body.code;
    const mode = req.body.mode || '';
    pool = await deps.getPool();
    if (mode === "site") {
        const queryText = `
            SELECT site_code, site_name, closing, minor_name, tel_number
            FROM site WITH (NOLOCK)
            WHERE minor_name LIKE @sWord OR site_code LIKE @sWord OR site_name LIKE @sWord
            ORDER BY site_name
        `;
        const sWord  = `%${keyword}%`;
        const result = await pool.request()
            .input('sWord', deps.sql.NVarChar(255), sWord)
            .query(queryText);
        const rows = result.recordset || [];
        let list = '';
        rows.forEach(row => {
            const name    = row.site_name.trim() || '';
            const code    = row.site_code.trim() || '';
            const closing = row.closing.trim() || '';
            //const tel_number = row.tel_number.trim() || '';
            //tel = deps.aes128Decrypt(deps.getNow().aviaSecurityKey, tel_number);
            if (closing !== "Y") {
                list += `
                    <tr>
                        <td><span type="button" class="btn_basic btn_gray" onclick="return siteInterInsert('${code}','${name}')">${code}</span></td>
                        <td>${name}</td>
                    </tr>
                `;
            }
        
        });
        res.json ({success:'ok',datas:list});
    } else if (mode === "manager") {
        const queryText = `
            select man_id,manager from site_manager where site_code = @sWord and status = 'Y' 
        `;
        const sWord  = `${keyword}`;
        const result = await pool.request()
            .input('sWord', deps.sql.NVarChar(255), sWord)
            .query(queryText);
        const rows = result.recordset || [];
        let addScript = '';
        rows.forEach((row, ix) => {
            const manId   = (row.man_id   ?? '').toString().trim();
            const manager = (row.manager  ?? '').toString().trim();
            addScript += `<option value='${manId}'> ${manager}`;
        });
        list = `
            <select class='form-control' name='manager_id' id='manager_id'>
                <option value=''>선택</option>
                ${addScript}
            </select>
        `;
        res.json ({success:'ok',datas:list});
    }
}