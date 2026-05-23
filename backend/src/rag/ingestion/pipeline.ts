// Clean public entry point — import from here, not ingestionPipeline.ts directly
export { runIngestionPipeline } from './ingestionPipeline';
export type { PipelineResult, ProgressCallback } from './ingestionPipeline';