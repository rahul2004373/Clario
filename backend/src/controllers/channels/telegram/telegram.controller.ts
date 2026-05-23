import { Request, Response } from 'express';
import { TelegramService } from '../../../services/chat-core/telegram.service';

export class TelegramController {
    /**
     * Connect Telegram bot
     * POST /api/v1/workspaces/:workspaceId/chatbots/:chatbotId/integrations/telegram
     */
    static async connect(req: Request, res: Response): Promise<any> {
        try {
            const chatbotId = req.params.chatbotId as string;
            const workspaceId = req.params.workspaceId as string;
            const { botToken } = req.body;
            const user = (req as any).user;

            if (!botToken) {
                return res.status(400).json({ error: 'botToken is required' });
            }

            // In production, this should be your actual domain (e.g. https://api.clairo.com)
            // For development, you can use ngrok URL via env or request host
            const webhookBaseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;

            const integration = await TelegramService.connectTelegram(
                chatbotId,
                workspaceId,
                botToken,
                webhookBaseUrl
            );

            return res.status(200).json({
                message: 'Telegram bot connected successfully',
                data: {
                    isActive: integration.isActive,
                    botUsername: integration.botUsername,
                    shareLink: `https://t.me/${integration.botUsername}`
                }
            });
        } catch (error: any) {
            console.error('[TelegramController] Connect error:', error);
            return res.status(400).json({ error: error.message || 'Failed to connect Telegram bot' });
        }
    }

    /**
     * Get integration status
     * GET /api/v1/workspaces/:workspaceId/chatbots/:chatbotId/integrations/telegram
     */
    static async getStatus(req: Request, res: Response): Promise<any> {
        try {
            const chatbotId = req.params.chatbotId as string;
            const status = await TelegramService.getTelegramStatus(chatbotId);
            
            if (!status) {
                return res.status(200).json({
                    data: {
                        connected: false,
                        isActive: false
                    }
                });
            }

            return res.status(200).json({
                data: {
                    ...status,
                    connected: true
                }
            });
        } catch (error: any) {
            console.error('[TelegramController] Get status error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Disconnect Telegram bot
     * DELETE /api/v1/workspaces/:workspaceId/chatbots/:chatbotId/integrations/telegram
     */
    static async disconnect(req: Request, res: Response): Promise<any> {
        try {
            const chatbotId = req.params.chatbotId as string;
            await TelegramService.disconnectTelegram(chatbotId);
            return res.status(200).json({ message: 'Telegram bot disconnected successfully' });
        } catch (error: any) {
            console.error('[TelegramController] Disconnect error:', error);
            return res.status(500).json({ error: 'Failed to disconnect Telegram bot' });
        }
    }

    /**
     * Toggle active state
     * PATCH /api/v1/workspaces/:workspaceId/chatbots/:chatbotId/integrations/telegram/toggle
     */
    static async toggle(req: Request, res: Response): Promise<any> {
        try {
            const chatbotId = req.params.chatbotId as string;
            const { isActive } = req.body;

            if (typeof isActive !== 'boolean') {
                return res.status(400).json({ error: 'isActive boolean is required' });
            }

            const updated = await TelegramService.toggleTelegram(chatbotId, isActive);
            return res.status(200).json({
                message: `Telegram integration ${isActive ? 'activated' : 'paused'}`,
                data: { isActive: updated.isActive }
            });
        } catch (error: any) {
            console.error('[TelegramController] Toggle error:', error);
            return res.status(500).json({ error: 'Failed to toggle Telegram integration' });
        }
    }
}
