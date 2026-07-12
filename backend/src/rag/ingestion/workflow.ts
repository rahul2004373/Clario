import { traceRagFunction } from "../observability";
import type { EmbeddedChunk, IngestionInput, IngestionResult, RawChunk } from "../types";
import { chunkText } from "./chunker";
import { cleanText } from "./cleaner";
import { embedChunks } from "./embedder";
import { parseSource } from "./parser";
import { resolveStorageUrl } from "./source-resolver";
import { clearSourceChunks, storeChunks } from "./storer";

export async function extractDocumentText(input: IngestionInput): Promise<import("../types").ParsedDocument[]> {
  const sourceUrl = await resolveStorageUrl(input);
  const rawText = input.content?.trim() || input.rawText?.trim() || undefined;
  const parsedDocs = rawText
    ? [{ text: rawText }]
    : await parseSource({
        type: input.sourceType,
        rawContentUrl: sourceUrl ?? input.rawContentUrl ?? null,
        rawText: input.rawText ?? null
      });

  return parsedDocs.map(doc => ({
    ...doc,
    text: cleanText(doc.text)
  }));
}

export async function chunkDocument(
  documents: import("../types").ParsedDocument[],
  sourceId: string,
  workspaceId: string,
  metadata: Record<string, unknown> = {}
): Promise<RawChunk[]> {
  return chunkText(documents, sourceId, workspaceId, metadata);
}

export async function embedAndStoreDocumentChunks(chunks: RawChunk[], batchSize?: number): Promise<EmbeddedChunk[]> {
  const embeddedChunks = await embedChunks(chunks, batchSize);
  await storeChunks(embeddedChunks);
  return embeddedChunks;
}

async function runDocumentIngestionWorkflowImpl(input: IngestionInput): Promise<IngestionResult> {
  const metadata = input.metadata ?? {};
  const cleanedDocs = await extractDocumentText(input);

  if (!cleanedDocs || cleanedDocs.length === 0) {
    const error = new Error("Parsed content is empty");
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }

  const chunks = await chunkText(cleanedDocs, input.sourceId, input.workspaceId, metadata);

  if (chunks.length === 0) {
    const error = new Error("No chunks were created from the parsed content");
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }

  await clearSourceChunks(input.sourceId);
  const embeddedChunks = await embedChunks(chunks, input.batchSize);
  await storeChunks(embeddedChunks);

  return {
    sourceId: input.sourceId,
    chunkCount: embeddedChunks.length,
    charCount: cleanedDocs.reduce((acc, doc) => acc + doc.text.length, 0)
  };
}

export const runDocumentIngestionWorkflow = traceRagFunction(
  "rag.runDocumentIngestionWorkflow",
  "chain",
  runDocumentIngestionWorkflowImpl
);
