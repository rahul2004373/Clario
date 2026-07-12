export type SourceType = "text" | "doc" | "docx" | "pdf" | "excel" | "xlsx" | "url";

export interface ParsedDocument {
  text: string;
  metadata?: Record<string, unknown>;
}

export interface RawChunk {
  sourceId: string;
  workspaceId: string;
  content: string;
  chunkIndex: number;
  tokenCount: number;
  metadata: Record<string, unknown>;
}

export interface EmbeddedChunk extends RawChunk {
  embedding: number[];
}

export interface SimilarityResult extends RawChunk {
  id?: string;
  similarity: number;
}

export interface IngestionInput {
  sourceId: string;
  workspaceId: string;
  sourceType: SourceType;
  content?: string;
  rawContentUrl?: string | null;
  storageBucket?: string | null;
  storagePath?: string | null;
  rawText?: string | null;
  metadata?: Record<string, unknown>;
  batchSize?: number;
}

export interface IngestionResult {
  sourceId: string;
  chunkCount: number;
  charCount: number;
}

export interface QueryInput {
  query: string;
  workspaceId: string;
  sourceIds?: string[] | null;
  topK?: number;
  threshold?: number;
  systemPrompt?: string;
  promptTemplate?: string;
  modelName?: string;
  temperature?: number;
  topP?: number;
  generationTopK?: number;
  maxOutputTokens?: number;
}

export interface QueryResult {
  answer: string;
  context: Array<{
    sourceId: string;
    content: string;
    similarity: number;
    metadata?: Record<string, unknown>;
  }>;
}

export interface QueryResultStream {
  context: Array<{
    sourceId: string;
    content: string;
    similarity: number;
    metadata?: Record<string, unknown>;
  }>;
  tokenStream: AsyncGenerator<string>;
}

