const fs = require('fs');
const path = require('path');

function loadJSON(file) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'));
}

module.exports = {
  erpMenuArea: loadJSON('erpMenuArea.json'),
  //erpRoleList: loadJSON('role.json'),
  //erpDeptList: loadJSON('dept.json'),
};