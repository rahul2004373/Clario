import { createClient } from "@supabase/supabase-js";
import { env } from "../../config/env";
import { traceRagFunction } from "../observability";
import type { EmbeddedChunk, SimilarityResult } from "../types";

let supabaseClient: any = null;

function assertVectorDimension(vector: number[], context: string) {
  if (vector.length !== env.RAG_VECTOR_DIMENSION) {
    throw new Error(
      `${context} has ${vector.length} dimensions, but RAG_VECTOR_DIMENSION is ${env.RAG_VECTOR_DIMENSION}. ` +
        `Update Supabase column "embedding" to vector(${env.RAG_VECTOR_DIMENSION}) or change RAG_VECTOR_DIMENSION to match your embedding model.`
    );
  }
}

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  return supabaseClient;
}

async function upsertChunksImpl(chunks: EmbeddedChunk[]): Promise<void> {
  if (chunks.length === 0) {
    return;
  }

  const supabase: any = getSupabaseClient();
  const rows = chunks.map((chunk) => ({
    source_id: chunk.sourceId,
    workspace_id: chunk.workspaceId,
    content: chunk.content,
    chunk_index: chunk.chunkIndex,
    token_count: chunk.tokenCount,
    embedding: chunk.embedding,
    metadata: chunk.metadata
  }));

  for (const row of rows) {
    assertVectorDimension(row.embedding, `Chunk ${row.source_id}:${row.chunk_index}`);
  }

  for (let index = 0; index < rows.length; index += 100) {
    const batch = rows.slice(index, index + 100);
    console.log(`[VectorStore] Attempting to insert ${batch.length} chunks into ${env.SUPABASE_CHUNKS_TABLE}...`);
    
    const { data, error } = await supabase.from(env.SUPABASE_CHUNKS_TABLE).upsert(batch, {
      onConflict: "source_id,chunk_index"
    }).select();

    if (error) {
      console.error("[VectorStore] Supabase API Error during upsert:", error);
      throw new Error(`Failed to store chunks: ${error.message} (Code: ${error.code})`);
    }

    if (!data || data.length === 0) {
      const msg = `[VectorStore] FATAL: upsert returned 0 rows! Missing unique constraint on (source_id, chunk_index)?`;
      console.error(msg);
      throw new Error(msg);
    }
    console.log(`[VectorStore] Successfully inserted ${data.length} rows.`);
  }
}

async function deleteChunksBySourceImpl(sourceId: string): Promise<void> {
  const supabase: any = getSupabaseClient();
  const { error } = await supabase.from(env.SUPABASE_CHUNKS_TABLE).delete().eq("source_id", sourceId);

  if (error) {
    throw new Error(`Failed to delete chunks for ${sourceId}: ${error.message}`);
  }
}

async function similaritySearchImpl(
  queryEmbedding: number[],
  queryText: string,
  workspaceId: string,
  sourceIds: string[] | null = null,
  topK = env.RAG_SEARCH_TOP_K,
  threshold = env.RAG_SEARCH_THRESHOLD
): Promise<SimilarityResult[]> {
  assertVectorDimension(queryEmbedding, "Query embedding");
  const supabase: any = getSupabaseClient();
  const { data, error } = await supabase.rpc("match_rag_chunks", {
    query_embedding: queryEmbedding,
    query_text: queryText,
    p_workspace_id: workspaceId,
    p_source_ids: sourceIds,
    match_count: topK,
    match_threshold: threshold
  });

  if (error) {
    throw new Error(`Similarity search failed: ${error.message}`);
  }

  return (data ?? []).map((item: any) => ({
    id: item.id,
    sourceId: item.source_id,
    workspaceId: item.workspace_id,
    content: item.content,
    chunkIndex: item.chunk_index,
    tokenCount: item.token_count,
    metadata: item.metadata ?? {},
    similarity: Number(item.similarity ?? item.score ?? 0)
  }));
}

export const upsertChunks = traceRagFunction("rag.upsertChunks", "tool", upsertChunksImpl);
export const deleteChunksBySource = traceRagFunction("rag.deleteChunksBySource", "tool", deleteChunksBySourceImpl);
export const similaritySearch = traceRagFunction("rag.similaritySearch", "tool", similaritySearchImpl);
