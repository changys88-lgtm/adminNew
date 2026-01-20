const deps = require('../../src/common/dependencies');
const { uidNext } = require('../../src/utils/idxFunction');
const { minorNext } = require('../../src/utils/database');
const { dsrSegData } = require('../../src/utils/functions');
const { arrGdsData , arrIssueGubun } = require('../../src/utils/airConst');

module.exports = async (req, res) => {
    const data          = req.body;
    const AviaLoginId   = req.cookies?.AviaLoginId || '';
    const b2bMASTER     = req.cookies?.b2bMASTER || '';
    const b2bSiteCode   = req.cookies?.b2bSiteCode || '';
    const orgMode       = (data.orgMode || '').trim();   
    const pool          = await deps.getPool();
    let   mode          = (data.mode || '').trim();   
    let   uid           = data.uid  || '';
    let   air_line_code = data.air_line_code  || '';
    let   ticket_number = data.ticket_number  || '';
    let   ticket_type   = data.ticket_type  || '';
    let   org_ticket_type = data.org_ticket_type  || '';
    let   msg           = '';
    let   sqlText       = '';
    let   sqlResult     = '';
    let   rsCount       = '';
    let   titleData     = '';
    let   htmlData      = '';
    let   passSql       = '';
    const sql           = deps.sql;
    const aes128Encrypt   = deps.aes128Encrypt;
    const aes128Decrypt   = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;
    const NOWSTIME        = deps.getNow().NOWSTIME;
    const NOWS            = deps.getNow().NOWS;
    const StrClear        = deps.StrClear;
    const mainTable       = 'AirTickets';
    const fullTicket      = `${air_line_code}${ticket_number}`;

    let   html            = '';
    let   modes           = '';
    let   row             = {};
    let   tasfRow         = {};
    let   cardRow         = {};
    let   tasfRead        = '';
    let   readOnly        = '';
    let   buttonName      = '신규입력';
    let   routeCount      = 2;
    let   gdsData         = '';
    let   airData         = '';
    let   issData         = '';
    if (mode === "input" || mode === "modify") {
        if (air_line_code) {
            const addField = `city_code, air, air_type, start_day, start_time, arr_day, arr_time, class, country, birthday, gender, passport, expired, telephone
            , c.name as air1Name 
            `;
            
            sqlText   = ` select a.* , ${addField} from ${mainTable} as a 
                        left outer join ${mainTable}_minor as b  on a.air_line_code = b.air_line_code and a.ticket_number = b.ticket_number
                        left outer join airline_code as c  on substring(b.air,1,2) = c.code_2 
                    where a.air_line_code = @air_line_code and a.ticket_number = @ticket_number and a.ticket_type = @ticket_type 
                `;
            sqlResult = await pool.request()    
                    .input('air_line_code',sql.NVarChar,air_line_code)
                    .input('ticket_number',sql.NVarChar,ticket_number)
                    .input('ticket_type'  ,sql.NVarChar,ticket_type)
                    .query(sqlText);
            row       = sqlResult.recordset?.[0] || {};
            buttonName = '수정하기';
            readOnly   = 'readonly';
            row = dsrSegData (row);
            //console.log(sqlText)

            sqlText = `select * from site_commlist where air_line_code = @air_line_code and ticket_number = @ticket_number and site_code = @site_code and gubun = 'T' and void is null `;
            sqlResult = await pool.request()    
                    .input('air_line_code',sql.NVarChar,air_line_code)
                    .input('ticket_number',sql.NVarChar,ticket_number)
                    .input('site_code'    ,sql.NVarChar,row.site_code || '')
                    .query(sqlText);
            tasfRow = sqlResult.recordset?.[0] || {};
            tasfRead = tasfRow?.uid ? "readonly" : '';

            sqlText = `
                select b.uid_minor,c.card_code from interline as a left outer join interline_pax as b on a.uid = b.uid_minor 
                left outer join interline_minor as c on a.uid = c.uid_minor
                where b.ticket_number = @tkt and a.in_status = '4' 
            `;
            sqlResult = await pool.request()    
                    .input('tkt',sql.NVarChar,fullTicket)
                    .query(sqlText);
            cardRow = sqlResult.recordset?.[0] || {};

            if (!tasfRow?.uid && cardRow?.uid_minor) {
                sqlText = `select card_number, expire_date , card_pass , SelectCard from interline_pax where uid_minor = @uid_minor and minor_num = '1' `;
                sqlResult = await pool.request()    
                    .input('uid_minor',sql.Int,cardRow?.uid_minor)
                    .query(sqlText);
                const cRow = sqlResult.recordset?.[0] || {};
                if (cRow) {
                    tasfRow.reissue_card        = cRow.card_number;
                    tasfRow.reissue_card_exp    = cRow.expire_date;
                    tasfRow.reissue_SelectCard  = cRow.SelectCard;
                    tasfRow.reissue_card_pass   = cRow.card_pass;
                }
            }
        }

        for (const [k,v] of  Object.entries(arrGdsData)) {
            const s = k === (row.crs_gubun || '').trim() ? 'selected' : '';
            gdsData += `<option value='${k}' ${s}> ${v}`;
        }

        let tax_amount = 0;
        for (let i = 1; i <= 12; i++) {
            tax_amount += Number(row[`tax_amount${i}`] || 0);
        }

        for (let ix = 0 ; ix < 17 ; ix ++) {
            const ii = ix + 1;
            const city_code		= row[`city_code${ii}`];
            const start_day		= row[`start_day${ii}`];
            const air			= row[`air${ii}`];
            const air_type		= row[`air_type${ii}`];
            const start_time	= row[`start_time${ii}`];
            const arrive_time	= row[`arrive_time${ii}`];
            const cls			= row[`class${ii}`];
            const baggage		= row[`baggage${ii}`];
            if (ii > routeCount && !city_code) none = "none"; else none = "";
            airData += `
                <tr class='cmn_trbgcolor_titlebg' ID=Routing1_$ii style='display:${none}'>
                    <th class=''>항공 ${ii}</th>
                    <td  class='' colspan=5>
                        도시 : <input type=text class=' wh50'  name=city_code${ii}   value='${city_code}'> &nbsp; 
                        일자 : <input type=text class=' wh100' name=start_day${ii}   value='${start_day}'>  &nbsp; 
                        항공 : <input type=text class=' wh40'  name=air${ii}         value='${air}'> &nbsp; 
                        편수 : <input type=text class=' wh60'  name=air_type${ii}    value='${air_type}'> &nbsp; 
                        출발 : <input type=text class=' wh60'  name=start_time${ii}  value='${start_time}'>  &nbsp; 
                        도착 : <input type=text class=' wh60'  name=arrive_time${ii} value='${arrive_time}'>  &nbsp; 
                        CLS  : <input type=text class=' wh30'  name=class${ii}       value='${cls}'>
                        Bag  : <input type=text class=' wh40'  name=baggage${ii}     value='${baggage}'>
                    </td>
                </tr>
            `;
        }
        for (const [k,v] of Object.entries(arrIssueGubun)) {
            const s = row.ticket_type === k ? 'selected' : '';
            issData += `<option value='${k}' ${s}> ${v}`;
        }
        
        titleData = `<i class="fas fa-edit search-title-text"> 발권데이터 <span class='font13'>(${air_line_code || ''} - ${ticket_number || ''}) </span></i>`;
        htmlData  = `
            <form name="frmDetail" id="frmDetail" method="post"  enctype="multipart/form-data">
                <input type="hidden" name="mode"		value="save">
                <input type="hidden" name="orgMode"		value="${mode}">
                <input type="hidden" name="org_ticket_type" value="${row.ticket_type || ''}">
                <input type="hidden" name="comm_amount" value="">
                <input type="hidden" name="curRouting" value="<?=${routeCount || 0}">
                <div class="border regis-box shadow-sm menuArea" >
                <div class="row w-90 p-3">
                    <div class="col">
                    <table class="search-view-table">
                        <tr class="">
                            <th class="wh130" >항공사</th>
                            <td class="al"  >
                                <input type=text maxlength=4 class=" wh50" onChange="return minorCheck(this.value,'_2')"  value="${row.air_line_code || ''}" name="air_line_code"> &nbsp; 
                                <input type=text maxlength=3 class=" wh40" readonly  value="${row.air1 || ''}" name="code_2" > &nbsp; 
                                <input type=text maxlength=3 class=" wh100" readonly value="${row.air1Name || ''}" name="code_2_name"></td>
                            <th class="" >TICKET NO</th>
                            <td class=""   colspan=3>
                                <input type=text maxlength=10 class=" wh120" size=20 value="${row.ticket_number || ''}"  name="ticket_number" >
                                ~
                                Conjunction 
                                <input type=text maxlength=3  class=" wh50"  value=""  name="conjunction_number">
                            </td>
                        </tr>
                        <tr class="">
                            <th class="" >영문명</th>
                            <td class=""  ><input type=text maxlength=30  class=" " value="${row.pax_name || ''}" name="pax_name"></td>
                            <th class="" >발권일자</th>
                            <td class=""   colspan=3>
                                <input type=text maxlength=10    class=" wh120" value="${deps.cutDate(row.downdate || '')}" name="downdate"> 
                                <?=$downButton?>                            
                            </td>
                        </tr>
                        <tr class="">
                            <th class="" >PNR</th>
                            <td class=""  ><input type=text maxlength=9 class=""  value="${row.pnr || ''}" name="pnr"></td>
                            <th class="" >CRS구분</th>
                            <td class=""   >
                                <select name=crs_gubun class="search_action_select wh120">
                                    <option value="">선택하세요
                                    ${gdsData}
                                </select>
                            </td>
                            <th class="" >일정추가</th>
                            <td align=center>
                                <span type= button class=" btn_slim btn_gray" value="-" onClick="return routingChange('-')">-</span>
                                <span type= button class=" btn_slim btn_gray" value="+" onClick="return routingChange('+')">+</span>
                            </td>
                        </tr>
                        ${airData}

                        <tr class="">
                            <th class="" >TAX</th>
                            <td class=""   colspan=5>
                                <table border=0 cellpadding=2 cellspacing=0 width="100%" class="">
                                    <tr>
                                        <td>Code</td>
                                        <td>1. <input type=text  maxlength=3 class=" wh50"  onkeyup="StrLimit(this.form.name,this.value,3,'tax_code2')" value="${row.tax_code1 || ''}" name="tax_code1" ></td>
                                        <td>2. <input type=text  maxlength=3 class=" wh50"  onkeyup="StrLimit(this.form.name,this.value,3,'tax_code3')" value="${row.tax_code2 || ''}" name="tax_code2" ></td>
                                        <td>3. <input type=text  maxlength=3 class=" wh50"  onkeyup="StrLimit(this.form.name,this.value,3,'tax_code4')" value="${row.tax_code3 || ''}" name="tax_code3" ></td>
                                        <td>4. <input type=text  maxlength=3 class=" wh50"  onkeyup="StrLimit(this.form.name,this.value,3,'tax_code5')" value="${row.tax_code4 || ''}" name="tax_code4" ></td>
                                        <td>5. <input type=text  maxlength=3 class=" wh50" onkeyup="StrLimit(this.form.name,this.value,3,'tax_amount1')" value="${row.tax_code5 || ''}" name="tax_code5" ></td>
                                        <td>발권 Comm <input type=text  maxlength=3 class=" wh50"  onChange="return comChange(this.value)" value="${row.commission_code || ''}" name="commission_code" ></td>
                                    </tr>
                                    <tr>
                                        <td>금액</td>
                                        <td>1. <input type=text  class=" wh80"  value="${row.tax_amount1 || ''}" ONKEYup="numSeparate(this);netChange()" name="tax_amount1" ></td>
                                        <td>2. <input type=text  class=" wh80"  value="${row.tax_amount2 || ''}" ONKEYup="numSeparate(this);netChange()" name="tax_amount2" ></td>
                                        <td>3. <input type=text  class=" wh80"  value="${row.tax_amount3 || ''}" ONKEYup="numSeparate(this);netChange()" name="tax_amount3" ></td>
                                        <td>4. <input type=text  class=" wh80"  value="${row.tax_amount4 || ''}" ONKEYup="numSeparate(this);netChange()" name="tax_amount4" ></td>
                                        <td>5. <input type=text  class=" wh80"  value="${row.tax_amount5 || ''}" ONKEYup="numSeparate(this);netChange()" name="tax_amount5" ></td>
                                        <td>Tax Total. <input type=text  class=" wh80"  value="${tax_amount}" readonly name="tax_total" ></td>
                                    </tr>
                                    <tr>
                                        <td>Code</td>
                                        <td>6. <input type=text  maxlength=3 class=" wh50"  onkeyup="StrLimit(this.form.name,this.value,3,'tax_code2')" value="${row.tax_code6 || ''}" name="tax_code6" ></td>
                                        <td>7. <input type=text  maxlength=3 class=" wh50"  onkeyup="StrLimit(this.form.name,this.value,3,'tax_code3')" value="${row.tax_code7 || ''}" name="tax_code7" ></td>
                                        <td>8. <input type=text  maxlength=3 class=" wh50"  onkeyup="StrLimit(this.form.name,this.value,3,'tax_code4')" value="${row.tax_code8 || ''}" name="tax_code8" ></td>
                                        <td>9. <input type=text  maxlength=3 class=" wh50"  onkeyup="StrLimit(this.form.name,this.value,3,'tax_code5')" value="${row.tax_code9 || ''}" name="tax_code9" ></td>
                                        <td>10. <input type=text  maxlength=3 class=" wh50" onkeyup="StrLimit(this.form.name,this.value,3,'tax_amount10')" value="${row.tax_code10 || ''}" name="tax_code10" ></td>
                                        <td>11. <input type=text  maxlength=3 class=" wh50" onkeyup="StrLimit(this.form.name,this.value,3,'tax_amount11')" value="${row.tax_code11 || ''}" name="tax_code11" ></td>
                                    </tr>
                                    <tr>
                                        <td>금액</td>
                                        <td>6. <input type=text  class=" wh80"  value="${row.tax_amount6 || ''}" ONKEYup="numSeparate(this);netChange()" name="tax_amount6" ></td>
                                        <td>7. <input type=text  class=" wh80"  value="${row.tax_amount7 || ''}" ONKEYup="numSeparate(this);netChange()" name="tax_amount7" ></td>
                                        <td>8. <input type=text  class=" wh80"  value="${row.tax_amount8 || ''}" ONKEYup="numSeparate(this);netChange()" name="tax_amount8" ></td>
                                        <td>9. <input type=text  class=" wh80"  value="${row.tax_amount9 || ''}" ONKEYup="numSeparate(this);netChange()" name="tax_amount9" ></td>
                                        <td>10. <input type=text  class=" wh80"  value="${row.tax_amount10 || ''}" ONKEYup="numSeparate(this);netChange()" name="tax_amount10" ></td>
                                        <td>11. <input type=text  class=" wh80"  value="${row.tax_amount11 || ''}" ONKEYup="numSeparate(this);netChange()" name="tax_amount11" ></td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr class="">
                            <th class="" >요금</th>
                            <td class=""   colspan=5>
                                <table border=0 cellpadding=2 cellspacing=0 width="100%">
                                    <tr>
                                        <td align=center>정상가</td>
                                        <td align=center>판매가</td>
                                        <td align=center>지급 COMM %</td>
                                        <td align=center>입금가</td>
                                        <td align=center>NNET</td>
                                    </tr>
                                    <tr>
                                        <td><input type=text  class="" size=12 value="${row.inter_normal || ''}" style='text-align:right' ONKEYup="numSeparate(this);netChange()" name="inter_normal" ></td>
                                        <td><input type=text  class="" size=12 value="${row.inter_sales || ''}" style='text-align:right' ONKEYup="numSeparate(this);netChange()" name="inter_sales" ></td>
                                        <td><input type=text  class=""  value="${row.inter_comm || ''}" style='text-align:center' ONKEYup="netChange2('inter',this.value)" name="inter_comm" ></td>
                                        <td><input type=text  class="" size=12 value="${row.inter_input || ''}" style='text-align:right' ONKEYup="numSeparate(this);" onBlur="netChange3('inter')" name="inter_input" ></td>
                                        <td><input type=text  class="" size=12 value="${row.inter_net || ''}" style='text-align:right' ONKEYup="numSeparate(this);netChange()" name="inter_net" ></td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <th class="" >TASF 관련<br><font color="brown">(카드발권시)</font></th>
                            <td class=""   colspan=5>
                                <table border=0 cellpadding=2 cellspacing=0 width="100%">
                                    <tr>
                                        <td>금액</td>
                                        <td>AUTH</td>
                                        <td>날자</td>
                                        <td>인원</td>
                                        <td rowspan="2"><p class="btn_basic btn_yellow nowrap" onClick="$('#cardArea').toggle()">카드<br>결제</p></td>
                                    </tr>
                                    <tr>
                                        <td><input type="text"  class="" ${tasfRead}  name="tasf_amount"  value="${deps.numberFormat(tasfRow.amount || '')}" style='text-align:right' ></td>
                                        <td><input type="text"  class=""   name="tasf_auth"    value="${tasfRow.auth_number || ''}"                                 ></td>
                                        <td><input type="text"  class=""   name="tasf_update" readonly id="tasf_update" onClick="return datePick('tasf_update')"  value="${tasfRow.up_date || ''}"                            ></td>
                                        <td><input type="text"  class=""   name="tasf_members" value="${tasfRow.tasf_members || ''}"                  ></td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr class="">
                            <th class="" >CASH</th>
                            <td class=""  >
                                <input type=text  class=" wh80" value="${deps.numberFormat(row.cash_amount)}" name="cash_amount" > 
                                VAT : <input type=checkbox value="Y" name="vat_use" ${row.vat_use === "Y" ? "checked" : ''}>발행
                            </td>
                            <th class="" >CARD</th>
                            <td class=""  ><input type=text  ONKEYup="numSeparate(this);netChange4(this.value)" class=" " value="${deps.numberFormat(row.card_amount)}" name="card_amount" ></td>
                            <th class="" >미매칭</th>
                            <td class=""  ><input type=text  class=" "  value="${deps.numberFormat(row.not_matching)}" name="not_matching"></td>
                        </tr>
                        <tr class="">
                            <th class="" >Card No</th>
                            <td class=""  colspan="3"> 
                                종류 : <input type=text class=" wh40"  value="${row.card_type}"  name="card_type"> &nbsp; 
                                카드번호 : <input type=text class="search_action_search_input wh180"  value="${row.card_number}" maxlength='6'  name="card_number"> &nbsp; 
                                할부 : 
                                    <select name=installment class="search_action_select wh60">
                                        <option value="">0
                                        <option value="2"  ${row.installment === "2" ? 'selected' : ''} >2
                                        <option value="3"  ${row.installment === "3" ? 'selected' : ''} >3
                                        <option value="4"  ${row.installment === "4" ? 'selected' : ''} >4
                                        <option value="5"  ${row.installment === "5" ? 'selected' : ''} >5
                                        <option value="6"  ${row.installment === "6" ? 'selected' : ''} >6
                                        <option value="7"  ${row.installment === "7" ? 'selected' : ''} >7
                                        <option value="8"  ${row.installment === "8" ? 'selected' : ''} >8
                                        <option value="9"  ${row.installment === "9" ? 'selected' : ''} >9
                                        <option value="10" ${row.installment === "10" ? 'selected' : ''}>10
                                        <option value="11" ${row.installment === "11" ? 'selected' : ''}>11
                                        <option value="12" ${row.installment === "12" ? 'selected' : ''}>12
                                    </select>
                                    &nbsp; 
                                승인번호 :<input type=text class="search_action_search_input wh100"  size=10 value="${row.approval_code}" name="approval_code">
                            </td>
                            <th class="" >총금액</th>
                            <td class=""  >
                                <input type=text  class="search_action_search_input wh180"  value="${deps.numberFormat(row.totalAmount)}" name="totalAmount" >
                                <input type="hidden"  class="search_action_search_input "  value="${deps.numberFormat(row.fare)}" name="fare" >
                            </td>
                        </tr>
                        <tr class="">
                            <th class="" >할인액</th>
                            <td class=""  >
                                <input type=text  ONKEYup="numSeparate(this);netChange()" class="search_action_search_input" size=10 value="${deps.numberFormat(row.self_dc)}" name="self_dc">
                            </td>
                            <th class="" >영업사원</th>
                            <td class="" >
                                <input type=text tabindex=101 class="search_action_search_input" readonly onkeyup="StrLimit(this.form.name,this.value,2,'code2')" onChange="return minorCheck(this.value,'1')" size=10 value="" name="code1">
                            </td>
                            <th class="" >유효기간</th>
                            <td class="wh140"  >
                                <input type=text maxlength=4  class=" wh50"  value="20${row.valid_date}" name="exp1">년 
                                <input type=text maxlength=2  class=" wh30" value="${row.valid_date.slice(2)}" name="exp2">월
                            </td>
                        </tr>
                        <tr class="">
                            <th class="" >순수입</th>
                            <td class=""  >
                                <input type=text  class="search_action_search_input" size=10 value="${deps.numberFormat(row.benefit - row.self_dc)}" name="benefit">
                            </td>
                            <th class="" >발권카운터</th>
                            <td class=""   >
                                <select name="issue_manager" class="search_action_select wh120" onChange="dataChange ('AirTickets','issue_manager',this.value,'${ticket_number}')" >
                                    <option value="">선택하세요
                                    <?=$manHTML?>
                                </select>
                            </td>
                            <th class="" >티켓구분</th>
                            <td class=""   >
                                <select class="search_action_select wh120" name="ticket_type" onChange="dataChange ('AirTickets','ticket_type',this.value,'${ticket_number}')" >
                                    ${issData}
                                </select>
                            </td>
                        </tr>
                        <tr class="">
                            <th class="" >수수료</th>
                            <td class=""  >
                                <input type=text onfocus="Del_Comma2(this);this.select();"  onBlur="Add_Comma2(this)" class="search_action_search_input" size=10 name="system" value="${deps.numberFormat(row.system)}">
                            </td>
                            <th class="" >거래처</th>
                            <td class=""   colspan=3>
                                <input type=text class="search_action_search_input wh100" onChange="return smallPopShow2(this.value)" size=10 value="${row.site_code}" name="site_code">
                                <input type=text class="search_action_search_input wh200" readonly name="siteName" value="${row.site_name || ''}">
                            </td>
                        </tr>
                        
                        <tr class="">
                            <th class="" >입금전표</th>
                            <td class=""  >
                                <input type=text class="search_action_search_input"onChange="valChange(this.value,'ticket_num_in')" size=14 value="${row.ticket_num_in}" name=ticket_num_in>
                                </td>
                            <th class="" >IATA No.</th>
                            <td class=""   colspan=3><input type=text tabindex=101 maxlength=11 class="search_action_search_input" size=10  value="${row.iatanumber}" name="iatanumber">

                            </td>
                        </tr>
                        <tr class="">
                            <th class=""  rowspan=5>비고</th>
                            <td class=""   rowspan=5 height="100%"><textarea type=text class="search_action_search_input hh100" name="etc">${row.etc}</textarea></td>
                            <th class="" >증빙서</th>
                            <td class=""   colspan=3><input type=text  class="search_action_search_input" value="${row.auth}" name="auth"> </td>
                        </tr>
                        <tr class="">
                            <th class="" >VOID</th>
                            <td class=""   colspan=3>	
                                <input type=checkbox  class="search_action_checkbox" value="V" name=ticketType onCLick="return voidCheck()" > 
                                <input type=text class="search_action_search_input wh300"  disabled  value="${row.viod_data || ''}" name="void_data"> 
                            </td>
                        </tr>
                        <tr class="">
                            <th class="" >VOID 날자</th>
                            <td class="" colspan="3"  >
                            <span class="fl"> <input type=text  class="search_action_search_input" value="${row.void_date}" readonly name="void_date" id="void_date" onClick="return datePick('void_date')"> </spaN> 
                            <span class="search_action_btn_gray fl" name=Button1 id='' onClick="$('#void_date').click()" >날짜</span>
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
            org_ticket_type = !org_ticket_type ? ticket_type : org_ticket_type;
            sqlText = `select count(*) as cnt from ${mainTable} where air_line_code = @air_line_code and ticket_number = @ticket_number and ticket_type = @ticket_type `;
            sqlResult = await pool.request()
                    .input('air_line_code',sql.NVarChar , air_line_code)
                    .input('ticket_number',sql.NVarChar , ticket_number)
                    .input('ticket_type'  ,sql.NVarChar , org_ticket_type)
                    .query(sqlText);
            const cnt  = sqlResult.recordset?.[0]?.cnt || 0;
            if (cnt > 0) {
                msg = '코드가 중복 되었습니다';
            } else {
                sqlText = `insert into ${mainTable} (air_line_code,ticket_number,ticket_type) values (@air_line_code, @ticket_number , @ticket_type)`;
                await pool.request()
                    .input('air_line_code',sql.NVarChar , air_line_code)
                    .input('ticket_number',sql.NVarChar , ticket_number)
                    .input('ticket_type'  ,sql.NVarChar , org_ticket_type)
                    .query(sqlText);
            }
        }
        if (!msg) {
            const baseFields = {
                pax_name:        data.pax_name,
                conjunction_number: data.conjunction_number,
                pnr:             data.pnr,
              
                tax_code1:       data.tax_code1,
                tax_code2:       data.tax_code2,
                tax_code3:       data.tax_code3,
                tax_code4:       data.tax_code4,
                tax_code5:       data.tax_code5,
              
                tax_amount1:     StrClear(data.tax_amount1),
                tax_amount2:     StrClear(data.tax_amount2),
                tax_amount3:     StrClear(data.tax_amount3),
                tax_amount4:     StrClear(data.tax_amount4),
                tax_amount5:     StrClear(data.tax_amount5),
              
                inter_normal:    StrClear(data.inter_normal),
                inter_sales:     StrClear(data.inter_sales),
                inter_comm:      StrClear(data.inter_comm),
                inter_input:     StrClear(data.inter_input),
                inter_net:       StrClear(data.inter_net),
              
                iatanumber:      data.iatanumber,
                members:         data.members,
                system:          data.system,
                cash_amount_bsp: StrClear(data.cash_amount_bsp),
                fare:            data.fare,
              
                commission_code: data.commission_code,
                totalAmount:     StrClear(data.totalAmount),
                not_matching:    data.not_matching,
                card_amount:     StrClear(data.card_amount),
                cash_amount:     StrClear(data.cash_amount),
                money_type:      data.money_type,
                self_dc:         data.self_dc,
                site_code:       data.site_code,
                etc:             data.etc,
                auth:            data.auth,
                void_date:       data.void_date,
                card_type:       data.card_type,
                card_number:     data.card_number,
                valid_date:      data.valid_date,
                approval_code:   data.approval_code,
                installment:     data.installment,
                benefit:         data.benefit,
                vat_use:         data.vat_use,
                branch:          data.branch,
                ticket_num:      data.uid,
                issue_manager:   data.issue_manager,
                serial:          data.vat_uid,
                ticket_type:     data.ticket_type,
            };
            const setClauses = [];
                Object.keys(baseFields).forEach((col) => {
                if (baseFields[col] !== undefined) {
                    setClauses.push(`${col} = @${col}`);
                }
            });
            sqlText = `
                UPDATE ${mainTable}  SET  ${setClauses.join(',\n    ')}
                WHERE ticket_number = @ticket_number AND air_line_code = @air_line_code AND ticket_type   = @org_ticket_type;
            `;
            try {
                const request = pool.request();

                // 기본 필드 파라미터 바인딩
                for (const [col, value] of Object.entries(baseFields)) {
                    if (value !== undefined) {
                        request.input(col, value); // 타입 지정 필요하면 여기서
                    }
                }

                // WHERE 조건 바인딩
                request
                .input('ticket_number', data.ticket_number)
                .input('air_line_code', data.air_line_code)
                .input('org_ticket_type', data.org_ticket_type);

                await request.query(sqlText);
                
                if (data.tasf_amount > 0 && data.card_type && data.card_number ) {
                    sqlText = ` select count(*) as  cnt from site_commlist where 
                        ticket_number = @ticket_number and air_line_code = @air_line_code and site_code = @site_code and gubun = @gubun and void is null
                    `;
                    sqlResult = await pool.request()
                        .input('air_line_code',sql.NVarChar , air_line_code)
                        .input('ticket_number',sql.NVarChar , ticket_number)
                        .input('site_code'    ,sql.NVarChar , data.site_code)
                        .input('gubun'        ,sql.NVarChar , 'T')
                        .query(sqlText);
                    rsCount = sqlResult?.[0]?.cnt || 0;
                    if (rsCount === 0) {
                        max  = uidNext("site_commlist",pool);
                        sqlText = ` insert into site_commlist (uid,gubun,site_code,up_date,air_line_code,ticket_number)  `;
                        sqlText += ` values ('${uid}','T','${data.site_code}','${data.tasf_update}','${air_line_code}','${ticket_number}')   `;
                        sqlResult = await pool.request().query(sqlText);
                    }
                    sqlText = `
                        update site_commlist
                            set 
                            amount      = '${data.tasf_amount}',
                            comm        = '${data.tasf_amount}',
                            up_date     = '${data.tasf_update}',
                            auth_number = '${data.tasf_auth}'
                        where ticket_number = '${ticket_number}' and air_line_code = '${air_line_code}' and site_code = '${data.site_code}' and gubun = 'T' and void is null
				    `;
				    sqlResult = await pool.request().query(sqlText);
                }

            } catch (err) {
                msg = err;
                console.log(err)
            }

        }
    }
    
    if (msg) rs = 'no'; else rs = 'ok';
    res.json ({success: rs, errorMsg: msg , title: titleData , html: htmlData 

    
    });
}