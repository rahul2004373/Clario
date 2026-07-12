import { prisma } from "../../../lib/prisma";
import { IngestionStatus, SourceType as PrismaSourceType } from "@prisma/client";
import { runIngestionPipeline } from "../../../rag/ingestion/pipeline";
import { SourceType as RagSourceType } from "../../../rag/types";

// In a real application, you'd probably run this in a separate worker process.
// We can start a lightweight polling loop here for demonstration.
const MAX_CONCURRENT_JOBS = 2;
const POLL_INTERVAL_MS = 5000;
let activeJobs = 0;

export class IngestionWorker {
  static async startPolling() {
    console.log(`[${new Date().toISOString()}] [Worker] Starting polling loop...`);
    setInterval(async () => {
      if (activeJobs >= MAX_CONCURRENT_JOBS) return;

      try {
        await this.processNextJob();
      } catch (err) {
        console.error(`[${new Date().toISOString()}] [Worker] polling error:`, err);
      }
    }, POLL_INTERVAL_MS);
  }

  static async processNextJob() {
    // 1. Fetch the next PENDING job atomically with raw SQL SKIP LOCKED to prevent race conditions across multiple worker processes
    const rawResult = await prisma.$queryRaw<any[]>`
      UPDATE "ingestion_jobs"
      SET status = 'PROCESSING', "startedAt" = NOW(), attempts = attempts + 1
      WHERE id = (
        SELECT id FROM "ingestion_jobs"
        WHERE status = 'PENDING'
        ORDER BY "createdAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING id;
    `;

    if (!rawResult || rawResult.length === 0) return null; // No pending jobs

    const jobId = rawResult[0].id;

    const job = await prisma.ingestionJob.findUnique({
      where: { id: jobId },
      include: { source: { include: { chatbot: true } } }
    });

    if (!job) return; // No pending jobs

    activeJobs++;
    try {
      // Also update the source status
      await prisma.source.update({
        where: { id: job.sourceId },
        data: { ingestionStatus: IngestionStatus.PROCESSING }
      });

      // Map Prisma SourceType to RAG SourceType
      let ragSourceType: RagSourceType = "text";
      switch (job.source.type) {
        case PrismaSourceType.PDF: ragSourceType = "pdf"; break;
        case PrismaSourceType.DOCX: ragSourceType = "docx"; break;
        case PrismaSourceType.XLSX: ragSourceType = "excel"; break;
        case PrismaSourceType.CSV: ragSourceType = "text"; break;
        case PrismaSourceType.TXT: ragSourceType = "text"; break;
        case PrismaSourceType.URL: ragSourceType = "url"; break;
        case PrismaSourceType.YOUTUBE: ragSourceType = "text"; break; // Needs specialized handler in RAG
        case PrismaSourceType.NOTION: ragSourceType = "text"; break;
        case PrismaSourceType.SITEMAP: ragSourceType = "url"; break;
        case PrismaSourceType.PLAIN_TEXT: ragSourceType = "text"; break;
      }

      console.log(`[${new Date().toISOString()}] [Worker] Processing Job ${job.id} for Source ${job.source.name}...`);
      
      const result = await runIngestionPipeline({
        sourceId: job.sourceId,
        workspaceId: (job.source as any).chatbot.workspaceId,
        sourceType: ragSourceType,
        rawContentUrl: job.source.fileUrl || job.source.sourceUrl,
        content: undefined
      });

      console.log(`[${new Date().toISOString()}] [Worker] Pipeline finished for ${job.id}. Checking result...`);

      if (result.chunkCount === 0) {
        console.warn(`[${new Date().toISOString()}] [Worker] WARNING: Pipeline reported 0 chunks generated for ${job.id}.`);
      } else {
        console.log(`[${new Date().toISOString()}] [Worker] Pipeline successfully generated and stored ${result.chunkCount} chunks.`);
      }

      // 3. Mark job as COMPLETED
      await prisma.$transaction([
        prisma.ingestionJob.update({
          where: { id: job.id },
          data: { status: IngestionStatus.COMPLETED, completedAt: new Date() }
        }),
        prisma.source.update({
          where: { id: job.sourceId },
          data: { 
            ingestionStatus: IngestionStatus.COMPLETED,
            chunkCount: result.chunkCount,
            lastIngestedAt: new Date()
          }
        })
      ]);
      console.log(`[${new Date().toISOString()}] [Worker] Job ${job.id} COMPLETED. Generated ${result.chunkCount} chunks.`);

    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] [Worker] Job ${job.id} FAILED:`, error);
      
      // 4. Mark job as FAILED
      await prisma.$transaction([
        prisma.ingestionJob.update({
          where: { id: job.id },
          data: { 
            status: IngestionStatus.FAILED, 
            error: error.message,
            completedAt: new Date()
          }
        }),
        prisma.source.update({
          where: { id: job.sourceId },
          data: { 
            ingestionStatus: IngestionStatus.FAILED,
            ingestionError: error.message
          }
        })
      ]);
    } finally {
      activeJobs--;
    }
  }
}
