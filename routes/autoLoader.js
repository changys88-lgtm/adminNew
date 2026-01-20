// routes/autoLoader.js
const fs = require('fs');
const path = require('path');

module.exports = (app) => {
  const routePath = path.join(__dirname);
  fs.readdirSync(routePath).forEach(file => {
    if (file === 'autoLoader.js') return;
    const route = require(`./${file}`);
    app.use(`/${file.replace('.js', '')}`, route);
  });
};