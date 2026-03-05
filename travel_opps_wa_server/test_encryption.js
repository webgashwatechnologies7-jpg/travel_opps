const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = 'your_secret_key_here';
const testData = JSON.stringify({ creds: { noiseKey: { private: 'abc', public: 'def' } } });

function encrypt(text) {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

function decrypt(ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

try {
    console.log('Original Data:', testData);
    const encrypted = encrypt(testData);
    console.log('Encrypted Data:', encrypted);
    const decrypted = decrypt(encrypted);
    console.log('Decrypted Data:', decrypted);

    if (testData === decrypted) {
        console.log('TEST PASSED: Encryption and Decryption are working correctly.');
    } else {
        console.error('TEST FAILED: Decrypted data does not match original.');
    }
} catch (error) {
    console.error('TEST FAILED with error:', error.message);
}
