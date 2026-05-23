export type SourceType = 'pdf' | 'docx' | 'text' | 'url' | 'xlsx';
export type SourceStatus = 'pending' | 'processing' | 'ready' | 'failed' | 'cancelled';
export type Role = 'user' | 'assistant' | 'system';

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

export interface SimilarityResult {
    id: string;
    sourceId: string;
    content: string;
    metadata: Record<string, unknown>;
    score: number;
}

export interface IngestionJobData {
    sourceId: string;
    workspaceId: string;
}

export interface ChatMessage {
    role: Role;
    content: string;
}