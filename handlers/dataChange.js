const { aes128Encrypt, aes128Decrypt } = require('../src/utils/cryptoUtil');
const { dbConfig, blockedIP, getNow } = require('../lib/config');
const { sql , getPool } = require('../lib/dbPool');
const cookieParser = require('cookie-parser');
const express = require('express');
const { cutDate , cutDateTime , StrClear } = require('../src/utils/cutDate');

const app = express();
app.use(cookieParser());

module.exports = async (req, res) => {
    const mode      = req.body.mode;
    const uid       = req.body?.uid || '';
    const minor_num = req.body?.minor_num || '';
    const table     = req.body?.table || '';
    const field     = req.body?.field || '';
    let   val       = req.body?.val || '';
    //console.log(mode);
    currentId     = req.cookies?.AviaLoginId || '';
    b2bMASTER     = req.cookies?.b2bMASTER || '';
    pool = await getPool();
    let sqlText   = '';
    let result    = '';
    let addQry    = '';
    if (mode === "Change") {
        if (Number(minor_num) > 0) addQry = ` uid_minor = @uid and minor_num = @minor_num `;
        else if (minor_num === 0) addQry = ` uid_minor = @uid `;
        else addQry = ` uid = @uid `;

        const comField = /(dep_tel|arr_tel|passport|birthday|expire)/i;
        const numField = /(TL|issue_date)/i;

        if (comField.test(field)) {
            val = aes128Encrypt (getNow().aviaSecurityKey,val);
        }
        if (numField.test(field)) {
            val = StrClear(val);
        }

        sqlText = `update ${table} set ${field} = '${val}' where ${addQry} `;
        const req = pool.request()
            .input('uid',sql.Int , uid)
        if (minor_num) req.input('minor_num',sql.Int , minor_num)
        try {
            await req.query(sqlText);
        } catch (e) {
            const params = Object.fromEntries(
                Object.entries(req.parameters || {}).map(([k, v]) => [k, v?.value])
            );
            console.error('[SQL ERROR]', {
                sql: sqlText,
                params,
                message: e.message,
                number: e.number,
                state: e.state,
                lineNumber: e.lineNumber,
                serverName: e.serverName,
                // tedious 원본
                original: e.originalError?.info,
                preceding: e.precedingErrors?.map(x => x?.message),
            });
        }
        res.json({  success:'ok' ,datas: '' });
    }
    
	
};

