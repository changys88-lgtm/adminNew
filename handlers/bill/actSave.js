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
    let   passSql     = '';
    let   year = '' , month = '';
    const table       = '';
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
    let   buttonName      = '신규입력';
    if (mode === "input" || mode === "modify") {
        if (ticket_num) {
            sqlText   = ` select * from money_act where ticket_num = @ticket_num `;
            sqlResult = await pool.request().input('ticket_num',sql.NVarChar,ticket_num).query(sqlText);
            row       = sqlResult.recordset?.[0];
            buttonName = '수정하기';
        }
            let infData = chdData = adtData = s = revAvail = '';
            titleData = `<i class="fas fa-edit" style="color:#777;font-size:16px;"></i> 지출결의서<span class='font15'>(${row.ticket_num || ''}) </span>`;
            htmlData  = `
                <form name="frmDetail" id="frmDetail" method="post" action="/site/site_save" enctype="multipart/form-data">
                    <input type="hidden" name="mode"		value="${modes}">
                    <input type="hidden" name="uid"			value="${uid}">
                    <input type="hidden" name="ticket_num"	value="${ticket_num}">
                    <input type="hidden" name="orgMode"		value="${mode}">
                    <div class="border regis-box shadow-sm menuArea" >
                    <div class="row w-90 p-3">
                        <div class="col">
                        <table class="table regis-hotel">
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="width:130px;" required>상품명  </th>
                                <td class="regis-hotel-td2">
                                    <input name="tourName" class="form-control form-control-sm border-dark mt-2 wh400" type="text" readonly value="${row.tourName || ''}" >&nbsp;&nbsp;
                                    예명 : <input name="tourNameShort" placeholder="짧은 상품명 " class="form-control form-control-sm border-dark mt-2 wh200" readonly type="text" value="${row.tourNameShort || ''}" maxlength="20">
                                </td>
                                <th scope="row" class="regis-hotel-td1" style="">노출 순위</th>
                                <td>
                                    <input name="main_view" class="form-control form-control-sm border-dark mt-2" type="text" readonly value="${row.main_view || 0}" style="width:40px"> '0' 보다 큰수로 낮은수 부터 위에서 보임
                                </td>
                            </tr>
                            <tr>
                                <th  colspan="3"><h5>- 포함 불포함</h5></th>
                            </tr>
                            <tr>
                                <th scope="row"  class="regis-hotel-td1" style="line-height:50px;border-bottom:0px;" >포함사항 	</th>
                                <td colspan="3" class="group02"><textarea name="contain" id="contain" type="text"  class="form-control" onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${row.contain || ''}</textarea></td>
                            </tr>
                            <tr>
                                <th scope="row"  class="regis-hotel-td1" style="line-height:50px;border-bottom:0px;" >불포함사항 	</th>
                                <td colspan="3" class="group02"><textarea name="uncontain" id="uncontain" type="text"  class="form-control" onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${row.uncontain || ''}</textarea></td>
                            </tr>
                            <tr>
                                <th colspan="1"><h5>- 유의사항</h5></th>
                                <td colspan="3">	
                                    <input name="noticeUse" type="radio" value="Y" ${((row.noticeUse || '').trim() === "Y")? 'checked' : ''} > 계약서 노출
                                    <input name="noticeUse" type="radio" value="N" ${((row.noticeUse || '').trim() === "N")? 'checked' : ''} > 계약서 미노출
                                    &#8251;&#8251; 노출 체크시에만 계약서에서 보입니다 &#8251;&#8251;
                                </td>
                            </tr>
                            <tr>
                                <th scope="row"  class="regis-hotel-td1" style="line-height:50px;" >유의사항 	</th>
                                <td colspan="3" class="group02"><textarea name="notice" id="notice" type="text"  class="form-control" onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${row.notice || ''}</textarea></td>
                            </tr>
                            <tr>
                                <th  colspan="4"><h5>- 취소환불</h5></th>
                            </tr>
                            <tr>
                                <th scope="row"  class="regis-hotel-td1" style="line-height:50px;" >취소환불 
                                </th>
                                <td colspan="3" style="border-bottom:1px solid #ddd; "><textarea name="cancelRefund"  id="cancelRefund" type="text"  class="form-control" onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${row.cancelRefund || ''}</textarea></td>
                            </tr>
                            <tr>
                                <th  colspan="4"><h5>- 쇼핑 & 선택관광</h5></th>
                            </tr>
                            <tr>
                                <th scope="row"  class="regis-hotel-td1" style="line-height:50px;" >쇼핑및옵션	</th>
                                <td colspan="3" class="group02"><textarea name="shoppingNoption" id="shoppingNoption" type="text"  class="form-control" onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${row.shoppingNoption || ''}</textarea></td>
                            </tr>
                            <tr>
                                <th  colspan="4"><h5>- 모객정보</h5></th>
                            </tr>

                            <tr>
                                <th scope="row"  class="regis-hotel-td1" style="line-height:50px;" >모객정보
                                </th>
                                <td colspan="3" style="border-bottom:1px solid #ddd; "><textarea name="customer"  id="customer" type="text"  class="form-control" onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${row.customer || ''}</textarea></td>
                            </tr>
                            
                        </table>
                        </div>
                    </div>
                    <div class="row w-70 regis-btn">
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