const { aes128Encrypt, aes128Decrypt } = require('../src/utils/cryptoUtil');
const { dbConfig, blockedIP, getNow , googleKey } = require('../lib/config');
const { sql , getPool } = require('../lib/dbPool');
const cookieParser = require('cookie-parser');
const express = require('express');
//const sql = require('mssql');
const { cutDate , cutDateTime } = require('../src/utils/cutDate');
const { xmlOpen } = require('../src/utils/multiNetwork');
const { copyFileSync } = require('fs');

const app = express();
app.use(cookieParser());

module.exports = async (req, res) => {
    const mode = req.body.mode;
    const uid  = req.body?.uid || '';
    //console.log(mode);
    currentId         = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    pool = await getPool();
    let sqlText   = '';
    let result    = '';
    if (mode == "Notice") {
        const addQry = '';
        try {
            const baseQuery = `select top 3 * from notice where viewPos like '%A%' ${addQry} order by uid desc  `;
            result = await pool.request().query(baseQuery);
            let   noticeHTML = ``;

            result.recordset.forEach(row => {
                const uid     = row.uid;
                const subject = row.subject?.trim() || '';
                const up_date = cutDate(row.up_date);
                noticeHTML += `
                    <tr height="29" onmouseover="this.style.backgroundColor='#f3f3f3'" onmouseout="this.style.backgroundColor=''">
                        <td><a href="javascript://" onclick="return newReg('${uid}','notice')" style="color:#222;font-weight:600;">${uid}</a></td>
                        <td class="al"><a href="javascript://" onclick="return newReg('${uid}','notice')" style="color:#222;font-weight:600;">${subject}</a></td>
                        <td class="nowrap">${up_date}</td>
                    </tr>
                `;
            });

            const baseQuery2 = `
                select top 3 p.*, s.site_code as siteCode, s.up_date as create_date from partnership as p
                left outer join site as s on s.site_number = p.companyNumber
                ${addQry}
                order by uid desc  
            `;
            const result2 = await pool.request().query(baseQuery2);
            let   shakeHTML = ``;

            result2.recordset.forEach(row => {
                const uid         = row.uid;
                const site_name   = row.site_name?.trim() || '';
                const up_date     = cutDate(row.up_date);
                const email       = row.email;
                const siteCode    = row.siteCode?.trim() || '';
                const create_date = row.create_date;
                let add2      = '';
                let add       = '';
                if (b2bMASTER == "Y" ) {
                    if(siteCode != "") add = cutDateTime(create_date)+`<br><span class='btn_slim btn_yellow' onClick="viewSite('${siteCode}')"> ${siteCode}</span>`;
                    else add = `<span class='btn_basic btn_blue' onClick="return newSite('${uid}')"> 생성</span>`;
                }else{
                    add = cutDateTime(create_date);
                }
                shakeHTML += `
                    <tr height="29" onmouseover="this.style.backgroundColor='#f3f3f3'" onmouseout="this.style.backgroundColor=''">
                        <td $link><a href='javascript://' onClick=\"return  newReg('${uid}','partner', '${b2bMASTER}')\" style='color:#222;font-weight:600;'>${uid}</a></td>
                        <td class='al'>${add2} ${site_name}</td>
                        <td class='al'>${email}</td>
                        <td class='nowrap'>${up_date}</td>
                        <td>${add}</td>
                    </tr>
                `;
            });
            
            res.json({ success:'ok', noticeData: noticeHTML , shakeData: shakeHTML });
        } catch (err) {
            console.error(err);
            res.status(500).send('Database error');
        } finally {
            //await sql.close();
        }
    } else if (mode == "aviaMenu") {
        const menuJson = require('../data/aviaMenu.json');
        let html = '';
        let index = 1;

        for (const key in menuJson) {
            const [menuTitle, iconClass] = key.split(';');
            const items = menuJson[key];

            html += `<li class="subMenu" style="border: 0px solid red;">\n`;
            html += `  <div class="menutab"><a href="javascript://" onclick="menuShow('${index}')" data-toggle="collapse" aria-expanded="true" class="dropdown-toggle"><span class="ico"><i class="fas ${iconClass} mr-1" style="font-size:13px; color:#3d3a3a;" aria-hidden="true"></i></span> ${menuTitle}</a></div>\n`;
            html += `  <ul class="collapse " id="menu${index}">\n`;

            items.forEach(([label, code, url]) => {
                html += `    <li><a href="javascript://" onclick="return frameChange('${code}', '${url}', '${label}')">${label}</a></li>\n`;
            });

            html += `  </ul>\n`;
            html += `</li>\n`;

            index++;
        }
        res.json({ leftMenu: html });
        //console.log(html);
    } else if (mode === "interLog") {
        sqlText = `select minor_num, content , operator , up_date ,ISNULL(micro_time,'') as micro_time from interline_log where uid_minor = @uid  order by minor_num asc`;
        result = await pool.request().input('uid' , sql.Int , uid).query(sqlText);
        let logList = '';
        for (const row of result.recordset) {
            const {minor_num, content , operator , up_date , micro_time  } = row;
            logList += `
                <tr  HEIGHT=29 class="" onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor=''">
                    <td align=center >${minor_num}</td>
                    <td align=center >${cutDateTime(up_date)} ${micro_time}<br>${operator} </td>
                    <td align=left  >${content}</td>
                </tr>
		    `;
        }
        logList = `
            <table border='1' cellspacing='0' width='100%' cellpadding='0'>
                <tr >
                    <th  class='wh40 ac'><b>NO</b></td>
                    <th  class='ac wh130'><b>등록일시</b></td>
                    <th  class='ac'><b>내용</b></td>
                </tr>
                ${logList}
            </table>
        `;
        res.json({  success:'ok', datas: logList });
    } else if (mode === "orderMemo") {
        if (b2bSiteCode) qry = `and (out_ok != 'N' or out_ok is null )`; else qry = '';
        sqlText = `select a.* from dat_table as a where db_name = '${uid}' ${qry} order by minor_num desc `;
        result = await pool.request().query(sqlText);
        let list = '';
        for (const row of result.recordset) {
            let {username, out_ok , content , up_date  } = row;
            if (out_ok === "A") {
                out = '';
            } else {
                out = '댓글';
            }
           // if (up_date.length === 10) up_date = timeFromUnix(up_date);
            list += `
                <tr  HEIGHT=29 class="" onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor=''">
                    <td align=center >${username}</td>
                    <td align=center >${out}</td>
                    <td align=left   >${content}</td>
                    <td align=center >${cutDateTime(up_date)}</td>
                </tr>
		    `;
        }
        const logList = `
            <table class='table' border=0>
                <thead class='thead-std' style='background-color:#d9d9d9;'>
                    <tr align=center>
                        <td colspan='4' class='al'>행사번호 : ${uid} </td>
                    </tr>
                    <tr align=center>
                        <td width='110'>작성자</td>
                        <th class='wh80'>댓글</th>
                        <td>내 용</td>
                        <td width='140'>작성일시</td>
                    </tr>
                </thead>
                ${list}
            </table>
        `;
        res.json({  success:'ok', datas: logList });
    } else if (mode === "googleMapPick") {
        sqlText = `select address , address2 from Products where tourNumber = @tourNumber `;
        result = await pool.request().input('tourNumber',sql.Int , uid ).query(sqlText);
        let add = result.recordset?.[0].address;
        add += result.recordset?.[0].address2;
        let add2 = encodeURIComponent(String(add).replace(/[?, ]/g, '+'));
        const sFile = `https://maps.googleapis.com/maps/api/geocode/json?address=${add2}&key=${googleKey}`;
        result = await xmlOpen(sFile);
        result = result.toString('utf8');
        const data = typeof result === 'string' ? JSON.parse(result) : result;
        const la = data?.results?.[0]?.geometry?.location?.lat ;
        const lo = data?.results?.[0]?.geometry?.location?.lng ;
        res.json({  success:'ok', lat: la , lon:lo });
    } 
   
	
};

