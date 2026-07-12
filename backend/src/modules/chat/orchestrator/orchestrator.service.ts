import { ProdOrchestrator } from "./production/prod.orchestrator";
import { BynaraOrchestrator } from "./development/bynara.orchestrator";

export class OrchestratorService {
  static async generateStream(messages: any[], onChunk: (chunk: string) => void): Promise<{ content: string, metadata: any }> {
    if (process.env.NODE_ENV === "production") {
      return ProdOrchestrator.generateStream(messages, onChunk);
    } else {
      return BynaraOrchestrator.generateStream(messages, onChunk);
    }
  }

  static async generateMessage(messages: any[]): Promise<{ content: string, metadata: any }> {
    if (process.env.NODE_ENV === "production") {
      return ProdOrchestrator.generateMessage(messages);
    } else {
      return BynaraOrchestrator.generateMessage(messages);
    }
  }
}
