import { prisma } from "../../lib/prisma";
import { ChatService } from "../chat/chat.service";
import { OrchestratorService } from "../chat/orchestrator/orchestrator.service";
import { MessageRole } from "@prisma/client";

export class PlaygroundService {
  static async createSession(chatbotId: string, formData?: any) {
    const sessionId = `pg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId }
    });
    
    if (!chatbot) throw new Error("Chatbot not found");
    
    const conversation = await prisma.conversation.create({
      data: {
        chatbotId,
        sessionId,
        formData: formData || {},
        userId: "playground-user", // strictly tag it so it can be identified
      }
    });

    return { sessionId: conversation.id, welcomeMessage: chatbot.welcomeMessage };
  }

  static async streamMessage(
    chatbotId: string,
    workspaceId: string,
    sessionId: string,
    message: string,
    onChunk: (chunk: string) => void
  ) {
    // 1. Prepare message payload using existing robust RAG logic
    const { orchestratorPayload, retrievedChunkIds, isEmpty } = await ChatService.prepareMessagePayload(
      chatbotId,
      workspaceId,
      sessionId,
      "playground-user",
      "playground",
      "admin",
      message
    );

    let fullResponse = "";

    if (isEmpty) {
      fullResponse = "I don't have enough information from the uploaded documents.";
      onChunk(fullResponse);
    } else {
      const result = await OrchestratorService.generateStream(
        orchestratorPayload.messages,
        onChunk
      );
      fullResponse = result.content;
    }

    // 2. Save assistant message
    await prisma.message.create({
      data: {
        conversationId: sessionId,
        role: MessageRole.ASSISTANT,
        content: fullResponse,
        retrievedChunkIds
      }
    });
  }

  static async clearSession(chatbotId: string, sessionId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: sessionId, chatbotId }
    });

    if (!conversation) {
      throw new Error("Session not found");
    }

    if (conversation.userId !== "playground-user") {
      throw new Error("Cannot clear non-playground sessions via this endpoint");
    }

    // Delete the conversation (cascades to messages)
    await prisma.conversation.delete({
      where: { id: sessionId }
    });
  }
}
