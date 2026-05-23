import { fetchFromS3 } from '../../../services/storage.service';

// pdf-parse@2.4.5 exports a class PDFParse
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse');

export async function parsePdf(s3Key: string): Promise<string> {
    if (typeof PDFParse !== 'function') {
        throw new Error('pdf-parse could not be loaded correctly. PDFParse is missing.');
    }
    const buffer = await fetchFromS3(s3Key);
    const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const parser = new PDFParse(uint8Array);
    const result = await parser.getText();
    // Assuming result has a .text property, or is the text itself.
    const rawText = typeof result === 'string' ? result : result.text || JSON.stringify(result);
    return rawText.replace(/\s+/g, ' ').trim();
}