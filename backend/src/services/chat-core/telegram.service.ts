import { prisma } from '../../db';
import { encrypt, decrypt } from '../../utils/crypto.util';
import { v4 as uuidv4 } from 'uuid';
import { RagService } from './rag.service';
import { ConversationService } from './conversation.service';

export class TelegramService {
    /**
     * Dashboard: Connect a new Telegram bot
     */
    static async connectTelegram(chatbotId: string, workspaceId: string, botToken: string, webhookBaseUrl: string) {
        // Verify Telegram Token by calling getMe
        const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const data = await response.json() as any;

        if (!data.ok) {
            throw new Error(`Invalid Telegram Token: ${data.description}`);
        }

        const botUsername = data.result.username;

        // Check if token is already in use by another chatbot (duplicate token check)
        const encryptedTokenCheck = encrypt(botToken);
        const existingIntegration = await prisma.telegramSetting.findUnique({
            where: { botToken: encryptedTokenCheck }
        });

        if (existingIntegration && existingIntegration.chatbotId !== chatbotId) {
            throw new Error('This Telegram bot token is already connected to another chatbot.');
        }

        // Generate webhook URL and secret token
        const secretToken = uuidv4().replace(/-/g, ''); // Telegram allows A-Z, a-z, 0-9, _ and -
        const webhookUrl = `${webhookBaseUrl}/api/v1/channels/telegram/webhook/${chatbotId}`;

        // Set webhook on Telegram
        const webhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: webhookUrl,
                secret_token: secretToken,
                allowed_updates: ['message']
            })
        });

        const webhookData = await webhookResponse.json() as any;
        if (!webhookData.ok) {
            throw new Error(`Failed to set Telegram webhook: ${webhookData.description}`);
        }

        // Save to DB
        return prisma.telegramSetting.upsert({
            where: { chatbotId },
            update: {
                botToken: encryptedTokenCheck,
                botUsername,
                secretToken,
                isActive: true,
            },
            create: {
                chatbotId,
                botToken: encryptedTokenCheck,
                botUsername,
                secretToken,
                isActive: true,
            }
        });
    }

    /**
     * Dashboard: Get integration status
     */
    static async getTelegramStatus(chatbotId: string) {
        const integration = await prisma.telegramSetting.findUnique({
            where: { chatbotId }
        });
        
        if (!integration) return null;

        return {
            isActive: integration.isActive,
            botUsername: integration.botUsername,
            createdAt: integration.createdAt,
            shareLink: `https://t.me/${integration.botUsername}`
        };
    }

    /**
     * Dashboard: Disconnect
     */
    static async disconnectTelegram(chatbotId: string) {
        const integration = await prisma.telegramSetting.findUnique({
            where: { chatbotId }
        });

        if (!integration) return true;

        const decryptedToken = decrypt(integration.botToken);

        // Call deleteWebhook
        await fetch(`https://api.telegram.org/bot${decryptedToken}/deleteWebhook`);

        await prisma.telegramSetting.delete({
            where: { chatbotId }
        });

        return true;
    }

    /**
     * Dashboard: Toggle active state
     */
    static async toggleTelegram(chatbotId: string, isActive: boolean) {
        return prisma.telegramSetting.update({
            where: { chatbotId },
            data: { isActive }
        });
    }

    /**
     * Webhook: Process incoming messages from Telegram
     */
    static async processWebhook(chatbotId: string, update: any) {
        const integration = await prisma.telegramSetting.findUnique({
            where: { chatbotId }
        });

        if (!integration || !integration.isActive) {
            console.log(`[Telegram Webhook] Integration inactive or not found for chatbot ${chatbotId}`);
            return;
        }

        if (!update.message || !update.message.text) {
            return; // We only handle text messages for now
        }

        const chatId = update.message.chat.id.toString();
        const text = update.message.text;

        const decryptedToken = decrypt(integration.botToken);

        // ⚠️ Handle /start command (Welcome message response)
        if (text === '/start') {
            await this.sendMessageToTelegram(decryptedToken, chatId, 'Hello! How can I help you today?');
            return;
        }

        // Find or create conversation for this chat ID
        let conversation = await prisma.conversation.findFirst({
            where: { chatbotId, telegramChatId: chatId, status: 'active', channel: 'telegram' }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    chatbotId,
                    telegramChatId: chatId,
                    channel: 'telegram',
                    status: 'active'
                }
            });
        }

        try {
            // Load history
            const history = await ConversationService.getRecentHistory(conversation.id, 6);
            const historyFormatted = history.map(m => ({ role: m.role, content: m.content }));

            // Save user message
            await ConversationService.saveMessage(conversation.id, 'user', text);

            // Pass to RAG service
            const result = await RagService.runQuery({
                chatbotId,
                query: text,
                history: historyFormatted,
                mode: 'general',
                stream: false
            });

            const replyText = result.text || 'I do not have enough information to answer that.';

            // Save assistant message
            await ConversationService.saveMessage(conversation.id, 'assistant', replyText, result.citations);

            // Send reply to Telegram
            await this.sendMessageToTelegram(decryptedToken, chatId, replyText);

        } catch (error: any) {
            console.error('[Telegram Webhook] RAG Error:', error);
            await this.sendMessageToTelegram(decryptedToken, chatId, 'Sorry, I am experiencing issues right now. Please try again later.');
        }
    }

    private static async sendMessageToTelegram(botToken: string, chatId: string, text: string) {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Telegram Webhook] Failed to send message: ${errorText}`);
        }
    }
}
