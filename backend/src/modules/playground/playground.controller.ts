import { Request, Response } from "express";
import { PlaygroundService } from "./playground.service";
import { formatError } from "../../utils/error";

export class PlaygroundController {
  static async createSession(req: Request, res: Response) {
    try {
      const { chatbotId } = req.params as Record<string, string>;
      const { formData } = req.body;
      const result = await PlaygroundService.createSession(chatbotId, formData);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: formatError(error) });
    }
  }

  static async sendMessage(req: Request, res: Response) {
    try {
      const { chatbotId, workspaceId } = req.params as Record<string, string>;
      const { sessionId, message } = req.body;
      
      if (!sessionId || !message) {
        return res.status(400).json({ error: "sessionId and message are required" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      await PlaygroundService.streamMessage(
        chatbotId,
        workspaceId,
        sessionId,
        message,
        (chunk) => {
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
      );

      res.write("event: done\ndata: {}\n\n");
      res.end();
    } catch (error: any) {
      if (!res.headersSent) {
        res.status(500).json({ error: formatError(error) });
      } else {
        res.write(`data: ${JSON.stringify({ error: formatError(error) })}\n\n`);
        res.end();
      }
    }
  }

  static async clearHistory(req: Request, res: Response) {
    try {
      const { chatbotId } = req.params as Record<string, string>;
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: "sessionId is required" });
      }
      
      await PlaygroundService.clearSession(chatbotId, sessionId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: formatError(error) });
    }
  }
}
