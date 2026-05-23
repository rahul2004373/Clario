// Router — picks the right parser based on source type
import { parsePdf } from './parser/pdf';
import { parseDoc } from './parser/doc';
import { parseText, parseUrl } from './parser/text';
import { parseExcel } from './parser/excel';
import type { SourceType } from '../../types';

export interface ParseInput {
    type: SourceType;
    rawContentUrl: string | null;
    rawText?: string | null;
}

export async function parseSource(source: ParseInput): Promise<string> {
    switch (source.type) {
        case 'pdf':
            return parsePdf(source.rawContentUrl!);

        case 'docx':
            return parseDoc(source.rawContentUrl!);

        case 'text':
            return parseText(source.rawContentUrl, source.rawText);

        case 'url':
            return parseUrl(source.rawContentUrl!);

        case 'xlsx':
            return parseExcel(source.rawContentUrl!);

        default:
            throw new Error(`Unsupported source type: ${source.type}`);
    }
}