import { IngestionQueue } from "./queue";
import { prisma } from "../../../lib/prisma";
import { IngestionStatus } from "@prisma/client";

export class IngestionProducer {
  static async enqueueJob(sourceId: string) {
    // 1. Mark source as PENDING
    await prisma.source.update({
      where: { id: sourceId },
      data: { ingestionStatus: IngestionStatus.PENDING, ingestionError: null }
    });

    // 2. Create the job in the queue
    return IngestionQueue.addJob(sourceId);
  }
}
