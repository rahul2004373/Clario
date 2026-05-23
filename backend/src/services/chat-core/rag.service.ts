import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../../db';
import { env } from '../../config/env';
import { similaritySearch } from '../../rag/ingestion/vectorStore';
import { embedQuery } from '../../rag/ingestion/embedder';
import { withGeminiRetry } from '../../utils/geminiRetry';
import { MetricsManager } from '../../observability/metrics';
import { log } from '../../observability/logger';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');
const LLM_MODEL = 'gemini-flash-lite-latest';

export type ChatMode = 'tutor' | 'sales' | 'customer_support' | 'general';

interface RagOptions {
    chatbotId: string;
    query: string;
    history?: { role: string; content: string }[];
    mode?: ChatMode;
    stream?: boolean;
}

export class RagService {
    private static getSystemPrompt(mode: ChatMode, basePrompt?: string) {
        const strictGrounding = `IMPORTANT: You must answer questions strictly based on the provided context. If the provided context does not contain the answer, state clearly: "I don't have enough information in my knowledge base to answer that." Do not speculate or use outside knowledge.`;
        const base = basePrompt || 'You are a helpful AI assistant.';
        
        const templates: Record<ChatMode, string> = {
            tutor: `Focus on explaining concepts simply. Use analogies. If the student is wrong, guide them to the right answer instead of just giving it.`,
            sales: `Be persuasive but professional. Focus on benefits and solving the user's pain points. Try to guide them towards a booking or purchase.`,
            customer_support: `Be empathetic and concise. Focus on troubleshooting and providing direct answers from the documentation.`,
            general: `Provide balanced, accurate, and helpful information.`
        };

        return `${strictGrounding}\n\n${base}\n\nMODE INSTRUCTIONS (${mode.toUpperCase()}): ${templates[mode]}`;
    }

    static async runQuery(options: RagOptions) {
        const { chatbotId, query, history = [], mode = 'general', stream = false } = options;

        // 1. Load Chatbot
        const chatbot = await prisma.chatbot.findUnique({
            where: { id: chatbotId },
            include: { chatbotSources: true }
        });
        if (!chatbot) throw new Error('Chatbot not found');

        // 2. Embed Query (Track Embedding Latency)
        const embedStart = process.hrtime();
        const queryEmbedding = await embedQuery(query);
        const embedDiff = process.hrtime(embedStart);
        const embedDuration = (embedDiff[0] * 1e9 + embedDiff[1]) / 1e9;
        MetricsManager.ragEmbeddingDuration.observe({ provider: 'Google' }, embedDuration);

        // 3. Determine sources
        let sourceIds: string[] | null = null;
        if (chatbot.chatbotSources && chatbot.chatbotSources.length > 0) {
            sourceIds = chatbot.chatbotSources.map(cs => cs.sourceId);
        }

        // 4. Vector Search (Track Search Latency & Empty Results)
        const searchStart = process.hrtime();
        console.log(`[RagService] Searching for context across sources: ${sourceIds ? sourceIds.length + ' assigned' : 'All'}`);
        const contextResults = await similaritySearch(
            queryEmbedding,
            chatbot.workspaceId,
            sourceIds,
            20,
            0.0
        );
        const searchDiff = process.hrtime(searchStart);
        const searchDuration = (searchDiff[0] * 1e9 + searchDiff[1]) / 1e9;
        MetricsManager.ragRetrievalDuration.observe({ chatbot_id: chatbotId }, searchDuration);

        if (contextResults.length === 0) {
            MetricsManager.ragRetrievalEmptyResults.inc({ chatbot_id: chatbotId });
        }

        const contextText = contextResults.map(r => r.content).join('\n---\n');
        const citations = contextResults.map(r => ({
            content: r.content,
            score: r.score,
            sourceId: r.sourceId
        }));

        // 5. Build Prompt
        const systemInstruction = this.getSystemPrompt(mode, chatbot.systemPrompt || undefined);
        
        const historyText = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');

        const finalPrompt = `
System Instruction:
${systemInstruction}

Relevant Context from Documents:
${contextText || 'No relevant documentation found.'}

Recent Conversation History (Excluding Current Query):
${historyText || 'No previous history.'}

User Query: ${query}

Final Response:`.trim();

        const model = genAI.getGenerativeModel({ model: LLM_MODEL });

        // Calculate prompt input size estimates
        const inputTokens = Math.ceil(finalPrompt.length / 4);
        MetricsManager.llmTokens.inc({ provider: 'Google', model: LLM_MODEL, type: 'input' }, inputTokens);

        const llmStart = process.hrtime();

        if (stream) {
            try {
                // Wrap the stream content initiation in rate-limit retry logic
                const streamResult = await withGeminiRetry(async () => {
                    return await model.generateContentStream(finalPrompt);
                });
                
                const llmDiff = process.hrtime(llmStart);
                const firstTokenDuration = (llmDiff[0] * 1e9 + llmDiff[1]) / 1e9;
                MetricsManager.llmTimeToFirstToken.observe({ provider: 'Google', model: LLM_MODEL }, firstTokenDuration);
                
                MetricsManager.llmRequests.inc({ provider: 'Google', model: LLM_MODEL, status: 'success' });
                
                return {
                    stream: streamResult.stream, // return AsyncGenerator directly
                    citations
                };
            } catch (error: any) {
                MetricsManager.llmRequests.inc({ provider: 'Google', model: LLM_MODEL, status: 'error' });
                log.error(`LLM Generative streaming call failed: ${error.message}`, {
                    providerName: 'Google',
                    modelName: LLM_MODEL,
                    chatbotId
                });
                throw error;
            }
        }

        try {
            // Wrap standard generation content in rate-limit retry logic
            const result = await withGeminiRetry(async () => {
                return await model.generateContent(finalPrompt);
            });

            const llmDiff = process.hrtime(llmStart);
            const llmDuration = (llmDiff[0] * 1e9 + llmDiff[1]) / 1e9;
            MetricsManager.llmRequestDuration.observe({ provider: 'Google', model: LLM_MODEL }, llmDuration);

            const textResponse = result.response.text();
            const outputTokens = Math.ceil(textResponse.length / 4);

            MetricsManager.llmTokens.inc({ provider: 'Google', model: LLM_MODEL, type: 'output' }, outputTokens);
            MetricsManager.llmTokens.inc({ provider: 'Google', model: LLM_MODEL, type: 'total' }, inputTokens + outputTokens);

            // Estimate Cost (Gemini Flash Lite is approx $0.075 / 1M input tokens and $0.30 / 1M output tokens)
            const cost = ((inputTokens * 0.075) / 1000000) + ((outputTokens * 0.30) / 1000000);
            MetricsManager.llmCost.inc({ provider: 'Google', model: LLM_MODEL }, cost);

            MetricsManager.llmRequests.inc({ provider: 'Google', model: LLM_MODEL, status: 'success' });

            return {
                text: textResponse,
                citations
            };
        } catch (error: any) {
            MetricsManager.llmRequests.inc({ provider: 'Google', model: LLM_MODEL, status: 'error' });
            log.error(`LLM Generative query call failed: ${error.message}`, {
                providerName: 'Google',
                modelName: LLM_MODEL,
                chatbotId
            });
            throw error;
        }
    }
}
