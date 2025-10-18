import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const keyLength = 32; // 256 bits
const ivLength = 16; // 128 bits

/**
 * Generate a random key
 */
export function generateKey(): string {
  return crypto.randomBytes(keyLength).toString('hex');
}

/**
 * Generate a random IV
 */
function generateIv(): Buffer {
  return crypto.randomBytes(ivLength);
}

/**
 * Encrypt text
 */
export function encrypt(text: string, key: string): string {
  try {
    const iv = generateIv();
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt text
 */
export function decrypt(encryptedText: string, key: string): string {
  try {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encrypted = textParts.join(':');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed');
  }
}

/**
 * Hash text
 */
export function hash(text: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(text, actualSalt, 10000, 64, 'sha512').toString('hex');
  return actualSalt + ':' + hash;
}

/**
 * Verify hash
 */
export function verifyHash(text: string, hashedText: string): boolean {
  const [salt, hash] = hashedText.split(':');
  const newHash = crypto.pbkdf2Sync(text, salt, 10000, 64, 'sha512').toString('hex');
  return hash === newHash;
}

/**
 * Generate a random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a UUID
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}