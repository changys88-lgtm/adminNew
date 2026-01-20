const express = require('express');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const { dbConfig, blockedIP, getNow } = require('../lib/config');
const { sql, getPool } = require('../lib/dbPool');
const { aes128Encrypt, aes128Decrypt } = require('../src/utils/cryptoUtil');
const { minorNext } = require('../src/utils/database');

module.exports = async (req, res) => {
  const userid = req.body.userid.trim().toUpperCase();
  const passwd = req.body.passwd;
  const ip     = req.ip;
  const ua     = req.get('user-agent') || '';
  const realIp = ip.replace(/^::ffff:/, '');

  try {
    pool = await getPool();
    const result = await pool.request().query`SELECT * FROM tblManager WHERE member_code = ${userid}`;
    const row = result.recordset[0];

    if (!row) return res.status(401).json({ error: '로그인 실패: 아이디 또는 비밀번호가 틀렸습니다.' });

    const hashPass = crypto.createHash('sha256').update(passwd).digest('hex');
    if (row.passwd !== hashPass) return res.status(401).json("비밀번호가 일치하지 않습니다.");

    if (row.resign) {
      return res.status(401).json(`${row.username} 님께서는 퇴사로 인하여 로그인 하실 수 없습니다.`);
    }

    // 로그인 성공 처리
    const nows   = getNow().NOWS;
    const nowStr = getNow().NOWSTIME;
    const key    = `${nowStr}|Y|${userid}`;
    const encryptedKey = aes128Encrypt(getNow().aviaSecurityKey, key);
    
    res.cookie('AviaLoginId', userid);
    res.cookie('AviaLoginName', row.username);
    res.cookie('b2bSiteCode', '');
    res.cookie('b2bMasterSite', '');
    res.cookie('b2bMASTER', 'Y');
    res.cookie('b2bGrade', row.grade);
    res.cookie('aviaAuthorizedKey', encryptedKey);

    // 로그인 로그 기록
    const fs = require('fs');
    const logFile = `Logs/${nows}_Login.txt`;
    const logData = `[${nowStr}][${ip}][[${userid}/${row.username}]\r\n`;
    fs.appendFileSync(logFile, logData);

    //const addMsg = passwd.length < 8 ? "alert('비밀번호를 8자 이상으로 변경하여 주세요!');" : "";
    res.status(200).json('OK');

    const NOWS = getNow().NOWS;
    const minor_num = await minorNext(pool , {table: 'dat_table', uid:'' , uid_minor:NOWS });
    const sqlText = `
              insert into dat_table (db_name,uid_minor,minor_num,username,content,up_date,ip,memo,read_time) 
              values ('LOGIN','${NOWS}','${minor_num}','${userid}','${row.username}','${getNow().NOWSTIME}','${realIp}','${ua}','') 
          `;
    await pool.request().query(sqlText);
  } catch (err) {
    console.error(err);
    res.status(500).send('서버 오류');
  } finally {
    //sql.close();
  }
};