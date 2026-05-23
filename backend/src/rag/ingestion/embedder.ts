import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import { env } from '../../config/env';
import type { RawChunk, EmbeddedChunk } from '../../types';
import { withGeminiRetry } from '../../utils/geminiRetry';

// ── Gemini Configuration ─────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');

const EMBEDDING_MODEL = 'gemini-embedding-001';

/**
 * Modular Embedder
 * Updated for gemini-embedding-001 (3072 dimensions) using v1beta endpoint.
 * Wrapped with Gemini retry resilience to guard against 429 rate limits.
 */

export async function embedChunks(
    chunks: RawChunk[],
    batchSize = 50 // Reduced default batch size slightly to be safer under TPM limits
): Promise<EmbeddedChunk[]> {
    const model = genAI.getGenerativeModel(
        { model: EMBEDDING_MODEL },
        { apiVersion: 'v1beta' }
    );
    const results: EmbeddedChunk[] = [];

    console.log(`[Embedder] Sending ${chunks.length} chunks to Gemini (gemini-embedding-001)...`);

    for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);

        try {
            // Wrap the batch request with retry logic
            const result = await withGeminiRetry(async () => {
                return await model.batchEmbedContents({
                    requests: batch.map(c => ({
                        content: { role: 'user', parts: [{ text: c.content }] },
                        taskType: TaskType.RETRIEVAL_DOCUMENT,
                    })),
                });
            });

            if (!result.embeddings) throw new Error('Gemini returned no embeddings');

            for (let j = 0; j < batch.length; j++) {
                results.push({
                    ...batch[j],
                    embedding: result.embeddings[j].values,
                });
            }

            console.log(`[Embedder] Progress: ${results.length}/${chunks.length}`);

            // Respect free tier rate limits (15 RPM -> keep a small gap between batches)
            if (i + batchSize < chunks.length) {
                await new Promise(res => setTimeout(res, 1200));
            }
        } catch (err: any) {
            console.error('[Embedder] Batch failed:', err.message);
            throw err;
        }
    }

    return results;
}

export async function embedQuery(text: string): Promise<number[]> {
    const model = genAI.getGenerativeModel(
        { model: EMBEDDING_MODEL },
        { apiVersion: 'v1beta' }
    );

    // Wrap single query embedding in rate-limit retry logic
    const result = await withGeminiRetry(async () => {
        return await model.embedContent({
            content: { role: 'user', parts: [{ text }] },
            taskType: TaskType.RETRIEVAL_QUERY,
        });
    });

    return result.embedding.values;
}