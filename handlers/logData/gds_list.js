const deps = require('../../src/common/dependencies');
//const { getPagination } = require('../../src/utils/paging'); 

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
    
    try {
        const pool = await deps.getPool();
        const sql = deps.sql;
        const request = pool.request();
        
        // listCount를 숫자로 변환 (기본값 1)
        let topCount = parseInt(listCount, 10) || 1;
        if (topCount < 1) topCount = 1;
        if (topCount > 1000) topCount = 1000; // 최대 제한
        
        // WHERE 조건 구성
        let whereConditions = [];
        
        if (GU1) {
            const gu1Value = deps.StrClear(GU1);
            whereConditions.push(`up_date like @gu1`);
            request.input('gu1', sql.NVarChar, `${gu1Value}%`);
        }
        
        if (GU2) {
            const gu2Value = GU2.trim();
            whereConditions.push(`uid_minor like @gu2`);
            request.input('gu2', sql.NVarChar, `${gu2Value}%`);
        }
        
        if (GU3) {
            const gu3Value = GU3.trim();
            whereConditions.push(`man_id like @gu3`);
            request.input('gu3', sql.NVarChar, `%${gu3Value}%`);
        }
        
        if (GU4) {
            const gu4Value = GU4.trim();
            whereConditions.push(`ip like @gu4`);
            request.input('gu4', sql.NVarChar, `%${gu4Value}%`);
        }
        
        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';
        
        // TOP 절은 파라미터를 직접 사용할 수 없으므로, 검증된 숫자 값을 직접 사용
        // topCount는 이미 parseInt와 범위 체크로 검증되었으므로 안전함
        const sqlText = `
            select top ${topCount} * 
            from interline_log as a ${whereClause} order by up_date desc , minor_num desc
        `;
        const result = await request.query(sqlText);
        const totalCount = result.recordset.length;
        let   list = ``;
        let   font = '';
        for (let row of result.recordset) {
            let {up_date , uid_minor, minor_num,  operator , content } = row;            
            list += `
                <tr height="29" onmouseover="this.style.backgroundColor='#f3f3f3'" onmouseout="this.style.backgroundColor=''">
                    <td  >${deps.cutDateTime(up_date)}</td>
                    <td >${font}${uid_minor} ${minor_num} </td>
                    <td >${font}${operator}</td>
                    <td class='al'>${font}${content}</td>
                </tr>
            `;
        };
        if (!list) list = `<tr><td colspan='6' class='ac hh50'>데이터가 없습니다.</td></tr>`;

        const listHTML = `
            <table class='search-table' id='dtBasic'>
                <tr >
                    <th>로그 시간</th>
                    <th>주문서</th>
                    <th>아이디</th>
                    <th>내용</th>
                </tr>
                ${list}
            </table>
        `;
        res.json({ success: 'ok', listData: listHTML , pageData: '' , totalCount: totalCount  });
    } catch (err) {
        console.error('에러:'+err);
        res.status(500).send('Database error');
    }
	
};

/*
이 파일은 Interline GDS 관련 로그 데이터를 리스트 형태로 조회하여, 웹 프론트엔드(Ajax 등)로 HTML 테이블 형태로 반환하는 Node.js 핸들러 코드로 보입니다.

주요 특징 및 동작 방식:
- 쿼리 파라미터(GU1~GU4 등)를 활용해, 로그 테이블(interline_log)에서 특정 조건에 맞는 데이터(로그 시간, 주문서번호, 아이디, 내용 등)를 검색합니다.
- 데이터베이스 연결은 deps.getPool()로 풀에서 커넥션을 받아 MSSQL 쿼리를 수행합니다.
- 쿼리 결과로 반환된 여러 행(row)을 HTML 테이블 형태로 가공하여 프론트엔드에 JSON으로 반환합니다.
- 만약 검색 결과가 없을 경우, '데이터가 없습니다.'라는 메시지가 출력됩니다.
- 쿼리 결과 및 테이블 컬럼: 로그 시간(up_date), 주문서(uid_minor/minor_num), 아이디(operator), 내용(content)
- 에러 발생 시 서버 로그에 출력 후 500 에러를 반환합니다.

핵심 흐름:
1. 검색 조건을 기반으로 쿼리문(addQry)을 구성합니다.
2. 데이터베이스에 쿼리를 날려 결과를 받아옵니다.
3. 결과를 순회하며, HTML 테이블의 각 행(row)으로 만듭니다.
4. 프론트로 listData에 테이블 HTML, pageData는 비워서 응답합니다.

보안을 위해 입력값에 일부 정제를 하고 있으나, SQL Injection 등 위험요소는 남아있을 수 있으니 필요에 따라 쿼리 파라미터 바인딩 등을 강화할 필요가 있습니다.
*/
