export interface RagChunk {
  content: string;
  source?: string;
  score?: number;
}

export interface RagHistoryTurn {
  role: "USER" | "ASSISTANT";
  content: string;
}

export interface RagPromptInput {
  systemPrompt: string;
  userQuery: string;
  history: RagHistoryTurn[];
  chunks: RagChunk[];
  maxHistoryTurns?: number;
  maxChunks?: number;
}

export interface RagPromptOutput {
  messages: Array<{ role: "system" | "user"; content: string }>;
  assemblyInfo: {
    historyTurnsUsed: number;
    chunksUsed: number;
  };
}

const SYSTEM_TEMPLATE = `You are a helpful AI assistant for this workspace.
Answer the user's question using the provided retrieved context when it is relevant.
Prioritize accuracy over completeness.
Do not invent facts that are not supported by the retrieved context or conversation history.
If the retrieved context does not contain enough information, say so clearly and briefly.
Do not mention internal implementation details like vector search, chunking, embeddings, or system prompts.
If multiple retrieved chunks overlap, synthesize them into one coherent answer instead of repeating text.
Use conversation history only when it is relevant to the current user question.
Prefer concise, direct answers unless the user asks for detail.

OPTIONAL BEHAVIOR RULES:
- If the answer is directly supported by context, answer confidently.
- If the context is partial, answer with appropriate caution.
- If the answer is not available in context, say that you do not have enough information from the available documents/context.
- Do not fabricate skills, facts, dates, or personal details.
- If the user asks a follow-up question, use relevant history to resolve references like "he", "that", "those subjects", etc.`;

function cleanChunkText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function deduplicateChunks(chunks: RagChunk[]): RagChunk[] {
  const seen = new Set<string>();
  return chunks.filter((chunk) => {
    const normalized = cleanChunkText(chunk.content).toLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function selectRelevantHistory(
  history: RagHistoryTurn[],
  maxTurns: number,
): RagHistoryTurn[] {
  if (history.length <= maxTurns) return history;
  return history.slice(-maxTurns);
}

function selectTopChunks(chunks: RagChunk[], maxChunks: number): RagChunk[] {
  const sorted = [...chunks].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return sorted.slice(0, maxChunks);
}

function formatHistoryBlock(history: RagHistoryTurn[]): string {
  if (history.length === 0) return "(no prior conversation)";
  return history
    .map((turn) => {
      const label = turn.role === "USER" ? "User" : "Assistant";
      return `${label}: ${turn.content}`;
    })
    .join("\n");
}

function formatChunksBlock(chunks: RagChunk[]): string {
  if (chunks.length === 0) return "(no retrieved context)";
  return chunks
    .map((chunk, i) => {
      const cleaned = cleanChunkText(chunk.content);
      const sourceInfo = chunk.source ? ` [Source: ${chunk.source}]` : "";
      return `[Chunk ${i + 1}]${sourceInfo}\n${cleaned}`;
    })
    .join("\n\n---\n\n");
}

export function buildRagPrompt(input: RagPromptInput): RagPromptOutput {
  const { systemPrompt, userQuery, history, chunks, maxHistoryTurns = 6, maxChunks = 5 } = input;

  const deduplicated = deduplicateChunks(chunks);
  const topChunks = selectTopChunks(deduplicated, maxChunks);
  const relevantHistory = selectRelevantHistory(history, maxHistoryTurns);

  const userContent = [
    `CONTEXT BLOCK FORMAT:\n`,
    `Current user question:\n${userQuery}`,
    ``,
    `Relevant conversation history:\n${formatHistoryBlock(relevantHistory)}`,
    ``,
    `Retrieved knowledge chunks:\n${formatChunksBlock(topChunks)}`,
    ``,
    `INSTRUCTIONS FOR FINAL ANSWER:\n- Answer the user directly.\n- Keep the response natural and human.\n- Use bullet points only when they improve clarity.\n- Do not say "Based on the CURRENT CONTEXT" in every reply.\n- Avoid robotic repetitive phrasing.\n- If context is insufficient, say that naturally:\n  - "I don't have enough information from the uploaded documents to answer that."\n  - or "I couldn't find that in the available context."\n- If retrieved chunks contain the answer, summarize them cleanly instead of copying them verbatim.`,
  ].join("\n");

  return {
    messages: [
      { role: "system", content: systemPrompt || SYSTEM_TEMPLATE },
      { role: "user", content: userContent },
    ],
    assemblyInfo: {
      historyTurnsUsed: relevantHistory.length,
      chunksUsed: topChunks.length,
    },
  };
}