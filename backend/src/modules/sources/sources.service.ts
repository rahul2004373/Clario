import { prisma } from "../../lib/prisma";
import { SourceType } from "@prisma/client";
import { IngestionProducer } from "./jobs/producer";
import { IngestionQueue } from "./jobs/queue";
import { deleteChunksBySource } from "../../rag/retrieval/vector-store";
import { supabaseAdmin } from "../../lib/supabase";
import { env } from "../../config/env";

export class SourcesService {
  // 1. Core Source Logic
  static async listSources(chatbotId: string) {
    return prisma.source.findMany({
      where: { chatbotId },
      orderBy: { createdAt: "desc" },
      include: { metadata: true }
    });
  }

  static async getSource(sourceId: string, chatbotId: string) {
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
      include: { metadata: true }
    });
    if (!source || source.chatbotId !== chatbotId) {
      throw new Error("Source not found");
    }
    return source;
  }

  static async createSource(
    chatbotId: string,
    data: { name: string; type: SourceType; fileUrl?: string; fileSize?: number; sourceUrl?: string; content?: string }
  ) {
    // We assume the user already uploaded the file to Supabase via the controller (if applicable)
    // Create the record in Neon
    const source = await prisma.source.create({
      data: {
        chatbotId,
        name: data.name,
        type: data.type,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        sourceUrl: data.sourceUrl,
      }
    });

    // Fire off async ingestion job
    await IngestionProducer.enqueueJob(source.id);

    return source;
  }

  static async updateSource(sourceId: string, chatbotId: string, data: any) {
    const source = await this.getSource(sourceId, chatbotId);
    
    // Check if we are updating Source fields vs Metadata fields
    const { metadata, ...sourceFields } = data;

    return prisma.source.update({
      where: { id: source.id },
      data: {
        ...sourceFields,
        ...(metadata && {
          metadata: {
            upsert: {
              create: metadata,
              update: metadata
            }
          }
        })
      },
      include: { metadata: true }
    });
  }

  static async deleteSource(sourceId: string, chatbotId: string) {
    const source = await this.getSource(sourceId, chatbotId);

    // *************************************************************************
    // DELETING FROM SUPABASE (Postgres Vector)
    // Since chunks live in a separate Supabase database, we issue a delete 
    // command to Supabase before deleting the source in Neon.
    // *************************************************************************
    try {
      await deleteChunksBySource(source.id);
      console.log(`[Supabase] Deleted all chunks for source ${sourceId}`);
    } catch (err: any) {
      console.warn("Could not delete chunks from Supabase:", err.message);
    }

    // Deletes the source (and cascades to IngestionJob inside Neon)
    await prisma.source.delete({
      where: { id: source.id }
    });

    return { success: true, message: "Source and chunks deleted." };
  }

  static async deleteChunk(sourceId: string, chatbotId: string, chunkId: string) {
    await this.getSource(sourceId, chatbotId); // Validate ownership

    try {
      const { error } = await supabaseAdmin.from(env.SUPABASE_CHUNKS_TABLE || "rag_chunks").delete().eq('id', chunkId);
      if (error) throw error;
      console.log(`[Supabase] Deleted chunk ${chunkId} for source ${sourceId}`);
    } catch (err: any) {
      console.warn("Could not delete chunk from Supabase:", err.message);
    }

    return { success: true, message: "Chunk deleted" };
  }

  static async triggerReingest(sourceId: string, chatbotId: string) {
    const source = await this.getSource(sourceId, chatbotId);
    await IngestionProducer.enqueueJob(source.id);
    return { success: true, message: "Reingestion triggered" };
  }

  // 2. Job Polling Logic
  static async listJobs(chatbotId: string) {
    return IngestionQueue.listJobs(chatbotId);
  }

  static async getJob(jobId: string, chatbotId: string) {
    const job = await IngestionQueue.getJob(jobId);
    if (!job || job.source.chatbotId !== chatbotId) {
      throw new Error("Job not found");
    }
    return job;
  }
}
