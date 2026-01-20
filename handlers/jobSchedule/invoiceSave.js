const fs = require('fs');
const path = require('path');
const deps = require('../../src/common/dependencies');
const { uidNext } = require('../../src/utils/idxFunction');
const { xmlOpen } = require('../../src/utils/multiNetwork');
const { minorNext } = require('../../src/utils/database');

module.exports = async (req, res) => {
    const data        = req.body;
    const AviaLoginId = req.cookies?.AviaLoginId || '';
    const b2bMASTER   = req.cookies?.b2bMASTER || '';
    const b2bSiteCode = req.cookies?.b2bSiteCode || '';
    const mode        = data.mode.trim() || '' ;
    let   uid         = data.uid.trim() || '';   
    const pool        = await deps.getPool();
    let msg        = '';
    let sqlText    = '';
    let sqlResult  = '';
    let rsCount    = '';
    let titleData  = '';
    let htmlData   = '';
    let invData    = '';
    const table    = 'invoice';
    const sql      = deps.sql;
    const aes128Encrypt   = deps.aes128Encrypt;
    const aes128Decrypt   = deps.aes128Decrypt;
    const aviaSecurityKey = deps.getNow().aviaSecurityKey;
    let   doc_number      = uid;

    if (mode === "input") {
        //sqlText    = `select * from invoice where uid = @code `;
        //sqlResult  = await pool.request().input('code',sql.Int , uid).query(sqlText);
        //row        = sqlResult.recordset?.[0];
    } else {
        //uid = data.uid;
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
            try{
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
        } else if (mode === "Invoice"){
            titleData = `<i class="fas fa-edit search-title-text" > 인보이스 <span class='font15'>${doc_number}</span></i>
                <div class='fr lm250'>
                <select name="savePos" id="savePos" class="form-control form-control-sm d-inline" style="width:100px;" >
                    <option value="print">프린트
                    <option value="email">이메일
                    <option value="image">이미지저장
                </select>
                <span class="btn btn-dark mb-1" style="padding:4px 10px;font-size:12px;" onClick="return filePrint()">전송하기</span>
                </div>
            `;
            const num = doc_number.slice(0,4);
            const img = `${deps.bbsImgName}/Inv/BBSIMG2/20${num}/${doc_number}.html`;
            const invData = await xmlOpen(img);
            htmlData  = `
                <div class="border regis-box shadow-sm menuArea" id="InvoiceData">
                    <div class="row">
                        <div class="col">
                            ${invData}
                        </div>
                    </div>	
                </div>
            `;
        } else if (mode === "saveImage") {
            try {
                const imageData = data.imageData || '';
                const saveUid = data.uid || uid || '';
                
                if (!imageData) {
                    msg = '이미지 데이터가 없습니다.';
                } else if (!saveUid) {
                    msg = '인보이스 번호가 없습니다.';
                } else {
                    // base64 데이터에서 헤더 제거
                    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
                    const imageBuffer = Buffer.from(base64Data, 'base64');
                    
                    // 파일 저장 경로 설정 (doc_number 사용)
                    const num = saveUid.slice(0, 4);
                    const saveDir = path.join(__dirname, '../../public/Inv/BBSIMG2', `20${num}`);
                    
                    // 디렉토리가 없으면 생성
                    if (!fs.existsSync(saveDir)) {
                        fs.mkdirSync(saveDir, { recursive: true });
                    }
                    
                    // 파일명: doc_number.png
                    const fileName = `${saveUid}.png`;
                    const filePath = path.join(saveDir, fileName);
                    
                    // 파일 저장
                    fs.writeFileSync(filePath, imageBuffer);
                    
                    // 저장된 파일 경로를 응답에 포함
                    const fileUrl = `/Inv/BBSIMG2/20${num}/${fileName}`;
                    res.json({ success: 'ok', fileUrl: fileUrl, fileName: fileName });
                    return;
                }
            } catch (error) {
                msg = '이미지 저장 중 오류가 발생했습니다: ' + error.message;
                console.error('이미지 저장 오류:', error);
            }
        }
    }
    if (msg) rs = 'no'; else rs = 'ok';
    
    res.json ({success: rs, errorMsg: msg , title: titleData , html: htmlData });
}