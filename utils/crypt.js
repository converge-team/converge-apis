const crypto = require('crypto');

const algorithm = process.env.CRYPTO_ALGORITHM;
const password = process.env.CRYPTO_PASSWORD;

var key;

crypto.scrypt(password, process.env.CRYPTO_SALT, 24, (err, derivedKey) => {
    key = derivedKey;
});

const iv = Buffer.alloc(16, 0);

exports.createCipher = (string) => {
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(string, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
}

exports.decipherHash = (encrypted) => {
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}