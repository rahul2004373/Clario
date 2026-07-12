import { traceRagFunction } from "../observability";
import type { EmbeddedChunk } from "../types";
import { deleteChunksBySource, upsertChunks } from "../retrieval/vector-store";

async function storeChunksImpl(chunks: EmbeddedChunk[]): Promise<void> {
  await upsertChunks(chunks);
}

async function clearSourceChunksImpl(sourceId: string): Promise<void> {
  await deleteChunksBySource(sourceId);
}

export const storeChunks = traceRagFunction("rag.storeChunks", "tool", storeChunksImpl);
export const clearSourceChunks = traceRagFunction("rag.clearSourceChunks", "tool", clearSourceChunksImpl);
