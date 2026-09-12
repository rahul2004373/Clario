import dotenv from "dotenv";

dotenv.config();

const port = Number(process.env.PORT ?? 4000);
const ragChunkSizeTokens = Number(process.env.RAG_CHUNK_SIZE_TOKENS ?? 600);
const ragChunkOverlapTokens = Number(process.env.RAG_CHUNK_OVERLAP_TOKENS ?? 150);
const ragEmbeddingBatchSize = Number(process.env.RAG_EMBED_BATCH_SIZE ?? 8);
const ragSearchTopK = Number(process.env.RAG_SEARCH_TOP_K ?? 15);
const ragSearchThreshold = Number(process.env.RAG_SEARCH_THRESHOLD ?? 0.5);
const ragVectorDimension = Number(process.env.RAG_VECTOR_DIMENSION ?? 384);
const ragMaxContextTokens = Number(process.env.RAG_MAX_CONTEXT_TOKENS ?? 32000);
const supabaseSignedUrlTtl = Number(process.env.SUPABASE_SIGNED_URL_TTL ?? 3600);

export const env = {
  PORT: Number.isFinite(port) && port > 0 ? port : 4000,
  DATABASE_URL: process.env.DATABASE_URL?.trim() ?? "",
  EMBEDDING_MODEL_URL: process.env.EMBEDDING_MODEL_URL?.trim() ?? "",
  LLM_API_URL: process.env.LLM_API_URL?.trim() ?? "https://llm-api-latest-1.onrender.com/v1/chat/completions",
  LLM_API_STREAM_URL: process.env.LLM_API_STREAM_URL?.trim() ?? "https://llm-api-latest-1.onrender.com/v1/chat/stream",
  SUPABASE_URL: process.env.SUPABASE_URL?.trim() ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "",
  SUPABASE_CHUNKS_TABLE: process.env.SUPABASE_CHUNKS_TABLE?.trim() ?? "document_chunks",
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET?.trim() ?? "rag-files",
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET?.trim() ?? "",
  SUPABASE_SIGNED_URL_TTL: Number.isFinite(supabaseSignedUrlTtl) && supabaseSignedUrlTtl > 0 ? supabaseSignedUrlTtl : 3600,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY?.trim() ?? "",
  RAG_CHUNK_SIZE_TOKENS: Number.isFinite(ragChunkSizeTokens) && ragChunkSizeTokens > 0 ? ragChunkSizeTokens : 500,
  RAG_CHUNK_OVERLAP_TOKENS: Number.isFinite(ragChunkOverlapTokens) && ragChunkOverlapTokens >= 0 ? ragChunkOverlapTokens : 50,
  RAG_EMBED_BATCH_SIZE: Number.isFinite(ragEmbeddingBatchSize) && ragEmbeddingBatchSize > 0 ? ragEmbeddingBatchSize : 8,
  RAG_SEARCH_TOP_K: Number.isFinite(ragSearchTopK) && ragSearchTopK > 0 ? ragSearchTopK : 15,
  RAG_SEARCH_THRESHOLD:
    Number.isFinite(ragSearchThreshold) && ragSearchThreshold >= 0 && ragSearchThreshold <= 1
      ? ragSearchThreshold
      : 0.5,
  RAG_VECTOR_DIMENSION: Number.isFinite(ragVectorDimension) && ragVectorDimension > 0 ? ragVectorDimension : 384,
  RAG_MAX_CONTEXT_TOKENS: Number.isFinite(ragMaxContextTokens) && ragMaxContextTokens > 0 ? ragMaxContextTokens : 32000,
  WIDGET_SCRIPT_URL: process.env.WIDGET_SCRIPT_URL?.trim() ?? "http://localhost:3000/widget.js"
};
