import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { env } from "../../config/env";
import type { RawChunk } from "../types";


export async function chunkText(
  documents: import("../types").ParsedDocument[],
  sourceId: string,
  workspaceId: string,
  baseMetadata: Record<string, unknown> = {}
): Promise<RawChunk[]> {
  const { getEncoding } = await import("js-tiktoken");
  const enc = getEncoding("cl100k_base");
  
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: env.RAG_CHUNK_SIZE_TOKENS,
    chunkOverlap: env.RAG_CHUNK_OVERLAP_TOKENS,
    separators: ["\n\n", "\n", ". ", ", ", " ", ""],
    lengthFunction: (text) => enc.encode(text).length
  });

  const texts = documents.map(d => d.text);
  const metadatas = documents.map(d => ({ ...baseMetadata, ...(d.metadata || {}) }));

  const chunkedDocs = await splitter.createDocuments(texts, metadatas);

  const MIN_CHUNK_SIZE = 100;
  const processedChunks: any[] = [];

  for (let i = 0; i < chunkedDocs.length; i++) {
    const doc = chunkedDocs[i];
    const text = doc.pageContent.trim();
    if (text.length === 0) continue;

    const tokenCount = enc.encode(text).length;

    // If chunk is too small and we already have a previous chunk, merge it
    if (tokenCount < MIN_CHUNK_SIZE && processedChunks.length > 0) {
      const prev = processedChunks[processedChunks.length - 1];
      // Only merge if they share the same metadata (e.g. same page number)
      // For simplicity, we just merge if they have the same pageNumber, otherwise we keep it separate
      if (prev.metadata?.pageNumber === doc.metadata?.pageNumber || !doc.metadata?.pageNumber) {
        prev.pageContent += "\n" + text;
        prev.tokenCount += tokenCount;
        continue;
      }
    }

    processedChunks.push({ ...doc, pageContent: text, tokenCount });
  }

  return processedChunks.map((doc, index) => ({
    sourceId,
    workspaceId,
    content: doc.pageContent,
    chunkIndex: index,
    tokenCount: doc.tokenCount,
    metadata: { ...doc.metadata } as Record<string, unknown>
  }));
}
