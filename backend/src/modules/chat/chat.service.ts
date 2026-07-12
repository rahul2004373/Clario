import { prisma } from "../../lib/prisma";
import { MessageRole } from "@prisma/client";
import { embedText } from "../../rag/ingestion/embedder";
import { similaritySearch } from "../../rag/retrieval/vector-store";

export class ChatService {
  static async createSession(chatbotId: string, formData?: any, embedPublicKey?: string) {
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId }
    });

    if (!chatbot) {
      throw new Error("Chatbot not found");
    }

    const conversation = await prisma.conversation.create({
      data: {
        chatbotId,
        sessionId: formData?.sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        formData: formData || {},
        embedPublicKey: embedPublicKey || null,
      }
    });

    return {
      sessionId: conversation.id,
      welcomeMessage: chatbot.welcomeMessage
    };
  }

  static async endSession(chatbotId: string, sessionId: string) {
    return prisma.conversation.update({
      where: { id: sessionId, chatbotId },
      data: {
        isActive: false,
        endedAt: new Date()
      }
    });
  }

  static async getSession(chatbotId: string, sessionId: string) {
    return prisma.conversation.findUnique({
      where: { id: sessionId, chatbotId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });
  }

  static async rateMessage(messageId: string, rating: number) {
    return prisma.message.update({
      where: { id: messageId },
      data: { userRating: rating }
    });
  }

  static async prepareMessagePayload(
    chatbotId: string,
    workspaceId: string,
    sessionId: string,
    userId: string,
    channel: string,
    accessLevel: string,
    messageContent: string,
  ) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: sessionId, chatbotId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!conversation) {
      throw new Error("Session not found");
    }

    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId },
      include: {
        sources: { select: { id: true } },
        toolConfigs: true
      }
    });

    if (!chatbot) {
      throw new Error("Chatbot not found");
    }

    // Save USER message to DB
    const userMessage = await prisma.message.create({
      data: {
        conversationId: sessionId,
        role: MessageRole.USER,
        content: messageContent
      }
    });

    // --- 1. History Trimming ---
    // Take the last 4 messages (2 turns) from history
    const recentHistory = conversation.messages.slice(-4);
    let historyText = "";
    if (recentHistory.length > 0) {
      historyText = "\n\nRELEVANT CHAT HISTORY:\n" + recentHistory.map(m =>
        (m.role === "USER" ? "User: " : "Assistant: ") + m.content
      ).join("\n\n");
    }

    // --- 2. Two-Stage Retrieval & Source Filtering ---
    let retrievedChunks: any[] = [];
    let top10SourceIds: string[] = [];
    let rerankedScores: number[] = [];
    let dominantSourceId = "none";

    try {
      console.log(`\n================ RAG PIPELINE DEBUG ================`);
      console.log(`User Query: \n${messageContent}\n`);
      
      const queryEmbedding = await embedText(messageContent);
      console.log(`✓ Embedding Generated`);
      
      const sourceIds = chatbot.sources.map(s => s.id);

      // Stage 1: Retrieve top 20 (No similarity threshold to avoid empty results)
      const rawChunks = await similaritySearch(queryEmbedding, messageContent, workspaceId, sourceIds, 20, 0.0);
      top10SourceIds = rawChunks.map(c => c.sourceId);
      
      console.log(`\nTop Vector & BM25 Results:`);
      if (rawChunks.length === 0) {
        console.log(`  No chunks found in database for these sources.`);
      } else {
        rawChunks.forEach((chunk, idx) => {
          const preview = chunk.content.substring(0, 80).replace(/\n/g, ' ') + '...';
          console.log(`  ${idx + 1}. Similarity: ${chunk.similarity.toFixed(4)} | Chunk ID: ${chunk.id?.substring(0,8)} | Source: ${chunk.sourceId}\n     Preview: ${preview}`);
        });
      }

      // Stage 2: Basic Source Filtering (Instead of LLM Reranking)
      if (rawChunks.length > 0) {
        const sourceScores: Record<string, number> = {};
        for (const chunk of rawChunks) {
          sourceScores[chunk.sourceId] = (sourceScores[chunk.sourceId] || 0) + chunk.similarity;
        }

        let maxScore = 0;
        for (const [sId, score] of Object.entries(sourceScores)) {
          if (score > maxScore) {
            maxScore = score;
            dominantSourceId = sId;
          }
        }

        const thresholdScore = maxScore * 0.6;
        const validSources = new Set(
          Object.entries(sourceScores)
            .filter(([_, score]) => score >= thresholdScore)
            .map(([sId, _]) => sId)
        );

        // Take top 5 valid chunks
        retrievedChunks = rawChunks
          .filter(c => validSources.has(c.sourceId))
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 5);

        rerankedScores = retrievedChunks.map(c => c.similarity);
        
        console.log(`\nFinal Filtered Chunks (Top 5 from valid sources):`);
        retrievedChunks.forEach((chunk, idx) => {
          console.log(`  ${idx + 1}. Similarity: ${chunk.similarity.toFixed(4)} | Source: ${chunk.sourceId}`);
        });
      }
    } catch (error) {
      console.error("[ChatService] Retrieval error:", error);
    }

    // --- 3. Prompt Assembly ---
    const isEmpty = retrievedChunks.length === 0;

    const strictBoundaryPrompt = `You are a grounded assistant.
Answer only from CURRENT CONTEXT.
Use RELEVANT CHAT HISTORY only if it directly helps answer the current question.
Ignore unrelated prior conversation.
If the answer is not in CURRENT CONTEXT, say you don't know.`;

    const contextText = !isEmpty
      ? `\n\nCURRENT CONTEXT:\n${retrievedChunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n")}`
      : "";

    const finalSystemContent = `${chatbot.systemPrompt || "You are a helpful assistant."}\n\n${strictBoundaryPrompt}${historyText}${contextText}`;

    const orchestratorPayload = {
      messages: [
        { role: "system", content: finalSystemContent },
        { role: "user", content: `CURRENT QUESTION:\n${messageContent}` }
      ],
      metadata: {
        chatbotId,
        workspaceId,
        sessionId,
        userId,
        channel,
        accessLevel,
        formData: conversation.formData,
        agentTone: chatbot.agentTone
      }
    };

    // Calculate rough token count for logging
    const promptTokenCount = Math.round(JSON.stringify(orchestratorPayload).length / 4);

    // --- 4. Practical Debugging Logs ---
    console.log(`\nPrompt Token Count : ${promptTokenCount}`);
    console.log(`====================================================\n`);

    return { orchestratorPayload, retrievedChunkIds: retrievedChunks.map(c => c.id), retrievedChunks, isEmpty };
  }

  static async saveAssistantMessage(sessionId: string, content: string, chunkIds: string[]) {
    return prisma.message.create({
      data: {
        conversationId: sessionId,
        role: MessageRole.ASSISTANT,
        content,
        retrievedChunkIds: chunkIds
      }
    });
  }
}
