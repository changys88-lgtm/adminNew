const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { getPagination } = require('../../src/utils/paging'); 
const { arrNotice } = require('../../src/utils/airConst'); 


//left outer join interline as a (nolock) on main.uid = a.uid   
const joinQry = `
`;
module.exports = async (req, res) => {
    let   start_date  = req.body.start_date || '';
    let   end_date    = req.body.end_date || '';
    let   GU1         = req.body.GU1     || '';
    let   GU2         = req.body.GU2     || '';
    let   GU3         = req.body.GU3     || '';
    let   distance    = req.body.distance     || '';
    const gubun       = req.body.gubun   || '';
    const page        = req.body.page    || '1';
    const listCount   = req.body.listCount;
    const sWord       = req.body.sWord   || '';
    const sFrom       = req.body.sFrom   || '';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const pool        = await deps.getPool();
    const sql         = deps.sql;
    const mainTable   = 'airLine_code';

    let   sqlText     = '';
    let   sqlResult   = '';
    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }

    if (GU1  != "")       addQry         += ` and air_group = '${GU1}' `;
    if (GU2  != "")       addQry         += ` and countryName = '${GU2}' `;
    if (GU3  != "")       addQry         += ` and mainCity = '${GU3}' `;
    if (distance === "Y") addQry         += ` and and ( distanceType = '' or distanceType is null ) `;

    try {
        
        const totQuery = `
            select count(*) as total from  ${mainTable} as a (nolock)  
            ${joinQry}
            where
            ${addQry}
        `;
        const result2 = await pool.request().query(totQuery);
        const totalRowCount = result2.recordset[0].total;
        const { startRow, endRow, pageHTML } = getPagination({
            tot_row: totalRowCount,
            page: page ,
            listCount: listCount
        });
        const fieldQry = `
            a.* 
        `;

        const baseQuery = `
        select 
            ${fieldQry}
            from (
            select * from
                (select a.uid , ROW_NUMBER() OVER (order by a.uid desc ) as RowNum
                    from 
                    ${mainTable} as a (nolock)  
                    ${joinQry}
                    where   
                    ${addQry}
                    
                ) as db1
            where RowNum BETWEEN ${startRow} AND ${endRow}
            ) as main
            left outer join ${mainTable} as a (nolock) on main.uid = a.uid
            ${joinQry}
            
            order by RowNum asc
        `;
        //console.log(baseQuery)
        const result = await pool.request().query(baseQuery);
        let   rows = ``;
        let   ix = 0 ;
        let   font = '';
        for (const row of result.recordset) {
            let { 
                uid , code_2 , code_3 ,  name , eng_name , SearchGDS , GDS , sale_ban , cardNo , viSend
                , reSearch , air_group , issueSite , directApi 
            } = row;
            if (cardNo === "Y") cardNo = "<font color='red'>발권불가</font>";
            let img = '';            
            if (code_2) img += `<img src='${deps.bbsImgName}/Airline/Search/${code_2}.png' width='20' title='검색화면'> &nbsp;`;
            if (code_2) img += `<img src='${deps.bbsImgName}/Airline/List/airline_img_${code_2}.jpg' width='20' title='검색화면'> &nbsp;`;
            if (code_3) img += `<img src='${deps.bbsImgName}/Airline/Ticket/${code_3}_logo.jpg' height='20' title='티켓정보'>`;
            rows += `
                <tr  HEIGHT=29  onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor='#FFFFFF'" bgcolor="#fff">
                    <td ><span class='btn_slim btn_yellow' onClick="return newReg('${uid}','modify')" class='cursor'>${font}${uid} </span></td>
                    <td >${font}${code_2 || ''}</td>
                    <td >${font}${code_3 || ''}</td>
                    <td >${font}${name || ''}</td>
                    <td >${font}${eng_name || ''}</td>
                    <td >${font}${SearchGDS || ''}</td>
                    <td >${font}${GDS || ''}</td>
                    <td >${font}${sale_ban || ''}</td>
                    <td >${font}${cardNo || ''}</td>
                    <td >${font}${viSend || ''}</td>
                    <td >${font}${reSearch || ''}</td>
                    <td >${font}${air_group || ''}</td>
                    <td >${issueSite || ''}</td>
                    <td >${directApi || ''}</td>
                    <td >${img}</td>
                </tr>
            `;
            ix ++;
        };

        if (!rows) {
            rows = `<tr><td colspan='20' class='ac hh50'>검색된 데이터가 없습니다.</td></tr>`;
        }

        listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr >
                    <th>No</th>
                    <th>2코드</th>
                    <th>3코드</th>
                    <th>항공사명칭</th>
                    <th>영문명칭</th>
                    <th>검색GDS</th>
                    <th>발권GDS</th>
                    <th>판매금지</th>
                    <th>카드발권</th>
                    <th>VI 지급</th>
                    <th>리이슈</th>
                    <th>구분</th>
                    <th>발권BSP</th>
                    <th>NDC</th>
                    <th>이미지</th>
                </tr>
                ${rows}
            </table>
        `;

        res.json({ success : 'ok', listData: listHTML , pageData: pageHTML , totalCount: totalRowCount   });
    } catch (err) {
        console.error('에러:'+err);
        res.status(500).send('Database error');
    }
	
};

