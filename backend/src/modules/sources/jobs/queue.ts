import { prisma } from "../../../lib/prisma";
import { IngestionStatus } from "@prisma/client";

export class IngestionQueue {
  static async addJob(sourceId: string) {
    return prisma.ingestionJob.create({
      data: {
        sourceId,
        status: IngestionStatus.PENDING,
      },
    });
  }

  static async getJob(jobId: string) {
    return prisma.ingestionJob.findUnique({
      where: { id: jobId },
      include: { source: true },
    });
  }

  static async listJobs(chatbotId: string) {
    return prisma.ingestionJob.findMany({
      where: {
        source: {
          chatbotId,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
