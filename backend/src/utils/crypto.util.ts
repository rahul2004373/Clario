import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = crypto.scryptSync(env.API_KEY_SECRET, 'clairo-salt', 32);
// Use a fixed, deterministic IV so that identical keys produce identical ciphertexts.
// This allows us to query the database efficiently (O(1) lookup) without decrypting every row.
const FIXED_IV = crypto.scryptSync(env.API_KEY_SECRET, 'fixed-iv-salt', 16); 

export function encrypt(text: string): string {
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, FIXED_IV);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

export function decrypt(encryptedText: string): string {
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, FIXED_IV);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export function generateApiKey(): string {
    const randomHex = crypto.randomBytes(24).toString('hex');
    return `cl_sk_${randomHex}`;
}
