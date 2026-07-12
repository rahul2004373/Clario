import { traceRagFunction } from "../observability";
import type { IngestionInput, IngestionResult } from "../types";
import { runDocumentIngestionWorkflow } from "./workflow";

export const runIngestionPipeline = traceRagFunction(
  "rag.runIngestionPipeline",
  "chain",
  async (input: IngestionInput): Promise<IngestionResult> => {
    return runDocumentIngestionWorkflow(input);
  }
);
