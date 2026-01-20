const express = require('express');
const crypto = require('crypto');
const sql = require('mssql');
const cookieParser = require('cookie-parser');
const { dbConfig, blockedIP, getNow } = require('../lib/config');
//const { aes128Encrypt } = require('./aesUtil'); // 암호화 함수 별도 구현 필요

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.post('/login_check', async (req, res) => {
  const userid = req.body.userid.trim().toUpperCase();
  const passwd = req.body.passwd;
  const ip = req.ip;

  try {
    await sql.connect(config.dbConfig);
    const result = await sql.query`SELECT * FROM tblManager WHERE member_code = ${userid}`;
    const row = result.recordset[0];

    if (!row) return res.send("<script>alert('존재하지 않는 사용자입니다.'); history.back();</script>");

    const hashPass = crypto.createHash('sha256').update(passwd).digest('hex');
    if (row.passwd !== hashPass) return res.send("<script>alert('비밀번호가 일치하지 않습니다.'); history.back();</script>");

    if (row.resign) {
      return res.send(`<script>alert('${row.username} 님께서는 퇴사로 인하여 로그인 하실 수 없습니다.');</script>`);
    }

    // 로그인 성공 처리
    const nowStr = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const key = `${nowStr}|Y|${userid}`;
    const encryptedKey = aes128Encrypt(config.oyeSecurityKey, key);
    const encryptedGrade = aes128Encrypt(config.oyeSecurityKey, row.grade);

    res.cookie('oye_login_id', userid);
    res.cookie('oye_login_user_name', row.username);
    res.cookie('b2b_site_code', '');
    res.cookie('b2b_master_site', '');
    res.cookie('b2b_MASTER', 'Y');
    res.cookie('b2b_grade', encryptedGrade);
    res.cookie('OyeSuper', 'Y');
    res.cookie('oyeAuthorizedKey', encryptedKey);

    // 로그인 로그 기록
    const fs = require('fs');
    const today = new Date().toISOString().slice(0, 10);
    const logFile = `../Logs/${today.replace(/-/g, '')}_Login.txt`;
    const logData = `[${nowStr}][${ip}][OYE][${userid}/${row.username}]\r\n`;
    fs.appendFileSync(logFile, logData);

    const addMsg = passwd.length < 8 ? "alert('비밀번호를 8자 이상으로 변경하여 주세요!');" : "";
    res.send(`<script>${addMsg} location.href = '../main/main.html'; </script>`);

  } catch (err) {
    console.error(err);
    res.status(500).send('서버 오류');
  } finally {
    sql.close();
  }
});