//const deps   = require('../../src/common/dependencies');

async function uidNext( table , conn = '' , qry = '', field = 'uid' ) {
    let pool = conn;
    const tableName = table.toLowerCase();
    let max = 0;
  
    if (tableName === 'interline' && qry === '') {
        const interlineMaxQuery = `SELECT uid_max FROM interline_max WHERE name = 'INTERLINE'`;
        const result = await pool.request().query(interlineMaxQuery);
        max = result.recordset[0]?.uid_max;
    
        if (!max) {
            const backupQuery = `SELECT MAX(${field}) as max_uid FROM ${table}`;
            const backupResult = await pool.request().query(backupQuery);
            max = backupResult.recordset[0]?.max_uid || 10000;
        }
    
        max++;
        const updateQuery = `UPDATE interline_max SET uid_max = '${max}' WHERE name = 'INTERLINE'`;
        await pool.request().query(updateQuery);
    } else {
        const query = `SELECT MAX(${field}) as max_uid FROM ${table} ${qry}`;
        const result = await pool.request().query(query);
        max = result.recordset[0]?.max_uid || 100;
        max++;
    }
  
    return max;
}

async function nextDocNumber(pool,sql, table, field , prefix) {
    // table 이름은 화이트리스트 검증 권장
    if (!/^[A-Za-z0-9_]+$/.test(table)) throw new Error('Invalid table name');
    try {
        const req = pool.request().input('pref', sql.NVarChar, `${prefix}%`);
  
        const q = `
            SELECT MAX(TRY_CONVERT(int, RIGHT(${field}, 5))) AS maxSuffix
            FROM ${table}
            WHERE ${field} LIKE @pref
        `;
        
        const { recordset } = await req.query(q);
    
        const maxSuffix  = recordset[0]?.maxSuffix ?? 0;
        const nextSuffix = String(maxSuffix + 1).padStart(5, '0');
        const doc_number = `${prefix}_${nextSuffix}`;
    
        return doc_number;
    } catch (err) {
        console.log(err)
    }
}
  
module.exports = { 
    uidNext ,
    nextDocNumber
};