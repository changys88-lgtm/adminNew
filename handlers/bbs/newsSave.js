const deps = require('../../src/common/dependencies');
const { arrNewsGubun } = require('../../src/utils/airConst'); 

module.exports = async (req, res) => {
    const data        = req.body;
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const orgMode     = (data.orgMode || '').trim();   
    const pool        = await deps.getPool();
    let   mode        = (data.mode || '').trim();   
    let   uid         = data.uid  || '';
    let   ticket_num  = data.ticket_num  || '';
    let   minor       = data.minor  || '';
    let   cYear       = data.cYear  || '';
    let   cMonth      = data.cMonth || '';
    let   msg         = '';
    let   sqlText     = '';
    let   sqlResult   = '';
    let   rsCount     = '';
    let   titleData   = '';
    let   htmlData    = '';
    let   contents    = '';
    let   year = '' , month = '';
    const table       = '';
    const sql             = deps.sql;
    const aes128Encrypt   = deps.aes128Encrypt;
    const aes128Decrypt   = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;
    const NOWSTIME        = deps.getNow().NOWSTIME;
    const NOWS            = deps.getNow().NOWS;

    let   html            = '';
    let   s               = '';
    let   modes           = '';
    let   row             = {};
    let   buttonName      = '신규입력';
    if (mode === "view") {
            sqlText   = ` select * from airline_news where uid = @uid `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
            row       = sqlResult.recordset?.[0];
            sqlText   =  `select contents from airline_news_detail where uid_minor = @uid `;
	        sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
            contents  = (sqlResult.recordset?.[0]?.contents || '').trim();
            contents  = contents
                .replace(/\\/g,'')
                .replace(/\/upload\//g,"http://www.galileo.co.kr/upload/")
                .replace(/a href/g,"a target='_blank' href");
            titleData = `<i class="fas fa-edit search-title-text"> ${arrNewsGubun[row.gubun]} 항공 뉴스 <span class='font13'>(${row.uid || ''}) </span></i>`;
            htmlData  = `
                <form name="frmDetail" id="frmDetail" method="post" action="/site/site_save" enctype="multipart/form-data">
                    <input type="hidden" name="mode"		value="${modes}">
                    <input type="hidden" name="uid"			value="${uid}">
                    <input type="hidden" name="orgMode"		value="${mode}">
                    <div class="border regis-box shadow-sm menuArea" >
                    <div class="row w-90 p-3">
                        <div class="col">
                        <table class="table regis-hotel">
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="width:130px;" required>제목  </th>
                                <td class="regis-hotel-td2">
                                    ${row.subject || ''}
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="">등록구분</th>
                                <td>
                                    ${arrNewsGubun[row.gubun || '']}
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="">등록자</th>
                                <td>
                                    ${row.manager || ''}
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="">항공사</th>
                                <td>
                                    ${row.airline || ''}
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="">내용</th>
                                <td class='border-bottom'>
                                    ${contents}
                                </td>
                            </tr>
                            
                            
                        </table>
                        </div>
                    </div>
                    <div class="row w-70 regis-btn none">
                        <div class="col-12 ac" style="margin-bottom:20px;">
                            <span type="button" class="btn btn-yellow " href="javascript://" onCLick="return modifyCheck()" style="width:50%;font-size:19px !important;padding-top:10px;padding-bottom:13px;">${buttonName}</span>
                        </div>
                    </div>
                    </div>
                </form>
            `;
        
    } 
    
    if (msg) rs = 'no'; else rs = 'ok';
    res.json ({success: rs, errorMsg: msg , title: titleData , html: htmlData 

    
    });
}