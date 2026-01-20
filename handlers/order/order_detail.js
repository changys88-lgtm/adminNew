const { NVarChar } = require('mssql');
const deps = require('../../src/common/dependencies');
const {mainOrderQuery } = require('../../src/utils/database');
const { arrCountryCode , arrGender } = require('../../src/utils/airConst');

async function orderBaseData (pool,mainRow) {
    sqlText = `select eng_name1+'/'+eng_name2 as name from orderSheet_pax where order_num = @order_num  and minor_num = '1'`;
    sqlResult = await pool.request().input('order_num',deps.sql.NVarChar,mainRow.order_num).query(sqlText);
    let name = sqlResult.recordset?.[0]?.name || '';
    if (mainRow.handphone.length > 20) mainRow.handphone = deps.aes128Decrypt(deps.getNow().aviaSecurityKey,mainRow.handphone);
    const data = `
        <table class="table regis-hotel">
            <tbody>
            <tr>
                <th scope="row" class="regis-hotel-td1">주문번호</th>
                <td class="regis-hotel-td2"><input type="" class="form-control form-control-sm mt-2" value="${order_num}" readonly style="background-color:#fff;"></td>
                <th scope="row" class="regis-hotel-td1">총 금액</th>
                <td class="regis-hotel-td2" colspan="3"><input type="" class="form-control form-control-sm mt-2" value="${deps.numberFormat(mainRow.total_amount)} 원" readonly style="background-color:#fff;"></td>
            </tr>
            <tr>
                <th scope="row" class="regis-hotel-td1">주문자</th>
                <td class="regis-hotel-td2"><input type="" class="form-control form-control-sm mt-2" value="${mainRow.order_name}" readonly style="background-color:#fff;"></td>
                <th scope="row" class="regis-hotel-td1">인원</th>
                <td class="regis-hotel-td2 al" colspan="3">
                    성인 <input type="" class="form-control form-control-sm mt-2 d-inline" style="width:40px;background-color:#fff" value="${mainRow.adult_member}" readonly >&nbsp;&nbsp;/
                    소아 <input type="" class="form-control form-control-sm mt-2 d-inline" style="width:40px;background-color:#fff" value="${mainRow.child_member}" readonly >&nbsp;&nbsp;/
                    유아 <input type="" class="form-control form-control-sm mt-2 d-inline" style="width:40px;background-color:#fff" value="${mainRow.infant_member}" readonly ></td>
            </tr>
            <tr>
                <th scope="row" class="regis-hotel-td1">연락처</th>
                <td class="regis-hotel-td2"><input type="" class="form-control mt-2 form-control-sm  d-inline" value="${deps.telNumber(mainRow.handphone)}"readonly  style="background-color:#fff;"></td>
                <th scope="row" class="regis-hotel-td1">동행자</th>
                <td class="regis-hotel-td2">${name}</td>
                <th scope="row" class="regis-hotel-td1">출력 / 저장</th>
                <td class="regis-hotel-td2">									
                    <i class="fas fa-comment-dots" style="color:#bbb;" alt="sns보내기"></i>	
                    <i class="fas fa-print" style="color:#bbb;" alt="출력하기"></i>
                    <i class="fas fa-download" style="color:#bbb;"alt="저장하기"></i>
                </td>
            </tr>				
                
            </tbody>
        </table>
    `;
    return data;
}
async function orderListData (pool,mainRow,pos) {
    sqlText = `select a.*,b.username from orderSheet_inv as a left outer join tblManager as b on a.operator = b.member_code where order_num = @order_num  and gubun = @pos order by minor_num desc `;
    sqlResult = await pool.request().input('order_num',deps.sql.NVarChar,mainRow.order_num).input('pos',deps.sql.NVarChar,pos).query(sqlText);
    let num      = 1;
    let htmlURL  = '';
    let aNum     = '';
    let link     = '';
    let file     = '';
    let del      = '';
    let listData = '';
    for (const row of sqlResult.recordset) {
        let {gubun,receiver, file_name,up_date,username,send_type,minor_num}  =row;
        aNum = order_num.split('-');
        short = htmlURL = `${file_name}`;
        file    = file_name;
        if (gubun === "2") gubun = "Confirm";
        link    = `<span class='btn_slim btn_yellow cursor' onClick="preView('${send_type}','${file}')">보기</span>`;
        del     = `<span class='btn_slim btn_red cursor' onClick="attDel('${order_num}','${minor_num}','${gubun}')"><i class='fas fa-trash-alt'></i></a>`;
        listData += `
            <tr style='border-bottom:1px solid #dee2e6;'>
                <td align=center class='td_rightline1'>${num}</td>
                <td align=center class='td_rightline1'>${gubun}</td>
                <td align=center class='td_rightline1'>${receiver}</td>
                <td align=center class='td_rightline1'>${htmlURL} &nbsp;<span class='btn_basic btn_gray' onclick="return copyClip('${htmlURL}')">복사</span><br>$short &nbsp;<span class='btn_basic btn_gray' onclick="return copyClip('${short}')">복사</span></td>
                <td align=center class='td_rightline1'>${deps.cutDateTime(up_date,"S")}</td>
                <td align=center class='td_rightline1'>${username}</td>
                <td align=center class='td_rightline1'>${link}</td>
                <td align=center class='td_rightline1'>${del}</td>
            </tr>
        `;
        num ++;
    }
    if (!listData) listData = `<tr><td class='hh50 ac' colspan='8'>등록된 내역이 없습니다.</td></tr>`;
    return listData;
}
module.exports = async (req, res) => {
  const mode        = req.body.mode || '';
  let uid           = req.body.uid || '';
  let  order_num    = req.body.order_num || '';
  const menuGubun   = req.body.menuGubun ?? 'Base';
  const b2bMASTER   = req.cookies?.b2bMASTER || '';
  const b2bSiteCode = req.cookies?.b2bSiteCode || '';
  if (!order_num && !uid) {
    return res.status(404).send("UID 없음");
  }
  if (!order_num && uid) order_num = uid;

  const pool = await deps.getPool();
  let   sqlText       = '';
  let   sqlResult     = '';
  let   managerHTML   = '';
  let   tmpCls        = 'none';
  let   outRead       = '';
  let   settleRead    = '';
  let   settleDis     = '';
  let   memDetail     = '';
  const aes128Encrypt = deps.aes128Encrypt;
  const aes128Decrypt = deps.aes128Decrypt;
  const aviaSecurityKey = deps.getNow().aviaSecurityKey;
  const sql           = deps.sql;
  const mainRow       = await mainOrderQuery(order_num);
  const members = Number(mainRow.adult_member) + Number(mainRow.child_member) + Number(mainRow.infant_member);
  if (!mode) {
    try {
        for (const [key, value] of Object.entries(mainRow)) {
            global[key] = (typeof value === 'string') ? value.trim() : value;
        }
        const settle_uid = mainRow.uid;
        let menuData = `
            <div class='border regis-tle-box shadow-sm mw20 mat10 detail_view_header'>
                <div class="d-inline regis-tle " style="font-size:1.2em;"><i class="fas fa-edit search-title-text">&nbsp;상품 주문서 상세 보기 (${settle_uid})</i></div>    
                <div class="d-inline float-right">
                    <span  class="btn btn-sm btn-yellow-bg-sm    mb-1" id='Menu_Base'    onClick="orderMenuChange('Base'   ,'${order_num}')">기본사항</span>
                    <span  class="btn btn-sm btn-lightgrey-bg-sm mb-1" id='Menu_Confirm' onClick="orderMenuChange('Confirm','${order_num}')">확정서</span>
                    <span  class="btn btn-sm btn-lightgrey-bg-sm mb-1" id='Menu_Inv'     onClick="orderMenuChange('Inv'    ,'${order_num}')">인보이스</span>
                    <span  class="btn btn-sm btn-lightgrey-bg-sm mb-1" id='Menu_Att'     onClick="orderMenuChange('Att'    ,'${order_num}')">첨부화일</span>
                    <span  class="btn btn-sm btn-lightgrey-bg-sm mb-1 none" id='Menu_Settle'  onClick="orderMenuChange('Settle' ,'${order_num}')">정산서</span>
                    <span  class="btn btn-sm btn-lightgrey-bg-sm mb-1" id='Menu_Voucher' onClick="orderMenuChange('Voucher','${order_num}')">Voucher</span>
                    <span  id="orderCopy"  class="btn btn-yellow-bg-sm btn_red btn-sm  mb-1" onClick="orderCopy('${order_num}')">주문서복사</span>
                </div>
            </div>
        `;
        sqlText = `select member_code,username,handphone from tblManager where sale_manager = 'Y' and ( resign = '' or resign is null ) order by username `;
        sqlResult = await pool.request().query(sqlText);
        for (const row of sqlResult.recordset) {
            let { member_code , username , handphone } = row;
            
            if (handphone.length > 20) handphone = aes128Decrypt(aviaSecurityKey,handphone);
            if (member_code.trim() == (mainRow.manager || '').trim()) {
                s = "selected";
                managerName = username;
            } else s = "";
            managerHTML += `<option value='${member_code}' ${s}>${username}(${handphone}) `;
        }

        if (handphone.length > 20 ) handphone = aes128Decrypt(aviaSecurityKey,handphone);


        if (mainRow.userid) {
            memDetail = `<span class="btn_basic btn_blue" onClick="return memberView('${userid}')">회원상세</span>`;
        } else { 
            memDetail = `<span class="btn_basic btn_gray" onClick="return memberSet()">회원선택</span>`;
        } 

        let baseData = `
            <div class='schedule pdw20'>
                <div class='border regis-tle-box shadow-sm'>
                    <table class="table regis-hotel">
                        <colgroup>
                            <col width="100"></col>
                            <col width="220"></col>
                            <col width="100"></col>
                            <col width=""></col>
                            <col width="100"></col>
                            <col width="220"></col>
                            <col width="100"></col>
                            <col width="340"></col>
                        </colgroup>
                        <p class="pl-3 pt-2 sub-tle">기본사항 ⓐ
                        <span style='float: right;'>
                            <select name='manager' onChange="valChange('orderSheet','${order_num}','manager',0,this.value)" class='wh150' >
                                ${managerHTML}
                            </select>
                        </span>
                        <tbody>
                        <tr>
                            <th scope="row" class="regis-hotel-td1">주문번호</th>
                            <td class="regis-hotel-td2">
                                <input type="" class="form-control form-control-sm mt-2 wh150" value="${order_num}" readonly style="background-color:#fff;">
                            </td>
                            <th scope="row" class="regis-hotel-td1">부제:</th>
                            <td class="regis-hotel-td2">
                                <input type="" class="form-control form-control-sm mt-2 wh110" value="${sub_subject || ''}" onChange="valChange('orderSheet','${order_num}','sub_subject',0,this.value)" style="background-color:#fff;">
                            </td>
                            <th scope="row" class="regis-hotel-td1">인원</th>
                            <td class="regis-hotel-td2">
                                Adt <input type="number" class="form-control form-control-sm mt-2  d-inline" ${settleRead} onChange="valChange('orderSheet','${order_num}','adult_member',0,this.value)" style="width:50px;background-color:#fff" value="${adult_member}"  max="50" ${outRead} >&nbsp;&nbsp;/
                                Chd <input type="number" class="form-control form-control-sm mt-2  d-inline" ${settleRead} onChange="valChange('orderSheet','${order_num}','child_member',0,this.value)" style="width:50px;background-color:#fff" value="${child_member}"  max="50" ${outRead} >&nbsp;&nbsp;
                                <span class="${tmpCls}">
                                /
                                Inf <input type="text" class="form-control form-control-sm mt-2  d-inline ${tmpCls}" ${settleRead} onChange="valChange('orderSheet','${order_num}','infant_member',0,this.value)" style="width:50px;background-color:#fff" value="${infant_member} " ${outRead} >
                                </span>
                            </td>
                            
                            <th scope="row" class="regis-hotel-td1">상태</th>
                            <td class="regis-hotel-td2 borderBottom">
                                <select name="status" ${settleDis} onChange="valChange('orderSheet','${order_num}','status',0,this.value)" >
                                    <option value="">현재상태</option>
                                </select>
                                <select name="pay_finish" ${settleDis} onChange="valChange('orderSheet','${order_num}','pay_finish',0,this.value)" >
                                    <option value="">결제상태</option>
                                    
                                </select>
                                <select name="settle_status" ${settleDis} class="wh80" onChange="valChange('orderSheet','$order_num}','settle_status',0,this.value)" >
                                    <option value="">정산상태</option>
                                </select>

                                <label>견적완료<input type="checkbox" name="estimate" value="Y" class="" onChange="valChange('orderSheet','${order_num}','estimate',0,this.checked)" style="width:30px;background-color:#fff" <? if (${(estimate === "Y") ? "checked" : ''}> </label>

                            </td>
                        </tr>
                        <tr>
                            <th scope="row" class="regis-hotel-td1">구매자</th>
                            <td class="regis-hotel-td2 nowrap">
                                <input type="text"   name="order_name" class="form-control form-control-sm mt-2 wh60" ${settleRead} onChange="valChange('orderSheet','${order_num}','order_name',0,this.value)" placeholder='영문 성' value="${order_name}" style="background-color:#fff;">
                                <input type="text"   class="form-control form-control-sm mt-2 wh100" ${settleRead} onChange="valChange('orderSheet','${order_num}','order_ename',0,this.value)" placeholder='영문 이름' value="${order_ename || ''}" style="background-color:#fff;">
                                <input type="hidden" class="form-control form-control-sm mt-2 wh100" name="userid" value="${userid}">
                                ${memDetail}
                                <div style="position:reletive;">
                                    <div id="memberData" style="position:absolute; width:700px; height:300px; margin-top:12px; border:1px solid gray; overflow:hidden; overflow-y:auto; display:none; z-index:999; ">
                                    
                                    </div>
                                </div>
                            </td>
                            <th scope="row" class="regis-hotel-td1">연락처</th>
                            <td class="regis-hotel-td2"><input type="" name="handphone" onChange="valChange('orderSheet','${order_num}','handphone',0,this.value)" class="form-control mt-2 form-control-sm  d-inline wh150" value="${handphone}"  style="background-color:#fff;"></td>
                            <th  scope="row" class="regis-hotel-td1">이메일</th>
                            <td ><input type="" class="form-control form-control-sm mt-2 wh150 " onChange="valChange('orderSheet','${order_num}','email',0,this.value)" value="${email || ''}" style="background-color:#fff;"></td>

                            <th  scope="row" class="regis-hotel-td1">채널</th>
                            <td class="regis-hotel-td2">
                                <select name="orderPos" style="width:100px" onChange="valChange('orderSheet','${order_num}','orderPos',0,this.value)" >
                                    <option value="">채널</option>
                                </select>
                                <input type="" class="form-control form-control-sm mt-2 wh100" onChange="valChange('orderSheet','${order_num}','orderPos',0,this.value)" value="${orderPos}" style="background-color:#fff;" readonly>
                            </td>
                        </tr>
                        <tr>
                            <th scope='row' class='regis-hotel-td1'>수배상황</th>
                            <td class='regis-hotel-td1 al' colspan="">
                                항공
                                <select name="" onChange="valChange('orderSheet','${order_num}','air_book',0,this.value)" >
                                    <option value="">대기</option>
                                    <option value="Y" ${(air_book === "Y") ? 'selected' : '' }>완료</option>
                                </select>
                                &nbsp; &nbsp; 
                                숙박
                                <select name="" onChange="valChange('orderSheet','${order_num}','hotel_book',0,this.value)" >
                                    <option value="">대기</option>
                                    <option value="Y" ${(hotel_book === "Y") ? 'selected' : '' }>완료</option>
                                </select>
                                &nbsp; &nbsp; 
                                현지
                                <select name="" onChange="valChange('orderSheet','${order_num}','land_book',0,this.value)" >
                                    <option value="">대기</option>
                                    <option value="Y" ${(land_book === "Y") ? 'selected' : '' }>완료</option>
                                </select>
                                &nbsp; &nbsp; 
                                픽업
                                <select name="" onChange="valChange('orderSheet','${order_num}','pick_book',0,this.value)" >
                                    <option value="">대기</option>
                                    <option value="Y" ${(pick_book === "Y") ? 'selected' : '' }>완료</option>
                                </select>
                            </td>
                            <th scope="row" class="regis-hotel-td1">방송일자</th>
                            <td class="regis-hotel-td2"><input type="" name="broad_date" onChange="valChange('orderSheet','${order_num}','broad_date',0,this.value)" class="form-control mt-2 form-control-sm  d-inline wh150" value="${deps.cutDate(broad_date || '')}"  style="background-color:#fff;"></td>
                            <th  scope="row" class="regis-hotel-td1">연결번호</th>
                            <td class="regis-hotel-td2">
                                <input type="" class="form-control form-control-sm mt-2 wh150" onChange="valChange('orderSheet','${order_num}','online_order',0,this.value)" value="${online_order}" style="background-color:#fff;">
                            </td>
                            <th  scope='row' class='regis-hotel-td1'>알림전송</th>
                            <td class='regis-hotel-td1'>
                                <select name="alramSel" >
                                <option value="">알람내용선택
                                <option  value="HOTEL">호텔+에어시티확정서
                                <option  value="OAASHOTEL">OAAS호텔예약
                                </select>
                                <div class="btn mt-0  btn-sm btn-yellow-sm"  onclick="alramSend(document.frmForm.alramSel.value,'${order_num}')" >전송</div>
                            </td>
                        </tr>
                        <tr>
                            <th  scope="row" class="regis-hotel-td1" title="항공일정을 수기로 작업하여 보여준다 ">항공일정</th>
                            <td COLSPAN=""><input type="" class="form-control form-control-sm mt-2 wh30" ${settleRead} onChange="valChange('orderSheet','${order_num}','air_seg',0,this.value)" value="${air_seg || ''}" > Seg 예) '3' 여정 숫자만 기입</td>
                            <th  scope="row" class="regis-hotel-td1" title="국제선 주문서넘버를 기입하면 생성된 항공일정을 보여준다 " style="position: relative">항공주문서</th>
                            <td COLSPAN="">
                                <input type="" class="form-control form-control-sm mt-2 wh70 fl" ${settleRead} onChange="valChange('orderSheet','${order_num}','air_order',0,this.value)" value="${air_order || ''}" title="복수 주문서 일경우 ,로 구분하여 입력">
                                &nbsp;
                                <input type="" class="form-control form-control-sm mt-2 wh70 " ${settleRead} onChange="valChange('orderSheet','${order_num}','gdsPnr',0,this.value)" value="${gdsPnr || ''}" title="PNR 입력">
                            </td>
                            <th  scope="row" class="regis-hotel-td1">호텔객실</th>
                            <td colspan=""><input type="" class="form-control form-control-sm mt-2 wh30" ${settleRead} onChange="valChange('orderSheet','${order_num}','hotel_seg',0,this.value)" value="${hotel_seg || ''}" > Hotel 예) '1'  </td>
                            <th  scope="row" class="regis-hotel-td1">데일리일정</th>
                            <td colspan="">
                                <input type="" class="form-control form-control-sm mt-2 ac" ${settleRead} onChange="valChange('orderSheet','${order_num}','daily_seg',0,this.value)" value="${daily_seg || ''}" style="width:40px;"> 일정 예) '1' 
                                &nbsp; &nbsp;  &nbsp; <font color='brown'>추가비용</font>
                                <input type="" class="form-control form-control-sm mt-2 wh80" ${settleRead} value="${addPrice || ''}"  onChange="valChange('orderSheet','${order_num}','addPrice',0,this.value)"  style="background-color:#fff;">원
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" class="regis-hotel-td1">공급업체</th>
                            <td class="regis-hotel-td2 borderBottom" >
                            </td>
                            <th scope="row" class="regis-hotel-td1 hh20">공급업체<br>연락처</th>
                            <td class="regis-hotel-td2 borderBottom" >
                            </td>
                            <th scope="row" class="regis-hotel-td1">견적 환율</th>
                            <td class="regis-hotel-td2 borderBottom" >
                                <select name='currency' onChange="valChange('orderSheet','${order_num}','order_currency',0,this.value)" style='width: 80px;'>
                                </select>
                            </td>
                            <th scope="row" class="regis-hotel-td1 bgcEEE">직접결제</th>
                            <td class="regis-hotel-td2 borderBottom bgcEEE" >
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" class="regis-hotel-td1">판매업체</th>
                            <td class="regis-hotel-td2 borderBottom" >
                            </td>
                            <th scope="row" class="regis-hotel-td1 hh20">판매업체<br>연락처</th>
                            <td class="regis-hotel-td2 borderBottom" >
                            </td>
                            <th scope="row" class="regis-hotel-td1">공급업체<br>견적완료</th>
                                <td class="regis-hotel-td2 borderBottom" >

                                <label>견적완료<input type="checkbox" name="supply_estimate" value="Y" class="" onChange="valChange('orderSheet','${order_num}','supply_estimate',0,this.checked)" style="width:30px;background-color:#fff" ${supply_estimate === "Y" ? 'checked' : ''}> </label>
                                </td>

                            <th scope="row" class="regis-hotel-td1 bgcEEE">저장</th>
                            <td class="regis-hotel-td2 borderBottom bgcEEE" >
                                <span class="btn-yellow-sm mt-1 cursor" style="display:none" ID="btnModify" onClick="return modAction()">변경사항저장</span>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        `;

        let nameInput    = 'Y';
        let paxDataCopy  = '';
        let toHTML       = '';
        let minor        = 1;
        let countryData  = '';
        let genData      = '';
        let tmpName      = '';
        let bTicket      = [];
        let chkPassPort  = '';
        const aPass      = [];
        sqlText = `select merchant_id, person_order from scanList where merchant_id = @order_num  `;
        sqlResult = await pool.request().input('order_num',sql.NVarChar,order_num).query(sqlText);
        for (const row of sqlResult.recordset) {
            const {person_order} = row;
            deps.arrPush(aPass,person_order,'1');
        }

        function paxDataPush (minor,countryData='',genData='',kor_name='',eng_name1='',eng_name2='',passport='',expire='',birthdays='',birthdays2='',ticket='',chkPassPort='') {
            return `
                <tr style='text-align:center'>
                    <td style='border-bottom:1px solid #dee2e6;'>${minor}</td>
                    <td style='border-bottom:1px solid #dee2e6;'><input type='text' placeholder='한글이름필요시'    id='tkorname_${minor}' name='kor_name[]'   value='${kor_name || ''}'  class='form-control form-control-sm d-inline '  ></td>
                    <td style='border-bottom:1px solid #dee2e6;'><input type='text' placeholder='여권상 성(영문)'   id='tename1_${minor}'  name='eng_name1[]'  value='${eng_name1 || ''}' class='form-control form-control-sm d-inline ' style='text-transform: uppercase-' ></td>
                    <td style='border-bottom:1px solid #dee2e6;'><input type='text' placeholder='여권상 이름(영문)' id='tename2_${minor}'  name='eng_name2[]'  value='${eng_name2 || ''}' class='form-control form-control-sm d-inline ' style='text-transform: uppercase-' ></td>
                    <td style='border-bottom:1px solid #dee2e6;'>
                        <select name='country[]' id='tcountry_${minor}' ><option value=''>
                            ${countryData}
                        </select>
                    </td>
                    <td style='border-bottom:1px solid #dee2e6;'><input type='text' placeholder='여권번호' id='tpassport_${minor}' name='passport[]'  value='${passport || ''}' class='form-control form-control-sm d-inline wh120'></td>
                    <td style='border-bottom:1px solid #dee2e6;'><input type='text' placeholder='유효기간' id='texpired_${minor}'  name='expire[]'  value='${expire || ''}' class='form-control form-control-sm d-inline wh100' ></td>
                    <td style='border-bottom:1px solid #dee2e6;'>
                        <select class='' name='sex[]' id='tsex_${minor}'>
                            <option value=''>성별</option>
                            ${genData}
                        </select>
                    </td>
                    <td style='border-bottom:1px solid #dee2e6;'><input type='text' placeholder='생일' name='birthdays[]'           id='tbirth_${minor}' value='${birthdays || ''}' class='form-control form-control-sm d-inline wh90' > - <input type='$MasterView' placeholder='해당시뒷번호 ' name='birthdays2[]' id='tbirth2_${minor}'  value='${birthdays2 || ''}' class='form-control form-control-sm d-inline wh100' ></td>
                    <td style='border-bottom:1px solid #dee2e6;'>${ticket || ''}</td>
                    <td style='border-bottom:1px solid #dee2e6;' class='$passScanNone'><button class='btn_basic btn_red ' onClick="return passPicture('${minor}')">여권</button></td>
                    <td style='border-bottom:1px solid #dee2e6;'>${chkPassPort || ''}</td>
                </tr>
            `;
        }

        sqlText = `select * from orderSheet_pax where order_num = @order_num`;
        sqlResult = await pool.request().input('order_num' , sql.NVarChar , order_num). query(sqlText);
        for (const row of sqlResult.recordset) {
            let {minor_num , kor_name , eng_name1 , eng_name2 ,country, passport , expire , birthdays , birthdays2 , sex , tel_num } = row;
            if (tel_num?.length    || '' > 20) tel_num    = aes128Decrypt(aviaSecurityKey,tel_num);
            if (passport?.length   || '' > 20) passport   = aes128Decrypt(aviaSecurityKey,passport);
            if (birthdays?.length  || '' > 20) birthdays  = aes128Decrypt(aviaSecurityKey,birthdays);
            if (birthdays2?.length || '' > 20) birthdays2 = aes128Decrypt(aviaSecurityKey,birthdays2);
            if (expire?.length     || '' > 20) expire     = aes128Decrypt(aviaSecurityKey,expire);
            arrCountryCode.forEach(val => { 
                const tmp = val.split('/');
                const selected = tmp[1] === country ? 'selected': '';
                if (tmp[1] === country) countryName = tmp[2];
                countryData += `<option value="${tmp[1]}" ${selected}>${tmp[2]}`;
            });
            genData = '';
            for (const [key, val] of Object.entries(arrGender)) {
                const selected = key === sex.trim() ? 'selected' : '';
                if (key === sex) genName = val;          
                genData += `<option value="${key}" ${selected}>${val} `;
            }
            tmpName = `${eng_name1 || ''}${eng_name2 || ''}`;
            chkPassPort = aPass[minor_num] == '1' ? 'O' : '';
            toHTML += paxDataPush(minor,countryData,genData,kor_name,eng_name1,eng_name2,passport,expire,birthdays,birthdays2,bTicket[tmpName],chkPassPort);
            minor ++;
        }
        if (!genData) {
            for (const [key, val] of Object.entries(arrGender)) {
                if (key === sex) genName = val;          
                genData += `<option value="${key}" >${val} `;
            }
        }
        if (!countryData) {
            arrCountryCode.forEach(val => { 
                const tmp = val.split('/');
                countryData += `<option value="${tmp[1]}" >${tmp[2]}`;
            });
        }
        while (minor <= members) {
            toHTML += paxDataPush(minor,countryData,genData);
            minor ++;
        }

        let paxData = `
            <div class='schedule pdw20'>
                <form name="frmPax" id="frmPax" method="post">
                <input type="hidden" name="order_num" value="${order_num}">
                <input type="hidden" name="mode"      value="paxdata">
                <div class='border regis-tle-box shadow-sm'>
                    <p class="pl-3 pt-2 sub-tle hhm50">고객명단 ⓑ 
                        <span style='float: ;'>
                            <span  name='viewButton' class='btn-yellow-sm mt-1' id='viewButton' onClick="togglePax()" >${nameInput === '' ? '보기' : '닫기' }</span>
                            <span type='button' class='btn-yellow-sm mt-1 btn_blue' onClick="return apisInputReq('2')" >여권정보입력요청</span>
                            <span class='btn_basic btn_purple' onClick="passView('${order_num}')" class='btn_bg_gray'>여권보기</span>
                        </span>
                        <span   class='fr btn-yellow-sm mt-1 cursor' onClick="savePassenger()" value='명단저장'>명단저장</span>&nbsp;
                        <span   class='fr btn-gray-sm   mt-1' onClick="return copyPax('${order_num}')"> 명단 복사</span>&nbsp;
                        <span   class='fr btn-yellow-sm mt-1 btn_blue' onClick="excelPax('down')" value='엑셀다운'>엑셀다운</span>&nbsp;
                        <span   class='fr btn-yellow-sm mt-1 btn_blue' onClick="excelPax('up')" value='엑셀업로드'>엑셀업로드양식</span>&nbsp;
                        <div style='position:relative;top:0;left:0;z-index:9999'>
                            <div style='position:absolute;top:0px;right:7px;width:400px;border:1px solid #333;background-color:#ffffff;display:none' ID="paxDataArea">
                                <textarea  class="wh400 hh100" id="paxDataCopy" class="paxDataCopy" value="">${paxDataCopy}</textarea>
                            </div>
                        </div>
                    </p>
                    <table class="table regis-hotel-xs whp100" style='display:' id="paxArea">
                        <thead>    
                        <tr style="width:100%">
                            <td class="regis-hotel-td4 border-rt-1 hh40">No</td>
                            <td class="regis-hotel-td4 border-rt-1 wh100">한글이름</td>
                            <td class="regis-hotel-td4 border-rt-1 wh120">여권상 성 (영문)</td>
                            <td class="regis-hotel-td4 border-rt-1 wh150">여권상 이름 (영문)</td>
                            <td class="regis-hotel-td4 border-rt-1">국적</td>
                            <td class="regis-hotel-td4 border-rt-1">여권번호</td>
                            <td class="regis-hotel-td4 border-rt-1">유효기간</td>
                            <td class="regis-hotel-td4 border-rt-1">성별</td>
                            <td class="regis-hotel-td4 border-rt-1">생일</td>
                            <td class="regis-hotel-td4 border-rt-1">티켓</td>
                            <td class="regis-hotel-td4 border-rt-1 title="여권 정보를 자동으로 입력하여 주는 기능입니다. 각 승객의 사진이나 여권을 준비후에 정보를  전송하시면 각 항목을 자동입력합니다.">OAAS</td>
                            <td class="regis-hotel-td4 border-rt-1">사본</td>
                        </tr>
                        </thead>
                        <tbody>
                            ${toHTML}
                        </tbody>
                    </table>
                </div>
                </form>
            </div>
        `;

        let confirmButton = '';
        sqlText = "select confirm_date from orderSheet_confirm where order_num = @order_num ";
        sqlResult = await pool.request().input('order_num',sql.NVarChar,order_num).query(sqlText);
        const confirm_date = sqlResult.recordset?.[0]?.confirm_date;
        if (!confirm_date) {
            confirmButton = `<span class='btn_basic btn_blue' onClick="return confirmSend('${order_num}')">여행 계약서 발송</span>`;
        } else {
            confirmButton = `<span class='btn_basic btn_yellow'>${deps.cutDateTime($confirm_date)}>계약서 확인</span>`;
        }
        let estimateSendHTML = '';
        let estimateCopyHTML = '';
        let addOptBtn        = '';
        let productList      = '';
        let link2 = link3    = '';
        let inPrice          = 0;
        let supPrice         = 0;
        let salePrice        = 0;
        const addOrderRegButton = `
            <span style='float: right;'>
                <span class='btn-outline-gray mt-1'				type='button' value='원가 계산기' onClick="return costUpdate()">원가 계산기</span>&nbsp;
                ${estimateSendHTML}
                <span type='button' class='btn-yellow-sm mt-1 btn_blue' onClick="menuClick('1','','','')" value=''>견적서 생성</span>&nbsp;
                ${estimateCopyHTML}
                <span type='button' class='btn-yellow-sm mt-1' onClick="addOption('${order_num}')" value=''>여행상품 추가</span>
                ${addOptBtn}
            </span>`;
        let addField = `
            , a.rate , a.currency ,a.supply_price , a.supply_chd, a.supply_inf , a.input_price, a.input_chd  , a.input_inf, a.sale_price , a.sale_chd , a.sale_inf
            , a.start_day , a.terms , a.room_count
            , b.tourName
        `;
        
        sqlText = `select a.minor_num, a.tourNumber , a.adult_member , a.child_member , a.infant_member  , c.roomType ${addField} from orderSheet_minor as a 
                    left outer join Products as b on a.tourNumber = b.tourNumber
                    left outer join Products_option as c on a.tourNumber = c.tourNumber and a.option_code = c.minor_num 
                    left outer join Products_option_price as f on a.tourNumber = f.tourNumber and a.option_code = f.minor_num and a.start_day = f.sale_date
                    left outer join orderSheet_inv as g on a.order_num = g.order_num and a.minor_num = g.link_minor
                    left outer join site as s on b.site_code = s.site_code and a.minor_num = '1'
                    where a.order_num = @order_num  order by a.minor_num asc
            `;
        sqlResult = await pool.request().input('order_num',sql.NVarChar,order_num).query(sqlText);
        

        for (const row of sqlResult.recordset) {
            let {   
                minor_num ,  tourNumber , tourName , roomType , start_day , terms , room_count
                , adult_member , child_member , infant_member ,currency , rate
                , sale_price , sale_chd , sale_inf , supply_price , supply_chd, supply_inf , input_price , input_chd  , input_inf
            } = row;
            const mem = `
                성인 : ${adult_member}<br>
                소아 : ${child_member}<br>
                유아 : ${infant_member}
            `;
            const inputData = `
                성인 : ${deps.numberFormat(input_price)}<br>
                소아 : ${deps.numberFormat(input_chd)}<br>
                유아 : ${deps.numberFormat(input_inf)}
            `;
            const supplyData = `
                성인 : ${deps.numberFormat(supply_price || '0')}<br>
                소아 : ${deps.numberFormat(supply_chd   || '0')}<br>
                유아 : ${deps.numberFormat(supply_inf   || '0')}
            `;
            const saleData = `
                성인 : ${deps.numberFormat(sale_price || '0')}<br>
                소아 : ${deps.numberFormat(sale_chd   || '0')}<br>
                유아 : ${deps.numberFormat(sale_inf   || '0')}
            `;
            inPrice     += (adult_member * input_price)  + (child_member + input_chd)  + (infant_member * input_inf);
            supPrice    += (adult_member * supply_price) + (child_member + supply_chd) + (infant_member * input_inf);
            salePrice   += (adult_member * sale_price)   + (child_member + sale_chd)   + (infant_member * sale_inf);
            const link = `<span type='button' class='btn-yellow-sm mt-1 btn_blue' onClick="menuClick('3','','','','${minor_num}')">생성</span>`;
            const func = `<span class='btn_slim btn_red' onClick="return optionDel('${order_num}','${minor_num}')"><i class='fas fa-trash-alt'></i> 삭제</span><br>`;
            productList += `
                    <tr>

                        <td class='regis-hotel-td3 border-rt-1'  style='height: 150px;' $subPayButton>${minor_num}. ${tourNumber} </td>
                        <td  class='regis-hotel-td3 border-rt-1'  >${tourName} <br> ${roomType}  </td>
                        <td class='regis-hotel-td3 border-rt-1'  >${deps.cutDate(start_day)} <br>기간:${terms}<br> 수량:${room_count} </td>
                        <td class='regis-hotel-td3 border-rt-1'  >${mem} </td>
                        <td class='regis-hotel-td3 border-rt-1'  >${inputData}</td>
                        <td class='regis-hotel-td3 border-rt-1'  >${supplyData}</td>
                        <td class='regis-hotel-td3 border-rt-1'  >${saleData} </td>
                        <td class='regis-hotel-td3 border-rt-1'  >${currency || ''}<br>${rate || ''}</td>
                        <td class='regis-hotel-td3 border-rt-1'  >${link} ${link2} ${link3}</td>
                        <td class='regis-hotel-td3 border-rt-1'  >${func}</td>
                    </tr>
                `;
        }
        let productData = `
            <div class='schedule pdw20'>
                <div class='border regis-tle-box shadow-sm'>
                    <p class="pl-3 pt-2 sub-tle hhm50">상품내역 ⓒ  
                    ${confirmButton}
                    ${addOrderRegButton}
                    </p>
                    <table class="table regis-hotel-xs" >
                        <tr style="">
                            <td class="regis-hotel-td4 border-rt-1 wh80" style="height:40px;" >상품코드</td>
                            <td class="regis-hotel-td4 border-rt-1 ">상품명(옵션명)</td>
                            <td class="regis-hotel-td4 border-rt-1 ">이용일 (숙박일)</td>
                            <td class="regis-hotel-td4 border-rt-1 wh120">인원수</td>
                            <td class="regis-hotel-td4 border-rt-1 wh100">원가</td>
                            <td class="regis-hotel-td4 border-rt-1 wh100">공급가</td>
                            <td class="regis-hotel-td4 border-rt-1 wh100">판매가</td>
                            <td class="regis-hotel-td4 border-rt-1 wh100">판매환율</td>
                            <td class="regis-hotel-td4 border-rt-1 wh100">인보이스/견적서</td>
                            <td class="regis-hotel-td4 border-rt-1 wh100">기능</td>
                        </tr>
                        ${productList}
                        <tr id="insert_area" >
                            <td class='regis-hotel-td4 border-rt-1'  style='height:40px;' >합계</td>
                            <td class='regis-hotel-td3 border-rt-1'  ></td>
                            <td class='regis-hotel-td3 border-rt-1' >
                                <span type='button' ID="DateAction" style='display:none' class='btn-yellow-sm mt-1' onClick="return dateChange('${order_num}')">날짜변경</span>
                            </td>
                            <td class='regis-hotel-td3 border-rt-1'></td>
                            <td class='regis-hotel-td3 border-rt-1'>${deps.numberFormat(inPrice)}</td>
                            <td class='regis-hotel-td3 border-rt-1'>${deps.numberFormat(supPrice)}</td>
                            <td class='regis-hotel-td3 border-rt-1'>${deps.numberFormat(salePrice)}</td>
                            <td class='regis-hotel-td3 border-rt-1'></td>
                        </tr>
                    </table>
                </div>
            </div>
        `;

        sqlText = `select top 1 * from orderSheet_content as a where order_num = @order_num `;
        sqlResult = await pool.request().input('order_num',sql.NVarChar,order_num).query(sqlText);
        const contain      = sqlResult.recordset?.[0]?.contain;
        const uncontain    = sqlResult.recordset?.[0]?.uncontain;
        const notice       = sqlResult.recordset?.[0]?.notice;
        const cancelRefund = sqlResult.recordset?.[0]?.cancelRefund;
        let containData = `
            <div class='schedule pdw20'>
                <form name="frmContain" id="frmContain" method="post">
                <input type="hidden" name="order_num" value="${order_num}">
                <input type="hidden" name="mode"      value="contain">
                <div class='border regis-tle-box shadow-sm'>
                    <p class="pl-3 pt-2 sub-tle hhm50">포함/불포함 사항
                        <span style='float: right;'><span class='btn-yellow-sm mt-1 cursor' onClick="saveContain()">포함사항저장</span></span>
                    </p>
                    <table class="table regis-hotel-xs" >
                        <tbody>
                            <tr style="">
                                <td class="regis-hotel-td4 border-rt-1 whp25" style="height:40px;" >포함</td>
                                <td class="regis-hotel-td4 border-rt-1 whp25">불포함</td>
                                <td class="regis-hotel-td4 border-rt-1 whp25">유의사항</td>
                                <td class="regis-hotel-td4 border-rt-1 whp25">취소및환불</td>
                            </tr>
                            <tr>
                                <td class='regis-hotel-td3 border-rt-1 vat'><textarea name='contain'      id='contain'       type='text' class='form-control' onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${contain}</textarea></td>
                                <td class='regis-hotel-td3 border-rt-1 vat '><textarea name='uncontain'    id='uncontain'     type='text' class='form-control' onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${uncontain}</textarea></td>
                                <td class='regis-hotel-td3 border-rt-1 vat'><textarea name='notice'       id='notice'        type='text' class='form-control' onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${notice}</textarea></td>
                                <td class='regis-hotel-td3 border-rt-1 vat'><textarea name='cancelRefund' id='cancelRefund'  type='text' class='form-control' onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${cancelRefund}</textarea></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                </form>
            </div>
        `;

        let moneyReq = '';
        if (!mainRow.settleFinish) {
            moneyReq = `
                <span style='float: right;'>
                    <span type='button' class='btn-yellow-sm mt-1'  onClick="return askInputBank('y')" >계좌입금요청</span>
                    <span type='button' class='btn-yellow-sm mt-1'  onClick="return addPayCheck('total')">전체입금요청</span>
                    <span type='button' class='btn-yellow-sm mt-1'  onClick="return addPayCheck('add')" >추가입금요청</span>
                </span>
            `;
        }

        sqlText = `
            select a.minor_num, a.settle_days, a.amount, a.trno , a.up_date , a.void as void2 , a.resultcode , a.auth_number,b.visual_number,b.input_name 
            , (select amount from money_act_minor where ticket_num = b.ticket_num and sub_items = 'PGC') as pgAmt 
            from orderSheet_payment as a left outer join money_act as b on a.ticket_num = b.ticket_num 
            where a.order_num = @order_num and a.void is null and b.void is null order by a.minor_num 
        `;
        sqlResult = await pool.request().input('order_num',sql.NVarChar,order_num).query(sqlText);
        let name    = '';
        let settle  = '';
        let inHTML  = '';
        let sumData = [];
        sumData.SUM ??= 0;
        for (const row of sqlResult.recordset) {
            let { settle_days , void2 , trno , pgAmt , up_date , resultcode , auth_number , visual_number , minor_num ,amount } = row;
            name = "KSNET 승인";
            if ( void2 !== "C") {
                settle = `<input name='settle_day' id='settle_day' type='text' style='width:100px' class='d-inline form-control form-control-sm' onkeyup='return DateAutoCheck(this)' ${settleRead} onChange="dataChange1('${order_num}','settle_days','${minor_num}',this.value)" value='${deps.cutDate(settle_days)}'>`;
                sumData.SUM += Number(amount);
                inHTML += `
                    <tr>
                        <td class='regis-hotel-td3 border-rt-1'  >${name} </td>
                        <td class='regis-hotel-td3 border-rt-1'  >${deps.cutDateTime(up_date,'S')}</td>
                        <td class='regis-hotel-td3 border-rt-1'  >${trno}</td>
                        <td class='regis-hotel-td3 border-rt-1'  >${auth_number}</td>
                        <td class='regis-hotel-td3 border-rt-1'  $partLink >${amount}</td>
                        <td class='regis-hotel-td3'  >${settle}</td>
                    </tr>
                `;
                if (pgAmt != "") {
                    inHTML += `
                        <tr >
                            <td class='regis-hotel-td3 border-rt-1 backEFEFEF cored'  style='height:40px;' >카드수수료 </td>
                            <td class='regis-hotel-td3 border-rt-1 backEFEFEF'  >${deps.cutDateTime(up_date,'S')}</td>
                            <td class='regis-hotel-td3 border-rt-1 backEFEFEF'  >${trno}</td>
                            <td class='regis-hotel-td3 border-rt-1 backEFEFEF'  ></td>
                            <td class='regis-hotel-td3 border-rt-1 backEFEFEF cored'  >${deps.numberFormat(pgAmt)}</td>
                            <td class='regis-hotel-td3 backEFEFEF'></td>
                        </tr>
                    `;
                }
            }
        }
        
        let inputData  = `
            <div class='schedule pdw20'>
                <div class='border regis-tle-box shadow-sm'>
                    <p class="pl-3 pt-2 sub-tle hhm50">입금내역 
                        ${moneyReq}
                    </p>
                    <table class="table regis-hotel-xs" >
                        <tbody>
                            <tr style="">
                                <td class="regis-hotel-td4 border-rt-1 hh40" >결제방법</td>
                                <td class="regis-hotel-td4 border-rt-1" >거래날짜</td>
                                <td class="regis-hotel-td4 border-rt-1" >거래번호</td>
                                <td class="regis-hotel-td4 border-rt-1" >승인번호</td>
                                <td class="regis-hotel-td4 border-rt-1" >거래금액</td>
                                <td class="regis-hotel-td4" >정산예정일</td>
                            </tr>
                            ${inHTML}
                            <tr style="">
                                <td class="regis-hotel-td4 border-rt-1 hh40" >합계</td>
                                <td class="regis-hotel-td4 border-rt-1" ></td>
                                <td class="regis-hotel-td4 border-rt-1" ></td>
                                <td class="regis-hotel-td4 border-rt-1" ></td>
                                <td class="regis-hotel-td4 border-rt-1" >${sumData.SUM || ''}</td>
                                <td class="regis-hotel-td4" ></td>
                            </tr>
                            
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        if (b2bSiteCode) addQry = ` and siteOwner = '${b2bSiteCode}' `;
        else addQry = '';
        sqlText = `
            select a.*,b.account ,c.settleIgnore , d.site_name from orderSheet_outsite as a 
            left outer join money_act as b on a.ticket_num = b.ticket_num 
            left outer join BillAccount as c on b.account = c.AccountCode 
            left outer join site as d on a.site_code = d.site_code 
            where a.order_num = @order_num ${addQry} order by a.minor_num `;
        sqlResult = await pool.request().input('order_num',sql.NVarChar,order_num).query(sqlText);

        let outData  = '';
        let outSum   = 0;
        let read     = '';
        let outCount = 0;
        for (const row of sqlResult.recordset) {
            let { names ,minor_num , quantity , unit_price , total_price , auth_number , out_date , etc , site_name , settleIgnore , site_code , ticket_num } = row;
            
            if (!ticket_num) {
                add = `<span class='btn_slim btn_blue' onClick="return outSiteSave('${minor_num}','order_num')">수정</span> <span class='btn_slim btn_blue' onClick="return outSettleWrite('${order_num}','${minor_num}','order_num')">전표작성</span> <span class='btn_slim btn_red' onClick="return outSiteDel('${minor_num}')">Del</span>`;
                read = '';
            } else {
                add = `<span class='btn_basic btn_gray' onClick="modMoney('${ticket_num}','2')">${ticket_num}</span>`;
                read = 'readonly';
            }
            outSum += Number(total_price);
            if (settleIgnore === "N") {
                outData += `
                    <tr >
                        <td class='regis-hotel-td3 border-rt-1 hh40'  >${minor_num}</td>
                        <td class='regis-hotel-td3 border-rt-1 al'><font color='red'>(정산무시)${names}</font></td>
                        <td class='regis-hotel-td3 border-rt-1'   >${quantity}</td>
                        <td class='regis-hotel-td3 border-rt-1 ar'>${deps.numberFormat(unit_price)}</td>
                        <td class='regis-hotel-td3 border-rt-1 ar'>${deps.numberFormat(total_price)}</td>
                        <td class='regis-hotel-td3 border-rt-1 '  >${auth_number}</td>
                        <td class='regis-hotel-td3 border-rt-1 '  >${out_date}</td>
                        <td class='regis-hotel-td3 border-rt-1'   >${etc}</td>
                        <td class='regis-hotel-td3 border-rt-1'   >${site_name || ''}</td>
                        <td class='regis-hotel-td3 border-rt-1'   id='outButton_${minor_num}'>
                            ${add}
                        </td>
                    </tr>
                `;
            } else {
                outData += `
                    <tr >
                        <td class='regis-hotel-td3 border-rt-1'    ><input type='text' name='outNum_${minor_num}' ${read} id='outNum_${minor_num}' class='form-control form-control-sm d-inline ac' value='${minor_num}'></td>
                        <td class='regis-hotel-td3 border-rt-1'    ><input type='text' name='outPro_${minor_num}' ${read} id='outPro_${minor_num}' class='form-control form-control-sm d-inline'    value='${names}'></td>
                        <td class='regis-hotel-td3 border-rt-1'    ><input type='text' name='outQun_${minor_num}' ${read} id='outQun_${minor_num}' class='form-control form-control-sm d-inline ac' onChange="return addPriceChange('${minor_num}')" value='${quantity}'></td>
                        <td class='regis-hotel-td3 border-rt-1'    ><input type='text' name='outUni_${minor_num}' ${read} id='outUni_${minor_num}' class='form-control form-control-sm d-inline ar' onChange="return addPriceChange('${minor_num}')" value='${deps.numberFormat(unit_price)}'></td>
                        <td class='regis-hotel-td3 border-rt-1'    ><input type='text' name='outPri_${minor_num}' ${read} id='outPri_${minor_num}' class='form-control form-control-sm d-inline ar' value='${deps.numberFormat(total_price)}'></td>
                        <td class='regis-hotel-td3 border-rt-1'    ><input type='text' name='outAuh_${minor_num}' ${read} id='outAuh_${minor_num}' class='form-control form-control-sm d-inline ac' value='${auth_number}'></td>
                        <td class='regis-hotel-td3 border-rt-1'    ><input type='text' name='outDat_${minor_num}' ${read} id='outDat_${minor_num}' class='form-control form-control-sm d-inline ac' value='${out_date}'></td>
                        <td class='regis-hotel-td3 border-rt-1'    ><input type='text' name='outNot_${minor_num}' ${read} id='outNot_${minor_num}' class='form-control form-control-sm d-inline'    value='${etc}'></td>
                        <td class='regis-hotel-td3 border-rt-1 al' >
                            <input type='text' name='outSit_${minor_num}'  ${read}    id='outSit_${minor_num}'  class='form-control form-control-sm d-inline wh80'    value='${site_code}' onChange="siteCheck2(this.value,'${minor_num}')">
                            <input type='text' name='outSit2_${minor_num}' readonly id='outSit2_${minor_num}' class='form-control form-control-sm d-inline wh100'   value='${site_name || ''}' >
                            <div style='position:relative'>
                                <div style='position:absolute;top:0;left:0px;z-index:10;' ID='SiteSearch${minor_num}'></div>
                            </div>
                        </td>
                        <td class='regis-hotel-td3 border-rt-1'    id='outButton_${minor_num}'>
                            ${add}
                        </td>
                    </tr>
                `;
            }
            outCount ++;
        }

        const outputReq = `<span type='button' class='fr btn-yellow-sm mt-1'  onClick="return addOutSettle('${order_num}')" >추가출금등록</span>`;
        let outputData = `
            <div class='schedule pdw20'>
                <form name="frmOut" id="frmOut" method="post">
                <input type='hidden' name='outCount'  value='${outCount}'>
                <input type='hidden' name='order_num' value='${order_num}'>
                <input type='hidden' name='current'   value='1'>
                <input type='hidden' name='mode'      value='outSettle'>
                <div class='border regis-tle-box shadow-sm'>
                    <p class="pl-3 pt-2 sub-tle hhm50">출금관리 
                        ${outputReq}
                    </p>
                    <table class="table regis-hotel-xs" ID="OutSiteData" style="margin-bottom:0px !important;">
                        <tr style="">
                            <td class="regis-hotel-td4 border-rt-1 wh50 hh40" >번호</td>
                            <td class="regis-hotel-td4 border-rt-1" >품목 및 규격</td>
                            <td class="regis-hotel-td4 border-rt-1 wh50" >수량</td>
                            <td class="regis-hotel-td4 border-rt-1 wh120" >단가</td>
                            <td class="regis-hotel-td4 border-rt-1 wh120" >합계</td>
                            <td class="regis-hotel-td4 border-rt-1 wh120" >승인번호</td>
                            <td class="regis-hotel-td4 border-rt-1 wh100" >출금일</td>
                            <td class="regis-hotel-td4 border-rt-1 wh200" >비고</td>
                            <td class="regis-hotel-td4 border-rt-1 wh200" >거래처</td>
                            <td class="regis-hotel-td4 wh150" >지출전표</td>
                        </tr>
                        ${outData}
                        
                    </table>
                    <table class="table regis-hotel-xs" ID="" >
                        <tr style="">
                            <td class="regis-hotel-td4 border-rt-1 wh50 hh40" ></td>
                            <td class="regis-hotel-td4 border-rt-1" >합계</td>
                            <td class="regis-hotel-td4 border-rt-1 wh50" ></td>
                            <td class="regis-hotel-td4 border-rt-1 wh120" ></td>
                            <td class="regis-hotel-td4 border-rt-1 wh120" ID="TotalSum">${deps.numberFormat(outSum)}</td>
                            <td class="regis-hotel-td4 border-rt-1 wh120" ></td>
                            <td class="regis-hotel-td4 border-rt-1 wh100" ></td>
                            <td class="regis-hotel-td4 border-rt-1 wh200" ></td>
                            <td class="regis-hotel-td4 border-rt-1 wh200" ></td>
                            <td class="regis-hotel-td4 wh150" ></td>
                        </tr>
                    </table>
                </div>
                </form>
            </div>
        `;
        if (b2bSiteCode != "") addQry = " and (out_ok != 'N' or out_ok is null ) ";
        sqlText = `select a.* from dat_table as a where db_name = @order_num ${addQry} order by minor_num desc`;
        sqlResult = await pool.request().input('order_num',sql.NVarChar,order_num).query(sqlText);
        let memoList  = '';
        let space     = '';
        let readCheck = '';
        for (const row of sqlResult.recordset) {
            let {username , out_ok , content , up_date , minor_num , sup_read_time , sale_read_time , sup_site_code , sale_site_code} = row;
            if (out_ok === "A") {
                space = `<font color='red'><댓글></font>`;
                space1  = "pal30";
                out     = "";
            $out = "";
            } else {
                out   = `<a href='javascript://' onClick="return answer('${content} \\n------------------------------------\\n ','${minor_num}')" class='btn_green'>댓글</a>`;
                space = space1 = "";
            }
            if (b2bSiteCode === sup_site_code) {
                if (!sup_read_time) readCheck = `<span class='btn_slim btn_yellow' onClick="memoClear('${order_num}','${minor_num}','sup_read_time')">메모확인완료</span>`;
                else readCheck = `<span class='btn_slim btn_gray nowrap'>Read:${deps.cutDateTime(sup_read_time,"S")}</span>`;
            }
        
            if (b2bSiteCode === sale_site_code) {
                if (!sale_read_time) readCheck = `<span class='btn_slim btn_yellow' onClick="memoClear('${order_num}','${minor_num}','sale_read_time')">메모확인완료</span>`;
                else readCheck = `<span class='btn_slim btn_gray nowrap'>Read:${deps.cutDateTime(sale_read_time,"S")}</span>`;
            }

            if(b2bMASTER === "Y") delHTML = `<td align=center><a class='making_delete' href='javascript://' onClick="return del('${order_num}','${minor_num}','${up_date}')"><i class='fas fa-trash-alt'></i></a></td>`;
            else delHTML = "<td></td>";

            memoList += `
                <tr class='uFilter filter_${username}'>
                    <td align=center height=20>${username}</td>
                    <td align=center>${out || ''}</td>
                    <td class='$space1 al' style='padding:0 5 0 10' colspan='2'>${space}
                    
                        <div id='CONA_${minor_num}' $link >${content} </div>
                        <div id='CONB_${minor_num}' style='display:none'>
                            <textarea name='Con_$minor_num' class='whp100'  id='Con_${minor_num}' onFocus="boxCheck(this.name)" onkeyup="boxCheck(this.name)">".str_replace("<br>","\n",${content})."</textarea>
                            <br>
                            <span class='btn_slim btn_blue' onClick="return datModify('${minor_num}')">수정</span>
                        </div>
                    </td>
                    <td align=center>${readCheck}</td>
                    <td align=center>${deps.cutDateTime(up_date,"S")}</td>
                    ${delHTML}
                </tr>
            `;
        }
        let memoData = `
            <div class='schedule pdw20'>
                <form name="frmDat" id="frmDat" method="post">
                <input type='hidden' name='outCount'  value='${outCount}'>
                <input type='hidden' name='db_name'   value='${order_num}'>
                
                <div class='border regis-tle-box shadow-sm'>
                    <p class="pl-3 pt-2 sub-tle hhm50">메모
                    </p>
                    <table class="table">
                        <tr align="center" style="background-color:#f9f9f9;">
                            <td width='110'>
                                <select onChange="filterChange(this.value)"><?=$uHTML?></SELECT></td>
                            <td width='110'>댓글</td>
                            <td colspan="2">내 용</td>
                            <td width='140'></td>
                            <td width='140'>작성일시</td>
                            <td width='50'>
                                삭제
                            </td>
                        </tr>
                        ${memoList}
                    </table>
                </div>
                </form>
            </div>
        `;

        res.json({ success:'ok', menu:menuData , base:baseData , paxs: paxData , product:productData , contains: containData , inputs:inputData , outputs:outputData , memos: memoData });
    } catch (err) {
        console.error("order_detail 오류:", err);
        res.status(500).send("서버 오류");
    }
  } else if (mode === "Confirm"){
    const data = await orderBaseData (pool,mainRow);
    const pos = '2';
    const listData = await orderListData (pool,mainRow,pos);
    const menuData = `
        <div class='schedule pdw20'>
            <div class='border regis-tle-box shadow-sm'>
                ${data}
                <div style='padding:20px 0;'>
                    <span class="btn_basic btn_yellow "  onCLick="menuClick('${pos}','','','','${mode}')"><i class='fas fa-edit'></i>&nbsp;신규작성</span>
                </div>
                <table class="table">
                    <tr align=center>
						<td width=10>No.</td>
						<td class="">구분</td>
						<td>수신처</td>
						<td>경로</td>
						<td>등록일</td>
						<td>등록자</td>
						<td>미리보기</td>
						<td>삭제</td>
					</tr>
                    ${listData}
                </table>
            </div>
        </div>
    `;
    res.json ({success:'ok',datas:menuData});
  } else if (mode === "Inv"){
    const data = await orderBaseData (pool,mainRow);
    const pos = '3';
    const listData = await orderListData (pool,mainRow,pos);
    const menuData = `
        <div class='schedule pdw20'>
            <div class='border regis-tle-box shadow-sm'>
                ${data}
                <div style='padding:20px 0;'>
                    <span class="btn_basic btn_yellow "  onCLick="menuClick('${pos}','','','')"><i class='fas fa-edit'></i>&nbsp;신규작성</span>
                </div>
                <table class="table">
                    <tr align=center>
						<td width=10>No.</td>
						<td class="">구분</td>
						<td>수신처</td>
						<td>경로</td>
						<td>등록일</td>
						<td>등록자</td>
						<td>미리보기</td>
						<td>삭제</td>
					</tr>
                    ${listData}
                </table>
            </div>
        </div>
    `;
    res.json ({success:'ok',datas:menuData});
  } else if (mode === "Att"){
    const data = await orderBaseData (pool,mainRow);
    const pos = '5';
    const listData = await orderListData (pool,mainRow,pos);
    const menuData = `
        <div class='schedule pdw20'>
            <div class='border regis-tle-box shadow-sm'>
                ${data}
                <div style='padding:20px 0;'>
                    <span class="btn_basic btn_yellow "  onCLick="menuClick('${pos}','','','')"><i class='fas fa-edit'></i>&nbsp;신규작성</span>
                </div>
                <table class="table">
                    <tr align=center>
						<td width=10>No.</td>
						<td class="">구분</td>
						<td>수신처</td>
						<td>경로</td>
						<td>등록일</td>
						<td>등록자</td>
						<td>미리보기</td>
						<td>삭제</td>
					</tr>
                    ${listData}
                </table>
            </div>
        </div>
    `;
    res.json ({success:'ok',datas:menuData});
  } else if (mode === "Voucher"){
    const data = await orderBaseData (pool,mainRow);
    const pos = 'V';
    const listData = await orderListData (pool,mainRow,pos);
    const menuData = `
        <div class='schedule pdw20'>
            <div class='border regis-tle-box shadow-sm'>
                ${data}
                <div style='padding:20px 0;'>
                    <span class="btn_basic btn_yellow "  onCLick="menuClick('${pos}','','','')"><i class='fas fa-edit'></i>&nbsp;신규작성</span>
                </div>
                <table class="table">
                    <tr align=center>
						<td width=10>No.</td>
						<td class="">구분</td>
						<td>수신처</td>
						<td>경로</td>
						<td>등록일</td>
						<td>등록자</td>
						<td>미리보기</td>
						<td>삭제</td>
					</tr>
                    ${listData}
                </table>
            </div>
        </div>
    `;
    res.json ({success:'ok',datas:menuData});
  }

};