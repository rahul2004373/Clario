import { embedText } from "../ingestion/embedder";
import { traceRagFunction } from "../observability";
import type { QueryInput, QueryResult, QueryResultStream } from "../types";
import { buildContext } from "./context-builder";
import { generateRoutedResponse, generateRoutedResponseStream } from "./llm-router";
import { similaritySearch } from "./vector-store";

async function runQueryPipelineImpl(input: QueryInput): Promise<QueryResult> {
  const queryEmbedding = await embedText(input.query);
  const matches = await similaritySearch(
    queryEmbedding,
    input.query,
    input.workspaceId,
    input.sourceIds ?? null,
    input.topK,
    input.threshold
  );

  const context = matches.map((match) => ({
    sourceId: match.sourceId,
    content: match.content,
    similarity: match.similarity,
    metadata: match.metadata
  }));

  const answer = await generateRoutedResponse({
    question: input.query,
    context: await buildContext(context),
    systemPrompt: input.systemPrompt,
    promptTemplate: input.promptTemplate,
    modelName: input.modelName,
    temperature: input.temperature,
    topP: input.topP,
    topK: input.generationTopK,
    maxOutputTokens: input.maxOutputTokens
  });

  return {
    answer,
    context
  };
}

async function runQueryPipelineStreamImpl(input: QueryInput): Promise<QueryResultStream> {
  const queryEmbedding = await embedText(input.query);
  const matches = await similaritySearch(
    queryEmbedding,
    input.query,
    input.workspaceId,
    input.sourceIds ?? null,
    input.topK,
    input.threshold
  );

  const context = matches.map((match) => ({
    sourceId: match.sourceId,
    content: match.content,
    similarity: match.similarity,
    metadata: match.metadata
  }));

  const tokenStream = generateRoutedResponseStream({
    question: input.query,
    context: await buildContext(context),
    systemPrompt: input.systemPrompt,
    promptTemplate: input.promptTemplate,
    modelName: input.modelName,
    temperature: input.temperature,
    topP: input.topP,
    topK: input.generationTopK,
    maxOutputTokens: input.maxOutputTokens
  });

  return {
    context,
    tokenStream
  };
}

export const runQueryPipeline = traceRagFunction("rag.runQueryPipeline", "chain", runQueryPipelineImpl);
export const runQueryPipelineStream = traceRagFunction("rag.runQueryPipelineStream", "chain", runQueryPipelineStreamImpl);

