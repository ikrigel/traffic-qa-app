import crypto from 'crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-key';

// Normalize key to 32 bytes for AES-256
function getNormalizedKey(): Buffer {
  const hash = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  return hash.slice(0, 32);
}

// Hash API key for duplicate detection (non-reversible)
export function hashApiKey(key: string): string {
  return crypto
    .createHash('sha256')
    .update(key)
    .digest('hex');
}

// Encrypt API key for storage
export function encryptApiKey(key: string): {
  encrypted: string;
  hash: string;
  iv: string;
  authTag: string;
} {
  try {
    const iv = crypto.randomBytes(16);
    const normalizedKey = getNormalizedKey();

    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, normalizedKey, iv);
    let encrypted = cipher.update(key, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      hash: hashApiKey(key),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt API key');
  }
}

// Decrypt API key from storage
export function decryptApiKey(
  encrypted: string,
  iv: string,
  authTag: string
): string {
  try {
    const normalizedKey = getNormalizedKey();
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      normalizedKey,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt API key');
  }
}

// Store in single JSON format for database
export function encryptAndPackageKey(
  key: string
): string {
  const { encrypted, hash, iv, authTag } = encryptApiKey(key);
  return JSON.stringify({
    encrypted,
    hash,
    iv,
    authTag,
  });
}

// Extract and decrypt from database format
export function decryptPackagedKey(packagedKey: string): string {
  try {
    const { encrypted, iv, authTag } = JSON.parse(packagedKey);
    return decryptApiKey(encrypted, iv, authTag);
  } catch (error) {
    console.error('Failed to parse packaged key:', error);
    throw new Error('Invalid API key format');
  }
}
