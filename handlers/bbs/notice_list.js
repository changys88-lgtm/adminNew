const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { getPagination } = require('../../src/utils/paging'); 
const { arrNotice } = require('../../src/utils/airConst'); 

const fieldQry = `
    a.* 
    
`;

//left outer join interline as a (nolock) on main.uid = a.uid   
const joinQry = `
`;
module.exports = async (req, res) => {
    let   start_date  = req.body.start_date || '';
    let   end_date    = req.body.end_date || '';
    let   GU1         = req.body.GU1     || '';
    let   GU2         = req.body.GU2     || '';
    let   GU3         = req.body.GU3     || '';
    let   GU4         = req.body.GU4     || '';
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

    let addQry        = ` gubun1 != '26' `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }

    if (GU1  != "")      addQry         += ` and viewPos like '%${GU1}%' `;
    if (gubun    != "")  addQry         += ` and gubun = '${gubun}' `;
    if (b2bSiteCode)     addQry         += ` and (viewPos like '%B%' or userid = '${b2bSiteCode}') `;

    try {
        
        const totQuery = `
            select count(*) as total from  notice as a (nolock)  
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
        const baseQuery = `
        select 
            ${fieldQry}
            from (
            select * from
                (select a.uid , ROW_NUMBER() OVER (order by a.uid desc ) as RowNum
                    from 
                    notice as a (nolock)  
                    ${joinQry}
                    where   
                    ${addQry}
                    
                ) as db1
            where RowNum BETWEEN ${startRow} AND ${endRow}
            ) as main
            left outer join notice as a (nolock) on main.uid = a.uid
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
                uid , gubun1 , popup ,  subject , TempDomain , link_url , username , up_date , viewPos
            } = row;
            viewPos = viewPos
                .replace('A','관리자 ')
                .replace('B','파트너 ')
                .replace('C','고객 ');
            rows += `
                <tr  HEIGHT=29  onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor='#FFFFFF'" bgcolor='#FFFFFF'>
                    <td $link>${font}<a href='javascript://' onClick="return newReg('${uid}','view')" style='color:#222;font-weight:600;'>${uid}</a></td>
                    <td >${font}${arrNotice[gubun1]}</td>
                    <td >${font}${popup || ''}</td>
                    <td ><a href='javascript://' onClick="return newReg('${uid}','view')" style='color:#222;font-weight:600;'>${font}${subject}</a></td>
                    <td >${font}${viewPos} ${TempDomain || ''}</td>
                    <td >${font}${link_url || ''}</td>
                    <td >${font}${username}</td>
                    <td >${font}${deps.cutDate(up_date)}</td>
                    <td><span class='btn_basic btn_red' onClick="return funcDel('${uid}')">Del</span></td>
                </tr>
            `;
            ix ++;
        };

        listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr >
                    <th  class=''>No</th>
                    <th  class=''>구분</th>
                    <th  class=''></th>
                    <th  class=''>제목</th>
                    <th  class=''>노출위치</th>
                    <th  class=''>링크주소</th>
                    <th  class=''>등록자</th>
                    <th  class=''>등록일</th>
                    <th  class=''>삭제</th>
                </tr>
                ${rows}
            </table>
        `;
        res.json({ success : 'ok', listData: listHTML , pageData: pageHTML , totalCount: totalRowCount });
    } catch (err) {
        console.error('에러:'+err);
        res.status(500).send('Database error');
    }
	
};

