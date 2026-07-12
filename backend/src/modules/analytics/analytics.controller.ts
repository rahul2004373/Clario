import { Request, Response } from "express";
import { AnalyticsService } from "./analytics.service";

export const getMetrics = async (req: Request, res: Response) => {
  try {
    const chatbotId = req.params.chatbotId as string;
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    const metrics = await AnalyticsService.getDashboardMetrics(chatbotId, startDate, endDate);
    res.json(metrics);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
