const deps = require('../../src/common/dependencies');
const { getPagination } = require('../../src/utils/paging'); 

module.exports = async (req, res) => {
    const GU1         = req.body.GU1 || '';
    const GU2         = req.body.GU2 || '';
    const GU3         = req.body.GU3 || '';
    const GU4         = req.body.GU4 || '';
    const page        = req.body.page || '1';
    const listCount   = req.body.listCount || 1;
    const sWord       = req.body.sWord || '';
    const sFrom       = req.body.sFrom || '';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    
    let addQry        = ` 1=1  `;

    if (GU1 ) addQry += ` and up_date like '${deps.StrClear(GU1)}%' `;
    if (GU2 ) addQry += ` and site_code like '${GU2.trim()}%' `;
    if (GU3 ) addQry += ` and man_id like '%${GU3.trim()}%' `;
    if (GU4 ) addQry += ` and ip like '%${GU4.trim()}%' `;
    
    try {

        const pool = await deps.getPool();
        
        const sqlText = `
            select top ${listCount} * 
            , ISNULL((select site_name from site where site_code = a.site_code),'') as siteName
		    , ISNULL((select manager from site_manager where man_id = a.man_id),'') as managerName
            from interline_search_log as a where ${addQry} order by up_date desc , up_time desc
        `;
        const result = await pool.request().query(sqlText);
        const totalCount = result.recordset.length;
        let   list = ``;

        for (let row of result.recordset) {
            let {up_date , up_time  , ticket_type , ip , grade , site_code , siteName , etc , man_id,  managerName , src , dest 
                , dep_date , arr_date , adt_mem , chd_mem , inf_mem , stopover , shareTime , searchType , searchTime , bspSiteCode
            } = row;            
            font = '';
            list += `
                <tr height="29" onmouseover="this.style.backgroundColor='#f3f3f3'" onmouseout="this.style.backgroundColor=''">
                    <td  >${deps.cutDate(up_date)} _ ${deps.cutTime(up_time)}</td>
                    <td >${font}${ticket_type}</td>
                    <td >${font}${grade}</td>
                    <td >${font}${site_code} ${siteName} ${etc}</td>
                    <td >${font}${man_id} ${managerName}</td>
                    <td >${font}${src}</td>
                    <td >${font}${dest}</td>
                    <td >${font}${deps.cutDate(dep_date)}</td>
                    <td >${font}${deps.cutDate(arr_date)}</td>
                    <td >${font}${adt_mem}/${chd_mem}/${inf_mem}</td>
                    <td >${font}${ip}</td>
                    <td >${font}${stopover}</td>
                    <td >${font}${shareTime}</td>
                    <td >${font}${searchType}</td>
                    <td >${font}${searchTime}</td>
                    <td >${font}${bspSiteCode}</td>
                </tr>
            `;
        };
        if (!list) list = `<tr><td colspan='6' class='ac hh50'>데이터가 없습니다.</td></tr>`;

        const listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr >
                    <th class=''>검색시간</th>
                    <th >유형</th>
                    <th >캐빈</th>
                    <th >업체</th>
                    <th >담당자</th>
                    <th >출발</th>
                    <th >도착</th>
                    <th >출발날짜</th>
                    <th >도착날짜</th>
                    <th >인원</th>
                    <th >아이피</th>
                    <th >Stop</th>
                    <th >최대경유시간</th>
                    <th title="C:Cache / R:Real " >C/R</th>
                    <th title="검색 소요 시간(GDS 검색시간만)">Gap</th>
                    <th >BSP</th>
                </tr>
                ${list}
            </table>
        `;
        res.json({ success: 'ok', listData: listHTML , pageData: '' , totalCount: totalCount  });
    } catch (err) {
        console.error('에러:'+err);
        res.status(500).send('Database error');
    } finally {
        //await sql.close();
    }
	
};

