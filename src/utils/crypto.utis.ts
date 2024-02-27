import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);

// Função para criptografar uma string
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Função para descriptografar uma string
export function decrypt(text: string): string {
  let textParts = text.split(':');
  let ivString = textParts.shift();
  if (!ivString) {
    throw new Error('Invalid encrypted text. IV is missing.');
  }
  let iv = Buffer.from(ivString, 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

// // Testando as funções
// const message = 'Hello, World!';

// const encryptedMessage = encrypt(message);
// console.log('Encrypted Message: ', encryptedMessage);

// const decryptedMessage = decrypt(encryptedMessage);
// console.log('Decrypted Message: ', decryptedMessage);
