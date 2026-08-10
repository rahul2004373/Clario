import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";

export class FeedbackController {
  static async submitFeedback(req: Request, res: Response) {
    try {
      const { rating, feedback } = req.body;

      if (!rating || !feedback) {
        return res.status(400).json({ error: "Rating and feedback content are required" });
      }

      // Using 'as any' here so TypeScript doesn't throw errors before you manually update the Prisma schema
      const newFeedback = await (prisma as any).feedback.create({
        data: {
          rating,
          content: feedback,
        },
      });

      return res.status(201).json({ success: true, data: newFeedback });
    } catch (error) {
      console.error("[FeedbackController] Error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}
