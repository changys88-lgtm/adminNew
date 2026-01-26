const { aes128Encrypt, aes128Decrypt } = require('../src/utils/cryptoUtil');
const { dbConfig, blockedIP, getNow , bbsImgName } = require('../lib/config');
const { sql, getPool } = require('../lib/dbPool');
const { cutDate , cutTime , getWeekday } = require('../src/utils/cutDate');
const cookieParser = require('cookie-parser');
const express = require('express');
//const sql = require('mssql');
const { getPagination } = require('../src/utils/paging'); 

const app = express();
app.use(cookieParser());

module.exports = async (req, res) => {
    const mode = req.body.mode;
    const sWord = req.body?.sWord || '';
    const sAir = req.body?.sAir || '';
    //console.log(mode);
    const aviaLoginId   = req.cookies?.AviaLoginId   || '';
    const AviaLoginName = req.cookies?.AviaLoginName || '';
    const b2bLoginId    = req.cookies?.b2bLoginId    || '';
    const pool = await getPool();
    let   msg = '';
    if (mode == "CITY") {
        const page        = req.body.page || '1';
        const listCount   = '10';
        try {
            const cityQuery = `select * from airPort_code where groupName != '' and mainCity = 'Y' order by sorting `;
            const resultCity = await pool.request().query(cityQuery);
            let   subs   = ``;
            const cData  = {};
            resultCity.recordset.forEach(row => {
                groupName   = row.groupName.trim();
                cityName    = row.cityName.trim();
                portCode    = row.portCode.trim();
                cityName_en = row.cityName_en.trim();
                if (!cData[groupName]) cData[groupName] = [];
                cData[groupName].push(`${portCode}/${cityName}/${cityName_en}`);
            });
            for (const [key, val] of Object.entries(cData)) {
                let sub = '';
                for (const city of val) {
                    const [code , name , name_en] = city.split("/");
                    sub += `<li><a href='#' class='$font' onClick="cityChoice('${code}','${name}','${name_en}')">${name}</a></li>`;
                };
                subs += `
                    <div class='list-0 ${key}'>
                        <p class='city-tit'>${key}</p>
                        <ul>
                            ${sub}
                        </ul>
                    </div>
                `;
            };
            
            let newsQry   = ` where 1=1 `;
            if (sWord != "") newsQry += ` and subject like '%${sWord}%' `; 
            if (sAir != "") newsQry += ` and airline = '${sAir}' `;
            let totQuery = `select count(*) as total from airline_news as a ${newsQry}`;
            
            const result2 = await pool.request().query(totQuery);
            const totalRowCount = result2.recordset[0].total;
            const { startRow, endRow, pageHTML } = getPagination({
                tot_row: totalRowCount,
                page: page ,
                listCount: listCount
            });
            const joinQry = ` left outer join airline_news as a WITH (nolock) on main.uid = a.uid `;
            const newsQuery = `
            select 
                a.*
                from (
                select * from
                    (select a.uid , ROW_NUMBER() OVER (order by a.uid desc ) as RowNum
                        from 
                        airline_news (nolock) as a 
                        
                        ${newsQry}
                        
                    ) as db1
                where RowNum BETWEEN ${startRow} AND ${endRow}
                ) as main
                ${joinQry}
                order by RowNum asc
            `;
            //console.log(newsQuery);
            const resultNews = await pool.request().query(newsQuery);
            
            let   newsData = ``;
            resultNews.recordset.forEach(row => {
                const trimmedRow = {};
                for (const [key, val] of Object.entries(row)) {
                    trimmedRow[key] = val === null ? '' : (typeof val === 'string' ? val.trim()  : val);
                }
                const { uid , airline , subject , up_date , file_name , file_link  } = trimmedRow;
                let img = "";
                let ext = '';
                if (file_name) {
                    ext = file_name.split('.').pop().toLowerCase();
                    if (ext.length > 4) ext = file_link.split('.').pop().toLowerCase();
                    if (ext.length > 4) ext = "unknown";
                    img = `<img src='/images/icons/${ext}.gif'>`;
                }
                newsData += `
                    <tr>
                        <td>${uid}</td>
                        <td>${airline}</td>
                        <td class='al'><a href='javascript://' onClick="newsDetail('${uid}')">${subject}</a></td>
                        <td>${img}</td>
                        <td>${cutDate(up_date)}</td>
                    </tr>
                `;
            });
            const cityhtml = `
                <table class='result-table'  id='dtBasic'>
                    <thead class='thead-std' style=''>
                    <tr style='background-color:#eee;'>
                        <th class='wh100'>넘버</th>
                        <th class='wh100'>항공사</th>
                        <th >제목</th>
                        <th class='wh60'>첨부</th>
                        <th class='wh120'>등록일</th>
                    </tr>
                    </thead>
                    ${newsData}
                </table>
               
            `;

            const citySql = `select * from airPort_code where usage is null or usage = ''`;
            const cityResult = await pool.request().query(citySql);
            const gData = [];
            for (const put of cityResult.recordset) {
                let {portCode , countryName , cityName , portName , cityName_en} = put;
                gData.push(`${portCode}/${countryName}/${cityName}/${portName}/${cityName_en}`);
            }

            res.json({ city: subs , news: cityhtml , cityData : gData , pageHTML : pageHTML });
        } catch (err) {
            console.error(err);
            res.status(500).send('Database error');
        }
    } else if (mode === "NEWSLIST") {
        let newsQry   = ` where 1=1 `;
        if (sWord != "") newsQry += ` and subject like '%${sWord}%' `; 
        if (sAir != "") newsQry += ` and airline = '${sAir}' `;
        let totQuery = `select count(*) as total from airline_news as a ${newsQry}`;
        const page = req.body.page || 1;
        const listCount = '10';
        const result2 = await pool.request().query(totQuery);
        const totalRowCount = result2.recordset[0].total;
        const { startRow, endRow, pageHTML } = getPagination({
            tot_row: totalRowCount,
            page: page ,
            listCount: listCount
        });
        //console.log(page,totalRowCount,startRow,endRow,pageHTML);
        const joinQry = ` left outer join airline_news as a WITH (nolock) on main.uid = a.uid `;
        const newsQuery = `
        select 
            a.*
            from (
            select * from
                (select a.uid , ROW_NUMBER() OVER (order by a.uid desc ) as RowNum
                    from 
                    airline_news (nolock) as a 
                    
                    ${newsQry}
                    
                ) as db1
            where RowNum BETWEEN ${startRow} AND ${endRow}
            ) as main
            ${joinQry}
            order by RowNum asc
        `;
        //console.log(newsQuery);
        const resultNews = await pool.request().query(newsQuery);
        
        let   newsData = ``;
        resultNews.recordset.forEach(row => {
            const trimmedRow = {};
            for (const [key, val] of Object.entries(row)) {
                trimmedRow[key] = val === null ? '' : (typeof val === 'string' ? val.trim()  : val);
            }
            const { uid , airline , subject , up_date , file_name , file_link  } = trimmedRow;
            let img = "";
            let ext = '';
            if (file_name) {
                ext = file_name.split('.').pop().toLowerCase();
                if (ext.length > 4) ext = file_link.split('.').pop().toLowerCase();
                if (ext.length > 4) ext = "unknown";
                img = `<img src='/images/icons/${ext}.gif'>`;
            }
            newsData += `
                <tr>
                    <td style="text-align: center;">${uid}</td>
                    <td>${airline}</td>
                    <td class='al'><a href='javascript://' onClick="newsDetail('${uid}')">${subject}</a></td>
                    <td>${img}</td>
                    <td>${cutDate(up_date)}</td>
                </tr>
            `;
        });
        if (newsData == "") newsData = `<tr><td colspan='5' class='ac hh50'>검색결과가 없습니다.</td></tr>`;
        const cityhtml = `
            <table  id='dtBasic'>
                <thead>
                <tr>
                    <th>넘버</th>
                    <th>항공사</th>
                    <th>제목</th>
                    <th>첨부</th>
                    <th>등록일</th>
                </tr>
                </thead>
                <tbody>
                    ${newsData}
                </tbody>
            </table>
            
        `;
        res.json({ success: 'ok', errorMsg: msg , news: cityhtml , pageHTML : pageHTML });
    } else if (mode == "NEWS") {

        const uid = req.body.uid;
        try {
            const newsQuery = `select * from airline_news where uid = '${uid}' `;
            const result    = await pool.request().query(newsQuery);
            const newsRow   = result.recordset[0];

            const newsQuery2 = `select contents from airline_news_detail where uid_minor = '${uid}' `;
            const result2    = await pool.request().query(newsQuery2);
            const newsRow2   = result2.recordset[0];
            const titleData  = `<i class="fas fa-edit search-title-text"> 제목 : ${newsRow.subject} </span></i>`;
            let   htmlData = ` 제목 : ${newsRow.subject} <br><br>${newsRow2.contents} `;
            htmlData = newsRow2.contents || '';
            htmlData = htmlData.replace(/\/upload\//g, 'http://www.galileo.co.kr/upload/');
            htmlData = htmlData.replace(/<a href/gi, "<a target='_blank' href");
            htmlData = htmlData.replace(/\\"/g, '"');

            if (newsRow.file_name && newsRow.file_name !== '') {
                htmlData += `<br>첨부화일 : <a href="//www.galileo.co.kr/${newsRow.file_link}" target="_blank">첨부파일</a>`;
            }
        
            htmlData += "<br><BR><center><트래블 포트 코리아 제공></center>";
            res.json({ success: 'ok', errorMsg: msg , title: titleData , html: htmlData });
            
            //console.log(html);
        } catch (err) {
            msg = err;
            console.error(err);
            res.status(500).send('Database error');
        }
    } else if (mode == "airCheck") {
        const air = req.body.uid;
        try {
            let  airhtml = '';
            let  cityhtml = '';
            const airQuery = `select airLike , cityLike from airPort_code (nolock) where portCode = '${air}' `;
            const result1   = await pool.request().query(airQuery);
            const {airLike , cityLike} = result1.recordset[0] || {};
            if (airLike) {
                const airList    = airLike.replace(/\//g, "','");
                const airQuery2 = `select code_2,name from airLine_code (nolock) where code_2 in ('${airList}')`;
                const result2   = await pool.request().query(airQuery2);
                //for (const row of result2.recordset) {
                result2.recordset.forEach(row => {
                    code = row.code_2.trim();
                    name = row.name.trim();
                    airhtml += `
                        <div class='air-c-group custom-checkbox'>
                            <input class='custom-control-input' type='checkbox' title='${name}' name='SearchAirLikeData[]' id='SearchAirLikeData_${code}' value='${code}' onClick='return searchAirLikeChange(this.value)'>
                            <label class='custom-control-label' for='SearchAirLikeData_${code}'><img src='${bbsImgName}/Airline/Search/${code}.png' class='air-icon'>${code}</label>
                        </div>
                    `;
                });
            }
            airhtml += `
                <div class='air-c-group custom-checkbox'>
                    <input class='custom-control-input' type='checkbox' name='SearchAirLikeData[]' id='SearchAirLikeData_ETC' value='' onClick='return searchAirLikeChange(this.value)'><label class='custom-control-label' for='SearchAirLikeData_ETC'><input type='text' name='' class='form-smooth wh80' maxlength='2' placeholder='항공사 입력' onChange="$('#SearchAirLikeData_ETC').val(this.value)"></label>
                </div>
            `;

            if (cityLike) {
                const cityList    = cityLike.replace(/\//g, "','");
                const airQuery3 = `select portCode,cityName from airPort_code (nolock) where code_2 in ('${cityList}')`;
                const result3   = await pool.request().query(airQuery3);
                //for (const row of result2.recordset) {
                result3.recordset.forEach(row => {
                    portCode = row.portCode.trim();
                    cityName = row.cityName.trim();
                    airhtcityhtmlml += `
                        <div class='air-c-group custom-checkbox'>
                            <input class='custom-control-input' type='checkbox' title='${cityName}' name='SearchCityLikeData[]' id='SearchCityLikeData_${portCode}' value='${portCode}' onClick='return searchCityLikeChange(this.value)'><label class='custom-control-label' for='SearchCityLikeData_${portCode}'>${portCode}</label>
                        </div>
                    `;
                });
            }
            cityhtml += `
                <div class='air-c-group custom-checkbox'>
                    <input class='custom-control-input' type='checkbox' name='SearchCityLikeData[]' id='SearchCityLikeData_ETC' value='' onClick='return searchCityLikeChange(this.value)'><label class='custom-control-label' for='SearchCityLikeData_ETC'><input type='text' name='' class='form-smooth wh70' maxlength='3' onChange="$('#SearchCityLikeData_ETC').val(this.value)" placeholder='도시코드'></label>
                </div>
            `;
            

            
            res.json({ airData: airhtml , cityData : cityhtml });
        } catch (err) {
            console.log(err);
        }
    } else if (mode == "recentCheck") {
        let aHTML   = {};
        let font    = '';
        let addCode = '';
        let addDate = '';
        let code    = '';
        let week2   = '';
        let week3   = '';
        let week4   = '';
        qry   = ` and man_id = '${aviaLoginId}${b2bLoginId}' and searchType = 'R' `;
        reQuery =  `
            select top 30 * 
            , (select cityName from airPort_code where portCode = a.src )   as src_name
            , (select cityName from airPort_code where portCode = a.dest )  as dest_name
            , (select cityName from airPort_code where portCode = a.src2 )  as src_name2
            , (select cityName from airPort_code where portCode = a.dest2 ) as dest_name2
            , (select cityName from airPort_code where portCode = a.src3 )  as src_name3
            , (select cityName from airPort_code where portCode = a.dest3 ) as dest_name3
            , (select cityName from airPort_code where portCode = a.src4 )  as src_name4
            , (select cityName from airPort_code where portCode = a.dest4 ) as dest_name4
            from interline_search_log as a where dep_date > '${getNow().NOWS}' ${qry} order by up_date desc , up_time desc
        `;
        reResult = await pool.request().query(reQuery);
        reResult.recordset.forEach(row => {
            const trimmedRow = {};
            for (const [key, val] of Object.entries(row)) {
                trimmedRow[key] = val === null ? '' : (typeof val === 'string' ? val.trim() : val);
            }
            let {
                dep_date , dep_date2 , dep_date3 , dep_date4 , arr_date
                , src , dest , stopover , grade ,adt_mem , chd_mem , inf_mem
                , src2 , src_name2 , src3 , src_name3 , src4 , src_name4
                , dest2 , dest_name2 , dest3 , dest_name3 , dest4 , dest_name4 , ticket_type
                , up_date , up_time , src_name , dest_name
            } = trimmedRow;
            
            week1     = getWeekday(dep_date);
            code      = dep_date+arr_date+src+dest+stopover+grade+adt_mem+chd_mem+inf_mem;
            addCode   = src2+src_name2+dest2+dest_name2+src3+src_name3+dest3+dest_name3+src4+src_name4+dest4+dest_name4;
            addDate   = dep_date2+dep_date3+dep_date4;
            if (ticket_type == "3") {
                week2 = getWeekday(dep_date2);
                week3 = getWeekday(dep_date3);
                week4 = getWeekday(dep_date4);
            }
            addWeek = week2+week3+week4;
            if (!aHTML[code]) {
                HTML = `
                    <tr  onmouseout="this.style.backgroundColor=''">
                        <td  >${cutDate(up_date)}_${cutTime(up_time)}</td>
                        <td >${font}${stopover}</td>
                        <td >${font}${grade}</td>
                        <td >${font}${cutDate(dep_date)}</td>
                        <td >${font}${cutDate(arr_date)}</td>
                        <td title='${src_name}'>${font}${src}</td>
                        <td title='${dest_name}'>${font}${dest}</td>
                        <td >${font}${adt_mem}/${chd_mem}/${inf_mem}</td>
                        <td >${font}<span class='btn_slim btn_blue nowrap' onClick="searchHistory('${ticket_type}','${dep_date}','${arr_date}','${src}','${src_name}','${dest}','${dest_name}','${adt_mem}','${chd_mem}','${inf_mem}','${week1}','${week2}','${stopover}','${addCode}','${addDate}','${addWeek}','${grade}')">검색</span></td>
                    </tr>
                `;
                aHTML[code] = HTML;
            }
        });
        let listHTML = Object.values(aHTML).join('');
        listHTML = `
            <div class="avn-history-wrap">
                <table class="avn-history-table">
                    <thead>
                    <tr>
                        <th>검색일</th>
                        <th>직항</th>
                        <th>캐빈</th>
                        <th>출발일</th>
                        <th>도착일</th>
                        <th>출발지</th>
                        <th>도착지</th>
                        <th>인원</th>
                        <th>검색</th>
                    </tr>
                </thead>
                 <tbody>
                    ${listHTML}
                </tbody>
            </table>
             <div  class="opt-footer">
                <button type="button" onclick="$('#ageCheckPopup').hide()">닫기</button>
            </div>
        `;

        res.json ({recentData : listHTML});
    } else if (mode == "ageCheck") {
        html = `
            <div id='detail-popup' style='width:50%!important; height: 500px'>
                <div class='detail-top'>
                    <li class='tit'>나이 계산기</li>
                    <li id='datail-close' onClick="$('#revPopup').hide()" ><img src='../images/close.png' width='50'></li>
                </div>

                <div class='detail-content'></div>
                <form name='frmAge'>
                <div style='padding:10px 10px'>
                    <table width='100%' height='160' class='OyeTable bgcEEE'>

                        <tr class='ac'>
                            <th>출발일</th>
                            <th>생년월일</th>
                            <th>계산</th>
                        </tr>

                        <tr class='ac'>
                            <td class='ac'>
                                <input type='text' class='d-inline form-control form-control-sm wh120 ac' name='start_date' onfocus='this.select()' id='start_date' onkeyup='return DateAutoCheck(this)' onBlur='return dCheck3(this)' value='${cutDate(getNow().NOWS)}'>
                            </td>
                            <td class='ac'>
                                <input type='text' class='d-inline form-control form-control-sm wh120 ac' name='birthday'  onfocus='this.select()' id='birthday'  onkeyup='return DateAutoCheck(this)' onBlur='return dCheck3(this)' value='${cutDate(getNow().NOWS)}'>
                            </td>
                            <td >
                                <span class='btn_basic btn_blue' onClick='calculateAge ()'>계산하기</span>
                            </td>
                        </tr>

                        <tr class='ac'>
                            <td colspan='3'>
                                <span style='font-size: 24px;font-weight: 500;}'>
                                    실제 만나이 : 
                                    <span id='ageValue'>0</span> 세
                                </span>
                            </td>

                        </tr>

                    </table>
                </div>
                </form>
                <div class='detail-content'>
                <div class='pal30 al'>
                    <ul>
                        <li>최종 탑승일을 입력해 주세요
                        <li>성인 : 만 12세 이상
                        <li>소아 : 2세 부터 12세 미만까지
                        <li>유아 : 24개월 미만 
                        <li>주민등록및 신분증의 출생일을 직업입력후 계산하여 주세요
                    </ul>
                </div>
                <div class='detail-content ac' onClick="$('#revPopup').hide()" > <span class='btn_basic btn_gray' >닫 기</span></div>
                </div>
            </div>
        `;
        res.json({ ageData: html  });
    } 
};

