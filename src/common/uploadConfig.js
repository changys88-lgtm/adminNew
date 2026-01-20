// uploadConfig.js
const multer = require('multer');

// 메모리 저장소 사용
const storage = multer.memoryStorage();

// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB 제한 (원하면 조절)
//   },
//   fileFilter: (req, file, cb) => {
//     // 엑셀 MIME 타입 체크 (대충 xlsx / xls 허용)
//     const allowed = [
//       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//       'application/vnd.ms-excel'
//     ];
//     if (!allowed.includes(file.mimetype)) {
//       return cb(new Error('엑셀 파일만 업로드 가능합니다.'));
//     }
//     cb(null, true);
//   }
// });

const upload = multer ({
    storage
})

module.exports = upload;