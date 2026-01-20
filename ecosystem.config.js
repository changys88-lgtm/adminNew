module.exports = {
  apps: [{
    name: 'admin',
    script: 'D:/WEBDATA/NODE/admin/server.js',
    instances: 1,                 // 1 이상이면 cluster 모드 가능
    watch: true,                  // 변경 감지
    watch_delay: 1000,            // 변경 후 지연(ms) 뒤 재시작
    ignore_watch: [               // 감시 제외(필수)
      'node_modules',
      'logs',
      '*.log',
      '.git',
      '.cache',
      'tmp'
    ],
    watch_options: {              // 윈도우/네트워크 드라이브 안정화
      usePolling: true,
      interval: 1000,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      }
    },
    max_restarts: 10,
    restart_delay: 2000,
    autorestart: true,

    // 로그
    out_file: 'D:/WEBDATA/NODE/admin/logs/out.log',
    error_file: 'D:/WEBDATA/NODE/admin/logs/error.log',
    merge_logs: true,
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',

    env: { NODE_ENV: 'production' }
  }]
}