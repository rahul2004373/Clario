/**
 * ingestion.worker.ts
 * BullMQ Worker for processing ingestion jobs.
 */
import dotenv from 'dotenv';
dotenv.config();

import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { INGESTION_QUEUE_NAME } from './ingestion.queue';
import { prisma } from '../db';
import { runIngestionPipeline, PipelineInput } from '../rag/ingestion/ingestionPipeline';
import { MetricsManager } from '../observability/metrics';
import { log } from '../observability/logger';

const worker = new Worker<PipelineInput>(
    INGESTION_QUEUE_NAME,
    async (job: Job<PipelineInput>) => {
        const { sourceId, s3Key, workspaceId, fileType } = job.data;
        
        console.log(`\n[Worker] Processing Job ${job.id} | Source: ${sourceId}`);
        log.info(`[Worker] Started processing ingestion job ${job.id}`, {
            sourceId,
            workspaceId,
            requestId: job.id
        });

        MetricsManager.queueJobs.inc({ queue: INGESTION_QUEUE_NAME, job_name: job.name || 'ingestion', status: 'active' });
        const start = process.hrtime();

        try {
            await prisma.source.update({
                where: { id: sourceId },
                data: { status: 'PROCESSING' }
            });

            const result = await runIngestionPipeline(
                { s3Key, sourceId, workspaceId, fileType },
                (step, pct) => {
                    job.updateProgress(pct);
                    console.log(`[Worker] Job ${job.id} - ${step}: ${pct}%`);
                }
            );

            await prisma.source.update({
                where: { id: sourceId },
                data: { 
                    status: 'READY',
                    chunkCount: result.chunkCount,
                    syncedAt: new Date()
                }
            });

            // Double check linking in worker for robustness
            if (job.data.chatbotId) {
                await prisma.chatbotSource.upsert({
                    where: {
                        chatbotId_sourceId: {
                            chatbotId: job.data.chatbotId,
                            sourceId
                        }
                    },
                    update: {},
                    create: {
                        chatbotId: job.data.chatbotId,
                        sourceId
                    }
                });

                // Ensure it's in the array too
                const cb = await prisma.chatbot.findUnique({ where: { id: job.data.chatbotId } });
                if (cb && !cb.sourceIds.includes(sourceId)) {
                    await prisma.chatbot.update({
                        where: { id: job.data.chatbotId },
                        data: { sourceIds: { push: sourceId } }
                    });
                }
            }

            const diff = process.hrtime(start);
            const durationSeconds = (diff[0] * 1e9 + diff[1]) / 1e9;

            // Track standard BullMQ queues duration
            MetricsManager.queueJobDuration.observe({ queue: INGESTION_QUEUE_NAME, job_name: job.name || 'ingestion' }, durationSeconds);
            MetricsManager.queueJobs.inc({ queue: INGESTION_QUEUE_NAME, job_name: job.name || 'ingestion', status: 'completed' });

            // Track specific RAG ingestion duration & success count
            MetricsManager.ragIngestionDuration.observe({ type: fileType }, durationSeconds);
            MetricsManager.ragSourcesProcessed.inc({ type: fileType, status: 'success' });
            MetricsManager.ragChunksCreated.inc({ type: fileType }, result.chunkCount || 0);

            console.log(`[Worker] Job ${job.id} SUCCESS`);
            log.info(`[Worker] Successfully completed ingestion job ${job.id}`, {
                sourceId,
                workspaceId,
                durationMs: Math.round(durationSeconds * 1000)
            });

            return result;

        } catch (err: any) {
            console.error(`[Worker] Job ${job.id} FAILED:`, err.message);
            
            const diff = process.hrtime(start);
            const durationSeconds = (diff[0] * 1e9 + diff[1]) / 1e9;

            MetricsManager.queueJobs.inc({ queue: INGESTION_QUEUE_NAME, job_name: job.name || 'ingestion', status: 'failed' });
            MetricsManager.ragSourcesProcessed.inc({ type: fileType, status: 'failed' });

            log.error(`[Worker] Ingestion job ${job.id} failed: ${err.message}`, {
                sourceId,
                workspaceId,
                errorMessage: err.message,
                durationMs: Math.round(durationSeconds * 1000)
            });

            await prisma.source.update({
                where: { id: sourceId },
                data: { 
                    status: 'FAILED',
                    errorMsg: err.message
                }
            });

            throw err; // Allow BullMQ to handle retries
        }
    },
    { 
        connection: redisConnection,
        concurrency: 2, // Process 2 jobs at a time
    }
);

worker.on('ready', () => {
    console.log('--- Ingestion Worker Ready (BullMQ) ---');
    log.info('Ingestion Background Worker started successfully');
});

worker.on('error', (err) => {
    console.error('[Worker] Fatal Error:', err);
    log.fatal(`Ingestion Worker critical fatal error: ${err.message}`, {
        errorMessage: err.message
    });
});

worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed after all retries: ${err.message}`);
    log.error(`Ingestion Job ${job?.id} failed permanently: ${err.message}`, {
        requestId: job?.id,
        errorMessage: err.message
    });
});
