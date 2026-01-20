const deps = require('../../src/common/dependencies');
const { uidNext } = require('../../src/utils/idxFunction');
const { arrGender } = require('../../src/utils/airConst');

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
    const table    = 'members';
    const sql      = deps.sql;
    const aes128Encrypt = deps.aes128Encrypt;
    const aes128Decrypt = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;

    let hashPass     = '';
    let passSql      = '';
    let passwd       = data.passwd;
    let handphone    = data.handphone || '';
    let birthday     = data.birthday || '';
    if (passwd) {
        hashPass = deps.crypto.createHash('sha256').update(passwd).digest('hex');
        passSql = ` passwd = '${hashPass}' , `;
    }
    if (mode === "input") {
        uid = uidNext('members',pool);
        sqlText = `select count(*) as cnt from ${table} where userid = @userid `;
        result = await pool.request().input('userid',sql.NVarChar , data.userid).query(sqlText);
        rsCount = result.recordset?.[0].cnt || 0;
        if (rsCount > 0) {
            msg = '아이디가 중복 되었습니다.';
        }
    } else {
        uid = data.uid;
    }
    if (!msg) {
        if (mode === "input") {
            userid = data.userid1+"@"+data.userid2;
            sqlText = `insert into ${table} (uid,userid,passwd) values (@uid, @userid, @passwd)`;
            await pool.request()
                    .input('uid', sql.Int , uid)
                    .input('userid',sql.NVarChar , userid)
                    .input('passwd',sql.NVarChar, hashPass)
                    .query(sqlText);
        }

        if (mode === 'input' || mode === 'modify') {
            if (handphone)    handphone    = aes128Encrypt(aviaSecurityKey, deps.StrClear(handphone));
            if (birthday)     birthday     = aes128Encrypt(aviaSecurityKey, deps.StrClear(birthday));
            
            try {
                sqlText = `
                    update ${table} set 
                        ${passSql}
                        username		= '${data.username || ''}',
                        eng_name1		= '${data.eng_name1 || ''}',
                        eng_name2		= '${data.eng_name2 || ''}',
                        handphone		= '${handphone || ''}',
                        birthday		= '${birthday || ''}',
                        gender			= '${data.gender || ''}',
                        grade			= '${data.grade || ''}',
                        theme			= '${data.theme || ''}',
                        address			= '${data.address || ''}',
                        gubun			= '${data.gubun || ''}',
                        business_name	= '${data.business_name || ''}',
                        business_no		= '${data.business_no || ''}',
                        memo			= '${data.memo || ''}'
                    where uid = @uid
                `;
                await pool.request().input('uid',sql.Int , uid).query(sqlText);
            } catch (err) {
                msg = err;
                console.log(err)
            }
        } else if (mode === "delete") {
            try {
                sqlText = `delete from ${table} where uid = @uid `;
                await pool.request().input('uid',sql.Int , uid).query(sqlText);
            } catch (error) {
                msg = error;
            }
        } else if (mode === "Member") {
            let   buttonName = '입력';
            let   row        = [];
            let   modes      = 'input';
            let   idData     = '';
            let   handphone  = '';
            let   birthday   = '';
            let   sexData    = '';
            if (uid) {
                sqlText = `select * from members where uid = @code `;
                result  = await pool.request().input('code',sql.Int , uid).query(sqlText);
                row     = result.recordset?.[0];
                buttonName = '수정';
                modes      = 'modify';
                idData     = row.userid;
                if (row.handphone) handphone = aes128Decrypt(aviaSecurityKey,row.handphone);
                if (row.birthday)  birthday  = aes128Decrypt(aviaSecurityKey,row.birthday);
            } else {
                idData = `
                    <input name='userid1' type='text'  class='form-control form-control-sm' value='' style='width: 40%;';>
                    @
                    <input name='userid2' type='text'  class='form-control form-control-sm' value='' style='width: 52%;';></input>
                `;
            }
            for (const [v,t] of Object.entries(arrGender) ) {
                const s = (row.gender?.trim() || '') === v ? 'selected' : '';
                sexData += `<option value='${v}' ${s}> ${t}</option>`;
            }
            titleData = `<i class="fas fa-edit search-title-text" > 회원 관리 <span class='font13'>${uid}</span></i>`;
    
            htmlData  = `
            <form name="frmDetail" id="frmDetail" method="post" >
            <input type="hidden" name="mode"   value="${modes}">
            <input type="hidden" name="uid"    value="${row.uid || ''}">
            
                <div class="container" style="max-width:100% !important;">
                    <div class="border regis-box shadow-sm" >
                        <div class="row w-90 p-3">
                            <div class="col">
                                <table class="table regis-hotel">
                                <tr>
                                    <th scope="row" class="regis-hotel-td1 wh100" >아이디</th>
                                    <td class="regis-hotel-td2">
                                        ${idData}
                                    </td>
                                    <th scope="row" class="regis-hotel-td1 wh100" >비밀번호</th>
                                    <td class="regis-hotel-td2"><input name="passwd" type="password"  class="form-control form-control-sm" value=""></td>
                                </tr>
                                <tr>
                                    <th scope="row" class="regis-hotel-td1" >한글이름</th>
                                    <td class="regis-hotel-td2"><input name="username" type="text"  class="form-control form-control-sm" value="${row.username || ''}"></td>
                                    <th scope="row" class="regis-hotel-td1" >영문이름</th>
                                    <td class="regis-hotel-td2">
                                        <input name="eng_name1" type="text"  class="form-control form-control-sm" value="${row.eng_name1 || ''}" style="width: 49%;";>
                                        <input name="eng_name2" type="text"  class="form-control form-control-sm" value="${row.eng_name2 || ''}" style="width: 49%;";>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row" class="regis-hotel-td1" >핸드폰</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" ><input name="handphone" type="text"  class="form-control form-control-sm" value="${handphone}"></td>
                                    
                                </tr>
                               
                                <tr>
                                    <th scope="row" class="regis-hotel-td1" >주소</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan="3"><input name="address" type="text"  class="form-control form-control-sm" value="${row.address || ''}"></td>
                                </tr>
                                <tr>
                                    <th scope="row" class="regis-hotel-td1" >생년월일</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;"><input name="birthday" type="text"  class="form-control form-control-sm" value="${birthday}"></td>
                                    <th scope="row" class="regis-hotel-td1" >성별</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;">
                                        <select name="gender" class="form-control">
                                            <option value="">선택해주세요</option>
                                            ${sexData}
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row" class="regis-hotel-td1" >메모</th>
                                    <td class="regis-hotel-td2" style="border-bottom:1px solid #ddd;" colspan="3">
                                        <textarea name="memo" id="memo" class="form-control " onfocus="lineCheck(this)" onkeyup="lineCheck(this)">${row.memo || ''}</textarea>
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