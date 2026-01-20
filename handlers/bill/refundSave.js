const deps = require('../../src/common/dependencies');
const { uidNext } = require('../../src/utils/idxFunction');
const { minorNext } = require('../../src/utils/database');

module.exports = async (req, res) => {
    const data        = req.body;
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const orgMode     = (data.orgMode || '').trim();   
    const pool        = await deps.getPool();
    let   mode        = (data.mode || '').trim();   
    let   uid         = data.uid  || '';
    let   AccountCode = data.AccountCode  || '';
    let   minor       = data.minor  || '';
    let   cYear       = data.cYear  || '';
    let   cMonth      = data.cMonth || '';
    let   msg         = '';
    let   sqlText     = '';
    let   sqlResult   = '';
    let   rsCount     = '';
    let   titleData   = '';
    let   htmlData    = '';
    let   passSql     = '';
    const sql         = deps.sql;
    const aes128Encrypt   = deps.aes128Encrypt;
    const aes128Decrypt   = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;
    const NOWSTIME        = deps.getNow().NOWSTIME;
    const NOWS            = deps.getNow().NOWS;

    let   html            = '';
    let   s               = '';
    let   modes           = '';
    let   row             = {};
    let   readOnly        = '';
    let   buttonName      = '신규입력';
    if (mode === "input" || mode === "modify") {
        if (AccountCode) {
            sqlText   = ` select * from BillAccount where AccountCode = @AccountCode `;
            sqlResult = await pool.request().input('AccountCode',sql.NVarChar,AccountCode).query(sqlText);
            row       = sqlResult.recordset?.[0];
            buttonName = '수정하기';
            readOnly   = 'readonly';
        }
        
            let infData = chdData = adtData = s = revAvail = '';
            titleData = `<i class="fas fa-edit" style="color:#777;font-size:16px;"></i> 계정코드<span class='font15'>(${row.AccountCode || ''}) </span>`;
            htmlData  = `
                <form name="frmDetail" id="frmDetail" method="post" action="/site/site_save" enctype="multipart/form-data">
                    <input type="hidden" name="mode"		value="save">
                    <input type="hidden" name="orgMode"		value="${mode}">
                    <div class="border regis-box shadow-sm menuArea" >
                    <div class="row w-90 p-3">
                        <div class="col">
                        <table class="table regis-hotel">
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="width:130px;" required>계정 코드  </th>
                                <td class="regis-hotel-td2">
                                    <input name="AccountCode" class="form-control form-control-sm border-dark mt-2 wh400" type="text" ${readOnly} value="${row.AccountCode || ''}" >&nbsp;&nbsp;
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="line-height:30px;">계 정 명</th>
                                <td class="regis-hotel-td2"><input name="AccountName" type="text"  class="form-control form-control-sm" value="${row.AccountName || ''}"></td>
                            </tr>
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="line-height:30px;">계정 설명</th>
                                <td class="regis-hotel-td2"><input name="AccountIntro" type="text"  class="form-control form-control-sm" value="${row.AccountIntro || ''}"></td>
                            </tr>
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="line-height:30px;">구 분</th>
                                <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;">
                                    <input type="radio" name="GiveTake" value="1" ${row.GiveTake === "1" ? 'checked' : ''} >입금 &nbsp; &nbsp;
                                    <input type="radio" name="GiveTake" value="2" ${row.GiveTake === "2" ? 'checked' : ''} >출금 &nbsp; &nbsp;
                                    <input type="radio" name="GiveTake" value="3" ${row.GiveTake === "3" ? 'checked' : ''} >모두 &nbsp; &nbsp;
                                    <input type="radio" name="GiveTake" value="9" ${row.GiveTake === "9" ? 'checked' : ''} >해당사항없음
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="line-height:30px;">출금방법</th>
                                <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;">
                                    <input type="radio" name="GiveType" value="1" ${row.GiveType === "1" ? 'checked' : ''}  >예치금계좌 &nbsp; &nbsp;
                                    <input type="radio" name="GiveType" value="2" ${row.GiveType === "2" ? 'checked' : ''}  >거래처통장 &nbsp; &nbsp;
                                    <input type="radio" name="GiveType" value="3" ${row.GiveType === "3" ? 'checked' : ''}  >모두 &nbsp; &nbsp;
                                    <input type="radio" name="GiveType" value="9" ${row.GiveType === "9" ? 'checked' : ''}  >출금없음
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="line-height:30px;">VIEW</td>
                                <td align=left style="border-bottom:1px solid #ddd;">
                                    <input type="radio" name="Viewing" value="0" ${row.View === "0" ? 'checked' : ''}  >전부 &nbsp; &nbsp;
                                    <input type="radio" name="Viewing" value="1" ${row.View === "1" ? 'checked' : ''}  >영업 &nbsp; &nbsp;
                                    <input type="radio" name="Viewing" value="2" ${row.View === "2" ? 'checked' : ''}  >관리 &nbsp; &nbsp;
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="line-height:30px;">정산</td>
                                <td align=left style="border-bottom:1px solid #ddd;">
                                    <input type="radio" name="settleIgnore" value="Y" ${row.settleIgnore === "Y" ? 'checked' : ''}   >포함 &nbsp; &nbsp;
                                    <input type="radio" name="settleIgnore" value="N" ${row.settleIgnore === "N" ? 'checked' : ''}   >무시 &nbsp; &nbsp;
                                </td>
                            </tr>
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="line-height:30px;">정렬순서</td>
                                <td class="regis-hotel-td2 borderBottom"><input name="orderby" type="text"  class="form-control form-control-sm" value="${row.orderby || ''}"></td>
                            </tr>
                        </table>
                        </div>
                    </div>
                    <div class="row w-70 regis-btn">
                        <div class="col-12 ac" style="margin-bottom:20px;">
                            <span type="button" class="btn btn-yellow " href="javascript://" onCLick="return inputCheck()" style="width:50%;font-size:19px !important;padding-top:10px;padding-bottom:13px;">${buttonName}</span>
                        </div>
                    </div>
                    </div>
                </form>
            `;
        
    } else if (mode === "save") {
        if (orgMode === "input") {
            sqlText = `select count(*) as cnt from BillAccount where AccountCode = @AccountCode `;
            sqlResult = await pool.request().input('AccountCode',sql.NVarChar , AccountCode).query(sqlText);
            const cnt  = sqlResult.recordset?.[0]?.cnt || 0;
            if (cnt > 0) {
                msg = '코드가 중복 되었습니다';
            } else {
                sqlText = `insert into BillAccount (AccountCode) values (@AccountCode)`;
                await pool.request().input('AccountCode',sql.NVarChar , AccountCode).query(sqlText);
            }
        }
        if (!msg) {
        
            const req = pool.request();
                req.input('AccountCode'  , sql.NVarChar, AccountCode);
                req.input('AccountName'  , sql.NVarChar, data.AccountName || '');
                req.input('GiveTake'     , sql.NVarChar, data.GiveTake || '');
                req.input('GiveType'     , sql.NVarChar, data.GiveType || '');
                req.input('SalesRelation', sql.NVarChar, data.SalesRelation || '');
                req.input('AccountIntro' , sql.NVarChar, data.AccountIntro || '');
                req.input('View'         , sql.NVarChar, data.Viewing || '');
                req.input('Present'      , sql.NVarChar, data.Present || '');
                req.input('consumption'  , sql.NVarChar, data.consumption || '');
                req.input('settleIgnore' , sql.NVarChar, data.settleIgnore || '');
                req.input('orderby'      , sql.Int     , data.orderby || 0);
            await req.query(`
                update BillAccount set
                    AccountName     = @AccountName,
                    GiveTake        = @GiveTake,
                    GiveType        = @GiveType,
                    SalesRelation   = @SalesRelation,
                    AccountIntro    = @AccountIntro,
                    [View]          = @View,
                    Present         = @Present,
                    consumption     = @consumption,
                    settleIgnore    = @settleIgnore,
                    orderby         = @orderby
                where AccountCode   = @AccountCode
            `);
        }
    }
    
    if (msg) rs = 'no'; else rs = 'ok';
    res.json ({success: rs, errorMsg: msg , title: titleData , html: htmlData 

    
    });
}