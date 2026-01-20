const xlsx   = require('xlsx');
const upload = require('../../src/common/uploadConfig'); // 경로만 맞으면 OK
const deps = require('../../src/common/dependencies');
const { uidNext } = require('../../src/utils/idxFunction');

module.exports = (req, res) => {

  // multer 미들웨어를 직접 호출하는 패턴
  upload.single('pic')(req, res, async (err) => {
    if (err) {
      console.error('[multer error]', err);
      return res.status(500).json({
        success: 'no',
        errorMsg: String(err.message || err)
      });
    }

    try {
      //console.log('BODY:', req.body);  // 일반 필드들
      //console.log('FILE:', req.file);  // 업로드 파일(없으면 undefined)
      const pool        = await deps.getPool();
      const sql         = deps.sql;
      const NOWSTIME    = deps.getNow().NOWSTIME;
      const { aircode, mode, orgMode } = req.body;
      const file = req.file;

      const sqlText = ` select bin_number from airline_binNumber where aircode = '${aircode}'  `; 
      const sqlResult = await pool.request().query(sqlText);
      const arrBin = [];
      for (const put of sqlResult.recordset) {
          let {bin_number} = put;
          arrBin.push(bin_number);
      }

      const workbook  = xlsx.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];        // 시트1
      const sheet     = workbook.Sheets[sheetName];

      const rows = xlsx.utils.sheet_to_json(sheet, {
          header: 1,   // [ [A1,B1,C1...], [A2,B2,...], ... ]
          defval: ''   // 빈칸은 '' 로
      });

      // 3) 완전 빈 행 제거
      const rawData = rows.filter(row =>
          Array.isArray(row) &&
          row.some(v => String(v).trim() !== '')
      );

      const parsed = rawData.map((row, idx) => {
          const code3      = String(row[0] || '').trim(); // 3코드
          const code2      = String(row[1] || '').trim(); // 2코드
          const binCardNo  = String(row[2] || '').trim(); // Bin 카드넘버
          const cardName   = String(row[3] || '').trim(); // 카드명
          const binNumber  = String(row[4] || '').trim(); // 빈넘버

          return {
              rowNo: idx + 1,
              code3,
              code2,
              binCardNo,
              cardName,
              binNumber
          };    
      }).filter(r =>
          r.code3 || r.code2 || r.binCardNo || r.cardName || r.binNumber
      );
      const totalRows = parsed.length;
      const arrSql    = [];
      const binSet    = new Set(arrBin || []); 
      let   uid       = await uidNext("airline_binNumber",pool);
      let   newCount  = 0;
      for (let ix = 1 ; ix < totalRows ; ix ++) {
          const code3     = parsed[ix].code3;      
          const code2     = parsed[ix].code2;      
          const binCardNo = parsed[ix].binCardNo;      
          const cardName  = parsed[ix].cardName;      
          const binNumber = parsed[ix].binNumber; 
          if (!binNumber) continue;
          if (binSet.has(binNumber)) continue;
          binSet.add(binNumber);
          arrSql.push(` ( '${uid}','${aircode}', '${code3}','${code2}','${binCardNo}','${cardName}','${binNumber}' , '${NOWSTIME}') `);
          uid ++;
          newCount ++;
      }

      for (let ix = 0 ; ix < arrSql.length ; ix = ix + 999) {
        const chunk = arrSql.slice(ix, ix + 999);  // 최대 999개씩 자르기

        if (!chunk.length) continue;
        const sql = ` INSERT INTO airline_binNumber (uid, aircode, aircode2, binCode, binCompany, binCompanyName, bin_number, up_date)
                VALUES ${chunk.join(',')}
        `;
        await pool.request().query(sql);

      }
      return res.json({ success: 'ok', newCount: newCount   });
    } catch (e) {
      console.error('[binSave2 logic error]', e);
      return res.status(500).json({
        success: 'no',
        errorMsg: String(e.message || e)
      });
    }
  });
};