const crypto = require('crypto');

function aes128Encrypt(key, data) {
    if (!key || key.length !== 16) {
        key = crypto.createHash('md5').update(key).digest();
    }
    if (!data) return '';
    const iv = Buffer.alloc(16, 0); // \0 * 16
    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return encrypted;
}

function aes128Decrypt(key, data) {
    // 공백을 '+'로 처리

    data = data.replace(/ /g, '+');
    if (!data) return '';
    const encryptedData = Buffer.from(data, 'base64');

    if (!key || key.length !== 16) {
        key = crypto.createHash('md5').update(key).digest();
    }

    const iv = Buffer.alloc(16, 0);
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

module.exports = {
    aes128Encrypt,
    aes128Decrypt
};