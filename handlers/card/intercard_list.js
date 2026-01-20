const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { getPagination } = require('../../src/utils/paging'); 
const { arrNotice } = require('../../src/utils/airConst'); 


module.exports = async (req, res) => {
    let   start_date  = req.body.start_date || '';
    let   end_date    = req.body.end_date || '';
    let   GU1         = req.body.GU1     || '';
    let   GU2         = req.body.GU2     || '';
    let   GU3         = req.body.GU3     || '';
    let   GU4         = req.body.GU4     || '';
    let   startNo     = req.body.startNo || '';
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
    const mainTable   = 'interline_card';

    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }

    if (start_date !== "")	addQry += ` and a.up_date >= '${deps.StrClear(start_date)}000000' `;
    if (end_date !== "")	addQry += ` and a.up_date <= '${deps.StrClear(end_date)}235959' `;
    if (GU1 === "Y")		addQry += ` and (settle_days = '' or settle_days is null) and a.resultcode = '0000' `;
    if (GU2 !== "")			addQry += ` and a.status = '${GU2} ' `;
    if (GU3 !== "")			addQry += ` and a.settle_status = '${GU3}' `;
    if (startNo === "Y")	addQry += ` and osm.start_day = '' `;
    
    try {
        const fieldQry = `
            a.uid , a.uid_minor , a.minor_num , a.ResultMsg , a.auth_number , a.CardAuthIdx , a.card_price , a.void as cancelVoid , a.ResultErrorNo , a.up_date     
            , i.in_status , i.site_code as siteCode
        `;

        const joinQry = `
            left outer join interline_minor as m on a.uid_minor = m.uid_minor 
            left outer join interline as i on m.uid_minor = i.uid 
        `;
        const totQuery = `
            select count(*) as total from  
                ${mainTable} as a (nolock)  
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
        let   cancelButton = '';
        
        for (const row of result.recordset) {
            let { 
                uid , uid_minor , in_status , minor_num , ResultMsg , auth_number , CardAuthIdx , card_price , cancelVoid , ResultErrorNo , up_date , siteCode
            } = row;
            if (auth_number !== "" && ResultErrorNo === 0 && cancelVoid === "" && deps.cutDate(up_date) === deps.getNow().NOWS && ResultMsg === "Y") cancelButton = `<span class='btn_basic btn_red' onClick="return cardCancel('${uid}')">취소</span>`;
            else if (cancelVoid === "C") cancelButton = "취소완료";
            else cancelButton = "";
            rows += `
                <tr  HEIGHT=29  onmouseover="this.style.backgroundColor='#FFF99C'" onmouseout="this.style.backgroundColor='#FFFFFF'" bgcolor='#FFFFFF'>
                    <td $link2>${font}${uid}</td>
                    <td >${font}<a href='javascript://' onClick="return issueStart('${uid_minor}')">${uid_minor}</a> - ${in_status} (${siteCode})</td>
                    <td >${font}${minor_num}</td>
                    <td >${font} ${ResultMsg}</td>
                    <td >${font} ${auth_number}</td>
                    <td >${font} ${CardAuthIdx || ''}</td>
                    <td >${font} ${deps.numberFormat(card_price || 0)}</td>
                    <td >${font} ${deps.cutDateTime(up_date || '')}</td>
                    <td >${font} ${cancelButton}</td>
                </tr>
            `;
            ix ++;
        };

        listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr >
                    <th  class='border-bottom-0'>No</th>
					<th  class='border-bottom-0'>주문서</th>
					<th  class='border-bottom-0'>승객번호</th>
					<th  class='border-bottom-0'>결과코드</th>
					<th  class='border-bottom-0'>승인번호</th>
					<th  class='border-bottom-0'>승인아이디</th>
					<th  class='border-bottom-0'>금액</th>
					<th  class='border-bottom-0'>등록일</th>
					<th  class='border-bottom-0'>취소</th>
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

