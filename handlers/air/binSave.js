const { query } = require('mssql');
const deps = require('../../src/common/dependencies');
const { arrGdsData } = require('../../src/utils/airConst'); 
const { uidNext } = require('../../src/utils/idxFunction');
//const excelUploadHandler = require('../../file/excel_upload');
const xlsx = require('xlsx');
//const upload = require('../../src/common/uploadConfig');

//console.log('a');

//upload.single('pic');

//app.post('/file/excel_upload', excelUploadHandler);

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
    let   gubun1      = data.gubun1 || '';
    let   aView       = data.aView  || '';
    let   msg         = '';
    let   sqlText     = '';
    let   sqlResult   = '';
    let   rsCount     = '';
    let   titleData   = '';
    let   htmlData    = '';
    let   contents    = '';
    let   content     = data.content || '';
    let   subject     = data.subject || '';
    let   username    = data.username || '';
    const sql             = deps.sql;
    const aes128Encrypt   = deps.aes128Encrypt;
    const aes128Decrypt   = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;
    const NOWSTIME        = deps.getNow().NOWSTIME;
    const NOWS            = deps.getNow().NOWS;
    const mainTable       = 'airline_binNumber';

    let   html            = '';
    let   s               = '';
    let   modes           = '';
    let   row             = {};
    let   buttonName      = '신규입력';
    if (mode === "view") {
            
            
            htmlData  = `
                <form name="frmDetail" id="frmDetail" method="post" enctype="multipart/form-data">
                    <input type="hidden" name="mode"		value="${modes}">
                    <input type="hidden" name="uid"			value="${uid}">
                    <input type="hidden" name="orgMode"		value="${mode}">
                    <div class="border regis-box shadow-sm menuArea" >
                    <div class="row w-90 p-3">
                        <div class="col">
                        <table class="table regis-hotel">
                            <tr>
                                <th scope="row" class="regis-hotel-td1" style="width:130px;" required>제목  </th>
                                <td class="regis-hotel-td2" colspan="3">
                                    ${row.subject || ''}
                                </td>
                            </tr>
                            
                            
                            
                        </table>
                        </div>
                    </div>
                    <div class="row w-70 regis-btn ">
                        <div class="col-12 ac" style="margin-bottom:20px;">
                            <span type="button" class="btn btn-yellow " href="javascript://" onCLick="return newReg('${uid}','modify')" style="width:50%;font-size:19px !important;padding-top:10px;padding-bottom:13px;">수정하기</span>
                        </div>
                    </div>
                    </div>
                </form>
            `;
        
    } else if (mode === "input" || mode === "modify") {
        if (mode === "input") {
            buttonName = '신규입력';
            titleData  = `<i class="fas fa-edit search-title-text" > 항공사 BIN 등록</i>`;
            viewPos    = '';
        } else {
            buttonName = '수정입력';
            titleData  = `<i class="fas fa-edit search-title-text" > 항공사 BIN 수정</i>`;
            sqlText   = ` select * from ${mainTable} where uid = @uid `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
            row       = sqlResult.recordset?.[0];
        }
        modes      = mode;
        let sData = '', iData = '' , selHTML = '';
        htmlData   = `
            <form name="frmDetail" id="frmDetail" method="post" enctype="multipart/form-data">
                <input type="hidden" name="mode"		value="save">
                <input type="hidden" name="uid"			value="${uid}">
                <input type="hidden" name="orgMode"		value="${mode}">
                <div class="border regis-box shadow-sm menuArea" >
                <div class="row w-90 p-3">
                    <div class="col">
                    <table class="table regis-hotel">
                    <tr>
                        <th scope="row" class="regis-hotel-td1" >2코드</th>
                        <td class="regis-hotel-td2"><input name="aircode" type="text"  class="form-control form-control-sm wh100" value="${row.aircode || ''}"></td>
                        <th scope="row" class="regis-hotel-td1" >3코드</th>
                        <td class="regis-hotel-td2"><input name="aircode2"  type="text"  class="form-control form-control-sm wh100" value="${row.aircode2 || ''}" ></td>
                    </tr>
                    <tr>
                        <th scope="row" class="regis-hotel-td1" >Card Bin</th>
                        <td class="regis-hotel-td2" colspan=""><input name="binCode" type="text" maxlength="2"  class="form-control form-control-sm wh150" value="${row.binCode || ''}"></td>
                        <th scope="row" class="regis-hotel-td1" >Bin Company</th>
                        <td class="regis-hotel-td2" colspan=""><input name="binCompany" type="text" maxlength="3" class="form-control form-control-sm wh150" value="${row.binCompany || ''}"></td>
                    </tr>
                    <tr>
                        <th scope="row" class="regis-hotel-td1" >명칭</th>
                        <td class="regis-hotel-td2 borderBottom" colspan=""><input name="binCompanyName" type="text"  class="form-control form-control-sm wh150" value="${row.binCompanyName || ''}"></td>
                        <th scope="row" class="regis-hotel-td1" >bin_number</th>
                        <td class="regis-hotel-td2 borderBottom" colspan=""><input name="bin_number" type="text"  class="form-control form-control-sm wh150" value="${row.bin_number || ''}"></td>
                    </tr>
                        
                        
                    </table>
                    </div>
                </div>
                <div class="row w-70 regis-btn ">
                    <div class="col-12 ac" style="margin-bottom:20px;">
                        <span type="button" class="btn btn-yellow " href="javascript://" onCLick="return inputCheck()" style="width:50%;font-size:19px !important;padding-top:10px;padding-bottom:13px;">${buttonName}</span>
                    </div>
                </div>
                </div>
            </form>
        `;
    } else if (mode === "excel") {
        titleData  = `<i class="fas fa-edit search-title-text" > 항공사 BIN 엑셀 업로드</i>`;
        htmlData   = `
            <form name="frmDetail" id="frmDetail" method="post" enctype="multipart/form-data">
                <input type="hidden" name="mode"		value="excelSave">
                <input type="hidden" name="uid"			value="${uid}">
                <input type="hidden" name="orgMode"		value="${mode}">
                <div class="border regis-box shadow-sm menuArea" >
                <div class="row w-90 p-3">
                    <div class="col">
                    <table class="table regis-hotel">
                        <tr>
							<th scope="row" class="regis-hotel-td1" style="width:90px;line-height:30px;">항공사코드</th>
							<td class="regis-hotel-td1 al">
								<input name="aircode" type="text" maxlength='2' class="form-control form-control-sm wh50" value=""> KE/ OZ / 7C 등
							</td>
						</tr>
						<tr>
							<th scope="row" class="regis-hotel-td1" style="width:90px;line-height:30px;">엑셀파일</th>
							<td class="regis-hotel-td1"><input name="pic" type="file"  class="form-control form-control-sm" value="">
								<br>순서 : 3코드 / 2코드 / Bin 카드넘버 / 카드명 / 빈넘버 (총 5칸)
							</td>
                        </tr>
                    </table>
                    </div>
                </div>
                <div class="row w-70 regis-btn ">
                    <div class="col-12 ac" style="margin-bottom:20px;">
                        <span type="button" class="btn btn-yellow " onCLick="return excelCheck()" style="width:50%;font-size:19px !important;padding-top:10px;padding-bottom:13px;">${buttonName}</span>
                    </div>
                </div>
                </div>
            </form>
        `;
    } else if (mode === "del") {
        sqlText = `delete from ${mainTable} where uid = @uid`;
        sqlResult = await pool.request().input('uid',sql.Int , uid).query(sqlText);
        
    } else if (mode === "save") {
        if (orgMode === "input" && !uid) {
            uid = await uidNext(`${mainTable}`, pool );
            sqlText = `insert into ${mainTable} (uid) values (@uid) `;
            sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
        }
        if (!msg) {
            sqlText = `
                update ${mainTable} set
                    aircode			= '${data.aircode}',
                    aircode2		= '${data.aircode2 || ''}',
                    binCode			= '${data.binCode || ''}',
                    binCompany		= '${data.binCompany || ''}',
                    binCompanyName	= '${data.binCompanyName || ''}',
                    bin_number		= '${data.bin_number || ''}'
                where uid = @uid
            `;
            try {
                sqlResult = await pool.request().input('uid',sql.Int,uid).query(sqlText);
            } catch (err) {
                msg = err;
                console.log(err);
            }
        }
    }
    if (msg) rs = 'no'; else rs = 'ok';
    res.json ({success: rs, errorMsg: msg , title: titleData , html: htmlData , uid: uid  });
}