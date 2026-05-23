import { Request, Response } from 'express';
import { runQueryPipeline } from '../rag/retrieval/queryPipeline';

export class ChatController {
    static async handleQuery(req: Request, res: Response) {
        try {
            const chatbotId = req.params.chatbotId as string;
            const { query } = req.body;
            const userId = (req as any).user.id;

            if (!query) {
                return res.status(400).json({ error: 'Query is required.' });
            }

            const result = await runQueryPipeline(query, chatbotId, userId);

            res.status(200).json(result);
        } catch (err: any) {
            console.error('[ChatController] Error:', err);
            if (err.message === 'Chatbot not found' || err.message.includes('Unauthorized')) {
                return res.status(404).json({ error: 'Chatbot not found or unauthorized' });
            }
            res.status(500).json({ error: 'Failed to process query.' });
        }
    }
}
