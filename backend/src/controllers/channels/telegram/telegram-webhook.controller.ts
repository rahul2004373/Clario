import { Request, Response } from 'express';
import { TelegramService } from '../../../services/chat-core/telegram.service';
import { prisma } from '../../../db';

export class TelegramWebhookController {
    /**
     * Webhook receiver for Telegram updates
     * POST /api/v1/channels/telegram/webhook/:chatbotId
     */
    static async handleWebhook(req: Request, res: Response): Promise<void> {
        // ALWAYS return 200 early to Telegram so it doesn't retry indefinitely.
        res.status(200).send('OK');

        try {
            const chatbotId = req.params.chatbotId as string;
            const update = req.body;
            
            // Validate secret token for security (X-Telegram-Bot-Api-Secret-Token)
            const secretToken = req.headers['x-telegram-bot-api-secret-token'] as string | undefined;
            
            if (!secretToken) {
                console.warn(`[Telegram Webhook] Missing secret token for chatbot ${chatbotId}`);
                return;
            }

            const integration = await prisma.telegramSetting.findUnique({
                where: { chatbotId },
                select: { secretToken: true }
            });

            if (!integration || integration.secretToken !== secretToken) {
                console.warn(`[Telegram Webhook] Invalid secret token for chatbot ${chatbotId}`);
                return;
            }

            // Process webhook asynchronously
            await TelegramService.processWebhook(chatbotId, update);
            
        } catch (error: any) {
            console.error('[Telegram Webhook] Error processing update:', error);
        }
    }
}
