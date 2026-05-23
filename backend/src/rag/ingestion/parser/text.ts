import { fetchFromS3 } from '../../../services/storage.service';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export async function parseText(
    rawContentUrl: string | null,
    rawText?: string | null
): Promise<string> {
    if (rawText) return rawText.trim();
    const buffer = await fetchFromS3(rawContentUrl!);
    return buffer.toString('utf-8').trim();
}

export async function parseUrl(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching: ${url}`);
    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();
    if (!article?.textContent) throw new Error('Could not extract readable text from URL');
    return article.textContent.replace(/\s+/g, ' ').trim();
}