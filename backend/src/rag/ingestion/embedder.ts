import { env } from "../../config/env";
import { traceRagFunction } from "../observability";
import type { EmbeddedChunk, RawChunk } from "../types";

function ensureEmbeddingUrl() {
  if (!env.EMBEDDING_MODEL_URL) {
    throw new Error("EMBEDDING_MODEL_URL is required for embeddings");
  }
}

function normalizeEmbedding(values: number[]): number[] {
  if (values.length !== env.RAG_VECTOR_DIMENSION) {
    throw new Error(
      `Embedding API returned a vector of size ${values.length}, but RAG_VECTOR_DIMENSION is configured as ${env.RAG_VECTOR_DIMENSION}. ` +
        `Configure your database schema and env.RAG_VECTOR_DIMENSION to match your embedding model.`
    );
  }
  return values;
}

async function fetchEmbedding(content: string): Promise<number[]> {
  ensureEmbeddingUrl();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  try {
    response = await fetch(env.EMBEDDING_MODEL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ content }),
      signal: controller.signal
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Embedding service request failed for ${env.EMBEDDING_MODEL_URL}: ${message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Embedding request failed with HTTP ${response.status}`);
  }

  const payload: any = await response.json();
  const embedding =
    (Array.isArray(payload.embedding) && payload.embedding) ||
    (Array.isArray(payload.data?.embedding) && payload.data.embedding) ||
    (Array.isArray(payload.values) && payload.values) ||
    (Array.isArray(payload.data) ? payload.data : null);

  if (!Array.isArray(embedding)) {
    throw new Error("Embedding API did not return a valid embedding array");
  }

  return normalizeEmbedding(embedding.map((value: number) => Number(value)));
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const limit = Math.max(1, concurrency);
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function runWorker() {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runWorker()));
  return results;
}

async function embedChunksImpl(chunks: RawChunk[], batchSize = env.RAG_EMBED_BATCH_SIZE): Promise<EmbeddedChunk[]> {
  if (chunks.length === 0) {
    return [];
  }

  const embeddings = await mapWithConcurrency(chunks, batchSize, async (chunk) => fetchEmbedding(chunk.content));

  return chunks.map((chunk, index) => ({
    ...chunk,
    embedding: embeddings[index]
  }));
}

export const embedText = traceRagFunction("rag.embedText", "tool", fetchEmbedding);
export const embedChunks = traceRagFunction("rag.embedChunks", "tool", embedChunksImpl);
