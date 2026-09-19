const crypto = require('node:crypto');
const fs = require('node:fs');
const readline = require('node:readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => {
        rl.question(question, resolve);
    });
}

async function main() {
    try {
        // Read plaintext .env
        const envText = fs.readFileSync('.env', 'utf8');

        // Manually enter encryption key
        const password = await ask('Enter encryption key: ');

        // Random values
        const salt = crypto.randomBytes(16);
        const iv = crypto.randomBytes(12);

        // Turn your password into a 32-byte key
        const key = crypto.scryptSync(password, salt, 32);

        // AES-256-GCM encryption
        const cipher = crypto.createCipheriv(
            'aes-256-gcm',
            key,
            iv
        );

        const encrypted = Buffer.concat([
            cipher.update(envText, 'utf8'),
            cipher.final()
        ]);

        // Authentication tag
        const authTag = cipher.getAuthTag();

        // Save:
        // salt + iv + authTag + encrypted data
        const output = Buffer.concat([
            salt,
            iv,
            authTag,
            encrypted
        ]).toString('base64');

        fs.writeFileSync('.env.enc', output);

        console.log('\n.env encrypted successfully.');
        console.log('.env.enc created.');
    } catch (error) {
        console.error('Encryption failed:', error.message);
    }

    rl.close();
}

main();
