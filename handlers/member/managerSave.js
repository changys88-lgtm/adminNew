const deps = require('../../src/common/dependencies');
const { uidNext } = require('../../src/utils/idxFunction');
const crypto = require('crypto');

module.exports = async (req, res) => {
    const data        = req.body;
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const mode        = data.mode.trim();;    
    const pool = await deps.getPool();
    const member_code = data.member_code || '';
    let msg        = '';
    let sqlText    = '';
    let result     = '';
    let rsCount    = '';
    let uid        = '';
    let titleData  = '';
    let htmlData   = '';
    const table    = 'tblManager';
    const sql      = deps.sql;
    const aes128Encrypt = deps.aes128Encrypt;
    const aes128Decrypt = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;

    let hashPass     = '';
    let passSql      = '';
    let passwd       = data.passwd;
    let handphone    = data.handphone || '';
    let direct_phone = data.direct_phone || '';
    if (passwd) {
        hashPass = crypto.createHash('sha256').update(passwd).digest('hex');
        passSql = ` passwd = '${hashPass}' , `;
    }
    if (mode === "input") {
        uid = uidNext('tblManager',pool);
        sqlText = `select count(*) as cnt from ${table} where member_code = @member_code `;
        result = await pool.request().input('member_code',sql.NVarChar , data.member_code).query(sqlText);
        rsCount = result.recordset?.[0].cnt || 0;
        if (rsCount > 0) {
            msg = '아이디가 중복 되었습니다.';
        }
    } else {
        uid = data.uid;
    }
    if (!msg) {
        if (mode === "input") {
            uid = await uidNext(`${table}`, pool );
            sqlText = `insert into ${table} (uid,member_code,passwd) values (@uid, @member_code, @passwd)`;
            await pool.request()
                    .input('uid', sql.Int , uid)
                    .input('member_code',sql.NVarChar , member_code)
                    .input('passwd',sql.NVarChar, hashPass)
                    .query(sqlText);
        }

        if (mode === 'input' || mode === 'modify') {
            if (handphone)    handphone    = aes128Encrypt(aviaSecurityKey, deps.StrClear(handphone));
            if (direct_phone) direct_phone = aes128Encrypt(aviaSecurityKey, deps.StrClear(direct_phone));
            if ((data.resign || '').trim()) {
                passSql += ` resign = '${deps.StrClear(data.resign)}' ,  `;
            }
            if ((data.start_day || '').trim()) {
                passSql += ` start_day = '${deps.StrClear(data.start_day)}' ,  `;
            }
            if (!data.menuDest) menu_dest = '';
            else menu_dest = data.menuDest
                    .map(v => String(v).trim())
                    .filter(Boolean)            // 빈값 제거
                    .join(',');  
            try {
                sqlText = `
                    update ${table} set 
                        ${passSql}
                        username		= '${data.username}',
                        eng_name		= '${data.eng_name}',
                        handphone		= '${handphone}',
                        direct_phone	= '${direct_phone}',
                        email			= '${data.email}',
                        sale_manager	= '${data.sale_manager || ''}',
                        settle_group	= '${data.settle_group}',
                        zipcode			= '${data.zipcode}',
                        address1		= '${data.address1}',
                        address2		= '${data.address2}',
                        bankName		= '${data.bankName}',
                        accountNumber	= '${data.accountNumber}',
                        settle_line     = '${data.settle_line}',
                        menu_dest		= '${menu_dest}'
                    where uid = @uid
                `;
                await pool.request().input('uid',sql.Int , uid).query(sqlText);
            } catch (error) {
                msg = error;
            }
        } else if (mode === "delete") {
            try {
                sqlText = `delete from ${table} where uid = @uid `;
                await pool.request().input('uid',sql.Int , uid).query(sqlText);
            } catch (error) {
                msg = error;
            }
        } else if (mode === "Manager") {
            const menuMeta = require('../../data/erpMenuArea.json');
            const menuMap = Object.fromEntries(menuMeta.map(m => [m.code, {name: m.name, link: m.link || ''}]));
            let   buttonName = '입력';
            let   row      = [];
            let   modes    = 'input';
            let   dutyData = '';
            let   mapData  = '';
            let   menuSet  = '';
            if (uid) {
                sqlText = `select * from tblManager where uid = @code `;
                result  = await pool.request().input('code',sql.Int , uid).query(sqlText);
                row     = result.recordset?.[0];
                if (row.handphone.length > 20)    row.handphone    = aes128Decrypt(aviaSecurityKey,row.handphone);
                if (row.direct_phone.length > 20) row.direct_phone = aes128Decrypt(aviaSecurityKey,row.direct_phone);
                buttonName = '수정';
                modes      = 'modify';
                menuSet    = new Set(row.menu_dest.split(',').filter(Boolean).map(String));
            } else {
                menuSet    = new Set();
            }
            for (const menu of Object.keys(menuMap)) {
                const name = menuMap[menu].name;
                const s    = menuSet.has(menu) ? 'checked' : '';
                mapData   += `<label><input type='checkbox' name='menuDest[]' value='${menu}' ${s}>${name}</label> &nbsp; &nbsp; `;
            }
            sqlText = "select code,duty_name from duty order by sorting";
            result = await pool.request().query(sqlText);
            for (const put of result.recordset) {
                let { code , duty_name } = put;
                code      = code.trim();
                duty_name =  duty_name.trim();
                if ((row.working || '').trim() === code) sel = 'selected'; else sel = '';
                dutyData  += `<option value='${code}' ${sel}>${duty_name}`;
            }
    
            titleData = `<i class="fas fa-edit search-title-text" > 관리자 관리</i>`;
    
            htmlData  = `
            <form name="frmForm" id="frmForm" method="post" >
            <input type="hidden" name="mode"   value="${modes}">
            <input type="hidden" name="uid"    value="${row.uid || ''}">
            
                <div class="container" style="max-width:100% !important;">
                    <div class="border regis-box shadow-sm" >
                        <div class="row w-90 p-3">
                            <div class="col">
                                <table class="table regis-hotel">
                                    <tr>
                                        <th scope="row" class="regis-hotel-td1" >관리자코드</th>
                                        <td class="regis-hotel-td2"><input name="member_code" $read type="text" autocomplete='one-time-code' class="form-control form-control-sm" value="${row.member_code || ''}"></td>
                                        <th scope="row" class="regis-hotel-td1" >비밀번호</th>
                                        <td class="regis-hotel-td2"><input name="passwd" type="password" autocomplete='one-time-code' class="form-control form-control-sm" value="" onChange="return passCheck(this.value)"></td>
                                    </tr>
                                    <tr>
                                        <th scope="row" class="regis-hotel-td1" >한글이름</th>
                                        <td class="regis-hotel-td2"><input name="username" type="text" autocomplete='one-time-code' class="form-control form-control-sm" value="${row.username || ''}"></td>
                                        <th scope="row" class="regis-hotel-td1" >영문이름</th>
                                        <td class="regis-hotel-td2"><input name="eng_name" type="text" autocomplete='one-time-code' class="form-control form-control-sm" value="${row.eng_name || ''}"></td>
                                    </tr>
                                    <tr>
                                        <th scope="row" class="regis-hotel-td1" >핸드폰</th>
                                        <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input name="handphone" type="text"  class="form-control form-control-sm" value="${row.handphone || ''}"></td>
                                        <th scope="row" class="regis-hotel-td1" >직통번호</th>
                                        <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input name="direct_phone" type="text"  class="form-control form-control-sm" value="${row.direct_phone || ''}"></td>
                                    </tr>
                                    <tr>
                                        <th scope="row" class="regis-hotel-td1" >직책</th>
                                        <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;">
                                            <select name="working" class="form-control">
                                                <option value="">직책을 선택하세요
                                                ${dutyData}
                                            </select>
                                        </td>
                                        <th scope="row" class="regis-hotel-td1" >이메일</th>
                                        <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input name="email" type="text"  class="form-control form-control-sm" value="${row.email || ''}"></td>
                                    </tr>
                                    <tr>
                                        <th scope="row" class="regis-hotel-td1" >우편번호</th>
                                        <td class="regis-hotel-td2" colspan="3" >
                                            <input name="zipcode" type="text"  class="form-control form-control-sm wh100"    value="${row.zipcode || ''}"> 
                                            &nbsp; &nbsp; 
                                            주소 <input name="address1" type="text"  class="form-control form-control-sm wh400 "    value="${row.address1 || ''}"> 
                                        </td>
                                        
                                    </tr>
                                    <tr>
                                        <th scope="row" class="regis-hotel-td1" >상세 주소</th>
                                        <td class="regis-hotel-td2" colspan="3" >
                                            <input name="address2" type="text"  class="form-control form-control-sm  "    value="${row.address2 || ''}"> 
                                        </td>
                                        
                                    </tr>
                                    <tr>
                                        <th scope="row" class="regis-hotel-td1" >계좌번호</th>
                                        <td class="regis-hotel-td2" colspan="3" >
                                            <input name="bankName" type="text"  class="form-control form-control-sm wh80"    value="${row.bankName || ''}"> 은행
                                            &nbsp; &nbsp; 
                                            계좌 <input name="accountNumber" type="text"  class="form-control form-control-sm wh400 "    value="${row.accountNumber || ''}"> 
                                        </td>
                                        
                                    </tr>
                                    <tr>
                                        <th scope="row" class="regis-hotel-td1" >소속그룹</th>
                                        <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;">
                                            <select name="settle_group" class="form-control">
                                                <option value="">선택하세요
                                               
                                            </select>
                                        </td>
                                        <th scope="row" class="regis-hotel-td1" >판매관리</th>
                                        <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;">
                                            <label><input name="sale_manager" type="checkbox" value="Y" ${(row.sale_manager === "Y" ) ? 'checked' : ''} > 상품 판매 관리 
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row" class="regis-hotel-td1" >알림톡</th>
                                        <td colspan="3">
                                        
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row" class="regis-hotel-td1" >결제라인</th>
                                        <td colspan="3" class="regis-hotel-td2" style="border-bottom:1px solid #ddd;">
                                            <input name="settle_line" type="text" class="form-control form-control-sm" value="${row.settle_line || ''}">
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row" class="regis-hotel-td1" >관리결제라인</th>
                                        <td colspan="3" class="regis-hotel-td2" style="border-bottom:1px solid #ddd;">
                                            <input name="settle_line2" type="text" class="form-control form-control-sm" value="${row.settle_line2 || ''}">
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row" class="regis-hotel-td1" >입사일</th>
                                        <td colspan="" class="regis-hotel-td2" style="border-bottom:1px solid #ddd;">
                                            <input name="start_day" type="text"  class="form-control form-control-sm wh100" readonly onClick="datePick('start_day')" id="start_day" value="${row.start_day || ''}"> 
                                        </td>
                                        <th scope="row" class="regis-hotel-td1" >퇴직일</th>
                                        <td colspan="" class="regis-hotel-td2" style="border-bottom:1px solid #ddd;">
                                            <input name="resign" type="text"  class="form-control form-control-sm wh100" readonly onClick="datePick('resign')" id="resign" value="${row.resign || ''}"> 
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row" class="regis-hotel-td1" >바로가기</th>
                                        <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan="3">
                                           ${mapData}
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                        </div>	
                        <div class="row w-70 mb-4 regis-btn">
                            <div class="col-12" style="text-align:center;">
                                <span type="button" class="btn btn-yellow" onCLick="return inputCheck()" style="font-size:15px !important;">${buttonName || '입력'}</span>
                            </div>
                        </div>		
                    </div>
                    
                
                </div>
            
            
            
            
            </form>
            `;
        } 
    }
    if (msg) rs = 'no'; else rs = 'ok';
    res.json ({success: rs, errorMsg: msg, title: titleData , html: htmlData });
}