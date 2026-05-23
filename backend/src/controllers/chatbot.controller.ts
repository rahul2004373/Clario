import { Request, Response } from 'express';
import { ChatbotService } from '../services/chatbot.service';

export class ChatbotController {
    static async createChatbot(req: Request, res: Response) {
        try {
            const workspaceId = req.params.workspaceId as string;
            const { name, systemPrompt } = req.body;
            const userId = (req as any).user.id;

            if (!name) return res.status(400).json({ error: 'Chatbot name is required' });

            const chatbot = await ChatbotService.createChatbot(workspaceId, name, systemPrompt, userId);
            res.status(201).json(chatbot);
        } catch (err: any) {
            if (err.message === 'Workspace not found' || err.message === 'Unauthorized access to workspace') {
                return res.status(404).json({ error: 'Workspace not found or unauthorized' });
            }
            res.status(500).json({ error: err.message });
        }
    }

    static async getChatbots(req: Request, res: Response) {
        try {
            const workspaceId = req.params.workspaceId as string;
            const userId = (req as any).user.id;

            const chatbots = await ChatbotService.getChatbotsByWorkspace(workspaceId, userId);
            res.status(200).json(chatbots);
        } catch (err: any) {
            if (err.message === 'Workspace not found' || err.message === 'Unauthorized access to workspace') {
                return res.status(404).json({ error: 'Workspace not found or unauthorized' });
            }
            res.status(500).json({ error: err.message });
        }
    }

    static async getChatbotById(req: Request, res: Response) {
        try {
            const workspaceId = req.params.workspaceId as string;
            const id = req.params.id as string;
            const userId = (req as any).user.id;

            const chatbot = await ChatbotService.getChatbotById(workspaceId, id, userId);
            res.status(200).json(chatbot);
        } catch (err: any) {
            if (err.message.includes('not found') || err.message.includes('Unauthorized')) {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: err.message });
        }
    }

    static async updateChatbot(req: Request, res: Response) {
        try {
            const workspaceId = req.params.workspaceId as string;
            const id = req.params.id as string;
            const { name, systemPrompt } = req.body;
            const userId = (req as any).user.id;

            const chatbot = await ChatbotService.updateChatbot(workspaceId, id, { name, systemPrompt }, userId);
            res.status(200).json(chatbot);
        } catch (err: any) {
            if (err.message.includes('not found') || err.message.includes('Unauthorized')) {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: err.message });
        }
    }

    static async updateChatbotSources(req: Request, res: Response) {
        try {
            const workspaceId = req.params.workspaceId as string;
            const id = req.params.id as string;
            const { sourceIds } = req.body;
            const userId = (req as any).user.id;

            if (!Array.isArray(sourceIds)) {
                return res.status(400).json({ error: 'sourceIds must be an array of strings' });
            }

            const chatbot = await ChatbotService.updateChatbotSources(workspaceId, id, sourceIds, userId);
            res.status(200).json(chatbot);
        } catch (err: any) {
            if (err.message.includes('not found') || err.message.includes('Unauthorized')) {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: err.message });
        }
    }

    static async getLastTrainedTime(req: Request, res: Response) {
        try {
            const workspaceId = req.params.workspaceId as string;
            const id = req.params.id as string;
            const userId = (req as any).user.id;

            const result = await ChatbotService.getLastTrainedTime(workspaceId, id, userId);
            res.status(200).json(result);
        } catch (err: any) {
            if (err.message.includes('not found') || err.message.includes('Unauthorized')) {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: err.message });
        }
    }

    static async deleteChatbot(req: Request, res: Response) {
        try {
            const workspaceId = req.params.workspaceId as string;
            const id = req.params.id as string;
            const userId = (req as any).user.id;

            await ChatbotService.deleteChatbot(workspaceId, id, userId);
            res.status(204).send();
        } catch (err: any) {
            if (err.message.includes('not found') || err.message.includes('Unauthorized')) {
                return res.status(404).json({ error: err.message });
            }
            res.status(500).json({ error: err.message });
        }
    }
}
