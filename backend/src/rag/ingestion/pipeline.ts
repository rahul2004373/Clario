import type { IngestionInput, IngestionResult } from "../types";
import { runDocumentIngestionWorkflow } from "./workflow";

export const runIngestionPipeline = async (input: IngestionInput): Promise<IngestionResult> => {
    return runDocumentIngestionWorkflow(input);
  };
