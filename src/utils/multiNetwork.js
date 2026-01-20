const axios = require('axios');

/**
 * 여러 개의 HTTP 요청을 병렬로 실행 (GET 또는 POST)
 * @param {Array} requests - { url: string, method?: 'get'|'post', data?: object, headers?: object }
 * @returns {Promise<Array>} 응답 배열 (성공/실패 구분 포함)
 */
async function multiCurl(requests) {
    const results = await Promise.all(
        requests.map(async (req) => {
            try {
                const method = req.method?.toLowerCase() || 'post';
                const config = {
                    method,
                    url: req.url,
                    headers: req.headers || {},
                    data: req.data || undefined,
                    timeout: req.timeout || 10000
                };
                const res = await axios(config);
                return { success: true, data: res.data };
            } catch (err) {
                return {
                    success: false,
                    error: err.message,
                    url: req.url
                };
            }
        })
    );
    return results;
}
  
async function xmlOpen(url) {
    const responce = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000,
        maxRedirects: 5,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
        },
        validateStatus: s => s >= 200 && s < 400,
    });
    return responce.data;
}
module.exports = {
    multiCurl,
    xmlOpen
};