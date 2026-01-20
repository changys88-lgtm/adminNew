const cookieParser = require('cookie-parser');
const express = require('express');
const deps = require('../src/common/dependencies');
const { minorNext } = require('../src/utils/database.js');

const app = express();
app.use(cookieParser());


module.exports = async (req, res) => {
    const sql = deps.sql;
    const mode = req.body.mode;
    const AviaLoginId   = req.cookies.AviaLoginId;
    const AviaLoginName = req.cookies.AviaLoginName;
    const pool = await deps.getPool();
    if (mode == "menu" && AviaLoginId) {
        //const menuMeta = require('../data/erpMenuArea.json');
        //const menuMap = Object.fromEntries(menuMeta.map(m => [m.code, {name: m.name, link: m.link || ''}]));

        try {
            const { menuJson } = require('../data/aviaMenu.js');
            const labelToUrl = {};

            Object.values(menuJson).forEach(list => {
                list.forEach(([label, code, url]) => {
                    labelToUrl[code] = url;
                });
            });
            const baseQuery = `select menuName,menuNameKr from tblManager_menu where member_code =  @id order by minor_num`;
            const result = await pool.request().input('id',sql.NVarChar,AviaLoginId).query(baseQuery);
            let   names = '' , links = '' , item = '';
            //let   datas     = `<li class='shortCutButton on' ID='Button_MAIN' onClick="frameChange('MAIN','','')">MAIN</li>`;
            let   frameData = `<iframe class='mainFrame on' src='/main/body' name='Frame_MAIN' ID='Frame_MAIN' ></iframe>`;
            let   tabMenuData = `<span class='reserve-tab active' ID='Button_MAIN' onClick="menuChange('MAIN','','')">MAIN</span> `;
            for (const row of result.recordset) {
                names       = row.menuNameKr || '';
                item        = row.menuName || '';
                links       = labelToUrl[item] || '';
                tabMenuData += `<span class='reserve-tab' ID='Button_${item}' onClick="menuChange('${item}','','')">${names}</span> `;
                frameData   += `<iframe class='mainFrame off' src='${links}' ID='Frame_${item}' name='Frame_${item}' style='border:0px solid red;'></iframe>`;
            }
            res.json({ tabMenu: tabMenuData , frameMenu: frameData });
        } catch (err) {
            console.error(err);
            res.status(500).send('Database error');
        }
    } else if (mode == "aviaAllMenu") {
        const baseQuery = `select STRING_AGG(menuName, ',') WITHIN GROUP (ORDER BY minor_num) AS menuNames from tblManager_menu where member_code =  @id `;
        const result = await pool.request().input('id',sql.NVarChar,AviaLoginId).query(baseQuery);
        const row = result.recordset[0]?.menuNames || ''; 
        const menuList = row.split(',').filter(Boolean);  
        const { menuJson } = require('../data/aviaMenu.js');
        let html = '';
        let signal = '';
        for (const key in menuJson) {
            const [menuTitle, iconClass] = key.split(';');
            const items = menuJson[key];
            html += `<div class="menu-group">
            <h4>${menuTitle}</h4>
            <div class="menu-list">`;
            items.forEach(([label, code, url]) => {
                if (menuList.includes(code)) signal = '★';
                else signal = '☆';
                html += `
                    <span class='menu-item' id='menu_${code}'>
                        <span class='menu-star'  id='menu_${code}_signal' onClick="return menuSignal('${code}','${label}')">${signal}</span> 
                        <span class='menu-label' id='menu_${code}_label'>${label}</span>
                    </span>`;
            });
            html += `</div></div>`;
        }
        //console.log(html);
        res.json({ datas: html });
    } else if (mode == "menuChange") {
        const code  = req.body.data;
        const label = req.body.label;
        try {
            const sql1 = `select * from tblManager_menu where member_code = @id and menuName = @code`;
            const result1 = await pool.request().input('id',sql.NVarChar,AviaLoginId).input('code',sql.NVarChar,code).query(sql1);
            const menuName = result1.recordset[0]?.menuName || 0;
            let   minor_num = result1.recordset[0]?.minor_num || '';
            if (menuName) {
                const sql2 = `delete from tblManager_menu where member_code = @id and menuName = @code`;
                const result2 = await pool.request().input('id',sql.NVarChar,AviaLoginId).input('code',sql.NVarChar,code).query(sql2);
                const sql3 = `update tblManager_menu set minor_num = minor_num - 1 where member_code = @id and minor_num > @minor_num`;
                const result3 = await pool.request().input('id',sql.NVarChar,AviaLoginId).input('minor_num',sql.Int,minor_num).query(sql3);
            } else {
                //const sql5 = `select isnull(max(minor_num),0) + 1 as minor_num from tblManager_menu where member_code = @id`;
                //const result5 = await pool.request().input('id',sql.NVarChar,AviaLoginId).query(sql5);
                minor_num = await minorNext (pool, {table: 'tblManager_menu', uid:'' , uid_minor: '' , query : `member_code = '${AviaLoginId}'` });
                const sql4 = `insert into tblManager_menu (member_code, menuName, menuNameKr, minor_num) values (@id, @code, @menuNameKr, @minor_num)`;
                const result4 = await pool.request().input('id',sql.NVarChar,AviaLoginId).input('code',sql.NVarChar,code).input('menuNameKr',sql.NVarChar,label).input('minor_num',sql.Int,minor_num).query(sql4);
            }
            res.json({ success: 'ok' });
        } catch (err) {
            console.error(err);
            res.status(500).send('Database error');
        }
    } else if (mode == "aviaMenu") {
        const { menuJson } = require('../data/aviaMenu.js');
        let html = '';
        let index = 1;
        if (AviaLoginId) {
            for (const key in menuJson) {
                const [menuTitle, iconClass] = key.split(';');
                const items = menuJson[key];

                html += `
                <div class="nav-group">
                    <div class="nav-1-wrap" onclick="menuShow('${index}')" data-toggle="collapse" aria-expanded="true" class="dropdown-toggle">
                        <a href="#" class="nav-1-link chev">${menuTitle}</a>
                        <span class="chev">▾</span>
                    </div>
                    <div class="nav-2wrap" style="display: none;" id="menu${index}">
                        <div class="nav-item">
                `;
                items.forEach(([label, code, url , view]) => {
                    if (view !== "N") {
                        html += `<button class="nav-2" type="button" onclick="return menuChange('${code}', '${url}', '${label}')"> ${label} <span class="chev">▾</span> </button>`;
                    }
                });
                html += `</div></div></div>`;

                index++;
            }
        }
        res.json({ leftMenu: html });
        //console.log(html);
    } else if (mode == "Login") {
        const domain = req.headers.host;        // 접속 도메인
        let   ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
        if (ip.startsWith('::ffff:')) {
            ip = ip.replace('::ffff:', '');
        }
        const html = `
        	<div class="login-image">
                <img src="/images/junho.gif" alt="airplane">
            </div>
        
            <div class="login-panel">
                <h2>관리자 로그인</h2>
        
                <div class="form-row">
                    <label>관리자 ID</label>
                    <input type="text" placeholder="관리자 ID"  id="userid" name="userid">
                </div>
        
                <div class="form-row">
                    <label>비밀번호</label>
                    <input  type="password" name="passwd" placeholder="비밀번호" id="passwd">
                </div>
        
                <button class="btn-login" type="submit">관리자 로그인</button>
        
                <div class="login-info">
                    <p>도메인 : ${domain}</p>
                    <p>접속IP : ${ip}</p>
                    <p>기술문의 : (02) 844-0413</p>
                    <p class="copy">© Avianext · AOS Platform</p>
                </div>
            </div>
        
        `;
        res.json({ loginData: html });
    }
    
	
};

