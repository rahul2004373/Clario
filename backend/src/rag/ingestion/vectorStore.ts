import { vectorDB } from '../../db';
import type { EmbeddedChunk, SimilarityResult } from '../../types';

export async function upsertChunks(chunks: EmbeddedChunk[]): Promise<void> {
    if (!chunks.length) return;

    const rows = chunks.map(c => ({
        source_id: c.sourceId,
        workspace_id: c.workspaceId,
        content: c.content,
        chunk_index: c.chunkIndex,
        token_count: c.tokenCount,
        embedding: c.embedding,
        metadata: c.metadata,
    }));

    // Insert in batches of 100
    for (let i = 0; i < rows.length; i += 100) {
        const { error } = await vectorDB.from('chunks').insert(rows.slice(i, i + 100));
        if (error) throw new Error(`[VectorStore] Upsert failed: ${error.message}`);
    }

    console.log(`[VectorStore] ✓ Stored ${chunks.length} chunks`);
}

export async function deleteChunksBySource(sourceId: string): Promise<void> {
    const { error } = await vectorDB.from('chunks').delete().eq('source_id', sourceId);
    if (error) throw new Error(`[VectorStore] Delete failed: ${error.message}`);
}

export async function similaritySearch(
    queryEmbedding: number[],
    workspaceId: string,
    sourceIds: string[] | null = null,
    topK = 5,
    threshold = 0.5
): Promise<SimilarityResult[]> {
    const { data, error } = await vectorDB.rpc('match_chunks', {
        query_embedding: queryEmbedding,
        p_workspace_id: workspaceId,
        p_source_ids: sourceIds,
        match_count: topK,
        match_threshold: threshold,
    });
    if (error) throw new Error(`[VectorStore] Search failed: ${error.message}`);
    return (data ?? []) as SimilarityResult[];
}