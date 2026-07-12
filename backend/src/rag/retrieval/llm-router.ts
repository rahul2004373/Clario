import OpenAI from "openai";
import { env } from "../../config/env";
import { traceRagFunction } from "../observability";

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

interface ProviderConfig {
  id: string;
  providerType: "gemini" | "bynara" | "nvidia";
  client: OpenAI;
  modelName: string;
}

// Initialize API Clients
const geminiClient = env.GEMINI_API_KEY ? new OpenAI({
  apiKey: env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
}) : null;

const bynaraClient = env.BYNARA_API_KEY ? new OpenAI({
  apiKey: env.BYNARA_API_KEY,
  baseURL: env.BYNARA_BASE_URL,
  timeout: env.BYNARA_TIMEOUT_MS
}) : null;

const nvidiaClient = env.NVIDIA_API_KEY ? new OpenAI({
  apiKey: env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1"
}) : null;

// Construct the Fallback Chain exactly as specified
export const fallbackChain: ProviderConfig[] = [];

if (geminiClient) {
  fallbackChain.push({ id: "gemini-2.5-flash", providerType: "gemini", client: geminiClient, modelName: "gemini-2.5-flash" });
  fallbackChain.push({ id: "gemini-2.5-flash-lite", providerType: "gemini", client: geminiClient, modelName: "gemini-2.5-flash-lite" });
  fallbackChain.push({ id: "gemini-2.0-flash", providerType: "gemini", client: geminiClient, modelName: "gemini-2.0-flash" });
}

if (bynaraClient) {
  fallbackChain.push({ id: "claude-sonnet-4.5", providerType: "bynara", client: bynaraClient, modelName: "claude-sonnet-4.5" });
  fallbackChain.push({ id: "claude-haiku-4.5", providerType: "bynara", client: bynaraClient, modelName: "claude-haiku-4.5" });
}

if (nvidiaClient) {
  fallbackChain.push({ id: "deepseek-v4-flash", providerType: "nvidia", client: nvidiaClient, modelName: "deepseek-ai/deepseek-v4-flash" });
}

if (bynaraClient) {
  fallbackChain.push({ id: "mistral-large", providerType: "bynara", client: bynaraClient, modelName: "mistral-large" });
  fallbackChain.push({ id: "mistral-medium-3-5", providerType: "bynara", client: bynaraClient, modelName: "mistral-medium-3-5" });
}

function constructPrompt(input: LlmResponseInput) {
  const promptTemplate =
    input.promptTemplate?.trim() ||
    "Context:\n{context}\n\nQuestion:\n{question}\n\nAnswer using only the provided context. If the answer is not in the context, say you do not have enough information.";
  return promptTemplate
    .replaceAll("{context}", input.context)
    .replaceAll("{question}", input.question);
}

export async function generateLlmResponseImpl(input: LlmResponseInput): Promise<string> {
  if (fallbackChain.length === 0) {
    throw new Error("No LLM providers are configured in the fallback chain.");
  }

  const prompt = constructPrompt(input);
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (input.systemPrompt) {
    messages.push({ role: "system", content: input.systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  let lastError: any = null;

  for (const provider of fallbackChain) {
    try {
      console.log(`[LLM Router] Attempting generation with model: ${provider.modelName} via ${provider.providerType}`);
      const params: any = {
        model: provider.modelName,
        messages,
        temperature: input.temperature ?? 0.2,
        top_p: input.topP,
        max_tokens: input.maxOutputTokens ?? 1024
      };
      if (input.topK) {
        params.top_k = input.topK;
      }

      const completion = await provider.client.chat.completions.create(params);

      const text = completion.choices[0]?.message?.content || "";
      if (!text.trim()) {
        throw new Error("Received empty response from provider.");
      }
      return text.trim();
    } catch (error: any) {
      console.warn(`[LLM Router] Provider ${provider.modelName} failed: ${error.message}`);
      lastError = error;
      // Continue to the next fallback provider
    }
  }

  throw lastError || new Error("All LLM providers failed.");
}

export async function* generateLlmResponseStreamImpl(input: LlmResponseInput): AsyncGenerator<string> {
  if (fallbackChain.length === 0) {
    throw new Error("No LLM providers are configured in the fallback chain.");
  }

  const prompt = constructPrompt(input);
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (input.systemPrompt) {
    messages.push({ role: "system", content: input.systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  let lastError: any = null;

  for (const provider of fallbackChain) {
    try {
      console.log(`[LLM Router] Attempting stream generation with model: ${provider.modelName} via ${provider.providerType}`);
      const params: any = {
        model: provider.modelName,
        messages,
        temperature: input.temperature ?? 0.2,
        top_p: input.topP,
        max_tokens: input.maxOutputTokens ?? 1024,
        stream: true
      };
      if (input.topK) {
        params.top_k = input.topK;
      }

      const stream = await provider.client.chat.completions.create(params);

      for await (const chunk of stream as any) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          yield text;
        }
      }

      // If we made it here without error, we're done and shouldn't fallback.
      return;
    } catch (error: any) {
      console.warn(`[LLM Router] Provider ${provider.modelName} failed: ${error.message}`);
      lastError = error;
      // Note: This correctly falls back if the request fails completely (e.g. 503) 
      // before yielding any tokens.
    }
  }

  throw lastError || new Error("All LLM providers failed.");
}

export const generateRoutedResponse = traceRagFunction(
  "rag.generateRoutedResponse",
  "llm",
  generateLlmResponseImpl
);

export const generateRoutedResponseStream = traceRagFunction(
  "rag.generateRoutedResponseStream",
  "llm",
  generateLlmResponseStreamImpl
);
