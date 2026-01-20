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
    const mainTable   = 'airPort_code';

    let   sqlText     = '';
    let   sqlResult   = '';
    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }

    if (GU1  != "")       addQry         += ` and region = '${GU1}' `;
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
                uid , portCode , region ,  region_en , countryName , countryName_en , cityName , cityName_en , groupName , groupName2
                , portName , portName_en , cache_time , sorting , mainCity , distanceType , usage , addressReq
            } = row;
            if (distanceType === "1") distanceType = "단거리";
            else if (distanceType === "2") distanceType = "중거리";
            else if (distanceType === "3") distanceType = "장거리";
            rows += `
                <tr  HEIGHT=29  onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor='#FFFFFF'" bgcolor="#fff">
                    <td  onClick="return newReg('${uid}','modify')" class='cursor'>${font}${uid}</td>
                    <td >${font} <span class='btn_slim btn_yellow'  onClick="return newReg('${uid}','modify')"> ${portCode} </span></td>
                    <td >${font}${region} (${region_en || ''})</td>
                    <td >${font}${countryName} (${countryName_en || ''})</td>
                    <td >${font}${cityName} (${cityName_en || ''})</td>
                    <td >${font}${groupName}</td>
                    <td >${font}${groupName2 || ''}</td>
                    <td >${font}${portName} (${portName_en})</td>
                    <td >${font}${addressReq || ''}</td>
                    <td >${font}${mainCity || ''}</td>
                    <td >${font}${cache_time || ''}</td>
                    <td >${font}${sorting}</td>
                    <td >${font}${distanceType}</td>
                    <td class=''>${font}${usage || ''}</td>
                </tr>
            `;
            ix ++;
        };

        listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr >
                    <th>No</th>
                    <th>코드</th>
                    <th>대륙명</th>
                    <th>국가명</th>
                    <th>도시명</th>
                    <th>그룹명칭</th>
                    <th>그룹명칭(영문)</th>
                    <th>공항명</th>
                    <th>주소필수</th>
                    <th>주요도시</th>
                    <th>캐쉬</th>
                    <th>순서</th>
                    <th>거리</th>
                    <th>사용금지</th>
                </tr>
                ${rows}
            </table>
        `;

        let gu1Data = '';
        let gu2Data = '';
        sqlText = `select distinct (region) from ${mainTable} where region != '' `;
        sqlResult = await pool.request().query(sqlText);
        for (const put of sqlResult.recordset) {
            let {region} = put;
            region = region.trim();
            const s = GU1 === region ? 'selected' : '';
            gu1Data += `<option value='${region}' ${s}>${region}</option> `;
        }
        sqlText = `select distinct (countryName) from ${mainTable} where region = '${GU1}' and countryName != '' `;
        sqlResult = await pool.request().query(sqlText);
        for (const put of sqlResult.recordset) {
            let {countryName} = put;
            countryName = countryName.trim();
            const s = GU2 === countryName ? 'selected' : '';
            gu2Data += `<option value='${countryName}' ${s}>${countryName} </option> `;
        }
        const gu1List = `
                <select name="GU1" class="d-inline form-control form-control-sm"  style='width:100px;' >
                    <option value="">대륙선택</option>
                    ${gu1Data}    
                </select>
            `;
        const gu2List = `
                <select name="GU2" class="d-inline form-control form-control-sm"  style='width:100px;' >
                    <option value="">국가선택</option>
                    ${gu2Data}    
                </select>
            `;
        res.json({ success : 'ok',  listData: listHTML , pageData: pageHTML , totalCount: totalRowCount , gu1List:gu1List , gu2List: gu2List });
    } catch (err) {
        console.error('에러:'+err);
        res.status(500).send('Database error');
    }
	
};

