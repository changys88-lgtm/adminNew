const { aes128Encrypt, aes128Decrypt } = require('../src/utils/cryptoUtil');
const { dbConfig, blockedIP, getNow } = require('../lib/config');
const cookieParser = require('cookie-parser');
const express = require('express');

const app = express();
app.use(cookieParser());

module.exports = async (req, res) => {
  const aviaSecurityKey = getNow().aviaSecurityKey; // 암호화 키

  let rawKey = req.cookies?.aviaAuthorizedKey || '' ;
  let decrypted = '';
  try {
    decrypted = aes128Decrypt(aviaSecurityKey, rawKey);
  } catch (e) {
    return res.status(401).json('NO');
  }
  
  const [timestamp, type, savedId] = decrypted.split('|');
  const now         = new Date();
  const expireLimit = new Date(now.getTime() - 3 * 3600 * 1000);
  const expireStr   = formatDateTime(expireLimit);

  let currentId = '';
  if (type === 'Y') currentId = req.cookies.AviaLoginId;
  else if (type === 'X') currentId = req.cookies.b2bLoginId;
  
  if (timestamp > expireStr && currentId === savedId) {
    const newKey    = getNow().NOWSTIME + '|' + type + '|' + currentId;
    const encrypted = aes128Encrypt(aviaSecurityKey, newKey);
    res.cookie('aviaAuthorizedKey', encrypted, { path: '/', httpOnly: true });
    res.status(200).json('OK');
  } else {
    res.clearCookie('AviaLoginId');
    res.clearCookie('AviaLoginName');
    res.clearCookie('b2bSiteCode');
    res.clearCookie('b2bMasterSite');
    res.clearCookie('b2bMASTER');
    res.clearCookie('b2bGrade');
    res.clearCookie('aviaAuthorizedKey');
    return res.status(401).json('NO');
  }
};


// 날짜 포맷 함수
function formatDateTime(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return date.getFullYear() +
        pad(date.getMonth() + 1) +
        pad(date.getDate()) +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        pad(date.getSeconds());
}