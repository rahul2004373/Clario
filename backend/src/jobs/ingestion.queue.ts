import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import type { PipelineInput } from '../rag/ingestion/ingestionPipeline';

export const INGESTION_QUEUE_NAME = 'ingestion-queue';

export const ingestionQueue = new Queue<PipelineInput>(INGESTION_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

export async function addIngestionJob(input: PipelineInput) {
    await ingestionQueue.add(`ingest_${input.sourceId}`, input);
    console.log(`[Queue] Job added: ingest_${input.sourceId}`);
}
