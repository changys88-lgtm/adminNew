const { aes128Encrypt , aes128Decrypt } = require('../utils/cryptoUtil');
const { 
  cutDate , cutDateTime , StrClear , cutTime , FltTmCheck , cardNumSplit , getDateTimeNumber , numberFormat , getWeekday , getWeek 
  , makeTime , timeTermCheck , telNumber , BankAnySplit , WeekdayOfMonth , timeFromUnix , timeToAgo , ticketSplit , getLastDays
} = require('../utils/cutDate');
const { mainConfig , dbConfig, blockedIP, getNow , hubGds , hubSabre , searchUrl , bbsImgName , hubDom } = require('../../lib/config');
const { sql , getPool } = require('../../lib/dbPool');
//const cookieParser = require('cookie-parser');
//const express = require('express');
//const crypto  = require('crypto');
const fs      = require('fs');

function arrPush(obj, key, value) {
    if (!obj[key]) obj[key] = [];  // 없으면 자동 배열 생성
    obj[key].push(value);
}

function getAttr(node, name) {
  if (!node) return '';
  if (node[name] != null) return node[name];
  if (node.$ && node.$[name] != null) return node.$[name];
  return '';
}

function removeNameSuffix(name) {
  return String(name ?? '').replace(/\s*(?:MR|MS|MSTR|MISS)\.?$/i, '');
}

async function isFileCheck(filePath) {
  //console.log(filePath) // 보류
  try {
    const st = await fs.stat(filePath.trim());
    return st.isFile();                 // 진짜 '파일'인지 확인 (디렉토리 X)
  } catch {
    return false;                       // 없거나 접근 불가
  }
}

function arrWeekName (week,type='') {
  const aWeek = {
    "0":"일",
    "1":"월",
    "2":"화",
    "3":"수",
    "4":"목",
    "5":"금",
    "6":"토"
  };
  const aWeek2 = {
    "0":"Sun",
    "1":"Mon",
    "2":"Tue",
    "3":"Wed",
    "4":"Thu",
    "5":"Fri",
    "6":"Sat"
  };
  if (week === "A") return aWeek;
  else if (type === "en") return aWeek2[week];
  else return aWeek[week];

}


module.exports = {
  aes128Encrypt,
  aes128Decrypt,
  mainConfig , dbConfig,
  blockedIP,
  getNow, hubGds , hubSabre , searchUrl,bbsImgName , hubDom ,
  //cookieParser,
  //express,
  //crypto, 
  sql,
  cutDate , cutDateTime , StrClear , cutTime , FltTmCheck , cardNumSplit , getDateTimeNumber , numberFormat ,  getWeekday , getWeek , 
  makeTime , timeTermCheck , telNumber , BankAnySplit , WeekdayOfMonth,  timeFromUnix , timeToAgo , ticketSplit , getLastDays ,
  getPool,
  arrPush , getAttr ,
  removeNameSuffix,
  isFileCheck,
  arrWeekName
};