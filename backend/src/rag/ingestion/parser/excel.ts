import { fetchFromS3 } from '../../../services/storage.service';
import XLSX from 'xlsx';

export async function parseExcel(s3Key: string): Promise<string> {
    const buffer = await fetchFromS3(s3Key);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let text = '';
    
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        // Convert sheet to CSV to keep matrix format readable for LLM context
        const csv = XLSX.utils.sheet_to_csv(sheet);
        if (csv.trim()) {
            text += `\nSheet: ${sheetName}\n${csv}\n`;
        }
    }
    return text.trim();
}
