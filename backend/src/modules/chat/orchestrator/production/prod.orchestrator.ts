import OpenAI from "openai";
import { env } from "../../../../config/env";

interface ProviderConfig {
  name: string;
  client: OpenAI;
  models: string[];
}

const getProdProviders = (): ProviderConfig[] => {
  const configs: ProviderConfig[] = [];

  if (env.GROQ_API_KEY) {
    configs.push({
      name: "groq",
      client: new OpenAI({ baseURL: "https://api.groq.com/openai/v1", apiKey: env.GROQ_API_KEY }),
      models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]
    });
  }

  if (env.GEMINI_API_KEY) {
    configs.push({
      name: "gemini",
      client: new OpenAI({ baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/", apiKey: env.GEMINI_API_KEY }),
      models: ["gemini-2.5-flash", "gemini-2.5-flash-lite"]
    });
  }

  if (env.NVIDIA_API_KEY_DEEPSEEK_PRO) {
    configs.push({
      name: "nvidia-deepseek-v4-pro",
      client: new OpenAI({ baseURL: "https://integrate.api.nvidia.com/v1", apiKey: env.NVIDIA_API_KEY_DEEPSEEK_PRO }),
      models: ["deepseek-ai/deepseek-v4-pro"]
    });
  }

  if (env.NVIDIA_API_KEY_LLAMA_70B) {
    configs.push({
      name: "nvidia-llama-3.3-70b",
      client: new OpenAI({ baseURL: "https://integrate.api.nvidia.com/v1", apiKey: env.NVIDIA_API_KEY_LLAMA_70B }),
      models: ["meta/llama-3.3-70b-instruct"]
    });
  }

  if (env.NVIDIA_API_KEY_LLAMA_3B) {
    configs.push({
      name: "nvidia-llama-3.2-3b",
      client: new OpenAI({ baseURL: "https://integrate.api.nvidia.com/v1", apiKey: env.NVIDIA_API_KEY_LLAMA_3B }),
      models: ["meta/llama-3.2-3b-instruct"]
    });
  }

  return configs;
};

// Circuit Breaker Settings
const COOLDOWN_MS = 60000;
const cooldowns = new Map<string, number>();

export class ProdOrchestrator {
  static isCoolingDown(providerName: string, modelName: string): boolean {
    const key = `${providerName}:${modelName}`;
    const expiresAt = cooldowns.get(key);
    if (!expiresAt) return false;
    
    if (Date.now() > expiresAt) {
      cooldowns.delete(key);
      return false;
    }
    return true;
  }

  static setCooldown(providerName: string, modelName: string) {
    const key = `${providerName}:${modelName}`;
    cooldowns.set(key, Date.now() + COOLDOWN_MS);
    console.warn(`[ProdOrchestrator] CircuitBreaker Triggered for ${key}. Cooling down for ${COOLDOWN_MS / 1000}s.`);
  }

  static async generateStream(messages: any[], onChunk: (chunk: string) => void): Promise<{ content: string, metadata: any }> {
    const providers = getProdProviders();
    const fallbackReasons: any[] = [];
    let startTime = Date.now();

    for (const provider of providers) {
      for (const model of provider.models) {
        if (this.isCoolingDown(provider.name, model)) {
          console.log(`[ProdOrchestrator] Skipping ${provider.name}:${model} (Cooling Down)`);
          continue;
        }

        try {
          console.log(`[ProdOrchestrator] Attempting generation with ${provider.name}:${model}...`);
          startTime = Date.now();
          
          const stream = await provider.client.chat.completions.create({
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

          console.log(`[ProdOrchestrator] SUCCESS with ${provider.name}:${model} (${latencyMs}ms, ~${estimatedTokens} tokens)`);

          return { 
            content: fullContent,
            metadata: {
              provider: provider.name,
              model,
              latencyMs,
              fallbackReasons
            }
          };

        } catch (error: any) {
          const latencyMs = Date.now() - startTime;
          console.error(`[ProdOrchestrator] Failed ${provider.name}:${model} - ${error.status || error.message}`);
          
          fallbackReasons.push({
            provider: provider.name,
            model,
            reason: error.message,
            latencyMs
          });

          if (error.status === 429 || error.status >= 500) {
            this.setCooldown(provider.name, model);
          }
        }
      }
    }

    throw new Error(`All prod providers exhausted. Fallback log: ${JSON.stringify(fallbackReasons)}`);
  }

  static async generateMessage(messages: any[]): Promise<{ content: string, metadata: any }> {
    const providers = getProdProviders();
    const fallbackReasons: any[] = [];
    let startTime = Date.now();

    for (const provider of providers) {
      for (const model of provider.models) {
        if (this.isCoolingDown(provider.name, model)) {
          continue;
        }

        try {
          console.log(`[ProdOrchestrator] Attempting generation with ${provider.name}:${model}...`);
          startTime = Date.now();
          
          const response = await provider.client.chat.completions.create({
            model,
            messages,
            stream: false,
          });

          const latencyMs = Date.now() - startTime;
          const content = response.choices[0]?.message?.content || "";
          
          console.log(`[ProdOrchestrator] SUCCESS with ${provider.name}:${model} (${latencyMs}ms)`);

          return {
            content,
            metadata: {
              provider: provider.name,
              model,
              latencyMs,
              fallbackReasons
            }
          };

        } catch (error: any) {
          const latencyMs = Date.now() - startTime;
          console.error(`[ProdOrchestrator] Failed ${provider.name}:${model} - ${error.status || error.message}`);
          
          fallbackReasons.push({
            provider: provider.name,
            model,
            reason: error.message,
            latencyMs
          });

          if (error.status === 429 || error.status >= 500) {
            this.setCooldown(provider.name, model);
          }
        }
      }
    }

    throw new Error(`All prod providers exhausted. Fallback log: ${JSON.stringify(fallbackReasons)}`);
  }
}
