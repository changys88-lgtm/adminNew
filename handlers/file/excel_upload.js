const xlsx = require('xlsx');
const upload = require('../../src/common/uploadConfig');
// Express handler
module.exports = [
    upload.single('pic'), // input name="excel"
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ result: 'FAIL', msg: '파일이 없습니다.' });
        }
  
        // 1) 버퍼에서 엑셀 읽기
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
  
        // 2) 첫 번째 시트 사용 (필요하면 시트명 파라미터로 받게 변경 가능)
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
  
        // 3) 시트를 JSON으로 변환
        //   - header: 1 → 2차원 배열로 먼저 받고, 첫 줄을 컬럼명으로 쓸 수도 있음
        //   - 여기서는 sheet_to_json으로 바로 객체 배열로 변환
        const rows = xlsx.utils.sheet_to_json(worksheet, {
          defval: '',   // 빈칸은 '' 로
          raw: false    // 날짜 등은 포맷된 값으로
        });
  
        // rows 예시:
        // [
        //   { '이름': '홍길동', '나이': 20, '전화번호': '010-1234-5678' },
        //   ...
        // ]
  
        // 여기서 DB insert / update 등 원하는 작업 하면 됨
        // 예: MSSQL bulk insert 준비용
        /*
        for (const row of rows) {
          // 컬럼명 매핑 예시
          const name = row['이름'];
          const age  = row['나이'];
          // ... SQL 구성
        }
        */
  
        return res.json({
          result: 'OK',
          count: rows.length,
          data: rows.slice(0, 20) // 테스트로 앞 20개만 응답
        });
  
      } catch (err) {
        console.error('[excel_upload] error:', err);
        return res.status(500).json({
          result: 'FAIL',
          msg: '엑셀 처리 중 오류가 발생했습니다.',
          error: String(err.message || err)
        });
      }
    }
  ];