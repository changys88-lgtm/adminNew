const deps = require('../../src/common/dependencies');
const { uidNext } = require('../../src/utils/idxFunction');
const { minorNext } = require('../../src/utils/database');

module.exports = async (req, res) => {
    const data        = req.body;
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const mode        = data.mode.trim();;    
    const pool = await deps.getPool();
    let msg        = '';
    let sqlText    = '';
    let result     = '';
    let rsCount    = '';
    let uid        = '';
    let titleData  = '';
    let htmlData   = '';
    let passSql    = '';
    const table    = 'site';
    const sql      = deps.sql;
    const aes128Encrypt = deps.aes128Encrypt;
    const aes128Decrypt = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;

    if (mode === "input") {
        sqlText = `select * from site where uid = @code `;
        result  = await pool.request().input('code',sql.Int , uid).query(sqlText);
        row     = result.recordset?.[0];
        if (row.tel_number.length   > 20)   row.tel_number     = aes128Decrypt(getNow().aviaSecurityKey,row.tel_number);
        if (row.fax_number.length   > 20)   row.fax_number     = aes128Decrypt(getNow().aviaSecurityKey,row.fax_number);
        if (row.manager_tel.length  > 20)   row.manager_tel    = aes128Decrypt(getNow().aviaSecurityKey,row.manager_tel);
        if (row.manager_tel2.length > 20)   row.manager_tel2   = aes128Decrypt(getNow().aviaSecurityKey,row.manager_tel2);
        buttonName = '수정';
    } else {
        uid = data.uid;
    }
    if (!msg) {
        if (mode === "input") {
            sqlText = `insert into ${table} (uid,site_code) values (@uid, @site_code)`;
            await pool.request()
                    .input('uid', sql.Int , uid)
                    .input('site_code',sql.NVarChar , data.site_code)
                    .query(sqlText);
        }

        if (mode === 'input' || mode === 'modify') {
            if (data.tel_number)   data.tel_number   = aes128Encrypt(aviaSecurityKey, deps.StrClear(data.tel_number));
            if (data.fax_number)   data.fax_number   = aes128Encrypt(aviaSecurityKey, deps.StrClear(data.fax_number));
            if (data.manager_tel)  data.manager_tel  = aes128Encrypt(aviaSecurityKey, deps.StrClear(data.manager_tel));
            if (data.manager_tel2) data.manager_tel2 = aes128Encrypt(aviaSecurityKey, deps.StrClear(data.manager_tel2));
          
            if (b2bMASTER === "Y") {
                passSql = ` GAL_UAPI		= '${data.GAL_UAPI}' , 
                            GAL_PASSWD		= '${data.GAL_PASSWD}' , 
                            GAL_BRANCH		= '${data.GAL_BRANCH}' , 
                            GAL_PCC		    = '${data.GAL_PCC}' , 
                            BSP_USE		    = '${data.BSP_USE || ''}' , 
                            BSP_QUEUE		= '${data.BSP_QUEUE || ''}' , 
                            iatanumber		= '${data.iatanumber}' , 
                            bmsUse			= '${data.bmsUse}' , 
                            invoiceUse		= '${data.invoiceUse}' , 
                            cardAutoUse	    = '${data.cardAutoUse}' , 
                            interV2Use		= '${data.interV2Use || ''}' , 

                            ABA_FROM		= '${data.ABA_FROM}' , 
                            ABA_PASSWD		= '${data.ABA_PASSWD}' , 
                            ABA_USER		= '${data.ABA_USER}' , 
                            ABA_PCC		    = '${data.ABA_PCC}' , 
                            SEL_CITYCODE	= '${data.SEL_CITYCODE}' , 
                            SEL_WSUSER		= '${data.SEL_WSUSER}' , 
                            grade			= '${data.grade}', 
                            TempUse		    = '${data.TempUse || ''}', 
                            TempDomain		= '${data.TempDomain}', 
                            TempDomain1	    = '${data.TempDomain1}', 
                            TempDomain2	    = '${data.TempDomain2}', 
                            TempDomain3	    = '${data.TempDomain3}', 
                            TempDomain4	    = '${data.TempDomain4 || ''}', 
                            TempSettleDate	= '${data.TempSettleDate}', 
                            TempSettleAmt	= '${data.TempSettleAmt}', 
                            memo		    = '${data.memo}', 
                            master_site     = '${data.master_site}', 
                            est_yesno       = '${data.est_yesno}' ,
                            pass_scan       = '${data.pass_scan}' ,
                            month_search    = '${data.month_search}' ,
                            comm_grade      = '${data.comm_grade}',
                            trans_bbs       = '${data.trans_bbs}' ,
                            daily_bbs       = '${data.daily_bbs}',
                            schedule_bbs    = '${data.schedule_bbs}' ,
                            BlockUse        = '${data.BlockUse}' ,
                            TicketNotUse    = '${data.TicketNotUse}',
                            DcNotUse	    = '${data.DcNotUse}',
                            reissueUse	    = '${data.reissueUse}',
                            mirror_site_code	= '${data.mirror_site_code}' ,
                            mirror_title	= '${data.mirror_title}' ,
                            codeShareSearch	= '${data.codeShareSearch}',
                            paxTel			= '${data.paxTel}',
			            `;
            }
            try {
                sqlText = `
                    update ${table} set 
                        ${passSql}
                        site_master			= '${data.site_master || ''}',
                        proChannel			= '${data.proChannel || ''}',
                        site_name			= '${data.site_name}',
                        president			= '${data.president}',
                        site_number			= '${data.site_number}',
                        tel_number			= '${data.tel_number}',
                        fax_number			= '${data.fax_number || ''}',
                        manager				= '${data.manager}',
                        manager_tel			= '${data.manager_tel}',
                        manager_tel2		= '${data.manager_tel2}',
                        address1			= '${data.address1}',
                        e_mail				= '${data.e_mail}',
                        site_business		= '${data.site_business || ''}',
                        site_category		= '${data.site_category || ''}',
                        home_page			= '${data.home_page}',
                        default_city		= '${data.default_city}',
                        account_number		= '${data.account_number}',
                        bank_name			= '${data.bank_name}',
                        bank				= '${data.bank}',
                    
                        barobill_id			= '${data.barobill_id}',
                        barobill_passwd		= '${data.barobill_passwd}',
                        barobill_bank		= '${data.barobill_bank}',
                    
                        modify_date			= '${deps.getNow().NOWSTIME}',
                        closing				= '${data.closing}',
                        tasf_inter			= '${data.tasf_inter}',
                        tasf_dome			= '${data.tasf_dome}',
                        tasf_hotel			= '${data.tasf_hotel}',
                        tasf_golf			= '${data.tasf_golf}',
                        estimateArea1		= '${data.estimateArea1 || ''}',
                        estimateArea2		= '${data.estimateArea2 || ''}',
                        estimateArea3		= '${data.estimateArea3 || ''}',
                        siteThema			= '${data.siteThema || ''}',
                        introductionCode	= '${data.introductionCode || ''}',
                        site_nation			= '${data.site_nation}',
                        openTime			= '${deps.StrClear(data.openTime)}',
                        closeTime			= '${deps.StrClear(data.closeTime)}'
                    where uid = @uid
                `;
                //console.log(sqlText);
                await pool.request().input('uid',sql.Int , uid).query(sqlText);
            } catch (error) {
                msg = error;
                console.log(msg);
            }
        } else if (mode === "delete") {
            try {
                sqlText = `delete from ${table} where uid = @uid `;
                await pool.request().input('uid',sql.Int , uid).query(sqlText);
            } catch (error) {
                msg = error;
            }
        } else if (mode === "Site"){
            let modes = '';
            let managerList = '';
            let buttonName = '입력';
            let manHTML    = '';
            if (uid) {
                sqlText = `select * from site where uid = @code `;
                result  = await pool.request().input('code',sql.Int , uid).query(sqlText);
                row     = result.recordset?.[0];
                if (row.tel_number.length   > 20)   row.tel_number     = aes128Decrypt(aviaSecurityKey,row.tel_number);
                if (row.fax_number.length   > 20)   row.fax_number     = aes128Decrypt(aviaSecurityKey,row.fax_number);
                if (row.manager_tel.length  > 20)   row.manager_tel    = aes128Decrypt(aviaSecurityKey,row.manager_tel);
                if (row.manager_tel2.length > 20)   row.manager_tel2   = aes128Decrypt(aviaSecurityKey,row.manager_tel2);
                buttonName = '수정';
                modes      = 'modify';

                sqlText = ` select man_id,manager,tel_number from site_manager where site_code = @site_code  `;
                result  = await pool.request().input('site_code',sql.NVarChar,row.site_code).query(sqlText);
                for (const put of result.recordset) {
                    let {man_id , manager , tel_number } = put;
                    if (tel_number.length > 20) tel_number = deps.telNumber(aes128Decrypt(aviaSecurityKey,tel_number));
                    if (b2bMASTER === "Y") {
                        mod = `<span class='btn_slim btn_yellow' onClick="return manModify('${row.site_code}','${man_id}',frmDetail.${man_id.replace('.','__')}.value)">변경</span>`;
                    } else {
                        mod = '';
                    }
                    manHTML += `
                    <tr>
                        <td>${man_id}</td>
                        <td class='wh150'>${manager}</td>
                        <td style='width:30px;overflow:hidden'><input type='text' $read1 value='' name='${man_id.replace('.','__')}' id='${man_id}' class='form-control form-control-sm' style='width:140px'></td>
                        <td>${mod}</td>
                        <td>${tel_number}</td>
                        <td><span class='btn_slim btn_red'  onClick="return manDel('${row.site_code}','${man_id}')">삭제</span></td>
                    </tr>
                    `;
                }

                managerList = `
                    <tr>
                        <th scope="row" class="regis-hotel-td1" >사용자ID</th>
                        <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input type=text class="form-control form-control-sm" name="new_id" value=""></td>
                        <th scope="row" class="regis-hotel-td1" >비밀번호</th>
                        <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input type="text" class="form-control form-control-sm" style='width:100px;' name="new_passwd" value=""></td>
                        <th scope="row" class="regis-hotel-td1" >사용자명</th>
                        <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan="3">
                            <input type="text" class="form-control form-control-sm" style='width:90px;' name="new_name" value="">
                            연락처</th>
                            <input type="text" class="form-control form-control-sm" style='width:100px;' name="new_tel" value="">
                            <span  class="btn_basic btn_yellow nowrap"  onCLick="return newUser()" >추가</span>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row" class="regis-hotel-td1" >사용자목록</th>
                        <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan="7">
                            <table width="100%">
                                <tr>
                                    <td>아이디</td>
                                    <td>사용자이름</td>
                                    <td>비번</td>
                                    <td>수정</td>
                                    <td>연락처</td>
                                    <td>삭제</td>
                                </tr>
                                ${manHTML}
                            </table>
                        </th>
                    </tr>
                `;
                
            } else {
                modes      = 'input';
                row        = [];
            }
            titleData = `<i class="fas fa-edit search-title-text" > 거래처 관리</i>`;
            let accName  = '';
            let bankName = '';
            if (modes !== "modify") { 
                accName = `<span class="btn_basic btn_gray"  >수정시 작업 가능</span>`;
            } else if (!row.deposit_account) { 
                accName = `<span class="btn_basic btn_yellow nowrap" onClick="accountCreate()">계좌번호 생성 가능</span>`;
            } else { 
                accName = `<span class="btn_basic btn_gray nowrap" >계좌번호 생성 완료</span>`;
            } 
            if (!row.deposit_account) { 
                bankName = `
                    <select name='deposit_bank'  class='form-control form-control-sm'>
                        <option value=''>주거래은행
                        <option value='003'  >기업 은행
                        <option value='004'  >국민 은행
                        <option value='020'  >우리 은행
                        <option value='088'  >신한 은행
                    </select>
                `;
            } else {
                     if (row.deposit_bank === "003") bankName = "기업 은행"; 
                else if (row.deposit_bank === "004") bankName = "국민 은행"; 
                else if (row.deposit_bank === "020") bankName = "우리 은행"; 
                else if (row.deposit_bank === "088") bankName = "신한 은행"; 
            } 
            const closing = (row.closing || '').trim();
            htmlData  = `
                <form name="frmDetail" id="frmDetail" method="post" action="/site/site_save" enctype="multipart/form-data">
                    <input type="hidden" name="mode"		value="${modes}">
                    <input type="hidden" name="uid"			value="${uid}">
                    <input type="hidden" name="site_code"	value="${row.site_code || ''}">
                    <input type="hidden" name="dup"			value="Y">
                    <input type="hidden" name="tmpMaster"	value="">
                    <div class="border regis-box shadow-sm menuArea"  ID="Info1">
                    <div class="row w-90 p-3">
                        <div class="col">
                            <table class="table regis-hotel">
                                
                                <tr>
                                    <th scope="row" class="regis-hotel-td1" style="width:90px;line-height:30px;">회사명<i class='fas fa-star fr' style='color: red;line-height: 30px;font-size: 10px;' title='필수입력'></i></th>
                                    <td class="regis-hotel-td2"><input type=text class="form-control form-control-sm" name="site_name" $readMASTER value="${row.site_name || ''}"></td>
                                    <th scope="row" class="regis-hotel-td1" style="width:90px;line-height:30px;">대표자<i class='fas fa-star fr' style='color: red;line-height: 30px;font-size: 10px;' title='필수입력'></i></th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input type=text class="form-control form-control-sm" $readMASTER name="president" value="${row.president || ''}"></td>
                                    <th scope="row" class="regis-hotel-td1" style="width:90px;line-height:30px;">대표번호<i class='fas fa-star fr' style='color: red;line-height: 30px;font-size: 10px;' title='필수입력'></i></th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input type=text class="form-control form-control-sm" name="tel_number" value="${row.tel_number || ''}"></td>
                                    <th scope="row" class="regis-hotel-td1" style="width:90px;line-height:30px;">등급</th>
                                    <td class="regis-hotel-td2">
                                        <select name="grade"  class="form-control form-control-sm">
                                            <option value="">등급설정
                                            <option value="A" ${((row.grade || '').trim() === "A") ? 'selected' : ''}>그룹 관리자
                                            <option value="B" ${((row.grade || '').trim() === "B") ? 'selected' : ''}>2 군
                                            <option value="S" ${((row.grade || '').trim() === "S") ? 'selected' : ''}>쇼핑몰
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row" class="regis-hotel-td1" >주소<i class='fas fa-star fr' style='color: red;line-height: 30px;font-size: 10px;' title='필수입력'></i></th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan=""><input type=text class="form-control form-control-sm" name="address1" value="${row.address1 || ''}"></td>
                                    <th scope="row" class="regis-hotel-td1" >담당자</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input type=text class="form-control form-control-sm" name="manager" value="${row.manager || ''}"></td>
                                    <th scope="row" class="regis-hotel-td1" >휴대전화</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input type=text class="form-control form-control-sm" name="manager_tel" value="${row.manager_tel || ''}"></td>
                                    <th scope="row" class="regis-hotel-td1" >알람용</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input type=text class="form-control form-control-sm" name="manager_tel2" value="${row.manager_tel2 || ''}"></td>
                                </tr>
                                <tr>
                                    <th scope="row" class="regis-hotel-td1" >사업자<br>번호<i class='fas fa-star fr' style='color: red;line-height: 30px;font-size: 10px;' title='필수입력'></i></th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input type=text class="form-control form-control-sm" name="site_number" value="${row.site_number || ''}"></td>
                                    <th scope="row" class="regis-hotel-td1" >계좌번호</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" ><input type=text class="form-control form-control-sm" name="account_number" value="${row.account_number || ''}"></td>
                                    <th scope="row" class="regis-hotel-td1" >은행</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" ><input type=text class="form-control form-control-sm" name="bank" value="${row.bank || ''}"></td>
                                    <th scope="row" class="regis-hotel-td1" >예금주</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" ><input type=text class="form-control form-control-sm" name="bank_name" value="${row.bank_name || ''}"></td>
                                </tr>
                                <tr>
                                    <th scope="row" class="regis-hotel-td1" style="line-height:30px;">바로빌ID</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input type=text class="form-control form-control-sm"  name="barobill_id" value="${row.barobill_id || ''}"></td>
                                    <th scope="row" class="regis-hotel-td1" style="line-height:30px;">비밀번호</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" ><input type=text class="form-control form-control-sm" name="barobill_passwd" value="${row.barobill_passwd || ''}"></td>
                                    <th scope="row" class="regis-hotel-td1" style="line-height:30px;">계좌번호</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan="" title="중복등록시 / 를 이용하세요" ><input type=text class="form-control form-control-sm" name="barobill_bank" value="${row.barobill_bank || ''}"></td>
                                    <th scope="row" class="regis-hotel-td1" style="width:90px;line-height:30px;">영업담당</th>
                                    <td class="regis-hotel-td2">
                                        <select name="sale_manager"  class="form-control form-control-sm" <? if ($b2b_MASTER == "") echo "disabled"; ?>>
                                            <option value="">담당자
                                            <?=$saleHTML?>
                                        </select>
                                    </td>
                                </tr>
                                <tr class="bgcF7">
                                    <th scope="row" class="regis-hotel-td1 bgcF7" >전용계좌</th>
                                    <td class="regis-hotel-td2 bgcF7" style="border-bottom:1px solid #ddd;">
                                        ${accName}
                                    </td>
                                    <th scope="row" class="regis-hotel-td1 bgcF7" >주거래은행</th>
                                    <td class="regis-hotel-td2 bgcF7" style="border-bottom:1px solid #ddd;" >
                                        ${bankName}
                                    </td>
                                    <th scope="row" class="regis-hotel-td1 bgcF7" >계좌</th>
                                    <td class="regis-hotel-td2 bgcF7" style="border-bottom:1px solid #ddd;">
                                        <?=$arrayBankCode[$row["deposit_bank"]]?> - ${row.deposit_account}
                                    </td>
                                    <th scope="row" class="regis-hotel-td1 bgcF7" >잔액</th>
                                    <td class="regis-hotel-td2 bgcF7 ar" style="border-bottom:1px solid #ddd; ">
                                        <input type=text class="form-control form-control-sm ar" readonly name="deposit" value="${row.deposit || ''}">
                                    </td>
                                </tr>
                                
                                
                                    <tr class="bgcEEE">
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >템플릿사용</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;">
                                            <input type="checkbox" class="" name="TempUse" value="Y"  ${((row.TempUse || '').trim() === 'Y') ? 'checked' : ''}> 사용한다
                                        </td>
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >메인도메인</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;" >
                                            <input type=text class="form-control form-control-sm" name="TempDomain" value="${row.TempDomain || ''}">
                                        </td>
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >결제</th>
                                        <td class="regis-hotel-td2 bgcEEE nowrap" style="border-bottom:1px solid #ddd;">
                                            <input type=text class="form-control form-control-sm wh40 ac" name="TempSettleDate" value="${row.TempSettleDate || ''}"> 일 
                                            <input type=text class="form-control form-control-sm wh70 ar" name="TempSettleAmt" value="${row.TempSettleAmt || ''}"> 원
                                        </td>
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >미수허용</th>
                                        <td class="regis-hotel-td2 bgcEEE ar" style="border-bottom:1px solid #ddd; ">
                                            <input type=text class="form-control form-control-sm wh80 ar" name="outstanding_amt" value="${row.outstanding_amt || ''}"> 만원
                                        </td>
                                    </tr>
                                    <tr class="bgcEEE">
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >도메인1</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;">
                                            <input type=text class="form-control form-control-sm" name="TempDomain1" value="${row.TempDomain1 || ''}">
                                        </td>
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >도메인2</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;" >
                                            <input type=text class="form-control form-control-sm" name="TempDomain2" value="${row.TempDomain2 || ''}">
                                        </td>
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >도메인3</th>
                                        <td class="regis-hotel-td2 bgcEEE nowrap" style="border-bottom:1px solid #ddd;">
                                            <input type=text class="form-control form-control-sm" name="TempDomain3" value="${row.TempDomain3 || ''}">
                                        </td>
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >커미션등급</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;">
                                            <select name="comm_grade"  class="form-control form-control-sm">
                                                <option value="">선택해주세요</option>
                                                <option value="A" ${((row.comm_grade || '').trim() === "A") ? 'selected' : ''}>KE,OZ 2% 커미션 제공
                                                <option value="B" ${((row.comm_grade || '').trim() === "B") ? 'selected' : ''}>KE 2% 커미션 제공
                                                <option value="C" ${((row.comm_grade || '').trim() === "C") ? 'selected' : ''}>OZ 2% 커미션 제공
                                                <option value="X" ${((row.comm_grade || '').trim() === "X") ? 'selected' : ''}>커미션 제공안함
                                            </select>
                                        </td>
                                    </tr>
                                    <tr class="">
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >견적참여</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;">
                                            <select name="est_yesno"  class="form-control form-control-sm">
                                                <option value="">선택해주세요</option>
                                                <option value="Y" ${((row.est_yesno || '').trim() === "Y") ? 'selected' : ''}>참여가능
                                            </select>
                                        </td>
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >여권스캔</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;">
                                            <select name="pass_scan"  class="form-control form-control-sm">
                                                <option value="">선택해주세요</option>
                                                <option value="Y" ${((row.pass_scan || '').trim() === "Y") ? 'selected' : ''}>가능
                                                <option value="N" ${((row.pass_scan || '').trim() === "N") ? 'selected' : ''}>불가능
                                            </select>
                                        </td>
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >월별검색</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;">
                                            <select name="month_search"  class="form-control form-control-sm">
                                                <option value="">선택해주세요</option>
                                                <option value="Y" ${((row.month_search || '').trim() === "Y") ? 'selected' : ''}>가능
                                                <option value="N" ${((row.month_search || '').trim() === "N") ? 'selected' : ''}>불가능
                                            </select>
                                        </td>
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >그룹등급</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;" title="신규 등록시만 선택이 가능함">
                                            <select name="group_grade"  class="form-control form-control-sm">
                                                <option value="">선택해주세요</option>
                                                <option value="F" ${((row.group_grade || '').trim() === "F") ? 'selected' : ''}>퍼스트 등급
                                                <option value="C" ${((row.group_grade || '').trim() === "C") ? 'selected' : ''}>비지니스 등급
                                                <option value="Y" ${((row.group_grade || '').trim() === "Y") ? 'selected' : ''}>이코노미 등급
                                            </select>
                                        </td>
                                    </tr>
                                    <tr class="">
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >번역게시판</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;">
                                            <select name="trans_bbs"  class="form-control form-control-sm">
                                                <option value="">선택해주세요</option>
                                                <option value="Y" ${((row.trans_bbs || '').trim() === "Y") ? 'selected' : ''}>번역가능
                                            </select>
                                        </td>
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >일일업무관리</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;">
                                            <select name="daily_bbs"  class="form-control form-control-sm">
                                                <option value="">선택해주세요</option>
                                                <option value="Y" ${((row.daily_bbs || '').trim() === "Y") ? 'selected' : ''}>사용가능
                                            </select>
                                        </td>
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >스켸쥴관리</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;">
                                            <select name="schedule_bbs"  class="form-control form-control-sm">
                                                <option value="">선택해주세요</option>
                                                <option value="Y" ${((row.schedule_bbs || '').trim() === "Y") ? 'selected' : ''}>사용가능
                                            </select>
                                        </td>
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >상위거래처</th>
                                        <td class="regis-hotel-td2 bgcEEE ar" style="border-bottom:1px solid #ddd; ">
                                            <input type=text class="form-control form-control-sm" name="preSiteCode" value="${row.preSiteCode || ''}" ${(row.preSiteCode) ? 'readonly' : ''} title="수정불가">
                                        </td>
                                    </tr>
                                    <tr class="">
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >BMS 사용</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;">
                                            <select name="bmsUse"  class="form-control form-control-sm">
                                                <option value="">선택해주세요</option>
                                                <option value="Y" ${((row.bmsUse || '').trim() === "Y") ? 'selected' : ''}>사용한다
                                            </select>
                                        </td>
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >입금문자전송</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;">
                                            <select name="invoiceUse"  class="form-control form-control-sm">
                                                <option value="">선택해주세요</option>
                                                <option value="Y" ${((row.invoiceUse || '').trim() === "Y") ? 'selected' : ''}>사용한다
                                            </select>
                                        </td>
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >카드자동발권</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;">
                                            <select name="cardAutoUse"  class="form-control form-control-sm">
                                                <option value="">선택해주세요</option>
                                                <option value="Y" ${((row.cardAutoUse || '').trim() === "Y") ? 'selected' : ''}>사용한다
                                            </select>
                                        </td>
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >블럭공급업체</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;">
                                            <select name="BlockUse"  class="form-control form-control-sm">
                                                <option value="">선택해주세요</option>
                                                <option value="Y" ${((row.BlockUse || '').trim() === "Y") ? 'selected' : ''}>사용한다
                                            </select>
                                        </td>
                                    </tr>
                                    <tr class="bgcEEE">
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >미러사이트</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;">
                                            <input type=text class="form-control form-control-sm" name="mirror_site_code" value="${row.mirror_site_code || ''}">
                                        </td>
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >발권알림</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;">
                                            <select name="TicketNotUse"  class="form-control form-control-sm">
                                                <option value="">선택해주세요</option>
                                                <option value="Y" ${((row.TicketNotUse || '').trim() === "Y") ? 'selected' : ''}>사용 금지
                                            </select>
                                        </td>
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >할인금지</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;">
                                            <select name="DcNotUse"  class="form-control form-control-sm">
                                                <option value="">선택해주세요</option>
                                                <option value="Y" ${((row.DcNotUse || '').trim() === "Y") ? 'selected' : ''}>할인 없음
                                            </select>
                                        </td>
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >리이슈사용</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;">
                                            <select name="reissueUse"  class="form-control form-control-sm">
                                                <option value="">선택해주세요</option>
                                                <option value="Y" ${((row.reissueUse || '').trim() === "Y") ? 'selected' : ''}>사용한다
                                            </select>
                                        </td>
                                    </tr>
                                    <tr class="bgcEEE">
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >코드쉐어노출</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;" >
                                            <select name="codeShareSearch"  class="form-control form-control-sm">
                                                <option value="">기본전체검색</option>
                                                <option value="Y" ${((row.codeShareSearch || '').trim() === "Y") ? 'selected' : ''}>코드쉐어 제외노출
                                            </select>
                                        </td>
                                        <td colspan="2" class="regis-hotel-td2 bgcEEE cored">국제선 검색시 초기 노출 조건</td>
                                        <th scope="row" class="regis-hotel-td1 bgcEEE" >국제선연락처</th>
                                        <td class="regis-hotel-td2 bgcEEE" style="border-bottom:1px solid #ddd;" >
                                            <select name="paxTel"  class="form-control form-control-sm">
                                                <option value="">담당자(자동입력)</option>
                                                <option value="C" ${((row.paxTel || '').trim() === "Y") ? 'selected' : ''}>탑승자(빈값)
                                            </select>
                                        </td>
                                        <td colspan="2" class="regis-hotel-td2 bgcEEE cored">담당자는 자동, 탑승자는 빈값</td>
                                    </tr>
                                
                                <tr>
                                    <th scope="row" class="regis-hotel-td1" >템플릿 사용시</th>
                                    <td class="regis-hotel-td2 nowrap" style="border-bottom:1px solid #ddd;">
                                        <input type="number" class="form-control form-control-sm wh80" name="openTime" value="${row.openTime || ''}" placeholder="오픈시간">
                                        ~
                                        <input type="number" class="form-control form-control-sm wh80" name="closeTime" value="${row.closeTime || ''}" placeholder="마감시간">
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row" class="regis-hotel-td1" >이메일<i class='fas fa-star fr' style='color: red;line-height: 30px;font-size: 10px;' title='필수입력'></i></th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input type=text class="form-control form-control-sm" name="e_mail" value="${row.e_mail || ''}"></td>
                                    <th scope="row" class="regis-hotel-td1" >지역</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;">
                                        <select name="site_nation"  class="form-control form-control-sm">
                                            <option value="">선택해주세요</option>
                                        </select>
                                    </td>
                                    <th scope="row" class="regis-hotel-td1" >홈페이지</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan=""><input type=text class="form-control form-control-sm" name="home_page" value="${row.home_page || ''}"></td>
                                    <th scope="row" class="regis-hotel-td1" title="국제선 검색시 초기 출발 지역을 미리 설정 한다." >기본출발지</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan=""><input type=text class="form-control form-control-sm" maxlength="3" name="default_city" value="${row.default_city || ''}"></td>
                                </tr>
                                <tr>
                                    <th scope="row" class="regis-hotel-td1" >국제선</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;">
                                        <input type="number" class="form-control form-control-sm" name="tasf_inter" value="${row.tasf_inter || ''}" placeholder="마크업(TASF)">
                                    </td>
                                    <th scope="row" class="regis-hotel-td1" >국내선</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;">
                                        <input type="number" class="form-control form-control-sm" name="tasf_dome" value="${row.tasf_dome || ''}" placeholder="마크업(TASF)">
                                    </td>
                                    <th scope="row" class="regis-hotel-td1" >호텔</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;">
                                        <input type="number" class="form-control form-control-sm" name="tasf_hotel" value="${row.tasf_hotel || ''}" placeholder="마크업(TASF)">
                                    </td>
                                    <th scope="row" class="regis-hotel-td1" >골프</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;">
                                        <input type="number" class="form-control form-control-sm" name="tasf_golf" value="${row.tasf_golf || ''}" placeholder="마크업(TASF)">
                                    </td>
                                </tr>
                                
                                <tr>
                                    <th scope="row" class="regis-hotel-td1" >판매가능</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan="7">
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row" class="regis-hotel-td1" >영업상태</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan=" ${b2bSiteCode ? '7' : '3'}">
                                        <div class='custom-control custom-radio mr-2 d-inline'>
                                            <input class='custom-control-input' ID='closing1' type='radio' name='closing' value='N' ${closing === "N" ? 'checked' : ''}><label class="custom-control-label mb-2" for='closing1'>영업</label>
                                        </div>
                                        <div class='custom-control custom-radio mr-2 d-inline'>
                                            <input class='custom-control-input' ID='closing2' type='radio' name='closing' value='A' ${closing === "A" ? 'checked' : ''}><label class="custom-control-label mb-2" for='closing2'>주의</label>
                                        </div>
                                        <div class='custom-control custom-radio mr-2 d-inline'>
                                            <input class='custom-control-input' ID='closing3' type='radio' name='closing' value='Y' ${closing === "Y" ? 'checked' : ''}><label class="custom-control-label mb-2" for='closing3'>폐업</label>
                                        </div>
                                        <div class='custom-control custom-radio mr-2 d-inline'>
                                            <input class='custom-control-input' ID='closing4' type='radio' name='closing' value='D' ${closing === "D" ? 'checked' : ''}><label class="custom-control-label mb-2" for='closing4'>정지</label>
                                        </div>
                                        <div class='custom-control custom-radio mr-2 d-inline'>
                                            <input class='custom-control-input' ID='closing5' type='radio' name='closing' value='W' ${closing === "W" ? 'checked' : ''}><label class="custom-control-label mb-2" for='closing5'>대기</label>
                                        </div>
                                    </td>
                                    <th scope="row" class="regis-hotel-td1" >마스터 거래처</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan="">
                                        <select name="master_site"  class="form-control form-control-sm">
                                            <option value="">선택해주세요</option>
                                            <?=$bspHTML?>
                                        </select>
                                    </td>
                                    <th scope="row" class="regis-hotel-td1" >BSP제공</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan="">
                                        <input type="checkbox" class="" name="BSP_USE"   value="Y"   ${((row.BSP_USE   || '').trim() === "Y") ? 'checked' : ''}> 제공함
                                        <input type="checkbox" class="" name="BSP_QUEUE" value="Y"   ${((row.BSP_QUEUE || '').trim() === "Y") ? 'checked' : ''}> Queue
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row" class="regis-hotel-td1" >GAL 계정</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;">
                                        <input type="text" class="form-control form-control-sm " name="GAL_UAPI" value="${row.GAL_UAPI || ''}" placeholder="Universal API">
                                    <th scope="row" class="regis-hotel-td1" >비번</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" >
                                        <input type="text" class="form-control form-control-sm " name="GAL_PASSWD" value="${row.GAL_PASSWD || ''}" placeholder="3g******">
                                    <th scope="row" class="regis-hotel-td1" >브랜치코드</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" >
                                        <input type="text" class="form-control form-control-sm " name="GAL_BRANCH" value="${row.GAL_BRANCH || ''}" placeholder="P3****">
                                    </td>
                                    <th scope="row" class="regis-hotel-td1" >PCC</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" >
                                        <input type="text" class="form-control form-control-sm " name="GAL_PCC" value="${row.GAL_PCC || ''}" placeholder="****">
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row" class="regis-hotel-td1" >ABA 계정</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;">
                                        <input type="text" class="form-control form-control-sm " name="ABA_FROM" value="${row.ABA_FROM || ''}" placeholder="이메일주소">
                                    <th scope="row" class="regis-hotel-td1" >비번</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" >
                                        <input type="text" class="form-control form-control-sm " name="ABA_PASSWD" value="${row.ABA_PASSWD || ''}" placeholder="password">
                                    <th scope="row" class="regis-hotel-td1" >유저이름</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" >
                                        <input type="text" class="form-control form-control-sm " name="ABA_USER" value="${row.ABA_USER || ''}" placeholder="사용자이름">
                                    </td>
                                    <th scope="row" class="regis-hotel-td1" >PCC</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" >
                                        <input type="text" class="form-control form-control-sm " name="ABA_PCC" value="${row.ABA_PCC || ''}" placeholder="****">
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row" class="regis-hotel-td1" >SELL 계정</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan="3">
                                        <input type="text" class="form-control form-control-sm " name="SEL_CITYCODE" value="${row.SEL_CITYCODE || ''}" placeholder="SEL*******">
                                    </td>
                                    <th scope="row" class="regis-hotel-td1" >WS USER</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan="">
                                        <input type="text" class="form-control form-control-sm " name="SEL_WSUSER" value="${row.SEL_WSUSER || ''}" placeholder="1A********">
                                    </td>
                                    <th scope="row" class="regis-hotel-td1" >IATA</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan="">
                                        <input type="text" class="form-control form-control-sm " name="iatanumber" value="${row.iatanumber || ''}" placeholder="1732**">
                                    </td>
                                </tr>
                                
                                <tr>
                                    <th scope="row" class="regis-hotel-td1" >관련상품</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan="5"><input type=text class="form-control form-control-sm" name="relation_good" value="${row.relation_good || ''}" ></td>
                                    <td colspan="2"> 상품코드등록 (12345/12346) </td>
                                </tr>
                                
                                

                                <tr>
                                    <th scope="row" class="regis-hotel-td1" >메모</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan="7"><textarea type=text class="form-control form-control-sm" onfocus="lineCheck(this)" onkeyup="lineCheck(this)" name="memo" >${row.memo || ''}</textarea></td>
                                </tr>
                                <tr><td colspan="8" class="ac">
                                        <span  class="btn_basic btn_yellow "  onCLick="return InputCheck()" >${buttonName}</span>
                                </td></tr>
                                ${managerList}

                                <tr>
                                    <th scope="row" class="regis-hotel-td1" >로그인아이피</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan="7">
                                        <table width="100%">
                                            <tr class='ac'>
                                                <td>아이피</td>
                                                <td>마지막로긴</td>
                                                <td>횟수</td>
                                                <td>발권</td>
                                                <td>월별조회</td>
                                                <td>타사로긴</td>
                                            </tr>
                                            <?=$ipHTML?>
                                        </table>
                                    </th>
                                </tr>


                            </table>
                        </div>
                        
                    </div>	
                </div>
                </form>
            `;
        } else if (mode === "manPass") {

            sqlText = `update  site_manager set man_passwd = @pass where site_code = @site_code and man_id = @man_id `;
            const pass = deps.crypto.createHash('sha256').update(data.val).digest('hex');
            try {
                await pool.request()
                        .input('pass',sql.NVarChar , pass)
                        .input('site_code',sql.NVarChar , data.site_code)
                        .input('man_id',sql.NVarChar , data.man_id)
                        .query(sqlText);
            }catch (err) {
                console.log(err);
                msg = err;
            }
        } else if (mode === "newUser") {
            
            sqlText = `
                SELECT
                    ( 
                    (SELECT COUNT(*) FROM site_manager  WHERE man_id      = @id) + 
                    (SELECT COUNT(*) FROM tblManager    WHERE member_code = @id) + 
                    (SELECT COUNT(*) FROM site          WHERE site_master = @id)  ) AS cnt
            `;
            const result  = await pool.request()
                .input('id', sql.NVarChar(50), data.new_id)
                .query(sqlText);

            const rsCount = Number(result.recordset?.[0]?.cnt ?? 0);
    
            if (rsCount === 0) {
                try {
                    const minor   = await minorNext(pool, {table:'site_manager', uid:'', minor:'', query: ` site_code = '${data.site_code}' `});
                    const pass    = deps.crypto.createHash('sha256').update(data.new_passwd).digest('hex');
                    const new_tel = aes128Encrypt(aviaSecurityKey,data.new_tel);
                    sqlText = `insert into site_manager (site_code,minor_num,man_id,manager,status,man_passwd,tel_number) 
                                values ('${data.site_code}','${minor}','${data.new_id}','${data.new_name}','Y','${pass}','${new_tel}') `;
                    await pool.request().query(sqlText);
                } catch (err) {
                    msg = err;
                    console.log(err);
                }
            } else {
                msg = "이미 등록된 사용자 아이디 입니다.";
            }
        } else if (mode === "manDel") {
            try {
                sqlText = `delete from site_manager where site_code = @site_code and man_id = @man_id `;
                await pool.request().input('site_code',sql.NVarChar,data.site_code).input('man_id',sql.NVarChar,data.man_id).query(sqlText);
            } catch (err) {
                msg = err;
                console.log(err);
            }
        }
    }
    if (msg) rs = 'no'; else rs = 'ok';
    
    res.json ({success: rs, errorMsg: msg , title: titleData , html: htmlData });
}