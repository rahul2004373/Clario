import { fetchFromS3 } from '../../../services/storage.service';
import mammoth from 'mammoth';

export async function parseDoc(rawContentUrl: string): Promise<string> {
    const buffer = await fetchFromS3(rawContentUrl);
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
}