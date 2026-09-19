const crypto = require('node:crypto');

const FILEKEY = process.env.FILEKEY;

if (!FILEKEY) {
    throw new Error('FILEKEY is not loaded.');
}

function encrypt(text) {
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);

    const key = crypto.scryptSync(FILEKEY, salt, 32);

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([
        salt,
        iv,
        authTag,
        encrypted
    ]).toString('base64');
}

function decrypt(data) {
    const buffer = Buffer.from(data, 'base64');

    const salt = buffer.subarray(0, 16);
    const iv = buffer.subarray(16, 28);
    const authTag = buffer.subarray(28, 44);
    const encrypted = buffer.subarray(44);

    const key = crypto.scryptSync(FILEKEY, salt, 32);

    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        iv
    );

    decipher.setAuthTag(authTag);

    return Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ]).toString('utf8');
}

module.exports = {
    encrypt,
    decrypt
};
