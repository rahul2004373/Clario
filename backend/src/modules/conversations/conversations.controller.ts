import { Request, Response } from "express";
import { ConversationsService } from "./conversations.service";
import { formatError } from "../../utils/error";

export class ConversationsController {
  static async list(req: Request, res: Response) {
    try {
      const { workspaceId, chatbotId } = req.params as Record<string, string>;
      const { page = 1, limit = 20, status } = req.query;
      
      const result = await ConversationsService.list({
        workspaceId,
        chatbotId,
        page: Number(page),
        limit: Number(limit),
        status: status as string
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: formatError(error) });
    }
  }

  static async listByChatbot(req: Request, res: Response) {
    // This handles GET /workspaces/:workspaceId/chatbots/:chatbotId/conversations
    try {
      const { workspaceId, chatbotId } = req.params as Record<string, string>;
      const { page = 1, limit = 20, status } = req.query;
      
      const result = await ConversationsService.list({
        workspaceId,
        chatbotId,
        page: Number(page),
        limit: Number(limit),
        status: status as string
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: formatError(error) });
    }
  }

  static async getDetails(req: Request, res: Response) {
    try {
      const { workspaceId, conversationId } = req.params as Record<string, string>;
      const result = await ConversationsService.getDetails(workspaceId, conversationId);
      res.json(result);
    } catch (error: any) {
      res.status(404).json({ error: formatError(error) });
    }
  }

  static async getMessages(req: Request, res: Response) {
    try {
      const { workspaceId, conversationId } = req.params as Record<string, string>;
      const result = await ConversationsService.getMessages(workspaceId, conversationId);
      res.json(result);
    } catch (error: any) {
      res.status(404).json({ error: formatError(error) });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { workspaceId, conversationId } = req.params as Record<string, string>;
      const { isActive, isResolved } = req.body;
      const result = await ConversationsService.updateStatus(workspaceId, conversationId, { isActive, isResolved });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: formatError(error) });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { workspaceId, conversationId } = req.params as Record<string, string>;
      await ConversationsService.delete(workspaceId, conversationId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: formatError(error) });
    }
  }

  static async exportPDF(req: Request, res: Response) {
    try {
      const { workspaceId, conversationId } = req.params as Record<string, string>;
      const pdfStream = await ConversationsService.exportTranscriptToPDF(workspaceId, conversationId);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="transcript-${conversationId}.pdf"`);
      
      pdfStream.pipe(res);
    } catch (error: any) {
      res.status(400).json({ error: formatError(error) });
    }
  }
}
