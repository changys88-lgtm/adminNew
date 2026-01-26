module.exports = {
  mainConfig: {
    user: 'scmaster',
    password: 'changys8!!',
    server: '118.67.128.195',
    database: 'OYE2021',
    options: {
      encrypt: false,
      enableArithAbort: true
    }
  },
  dbConfig: {
    user: 'scmaster',
    password: 'changys8!!',
    //server: '49.50.164.166',
    server: '127.0.0.1',
    database: 'OYE2021',
    options: {
      encrypt: false,
      enableArithAbort: true
    }
  },
  blockedIP: '39.115.246.149',
  getNow: () => {
    const now  = new Date();
    const Week = now.getDay();
    const pad  = n => String(n).padStart(2, '0');
    const YY   = now.getFullYear();
    const MM   = pad(now.getMonth() + 1);
    const DD   = pad(now.getDate());
    const HH   = pad(now.getHours());
    const mm   = pad(now.getMinutes());
    const ss   = pad(now.getSeconds());
    return {
      NOWS: YY+MM+DD,
      NOWSTIME: YY+MM+DD+HH+mm+ss,
      TIME:HH+mm+ss,
      aviaSecurityKey: '2694951167022700',
      Week, YY , MM , DD 
    };
  },
  bbsImgName : 'https://oyeglobal.gcdn.ntruss.com',
  searchUrl  : 'http://127.0.0.1:3001',
  hubGds     : 'hubGalileo.dbo.',
  hubSabre   : 'hubSabre.dbo.',
  hubDom     : 'AirDcJeju.dbo.',
  googleKey  : 'AIzaSyCindMjIQCYh92KIUYwK7e8Gp-IS7HSWm4',
  pool: {
    max: 5,                   // 최대 동시 연결 수 (트래픽에 따라 조정)
    min: 0,                    // 최소 커넥션 수
    idleTimeoutMillis: 30000  // 사용 안 한 커넥션의 자동 정리 시간 (30초)
  }
};