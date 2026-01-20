const deps = require('../../src/common/dependencies');
const { getPagination } = require('../../src/utils/paging'); 

module.exports = async (req, res) => {
    let   mode          = req.body.mode;
    const airlineWord   = req.body?.airlineWord || '';
    const airlineData   = req.body?.airlineData || '';
    const aviaLoginId   = req.cookies?.AviaLoginId   || '';
    const AviaLoginName = req.cookies?.AviaLoginName || '';
    const b2bLoginId    = req.cookies?.b2bLoginId    || '';
    const pool          = await deps.getPool();
    const cutDate       = deps.cutDate;
    const page          = req.body.page || '1';
    const listCount     = '10';
    if (mode == "SET") {
        try {
                        
            let newsQry   = ` where 1=1  and gubun = '2' `;
            if (airlineWord != "") newsQry += ` and subject like '%${airlineWord}%' `; 
            if (airlineData != "") newsQry += ` and airline = '${airlineData}' `;
            let totQuery = `select count(*) from airline_news as a ${newsQry}`;
            
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
                <table class='oyeTable2 table-light text-center mt-3' border=1 bordercolor='#ddd'  style='border-bottom:1px solid #ddd;' id='dtBasic'>
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
                <div>
                    ${pageHTML}
                </div>
            `;
            res.json({ city: '' , news: cityhtml });
        } catch (err) {
            console.error(err);
            res.status(500).send('Database error');
        } 
    } else if (mode == "NEWS") {

        const uid = req.body.uid;
        try {
            pool = await getPool();
            const newsQuery = `select * from airline_news where uid = '${uid}' `;
            const result    = await pool.request().query(newsQuery);
            const newsRow   = result.recordset[0];

            const newsQuery2 = `select contents from airline_news_detail where uid_minor = '${uid}' `;
            const result2    = await pool.request().query(newsQuery2);
            const newsRow2   = result2.recordset[0];
            let   html = ` 제목 : ${newsRow.subject} <br><br>${newsRow2.contents} `;
            html = html.replace(/\/upload\//g, 'http://www.galileo.co.kr/upload/');
            html = html.replace(/<a href/gi, "<a target='_blank' href");
            html = html.replace(/\\"/g, '"');

            if (newsRow.file_name && newsRow.file_name !== '') {
                html += `<br>첨부화일 : <a href="//www.galileo.co.kr/${newsRow.file_link}" target="_blank">첨부파일</a>`;
            }
        
            html += "<br><BR><center><트래블 포트 코리아 제공></center>";
            
            res.json({ detail: html });
            //console.log(html);
        } catch (err) {
            console.error(err);
            res.status(500).send('Database error');
        }
    } 
};

