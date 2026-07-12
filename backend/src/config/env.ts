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
const bynaraTimeoutMs = Number(process.env.BYNARA_TIMEOUT_MS ?? 60000);
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
  GEMINI_API_KEY: process.env.GEMINI_API_KEY?.trim() ?? "",
  GEMINI_MODEL_NAME: process.env.GEMINI_MODEL_NAME?.trim() ?? "gemini-2.0-flash-lite",
  GROQ_API_KEY: process.env.GROQ_API_KEY?.trim() ?? "",
  NVIDIA_API_KEY: process.env.NVIDIA_API_KEY?.trim() ?? "",
  NVIDIA_API_KEY_DEEPSEEK_PRO: process.env.NVIDIA_API_KEY_DEEPSEEK_PRO?.trim() ?? "",
  NVIDIA_API_KEY_LLAMA_70B: process.env.NVIDIA_API_KEY_LLAMA_70B?.trim() ?? "",
  NVIDIA_API_KEY_LLAMA_3B: process.env.NVIDIA_API_KEY_LLAMA_3B?.trim() ?? "",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY?.trim() ?? "",
  BYNARA_API_KEY: process.env.BYNARA_API_KEY?.trim() ?? "",
  BYNARA_BASE_URL: process.env.BYNARA_BASE_URL?.trim() ?? "https://router.bynara.id/v1",
  BYNARA_MODEL: process.env.BYNARA_MODEL?.trim() ?? "claude-haiku-4.5",
  BYNARA_TIMEOUT_MS: Number.isFinite(bynaraTimeoutMs) && bynaraTimeoutMs > 0 ? bynaraTimeoutMs : 60000,
  LANGSMITH_TRACING: process.env.LANGSMITH_TRACING?.trim() === "true",
  LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY?.trim() ?? "",
  LANGSMITH_PROJECT: process.env.LANGSMITH_PROJECT?.trim() ?? "",
  LANGSMITH_ENDPOINT: process.env.LANGSMITH_ENDPOINT?.trim() ?? "",
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
