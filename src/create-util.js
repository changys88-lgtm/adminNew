#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const utilName = process.argv[2];
if (!utilName) {
  console.error('❌ 사용할 유틸 이름을 입력하세요: node create-util timeUtil');
  process.exit(1);
}

const utilsDir = path.join(__dirname, 'utils');
const filePath = path.join(utilsDir, `${utilName}.js`);
const indexPath = path.join(utilsDir, 'index.js');

if (fs.existsSync(filePath)) {
  console.error(`❌ 이미 ${utilName}.js 파일이 존재합니다.`);
  process.exit(1);
}

// 1. 새 유틸 파일 생성
fs.writeFileSync(filePath, 
`// ${utilName}.js
exports.${utilName} = () => {
  console.log('${utilName} 함수입니다.');
};
`, 'utf8');

// 2. index.js에 자동 등록
let indexCode = '';
if (fs.existsSync(indexPath)) {
  indexCode = fs.readFileSync(indexPath, 'utf8');
} else {
  indexCode = '// 🔄 이 파일은 create-util.js로 자동 생성됨\n\nmodule.exports = {};\n';
}

if (!indexCode.includes(utilName)) {
  const requireLine = `const { ${utilName} } = require('./${utilName}');\n`;
  const exportInsert = `. ${utilName},\n`;

  // insert require
  indexCode = requireLine + indexCode;

  // insert into module.exports
  indexCode = indexCode.replace(
    /module\.exports = {([^}]*)}/,
    (match, exportsBlock) => {
      return `module.exports = {${exportsBlock}${exportInsert}};`;
    }
  );

  fs.writeFileSync(indexPath, indexCode, 'utf8');
}

console.log(`✅ ${utilName}.js 유틸 생성 완료!`);
