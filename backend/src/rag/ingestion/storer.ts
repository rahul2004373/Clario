// Thin layer over vectorStore — swap storage backend here without touching pipeline
import { upsertChunks, deleteChunksBySource } from './vectorStore';
import type { EmbeddedChunk } from '../../types';

export async function storeChunks(chunks: EmbeddedChunk[]): Promise<void> {
    await upsertChunks(chunks);
}

export async function clearSourceChunks(sourceId: string): Promise<void> {
    await deleteChunksBySource(sourceId);
}