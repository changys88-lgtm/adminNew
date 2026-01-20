const express           = require('express');
//const multer          = require('multer');
//const upload          = multer();
//const sql             = require('mssql');
const fs              = require('fs');
const cookieParser      = require('cookie-parser');
const app               = express();
const port              = 3001;
const path              = require('path');
const vhost             = require('vhost');
const livereload        = require('livereload');
const connectLivereload = require('connect-livereload');

// const { dbConfig, blockedIP, getNow } = require('./lib/config');

app.locals.domeClassVersion = fs
  .statSync(path.join(__dirname, 'public/scripts/domeClass.js'))
  .mtime.getTime();
app.locals.airBookVersion = fs
  .statSync(path.join(__dirname, 'public/scripts/airBook.js'))
  .mtime.getTime();


// 1. livereload 서버 켜기 (파일 감시용)
//const liveReloadServer = livereload.createServer();
//liveReloadServer.watch(path.join(__dirname, 'public')); // CSS/JS 경로

// 2. 브라우저 요청에 livereload 스크립트 주입
//app.use(connectLivereload());

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(cookieParser()); // 
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//app.use(upload.none());

//require('./routes/autoLoader')(app); // 자동 로딩
//module.exports = app;
app.get('/', async (req, res) => {
    //console.log(`domain: ${req.headers.host}`)
    res.render('index');
});
app.get('/dashboard', async (req, res) => {
  const userName = req.cookies?.AviaLoginName || 'GUEST';
  res.render('dashboard',{ userName });
});
app.get('/interSearch/Search', async (req, res) => {
  const searchFrameNumber = req.query.searchFrameNumber;
  res.render('interSearch/Search',{ searchFrameNumber });
});

app.get('/logout', (req, res) => {
  res.clearCookie('AviaLoginId');
  res.clearCookie('aviaAuthorizedKey');
  res.clearCookie('b2bSiteCode');
  res.clearCookie('b2bMasterSite');
  res.clearCookie('b2bMASTER');
  res.clearCookie('b2bGrade');
  res.clearCookie('AviaLoginName');  
  res.redirect('/'); // 또는 메인 페이지
});
app.all('/gdsSearch/:file', async (req, res) => {
  const { file } = req.params;
  try {
    const handlerPath = path.join(__dirname, 'handlers', 'gdsSearch', `${file}.js`);
    const handler = require(handlerPath);
    await handler(req, res);
  } catch (err) {
    console.error(`[ERROR3] gdsSearch/${file} 처리 실패:`, err);
    res.status(404).send(`<h2>gdsSearch/${file} 경로를 찾을 수 없습니다.</h2>`);
  }
});
app.get('/:folder/:file', async (req, res) => {
  const { folder, file } = req.params;
  try {
    const uid = req.query.uid;
    const order_num = req.query.order_num;
    res.render(`${folder}/${file}`, { uid , order_num  });
  } catch (err) {
    console.error(`[ERROR4] ${folder}/${file} 처리 실패:`, err);
    res.status(404).send(`<h2>${folder}/${file} 경로를 찾을 수 없습니다.</h2>`);
  }
});
// catch-all 동적 라우팅
app.all('/:folder/:action', async (req, res) => {
    const { folder, action } = req.params;
    try {
      //console.log(folder + action);
      const handlerPath = path.join(__dirname, 'handlers', folder, `${action}.js`);
      const handler = require(handlerPath);
      await handler(req, res);
    } catch (err) {
      console.error(`[ERROR2] ${folder}/${action} 처리 실패:`, err);
      res.status(404).send(`<h2>${folder}/${action} 경로를 찾을 수 없습니다.</h2>`);
    }
});
app.all('/:action', async (req, res) => {
    const action = req.params.action;

    try {
        const handlerPath = path.join(__dirname, 'handlers', `${action}.js`);
        const handler = require(handlerPath);
        await handler(req, res);
    } catch (err) {
        console.error(`[ERROR1] ${action} 처리 실패:`, err);
        res.status(404).send(`<h2>${action} 경로를 찾을 수 없습니다.</h2>`);
    }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});