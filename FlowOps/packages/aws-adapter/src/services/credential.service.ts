import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const DEFAULT_LOCAL_KEY = crypto.createHash('sha256').update('flowops-local-dev-secret-key-32b').digest();

export class CredentialService {
  private encryptionKey: Buffer;

  constructor(customKey?: string) {
    if (customKey) {
      this.encryptionKey = crypto.createHash('sha256').update(customKey).digest();
    } else if (process.env.SECRET_ENCRYPTION_KEY) {
      this.encryptionKey = crypto.createHash('sha256').update(process.env.SECRET_ENCRYPTION_KEY).digest();
    } else {
      this.encryptionKey = DEFAULT_LOCAL_KEY;
    }
  }

  encryptSecret(plainText: string): { cipherText: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');

    return {
      cipherText: encrypted,
      iv: iv.toString('hex'),
      tag,
    };
  }

  decryptSecret(cipherText: string, ivHex: string, tagHex: string): string {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      this.encryptionKey,
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(cipherText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  maskSecret(raw: string): string {
    if (!raw || raw.length < 4) return '••••';
    const last4 = raw.slice(-4);
    return `••••••••${last4}`;
  }
}
