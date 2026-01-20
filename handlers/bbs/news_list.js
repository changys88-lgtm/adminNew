const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { getPagination } = require('../../src/utils/paging'); 
const { arrNewsGubun } = require('../../src/utils/airConst'); 

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

    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }

    if (GU1  != "")      addQry         += ` and viewPos like '%${GU1}%' `;
    if (gubun    != "")  addQry         += ` and gubun = '${gubun}' `;

    try {
        
        const totQuery = `
            select count(*) as total from  airline_news as a (nolock)  
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
                    airline_news as a (nolock)  
                    ${joinQry}
                    where   
                    ${addQry}
                    
                ) as db1
            where RowNum BETWEEN ${startRow} AND ${endRow}
            ) as main
            left outer join airline_news as a (nolock) on main.uid = a.uid
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
                uid , gubun , airline , subject , manager , up_date
            } = row;
            rows += `
                <tr  HEIGHT=29  onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor='#FFFFFF'">
                    <td $link>${font}<span class='btn_slim btn_yellow'  onClick="return newReg('${uid}')" style='color:#222;font-weight:600;'>${uid}</span></td>
                    <td >${font}${arrNewsGubun[gubun]}</td>
                    <td >${font}${airline}</td>
                    <td >${font}${subject}</td>
                    <td >${font}${manager}</td>
                    <td >${font}${deps.cutDate(up_date)}</td>
                    <td><span class='btn_basic btn_red' onClick="return funcDel('${uid}')">Del</span></td>
                </tr>
            `;
            ix ++;
        };

        listHTML = `
            <table class='search-table'  id='dtBasic'>
                <tr>
                    <th>No</th>
                    <th >항목</th>
                    <th  >구분</th>
                    <th  >제목</th>
                    <th  >등록자</th>
                    <th  >등록일</th>
                    <th  >삭제</th>
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

