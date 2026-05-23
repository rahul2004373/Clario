import { prisma } from '../db';
import { encrypt, decrypt, generateApiKey } from '../utils/crypto.util';

export class ApiKeyService {
    static async createKey(workspaceId: string, name: string) {
        const rawKey = generateApiKey();
        const encryptedKey = encrypt(rawKey);

        const newKey = await prisma.apiKey.create({
            data: {
                workspaceId,
                name,
                key: encryptedKey
            }
        });

        return {
            id: newKey.id,
            name: newKey.name,
            workspaceId: newKey.workspaceId,
            createdAt: newKey.createdAt,
            rawKey // Show raw key only ONCE during creation
        };
    }

    static async listKeys(workspaceId: string) {
        const keys = await prisma.apiKey.findMany({
            where: { workspaceId },
            orderBy: { createdAt: 'desc' }
        });

        return keys.map(k => {
            const rawKey = decrypt(k.key);
            return {
                id: k.id,
                name: k.name,
                workspaceId: k.workspaceId,
                createdAt: k.createdAt,
                lastUsedAt: k.lastUsedAt,
                key: rawKey // User requested key to be readable at all times
            };
        });
    }

    static async deleteKey(workspaceId: string, keyId: string) {
        const key = await prisma.apiKey.findFirst({
            where: { id: keyId, workspaceId }
        });

        if (!key) throw new Error('API key not found');

        return prisma.apiKey.delete({
            where: { id: keyId }
        });
    }

    static async validateKey(rawKey: string) {
        // With deterministic encryption, identical rawKeys produce identical ciphertexts.
        const encryptedKey = encrypt(rawKey);

        const key = await prisma.apiKey.findUnique({
            where: { key: encryptedKey }
        });

        if (!key) throw new Error('Invalid API Key');

        // Update last used at asynchronously
        prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(console.error);

        return key.workspaceId;
    }
}
