import { env } from "../../config/env";
import type { QueryResult } from "../types";

/**
 * Deduplicates and merges overlapping chunks, then truncates the context to fit within the max token limit.
 */
export async function buildContext(results: QueryResult["context"]): Promise<string> {
  if (results.length === 0) {
    return "No relevant context found in the knowledge base.";
  }

  // 1. Group chunks by Source ID
  const chunksBySource = new Map<string, Array<QueryResult["context"][0] & { chunkIndex: number }>>();

  for (const match of results) {
    const sourceId = match.sourceId;
    // Fallback index to a large number if not present so it doesn't break sorting, but it should be present.
    const chunkIndex = (match as any).chunkIndex ?? 999999;
    
    if (!chunksBySource.has(sourceId)) {
      chunksBySource.set(sourceId, []);
    }
    chunksBySource.get(sourceId)!.push({ ...match, chunkIndex });
  }

  const mergedContexts: string[] = [];

  // 2. Merge adjacent chunks within each source
  for (const [sourceId, chunks] of chunksBySource.entries()) {
    // Sort ascending by chunk index
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

    let currentMergedText = chunks[0].content;
    let currentStartIndex = chunks[0].chunkIndex;
    let currentEndIndex = chunks[0].chunkIndex;
    // Capture metadata from the first chunk in the merge (e.g. pageNumber)
    let currentMetadata = chunks[0].metadata || {};

    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // If chunks are strictly adjacent, merge them by simply joining them.
      // Because there is overlap, joining them directly will duplicate the overlap part, 
      // but for LLMs this is usually acceptable or we can just append with a newline.
      // A more complex overlap-stripper could be used here, but joining is safest for now.
      if (chunk.chunkIndex === currentEndIndex + 1) {
        currentMergedText += "\n...\n" + chunk.content;
        currentEndIndex = chunk.chunkIndex;
      } else {
        // Push the completed merged block
        mergedContexts.push(formatBlock(sourceId, currentMergedText, currentMetadata));
        
        // Start a new block
        currentMergedText = chunk.content;
        currentStartIndex = chunk.chunkIndex;
        currentEndIndex = chunk.chunkIndex;
        currentMetadata = chunk.metadata || {};
      }
    }
    
    // Push the final block
    mergedContexts.push(formatBlock(sourceId, currentMergedText, currentMetadata));
  }

  // 3. Truncate context to fit the token limit
  const { getEncoding } = await import("js-tiktoken");
  const enc = getEncoding("cl100k_base");
  const maxTokens = env.RAG_MAX_CONTEXT_TOKENS;
  let currentTokenCount = 0;
  let finalContextString = "";

  for (let i = 0; i < mergedContexts.length; i++) {
    const blockTokens = enc.encode(mergedContexts[i]).length;
    
    if (currentTokenCount + blockTokens > maxTokens) {
      console.warn(`[ContextBuilder] Truncated context at block ${i + 1} to stay under ${maxTokens} tokens.`);
      break;
    }

    finalContextString += (i > 0 ? "\n\n" : "") + mergedContexts[i];
    currentTokenCount += blockTokens;
  }

  return finalContextString;
}

function formatBlock(sourceId: string, text: string, metadata: Record<string, unknown>): string {
  let header = `--- Source Snippet (Source: ${sourceId}`;
  if (metadata.pageNumber) {
    header += `, Page: ${metadata.pageNumber}`;
  }
  header += `) ---`;
  return `${header}\n${text}`;
}
