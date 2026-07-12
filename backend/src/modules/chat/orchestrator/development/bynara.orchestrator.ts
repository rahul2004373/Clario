import OpenAI from "openai";
import { env } from "../../../../config/env";

export class BynaraOrchestrator {
  private static getClient(): OpenAI {
    return new OpenAI({
      baseURL: env.BYNARA_BASE_URL,
      apiKey: env.BYNARA_API_KEY,
      timeout: env.BYNARA_TIMEOUT_MS
    });
  }

  // The free models for Bynara Development
  private static getModels(): string[] {
    return ["mistral-large", "tencent-hy3"];
  }

  static async generateStream(messages: any[], onChunk: (chunk: string) => void): Promise<{ content: string, metadata: any }> {
    const client = this.getClient();
    const models = this.getModels();
    const fallbackReasons: any[] = [];
    let startTime = Date.now();

    for (const model of models) {
      try {
        console.log(`[DevOrchestrator] Attempting generation with bynara:${model}...`);
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
        console.log(`[DevOrchestrator] SUCCESS with bynara:${model} (${latencyMs}ms)`);

        return { 
          content: fullContent,
          metadata: {
            provider: "bynara",
            model,
            latencyMs,
            fallbackReasons
          }
        };

      } catch (error: any) {
        const latencyMs = Date.now() - startTime;
        console.error(`[DevOrchestrator] Failed bynara:${model} - ${error.status || error.message}`);
        
        fallbackReasons.push({
          provider: "bynara",
          model,
          reason: error.message,
          latencyMs
        });
      }
    }

    throw new Error(`All dev providers exhausted. Fallback log: ${JSON.stringify(fallbackReasons)}`);
  }

  static async generateMessage(messages: any[]): Promise<{ content: string, metadata: any }> {
    const client = this.getClient();
    const models = this.getModels();
    const fallbackReasons: any[] = [];
    let startTime = Date.now();

    for (const model of models) {
      try {
        console.log(`[DevOrchestrator] Attempting generation with bynara:${model}...`);
        startTime = Date.now();
        
        const response = await client.chat.completions.create({
          model,
          messages,
          stream: false,
        });

        const latencyMs = Date.now() - startTime;
        const content = response.choices[0]?.message?.content || "";
        
        console.log(`[DevOrchestrator] SUCCESS with bynara:${model} (${latencyMs}ms)`);

        return {
          content,
          metadata: {
            provider: "bynara",
            model,
            latencyMs,
            fallbackReasons
          }
        };

      } catch (error: any) {
        const latencyMs = Date.now() - startTime;
        console.error(`[DevOrchestrator] Failed bynara:${model} - ${error.status || error.message}`);
        
        fallbackReasons.push({
          provider: "bynara",
          model,
          reason: error.message,
          latencyMs
        });
      }
    }

    throw new Error(`All dev providers exhausted. Fallback log: ${JSON.stringify(fallbackReasons)}`);
  }
}
