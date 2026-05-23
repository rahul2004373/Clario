import { parseSource } from './parser';
import { chunkText } from './chunker';
import { embedChunks } from './embedder';
import { storeChunks, clearSourceChunks } from './storer';
import type { SourceType } from '../../types';

export interface PipelineInput {
    s3Key: string;
    sourceId: string;
    workspaceId: string;
    fileType: SourceType;
    chatbotId?: string; // Optional: Link to chatbot on success
}

export interface PipelineResult {
    sourceId: string;
    chunkCount: number;
    charCount: number;
}

export type ProgressCallback = (step: string, pct: number) => void;

export async function runIngestionPipeline(
    input: PipelineInput,
    onProgress?: ProgressCallback
): Promise<PipelineResult> {
    const { s3Key, sourceId, workspaceId, fileType } = input;

    console.log(`[Pipeline] START sourceId=${sourceId} type=${fileType}`);

    // 1. Parse
    onProgress?.('parsing', 10);
    const rawText = await parseSource({ type: fileType, rawContentUrl: s3Key });
    if (!rawText) throw new Error('Parsed text is empty');
    console.log(`[Pipeline] SUCCESS Parsed ${rawText.length} characters`);

    // 2. Chunk
    onProgress?.('chunking', 30);
    const chunks = await chunkText(rawText, sourceId, workspaceId, { fileType, s3Key });
    if (chunks.length === 0) {
        console.warn('[Pipeline] No chunks created.');
        return { sourceId, chunkCount: 0, charCount: rawText.length };
    }
    console.log(`[Pipeline] SUCCESS ${chunks.length} chunks created`);

    // 3. Clear
    onProgress?.('clearing', 50);
    await clearSourceChunks(sourceId);

    // 4. Embed
    onProgress?.('embedding', 60);
    const embedded = await embedChunks(chunks);
    console.log(`[Pipeline] SUCCESS ${embedded.length} embeddings ready`);

    // 5. Store
    onProgress?.('storing', 85);
    await storeChunks(embedded);

    onProgress?.('done', 100);
    console.log(`[Pipeline] SUCCESS DONE sourceId=${sourceId} chunks=${embedded.length}`);

    return { sourceId, chunkCount: embedded.length, charCount: rawText.length };
}