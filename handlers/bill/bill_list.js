const deps = require('../../src/common/dependencies');
const { dataPick } = require('../../src/utils/database');
const { getPagination } = require('../../src/utils/paging'); 
const { arrBankCode } = require('../../src/utils/airConst'); 


//left outer join interline as a (nolock) on main.uid = a.uid   
module.exports = async (req, res) => {
    let   start_date  = req.body.start_date || '';
    let   end_date    = req.body.end_date || '';
    let   GU1         = req.body.GU1     || '';
    let   GU2         = req.body.GU2     || '';
    let   GU3         = req.body.GU3    || '';
    let   GU4         = req.body.GU4    || '';
    const gMode       = req.body.gMode  || '';
    const page        = req.body.page    || '1';
    const listCount   = req.body.listCount;
    const sWord       = req.body.sWord || '';
    const sFrom       = req.body.sFrom || '';
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const mainTable   = 'BillAccount';
    const pool        = await deps.getPool();
    
    let addQry        = ` 1=1 `;
    if (sWord && sFrom ) {
        addQry +=  ` and ${sFrom} like '%${sWord}%' `;
    }
    
    if (GU1 !== "")		    addQry += ` and GiveTake = '${GU1}' `;

    try {
        const fieldQry = `
            a.* 
        `;

        const joinQry = `
        `;
        const totQuery = `
            select count(*) as total from  ${mainTable} as a (nolock)  
            ${joinQry}
            where
            ${addQry}
        `;
        //console.log(totQuery)
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
                (select a.AccountCode , ROW_NUMBER() OVER (order by a.AccountCode desc ) as RowNum
                    from 
                    ${mainTable} as a (nolock)  
                    ${joinQry}
                    where   
                    ${addQry}
                    
                ) as db1
            where RowNum BETWEEN ${startRow} AND ${endRow}
            ) as main
            left outer join ${mainTable} as a (nolock) on main.AccountCode = a.AccountCode
            ${joinQry}
            
            order by RowNum asc
        `;
        //console.log(baseQuery)
        const result = await pool.request().query(baseQuery);
        let   rows = ``;
        let ix = 0 ;
        for (const row of result.recordset) {
            let { 
                AccountCode , AccountName , Viewing , GiveTake , settleIgnore , GiveType , orderby , AccountIntro
            } = row;
            let bgcolor = 'fff' , font = '';
            
                 if (GiveTake === "1") GiveTake = "입금"; 
            else if (GiveTake === "2") GiveTake = "출금";
            else if (GiveTake === "3") GiveTake = "모두";
            else GiveTake = "해당사항없음";            

                 if (Viewing === "1") Viewing = "영업"; 
            else if (Viewing === "2") Viewing = "관리";
            else Viewing = "전부";
            
                 if (GiveType === "1") GiveType = "가상계좌";
            else if (GiveType === "2") GiveType = "거래처통장";
            else if (GiveType === "3") GiveType = "무관";

            rows += `
                <tr  onmouseout="this.style.backgroundColor='#${bgcolor}'" class="table-row-hover">
                    <td><span class='btn_slim btn_yellow'  onClick="return newReg('${AccountCode}','modify')">${AccountCode}</span></td>
                    <td>${AccountName}</td>
                    <td>${Viewing || ''}</td>
                    <td>${GiveTake}</td>
                    <td>${settleIgnore}</td>
                    <td>${GiveType}</td>
                    <td>${orderby}</td>
                    <td>${AccountIntro}</td>
                </tr>
            `;
            ix ++;
        };

        if (!rows) {
            rows = `<tr><td colspan='20'>검색된 데이터가 없습니다.</td></tr>`;
        }
        listHTML = `
            <table class="search-table" id='dtBasic'>
                <tr>
                    <th>계정코드</th>
                    <th>계정이름</th>
                    <th>뷰</th>
                    <th>구분</th>
                    <th>정산무시</th>
                    <th>출금방법코드</th>
                    <th>정렬</th>
                    <th>설명이름</th>
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

