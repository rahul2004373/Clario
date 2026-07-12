import { env } from "../config/env";

export const ragConfig = {
  chunkSize: env.RAG_CHUNK_SIZE_TOKENS,
  chunkOverlap: env.RAG_CHUNK_OVERLAP_TOKENS,
  embeddingBatchSize: env.RAG_EMBED_BATCH_SIZE,
  topK: env.RAG_SEARCH_TOP_K,
  threshold: env.RAG_SEARCH_THRESHOLD,
  embeddingUrl: env.EMBEDDING_MODEL_URL,
  supabaseUrl: env.SUPABASE_URL,
  supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseTable: env.SUPABASE_CHUNKS_TABLE,
  geminiApiKey: env.GEMINI_API_KEY,
  geminiModelName: env.GEMINI_MODEL_NAME,
  langsmithTracing: env.LANGSMITH_TRACING,
  langsmithApiKey: env.LANGSMITH_API_KEY,
  langsmithProject: env.LANGSMITH_PROJECT,
  langsmithEndpoint: env.LANGSMITH_ENDPOINT
};
