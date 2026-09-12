import OpenAI from "openai";
import { env } from "../../config/env";

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
  providerType: "openrouter";
  client: OpenAI;
  modelName: string;
}

// Initialize API Clients
const openrouterClient = env.OPENROUTER_API_KEY ? new OpenAI({
  apiKey: env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://clario.chat", // Optional, for including your app on openrouter.ai rankings.
    "X-Title": "Clario RAG Engine", // Optional. Shows in rankings on openrouter.ai.
  }
}) : null;

// Construct the Fallback Chain exactly as specified
export const fallbackChain: ProviderConfig[] = [];

if (openrouterClient) {
  fallbackChain.push({ id: "nemotron-3.5-lightning", providerType: "openrouter", client: openrouterClient, modelName: "nvidia/nemotron-3.5-lightning:free" });
  fallbackChain.push({ id: "gemma-4-31b", providerType: "openrouter", client: openrouterClient, modelName: "google/gemma-4-31b-it:free" });
  fallbackChain.push({ id: "nemotron-3-super", providerType: "openrouter", client: openrouterClient, modelName: "nvidia/nemotron-3-super-120b-a12b:free" });
  fallbackChain.push({ id: "gemma-4-26b", providerType: "openrouter", client: openrouterClient, modelName: "google/gemma-4-26b-a4b-it:free" });
  fallbackChain.push({ id: "nemotron-3-ultra", providerType: "openrouter", client: openrouterClient, modelName: "nvidia/nemotron-3-ultra-550b-a55b:free" });
  fallbackChain.push({ id: "inkling-small", providerType: "openrouter", client: openrouterClient, modelName: "thinkingmachines/inkling-small:free" });
  fallbackChain.push({ id: "laguna-s", providerType: "openrouter", client: openrouterClient, modelName: "poolside/laguna-s-2.1:free" });
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

export const generateRoutedResponse = generateLlmResponseImpl;

export const generateRoutedResponseStream = generateLlmResponseStreamImpl;
