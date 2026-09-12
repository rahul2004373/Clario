import OpenAI from "openai";
import { env } from "../../../config/env";

const COOLDOWN_MS = 60000;
const cooldowns = new Map<string, number>();

export class OrchestratorService {
  static getClient() {
    if (!env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured.");
    }
    return new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": "https://clario.chat",
        "X-Title": "Clario Orchestrator",
      }
    });
  }

  static getFallbackModels(): string[] {
    return [
      "nvidia/nemotron-3.5-lightning:free",
      "google/gemma-4-31b-it:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "google/gemma-4-26b-a4b-it:free",
      "nvidia/nemotron-3-ultra-550b-a55b:free",
      "thinkingmachines/inkling-small:free",
      "poolside/laguna-s-2.1:free"
    ];
  }

  static isCoolingDown(modelName: string): boolean {
    const expiresAt = cooldowns.get(modelName);
    if (!expiresAt) return false;
    if (Date.now() > expiresAt) {
      cooldowns.delete(modelName);
      return false;
    }
    return true;
  }

  static setCooldown(modelName: string) {
    cooldowns.set(modelName, Date.now() + COOLDOWN_MS);
    console.warn(`[OrchestratorService] CircuitBreaker Triggered for ${modelName}. Cooling down for ${COOLDOWN_MS / 1000}s.`);
  }

  static async generateStream(messages: any[], onChunk: (chunk: string) => void): Promise<{ content: string, metadata: any }> {
    const client = this.getClient();
    const models = this.getFallbackModels();
    const fallbackReasons: any[] = [];
    let startTime = Date.now();

    for (const model of models) {
      if (this.isCoolingDown(model)) {
        console.log(`[OrchestratorService] Skipping ${model} (Cooling Down)`);
        continue;
      }

      try {
        console.log(`[OrchestratorService] Attempting generation with ${model}...`);
        startTime = Date.now();

        const stream = await client.chat.completions.create({
          model,
          messages,
          stream: true,
        });

        let fullContent = "";
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullContent += content;
            onChunk(content);
          }
        }

        const latencyMs = Date.now() - startTime;
        const estimatedTokens = Math.ceil(fullContent.length / 4);

        console.log(`[OrchestratorService] SUCCESS with ${model} (${latencyMs}ms, ~${estimatedTokens} tokens)`);

        return {
          content: fullContent,
          metadata: {
            provider: "openrouter",
            model,
            latencyMs,
            fallbackReasons
          }
        };

      } catch (error: any) {
        const latencyMs = Date.now() - startTime;
        console.error(`[OrchestratorService] Failed ${model} - ${error.status || error.message}`);

        fallbackReasons.push({
          provider: "openrouter",
          model,
          reason: error.message,
          latencyMs
        });

        if (error.status === 429 || error.status >= 500) {
          this.setCooldown(model);
        }
      }
    }

    throw new Error(`All providers exhausted. Fallback log: ${JSON.stringify(fallbackReasons)}`);
  }

  static async generateMessage(messages: any[]): Promise<{ content: string, metadata: any }> {
    const client = this.getClient();
    const models = this.getFallbackModels();
    const fallbackReasons: any[] = [];
    let startTime = Date.now();

    for (const model of models) {
      if (this.isCoolingDown(model)) {
        continue;
      }

      try {
        console.log(`[OrchestratorService] Attempting generation with ${model}...`);
        startTime = Date.now();

        const response = await client.chat.completions.create({
          model,
          messages,
          stream: false,
        });

        const latencyMs = Date.now() - startTime;
        const content = response.choices[0]?.message?.content || "";

        console.log(`[OrchestratorService] SUCCESS with ${model} (${latencyMs}ms)`);

        return {
          content,
          metadata: {
            provider: "openrouter",
            model,
            latencyMs,
            fallbackReasons
          }
        };

      } catch (error: any) {
        const latencyMs = Date.now() - startTime;
        console.error(`[OrchestratorService] Failed ${model} - ${error.status || error.message}`);

        fallbackReasons.push({
          provider: "openrouter",
          model,
          reason: error.message,
          latencyMs
        });

        if (error.status === 429 || error.status >= 500) {
          this.setCooldown(model);
        }
      }
    }

    throw new Error(`All providers exhausted. Fallback log: ${JSON.stringify(fallbackReasons)}`);
  }
}
