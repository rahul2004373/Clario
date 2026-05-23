import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';
import { prisma } from '../../db';
import { embedQuery } from '../ingestion/embedder';
import { similaritySearch } from '../ingestion/vectorStore';
import { WorkspaceService } from '../../services/workspace.service';
import { withGeminiRetry } from '../../utils/geminiRetry';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');
// Use gemini-flash-lite-latest as default free-tier LLM for RAG to avoid 429 rate limits
const LLM_MODEL = 'gemini-flash-lite-latest';

export async function runQueryPipeline(
    query: string,
    chatbotId: string,
    userId: string
) {
    // 1. Fetch Chatbot and verify ownership
    const chatbot = await prisma.chatbot.findUnique({
        where: { id: chatbotId },
        include: { chatbotSources: true }
    });

    if (!chatbot) {
        throw new Error('Chatbot not found');
    }

    // Verify workspace ownership
    await WorkspaceService.getWorkspaceById(chatbot.workspaceId, userId);

    // 2. Determine sources to search
    let sourceIdsToSearch: string[] | null = null;
    if (chatbot.chatbotSources && chatbot.chatbotSources.length > 0) {
        sourceIdsToSearch = chatbot.chatbotSources.map(cs => cs.sourceId);
    }

    // Optional: If you want to throw an error when the workspace itself has 0 sources globally
    if (sourceIdsToSearch === null) {
        const workspaceSourceCount = await prisma.source.count({
            where: { workspaceId: chatbot.workspaceId }
        });
        if (workspaceSourceCount === 0) {
            return {
                response: "This workspace has no uploaded documents. Please upload some documents first to use the chatbot.",
                context: []
            };
        }
    }

    // 3. Embed the user query (already wrapped with retry resilience under the hood!)
    const queryEmbedding = await embedQuery(query);

    // 4. Similarity Search in Vector DB
    console.log(`[QueryPipeline] Searching for context in sources: ${sourceIdsToSearch || 'ALL'}`);
    const searchResults = await similaritySearch(
        queryEmbedding,
        chatbot.workspaceId,
        sourceIdsToSearch,
        20, // Top 20 results for broader context coverage
        0.0 // Relaxed similarity threshold
    );

    // 5. Construct Context and Prompt
    let contextText = '';
    if (searchResults.length > 0) {
        contextText = searchResults.map((res, i) => {
            return `--- Source Document Snippet ${i + 1} ---\n${res.content}`;
        }).join('\n\n');
    } else {
        contextText = "No relevant context found in the documents.";
    }

    const systemInstruction = chatbot.systemPrompt || 'You are a helpful assistant answering questions based strictly on the provided context.';

    const prompt = `
System Instruction:
${systemInstruction}

Here is the context retrieved from the user's documents:
${contextText}

User Query:
${query}

Please answer the User Query using ONLY the information provided in the context above. If the answer is not in the context, say "I don't have enough information in my knowledge base to answer that."
    `.trim();

    // 6. Call Gemini LLM with rate limit retries
    const model = genAI.getGenerativeModel({ model: LLM_MODEL });

    const result = await withGeminiRetry(async () => {
        return await model.generateContent(prompt);
    });
    
    const responseText = result.response.text();

    return {
        response: responseText,
        context: searchResults.map(r => ({
            sourceId: r.sourceId,
            content: r.content,
            score: r.score
        }))
    };
}
