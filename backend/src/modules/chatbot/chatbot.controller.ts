import { Request, Response } from "express";
import { ChatbotService } from "./chatbot.service";
import { formatError } from "../../utils/error";

export const listChatbots = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId } = req.params;
    const chatbots = await ChatbotService.listChatbots(workspaceId as string, userId);
    res.json({ chatbots });
  } catch (error: any) {
    res.status(403).json({ error: formatError(error) });
  }
};

export const createChatbot = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId } = req.params;
    const { name, systemPrompt, ...rest } = req.body;

    if (!name || !systemPrompt) {
      return res.status(400).json({ error: "Name and systemPrompt are required" });
    }

    const chatbot = await ChatbotService.createChatbot(workspaceId as string, userId, { name, systemPrompt, ...rest });
    res.status(201).json({ message: "Chatbot created", chatbot });
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const getChatbot = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId, chatbotId } = req.params;
    const chatbot = await ChatbotService.getChatbot(workspaceId as string, chatbotId as string, userId);
    res.json({ chatbot });
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const updateChatbot = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId, chatbotId } = req.params;
    
    // Disallow updating workspaceId or id
    const { id, workspaceId: _, ...data } = req.body;

    const chatbot = await ChatbotService.updateChatbot(workspaceId as string, chatbotId as string, userId, data);
    res.json({ message: "Chatbot updated", chatbot });
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const deleteChatbot = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId, chatbotId } = req.params;

    const result = await ChatbotService.deleteChatbot(workspaceId as string, chatbotId as string, userId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const togglePublish = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId, chatbotId } = req.params;
    const { isPublished } = req.body;

    if (typeof isPublished !== "boolean") {
      return res.status(400).json({ error: "isPublished boolean is required" });
    }

    const chatbot = await ChatbotService.togglePublish(workspaceId as string, chatbotId as string, userId, isPublished);
    res.json({ message: "Publish status updated", chatbot });
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const getEmbedCode = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId, chatbotId } = req.params;

    const result = await ChatbotService.getEmbedCode(workspaceId as string, chatbotId as string, userId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};

export const getLastTrained = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId, chatbotId } = req.params;

    const result = await ChatbotService.getLastTrainedTime(workspaceId as string, chatbotId as string, userId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: formatError(error) });
  }
};
