import process from 'process';
import crypto from 'crypto';

const cryptoAlgorithm = 'aes-256-ctr';
const cryptoKey = process.env.cryptokey || 'MUSTSETCRYPTOKEY';

function encryptText(text) {
  const cipher = crypto.createCipher(cryptoAlgorithm, cryptoKey);
  let result = cipher.update(text, 'utf8', 'hex');
  result += cipher.final('hex');
  return result;
}

function decryptText(text) {
  const decipher = crypto.createDecipher(cryptoAlgorithm, cryptoKey);
  let result = decipher.update(text, 'hex', 'utf8');
  result += decipher.final('utf8');
  return result;
}

export {
  encryptText,
  decryptText
};
