const sql = require('mssql');
const { mainConfig , dbConfig} = require('../lib/config');  // DB 접속 정보 파일

let pool     = null;
let mainPool = null;

let poolPromise;

async function getPool() {
    if (!poolPromise) {
        poolPromise = new sql.ConnectionPool(dbConfig)
          .connect()
          .then(p => {
            console.log("MSSQL POOL CREATED", process.pid);
            return p;
        })
        .catch(err => {
            poolPromise = null; // 실패 시 초기화
            throw err;
        });
    }
    return poolPromise;
}

async function getMainPool() {
    if (mainPool) return mainPool;

    try {
        mainPool = await sql.connect(mainConfig);
        console.log('✅ MSSQL main 연결 풀 생성됨');
        return mainPool;
    } catch (err) {
        console.error('❌ MSSQL main 연결 실패:', err);
        throw err;
    }
}

module.exports = {
    sql,
    getMainPool,
    getPool
};