const deps = require('../../src/common/dependencies');
const { arrBankCode } = require('../../src/utils/airConst');
const { interlineRefundCheck } = require('../../src/utils/functions');

module.exports = async (req, res) => {
    const data        = req.body;
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const orgMode     = (data.orgMode || '').trim();   
    const pool        = await deps.getPool();
    let   mode        = (data.mode || '').trim();   
    let   uid         = data.uid  || '';
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
    const mainTable       = 'air_refund';
    const minorTable      = 'AirTickets_minor';
    const air_line_code   = data.air_line_code || '';
    const ticket_number   = data.ticket_number || '';
    const ticket_type     = data.ticket_type || '';
    let   MixSettle       = '';
    let   cardData        = '';
    let   cardAuth        = '';
    let   modes           = '';
    let   row             = {};
    let   readOnly        = '';
    let   buttonName      = '신규입력';
    let   uid_minor       = '';
    let   aRefund         = [];
    if (mode === "input" || mode === "modify") {
        if (uid) {
            sqlText   = ` select a.* , b.site_name from ${mainTable} as a (nolock) left outer join site as b on a.site_code = b.site_code where a.uid = @uid `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
            row       = sqlResult.recordset?.[0];
            aCard     = {};
            buttonName = '수정입력';
            uid_minor = row.inter_uid;
            aRefund = await interlineRefundCheck(pool, uid_minor);
        } else {
            row = {};
            aCard = {};
        }
        
        if ((row.card_amount > 0 && row.cash_amount_bsp > 0) || row.re_sale_cc) {
            MixSettle = "Y";
        }

        let refundHtml = '';
        if (aRefund[0] === "Y") {
            refundHtml = `
                <table width='100%' border=1 bordercolor='#cccccc'>
                    <tr class='ac'>${aRefund[1]}</tr>
                    <tr class='ac'>${aRefund[2]}</tr>
                </table>
            `;
            if (aRefund[6].trim() !== "") {
                refundHtml += `
                    <table width='100%' border=1 bordercolor='#cccccc'>
                        <tr class='ac'>${aRefund[6]}</tr>
                        <tr class='ac'>${aRefund[7]}</tr>
                    </table>
                `;
            }
        }
        
        if (row.refund_penalty > 0 || row.method_type == 2 ) {
            if (row.ref_card.trim() === "") {
                sqlText = `select card_number, expire_date , card_pass , SelectCard from interline_pax where uid_minor = @uid_minor and minor_num = '1' `;
                sqlResult = await pool.request().input('uid_minor',sql.Int,uid_minor).query(sqlText);
                row.ref_card        = sqlResult.recordset?.[0]?.card_number || '';
                row.ref_card_exp    = sqlResult.recordset?.[0]?.expire_date || '';
                row.ref_SelectCard  = sqlResult.recordset?.[0]?.SelectCard || '';
                row.ref_card_pass   = sqlResult.recordset?.[0]?.card_pass || '';
            }
               
            // 2024-04-24 환불 패널티 카드 받을때 
            card_number = aes128Decrypt (aviaSecurityKey,row.ref_card);
            expire_date = aes128Decrypt (aviaSecurityKey,row.ref_card_exp);

            aCard = CardNumSplit(card_number,"s");
            ex2   = substr(expire_date,0,4);
            ex1   = substr(expire_date,5,2);
            if (row.ref_card_auth != "") {
                refStatus1 = "readonly";
                refStatus2 = "disabled";
            }
            if (row.ref_card_auth != "") {
                cardAuth = `<span class="btn_basic btn_gray" onCLick="alert('승인완료')">${row.ref_card_auth}</span>`;
            } else {
                cardAuth = `<span class="btn_basic btn_blue" onCLick="return cardAuth()">승인</span>`;
            }
            for (let dCount = 1 ; dCount < 13 ; dCount ++) {
                const selected = dCount == ex1 ? 'selected' : '';
                ex1Data += `<option value='${dCount}' ${selected}>${dCount} 월`;
            }
            const Year = deps.getNow().Year;
            for (let dCount = Year ; dCount < Year + 11 ; dCount ++) {
                const selected = dCount == ex2 ? 'selected' : '';
                ex2Data += `<option value='${dCount}' ${selected}>${dCount} 년`;
            }
            cardData = `
                <th >카드정보</th>
                <td class="pat5"> &nbsp; 번호 : 
                    <input type="text" class='ac d-inline form-control form-control-sm wh50' name="aCardnum1" ${refStatus1} value="${aCard[0] || ''}">-
                    <input type="text" class='ac d-inline form-control form-control-sm wh50' name="aCardnum2" ${refStatus1} value="${aCard[1] || ''}">-
                    <input type="text" class='ac d-inline form-control form-control-sm wh50' name="aCardnum3" ${refStatus1} value="${aCard[2] || ''}">-
                    <input type="text" class='ac d-inline form-control form-control-sm wh50' name="aCardnum4" ${refStatus1} value="${aCard[3] || ''}">
                    <span id="cardAuthButton">
                    ${cardAuth}
                    </span>
                    <br>
                    <div class=" mat5">
                    &nbsp;  Exp :
                    <select name="exM" ${refStatus2}>
                        <option value=''>월
                        ${ex1Data}
                    </select>
                    <select name="exY" ${refStatus2}>
                        <option value=''>연도
                        ${ex2Data}
                    </select>
                    &nbsp; 비번(앞2) 
                    <input type="text" class='ac d-inline form-control form-control-sm wh50' name="ref_card_pass" ${refStatus1} value="${row.ref_card_pass || ''}">
                    &nbsp;  
                    <select name="SelectCard" ${refStatus2}>
                        <option value='C' ${row.ref_SelectCard == "C" ? "selected" : ''}>개인카드
                        <option value='B' ${row.ref_SelectCard == "B" ? "selected" : ''}>법인카드
                    </select>
                    </div>
                </td>
            `;
        } 

        titleData = `<i class="fas fa-edit" style="color:#777;font-size:16px;"></i> 항공 환불<span class='font15'>(${uid}) </span>`;
        htmlData  = `
            <form name="frmDetail" id="frmDetail" method="post" >
                <input type="hidden" name="mode"		value="save">
                <input type="hidden" name="orgMode"		value="${mode}">
                <div class="border regis-box shadow-sm menuArea" >
                <div class="row w-90 p-3">
                    <div class="col">
                    <table class="table regis-hotel">
                        <tr >
                            <th>TICKET NO</td>
                            <td colspan="3" >
                                <input type=text class='d-inline form-control form-control-sm wh100' READONLY size=3  value="${row.air_line_code || ''}" tabindex=100 name="air_line_code" >
                                <input type=text class='d-inline form-control form-control-sm wh150' READONLY size=12  value="${row.ticket_number || ''}" tabindex=100 name="ticket_number" >
                                &nbsp;
                                #${row.uid_minor || ''} GDS:${row.pnr || ''} 항공사:${row.airPnr || ''} : ${row.refundDate || ''} 접수일:${deps.cutDateTime(row.up_date || '', "S")}
                            </td>
                        </tr>
                        <tr >
                            <th class="wh100">거래처</font></td>
                            <td>
                                <input type="text" readonly class='d-inline form-control form-control-sm wh100' value="${row.site_code || ''}" name="site_code"> 
                                <input type="text" readonly class='d-inline form-control form-control-sm wh150' value="${row.site_name || ''}" name="site_name">
                            </td>
                            <th class="wh100">영문명</font></td>
                            <td  ><input type=text readonly tabindex=100 class='d-inline form-control form-control-sm wh300' size=32 value="${row.username || ''}" name="username"></td>
                            
                        </tr>
                        <tr >
                            <th>고객연락처</font></td>
                            <td  ><input type=text class='d-inline form-control form-control-sm wh200' tabindex=100 size=20 value="${aes128Decrypt(aviaSecurityKey,(row.tel || ''))}" name="tel"></td>
                            <th>환불구간</font></td>
                            <td   ><input type=text class='d-inline form-control form-control-sm wh300' size=40 value="${row.routing || ''}" name="routing"></td>
                        </tr>
                        <tr >
                            <th>환불계좌</font></td>
                            <td >예치금 계좌로 환불 (${arrBankCode[row.deposit_bank] || ''}은행 ${deps.BankAnySplit(row.deposit_account) || ''})</td>
                            ${cardData}
                        </tr>
                        <tr >
                            <th>환불금액</font></td>
                            <td  >
                                <input type=text class='d-inline form-control form-control-sm wh100' tabindex=100 size=20 style='text-align:right' onChange="numSeparate(this)"  value="${deps.numberFormat(row.refund_amount) || ''}" name="refund_amount">
                            </td>
                            <th>수수료</font></td>
                            <td   >
                                AIR : <input type="text" class="d-inline form-control form-control-sm wh70" style='text-align:right' onkeyup="numSeparate(this);priceCheck('')" value="${deps.numberFormat(row.refund_air) || ''}" name="refund_air"> &nbsp; 
                                BSP : <input type="text" class="d-inline form-control form-control-sm wh70" style='text-align:right' onkeyup="numSeparate(this);priceCheck('')" value="${deps.numberFormat(row.refund_company) || ''}" name="refund_company"> &nbsp; 
                                <span title="수수료를 카드 결제 받을때 사용">CARD</span> : <input type="text" class="d-inline form-control form-control-sm wh70" style='text-align:right' onkeyup="numSeparate(this);priceCheck('')" value="${deps.numberFormat(row.refund_penalty) || ''}" name="refund_penalty">
                            </td>
                        </tr>
                        <tr >
                            <th>사용구간</font></td>
                            <td  ><input type=text class='d-inline form-control form-control-sm wh250'  value="${row.re_used_sector || ''}" name="re_used_sector"></td>
                            <th>사용금액</font></td>
                            <td   >
                                <input type=text class='d-inline form-control form-control-sm wh100' style='text-align:right' onkeyup="numSeparate(this);bubunCheck(this.value)" size=10 value="${deps.numberFormat(row.re_used_amt) || ''}"  name="re_used_amt">
                                사용택스
                                <input type=text class='d-inline form-control form-control-sm wh100' style='text-align:right' onkeyup="numSeparate(this);bubunCheck(this.value)" size=10 value="${deps.numberFormat(row.re_used_tax) || ''}"  name="re_used_tax">
                                
                            </td>
                        </tr>
                        <tr >
                            <th>환불상세내역</font></td>
                            <td   colspan=3>
                                <table border=0 cellpadding=-0 cellspacing=0 width="100%">
                                    <tr>
                                        ${MixSettle == "Y" ? "<td><font color=red>Cash</font></td>" : ''}
                                        <td>판매가: <input type=text class='d-inline form-control form-control-sm wh100' tabindex=100 style='text-align:right' onkeyup="numSeparate(this)" size=7 value="${deps.numberFormat(row.re_sale) || ''}" name="re_sale"></td>
                                        <td>입금가: <input type=text class='d-inline form-control form-control-sm wh100' tabindex=100 style='text-align:right' onkeyup="numSeparate(this);priceCheck('')" size=7 value="${deps.numberFormat(row.re_net) || ''}" name="re_net"></td>
                                        <td>NNET: <input type=text class='d-inline form-control form-control-sm wh100' tabindex=100 style='text-align:right' onkeyup="numSeparate(this)" size=7 value="${deps.numberFormat(row.re_nnet) || ''}" name="re_nnet"></td>
                                        <td>COMM: <input type=text class='d-inline form-control form-control-sm wh100' tabindex=100 style='text-align:right' onkeyup="numSeparate(this)" size=7 value="${deps.numberFormat(row.re_comm) || ''}" name="re_comm"></td>
                                        <td align="right">
                                            
                                        </td>
                                    </tr>
                                    ${MixSettle == "Y" ? `<tr>
                                    <tr>
                                        <td><font color=red>Card</font></td>
                                        <td>판매가: <input type=text class='d-inline form-control form-control-sm wh100' tabindex=100 style='text-align:right' onkeyup="numSeparate(this)" size=7 value="${deps.numberFormat(row.re_sale_cc) || ''}" name="re_sale_cc"></td>
                                        <td>입금가: <input type=text class='d-inline form-control form-control-sm wh100' tabindex=100 style='text-align:right' onkeyup="numSeparate(this);priceCheck('')" size=7 value="${deps.numberFormat(row.re_net_cc) || ''}" name="re_net_cc"></td>
                                    </tr>
                                    ` : ''}
                                </table>
                            </td>
                        </tr>
                        <tr >
                            <th>택스</font></td>
                            <td   colspan=3>
                                &nbsp;1.<input type=text class='d-inline form-control form-control-sm wh40' value="${row.taxCode1 || ''}" readonly name="tax_code1">:
                                <input type=text class='d-inline form-control form-control-sm wh70'   onkeyup="numSeparate(this);priceCheck('')" value="${deps.numberFormat(row.re_tax1 || '')}" name="re_tax1"> &nbsp; 
                                2.<input type=text class='d-inline form-control form-control-sm wh40'   value="${row.taxCode2 || ''}" readonly name="tax_code2">:
                                <input type=text class='d-inline form-control form-control-sm wh70'   onkeyup="numSeparate(this);priceCheck('')" value="${deps.numberFormat(row.re_tax2 || '')}" name="re_tax2"> &nbsp; 
                                3.<input type=text class='d-inline form-control form-control-sm wh40'   value="${row.taxCode3 || ''}" readonly name="tax_code3">:
                                <input type=text class='d-inline form-control form-control-sm wh70'   onkeyup="numSeparate(this);priceCheck('')" value="${deps.numberFormat(row.re_tax3 || '')}" name="re_tax3"> &nbsp; 
                                4.<input type=text class='d-inline form-control form-control-sm wh40'   value="${row.taxCode4 || ''}" readonly name="tax_code4">:
                                <input type=text class='d-inline form-control form-control-sm wh70'   onkeyup="numSeparate(this);priceCheck('')" value="${deps.numberFormat(row.re_tax4 || '')}" name="re_tax4"> &nbsp; 
                                &nbsp;5.<input type=text class='d-inline form-control form-control-sm wh40' value="${row.taxCode5 || ''}" readonly name="tax_code5">:
                                <input type=text class='d-inline form-control form-control-sm wh70'   onkeyup="numSeparate(this);priceCheck('')" value="${deps.numberFormat(row.re_tax5 || '')}" name="re_tax5"> &nbsp; 
                                <br>
                                6.<input type=text class='d-inline form-control form-control-sm wh40'   value="${row.taxCode6 || ''}" readonly name="tax_code6">:
                                <input type=text class='d-inline form-control form-control-sm wh70'   onkeyup="numSeparate(this);priceCheck('')" value="${deps.numberFormat(row.re_tax6 || '')}" name="re_tax6"> &nbsp; 
                                7.<input type=text class='d-inline form-control form-control-sm wh40'   value="${row.taxCode7 || ''}" readonly name="tax_code7">:
                                <input type=text class='d-inline form-control form-control-sm wh70'   onkeyup="numSeparate(this);priceCheck('')" value="${deps.numberFormat(row.re_tax7 || '')}" name="re_tax7"> &nbsp; 
                                8.<input type=text class='d-inline form-control form-control-sm wh40'   value="${row.taxCode8 || ''}" readonly name="tax_code8">:
                                <input type=text class='d-inline form-control form-control-sm wh70'   onkeyup="numSeparate(this);priceCheck('')" value="${deps.numberFormat(row.re_tax8 || '')}" name="re_tax8"> &nbsp; 
                                9.<input type=text class='d-inline form-control form-control-sm wh40'   value="${row.taxCode9 || ''}" readonly name="tax_code9">:
                                <input type=text class='d-inline form-control form-control-sm wh70'   onkeyup="numSeparate(this);priceCheck('')" value="${deps.numberFormat(row.re_tax9 || '')}" name="re_tax9"> &nbsp; 
                                10.<input type=text class='d-inline form-control form-control-sm wh40'  value="${row.taxCode10 || ''}" readonly name="tax_code10">:
                                <input type=text class='d-inline form-control form-control-sm wh70'   onkeyup="numSeparate(this);priceCheck('')" value="${deps.numberFormat(row.re_tax10 || '')}" name="re_tax10"> &nbsp; 
                            </td>
                        </tr>
                        <tr class="none">
                            <th>RAN(SLIP)</font></td>
                            <td  colspan=3><input type=text class="whp100 d-inline form-control form-control-sm " tabindex=100  onChange="valChange('ran',this.value)" value="${row.ran || ''}" name="ran"></td>
                        </tr>
                        <tr class="">
                            <th>환불규정일수</td>
                            <td  colspan="3" id="refundData">
                                ${refundHtml}
                            </td>
                        </tr>
                        <tr >
                            <th>빌링 (메모)</font></td>
                            <td   colspan=3>
                                <textarea class="d-inline form-control form-control-sm" onkeypress="lineCheck(this)" onChange="valChange('billing',this.value)" name="billing">${row.billing || ''}</textarea>
                            </td>
                        </tr>
                        <tr >
                            <th>비고</font></td>
                            <td   colspan=3>
                                <textarea class="d-inline form-control form-control-sm" onkeypress="lineCheck(this)" name="etc" onChange="valChange('etc',this.value)">${row.etc || ''}</textarea>
                            </td>
                            
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