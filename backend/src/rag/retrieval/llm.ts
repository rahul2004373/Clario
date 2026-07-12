import { env } from "../../config/env";
import { traceRagFunction } from "../observability";

const DEFAULT_RETRY_ATTEMPTS = 3;

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function parseRetryDelayMs(errorText: string) {
  const retryDelayMatch = errorText.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/i);
  if (!retryDelayMatch) {
    return null;
  }

  const retrySeconds = Number(retryDelayMatch[1]);
  if (!Number.isFinite(retrySeconds) || retrySeconds <= 0) {
    return null;
  }

  return Math.ceil(retrySeconds * 1000);
}

function createBynaraError(message: string, statusCode = 503) {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  return error;
}

function ensureBynaraConfig() {
  if (!env.BYNARA_API_KEY) {
    throw createBynaraError("BYNARA_API_KEY is required for RAG responses", 500);
  }
}

function extractAssistantText(payload: any) {
  const text =
    payload?.choices?.[0]?.message?.content ??
    payload?.choices?.[0]?.text ??
    payload?.output_text ??
    "";

  if (typeof text !== "string" || text.trim().length === 0) {
    throw createBynaraError("Bynara returned an empty response", 502);
  }

  return text.trim();
}

export interface LlmResponseInput {
  question: string;
  context: string;
  systemPrompt?: string;
  promptTemplate?: string;
  modelName?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
}

async function generateLlmResponseImpl(input: LlmResponseInput): Promise<string> {
  ensureBynaraConfig();

  const modelName = input.modelName?.trim() || env.BYNARA_MODEL;
  const promptTemplate =
    input.promptTemplate?.trim() ||
    "Context:\n{context}\n\nQuestion:\n{question}\n\nAnswer using only the provided context. If the answer is not in the context, say you do not have enough information.";
  const prompt = promptTemplate
    .replaceAll("{context}", input.context)
    .replaceAll("{question}", input.question);

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= DEFAULT_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), env.BYNARA_TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(`${env.BYNARA_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.BYNARA_API_KEY}`
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              ...(input.systemPrompt
                ? [
                    {
                      role: "system",
                      content: input.systemPrompt
                    }
                  ]
                : []),
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: input.temperature ?? 0.2,
            top_p: input.topP,
            top_k: input.topK,
            max_tokens: input.maxOutputTokens ?? 1024,
            stream: false
          }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorText = await response.text();
        const retryable = response.status === 429 || response.status >= 500;

        if (retryable && attempt < DEFAULT_RETRY_ATTEMPTS) {
          const retryDelayMs = parseRetryDelayMs(errorText) ?? attempt * 1000;
          await sleep(retryDelayMs);
          continue;
        }

        throw createBynaraError(
          `Bynara request failed with HTTP ${response.status}: ${errorText}`,
          response.status === 429 ? 503 : 502
        );
      }

      const payload = await response.json();
      return extractAssistantText(payload);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable = message.toLowerCase().includes("fetch failed") || message.toLowerCase().includes("timeout");

      if (retryable && attempt < DEFAULT_RETRY_ATTEMPTS) {
        await sleep(attempt * 1000);
        continue;
      }

      throw error instanceof Error ? error : createBynaraError("Bynara request failed", 503);
    }
  }

  throw lastError instanceof Error ? lastError : createBynaraError("Bynara request failed", 503);
}

export const generateGeminiResponse = traceRagFunction(
  "rag.generateBynaraResponse",
  "llm",
  generateLlmResponseImpl
);

async function* generateLlmResponseStreamImpl(input: LlmResponseInput): AsyncGenerator<string> {
  ensureBynaraConfig();

  const modelName = input.modelName?.trim() || env.BYNARA_MODEL;
  const promptTemplate =
    input.promptTemplate?.trim() ||
    "Context:\n{context}\n\nQuestion:\n{question}\n\nAnswer using only the provided context. If the answer is not in the context, say you do not have enough information.";
  const prompt = promptTemplate
    .replaceAll("{context}", input.context)
    .replaceAll("{question}", input.question);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.BYNARA_TIMEOUT_MS);

  try {
    const response = await fetch(`${env.BYNARA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.BYNARA_API_KEY}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          ...(input.systemPrompt
            ? [
                {
                  role: "system",
                  content: input.systemPrompt
                }
              ]
            : []),
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: input.temperature ?? 0.2,
        top_p: input.topP,
        top_k: input.topK,
        max_tokens: input.maxOutputTokens ?? 1024,
        stream: true
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw createBynaraError(`Bynara streaming request failed: HTTP ${response.status}: ${errorText}`, response.status);
    }

    if (!response.body) {
      throw createBynaraError("Bynara response body is null", 502);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine || cleanLine === "data: [DONE]") continue;

          if (cleanLine.startsWith("data: ")) {
            try {
              const data = JSON.parse(cleanLine.slice(6));
              const text = data.choices?.[0]?.delta?.content ?? "";
              if (text) {
                yield text;
              }
            } catch (e) {
              // Ignore invalid JSON on line boundary split
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export const generateGeminiResponseStream = traceRagFunction(
  "rag.generateBynaraResponseStream",
  "llm",
  generateLlmResponseStreamImpl
);

