import { Request, Response } from "express";
import { ChatService } from "./chat.service";
import { OrchestratorService } from "./orchestrator/orchestrator.service";
import { RunTree } from "langsmith";
import { env } from "../../config/env";

export const createSession = async (req: Request, res: Response) => {
  try {
    const chatbotId = req.params.chatbotId as string;
    const { formData } = req.body;
    const embedPublicKey = (req as any).embedPublicKey as string | undefined;

    const result = await ChatService.createSession(chatbotId, formData, embedPublicKey);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const endSession = async (req: Request, res: Response) => {
  try {
    const chatbotId = req.params.chatbotId as string;
    const sessionId = req.params.sessionId as string;
    await ChatService.endSession(chatbotId, sessionId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getSession = async (req: Request, res: Response) => {
  try {
    const chatbotId = req.params.chatbotId as string;
    const sessionId = req.params.sessionId as string;
    const session = await ChatService.getSession(chatbotId, sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(session);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const rateMessage = async (req: Request, res: Response) => {
  try {
    const messageId = req.params.messageId as string;
    const { rating } = req.body;
    await ChatService.rateMessage(messageId, rating);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const streamMessage = async (req: Request, res: Response) => {
  try {
    const chatbotId = req.params.chatbotId as string;
    const { sessionId, message, channel = "api", formData } = req.body;
    
    const userId = req.user?.id || "anonymous";
    const accessLevel = req.user?.role || "viewer";

    const apiKeyWorkspaceId = (req as any).apiKeyWorkspaceId;
    let targetWorkspaceId = apiKeyWorkspaceId;

    if (!targetWorkspaceId) {
      const { prisma } = require("../../lib/prisma");
      const chatbot = await prisma.chatbot.findUnique({ where: { id: chatbotId } });
      if (!chatbot) return res.status(404).json({ error: "Chatbot not found" });
      targetWorkspaceId = chatbot.workspaceId;
    }

    let actualSessionId = sessionId;
    if (!actualSessionId) {
      const embedPublicKey = (req as any).embedPublicKey as string | undefined;
      const session = await ChatService.createSession(chatbotId, formData, embedPublicKey);
      actualSessionId = session.sessionId;
    }

    const { orchestratorPayload, retrievedChunkIds, retrievedChunks, isEmpty } = await ChatService.prepareMessagePayload(
      chatbotId,
      targetWorkspaceId,
      actualSessionId,
      userId,
      channel,
      accessLevel,
      message
    );

    let trace: RunTree | undefined;
    if (env.LANGSMITH_TRACING && env.LANGSMITH_API_KEY) {
      trace = new RunTree({
        name: "ChatStream",
        run_type: "chain",
        inputs: {
          user_message: message,
          session_id: actualSessionId,
          chatbot_id: chatbotId,
          retrieved_chunk_ids: retrievedChunkIds,
          source_ids: retrievedChunks.map((c: any) => c.sourceId),
          similarity_scores: retrievedChunks.map((c: any) => c.similarity),
          chunk_previews: retrievedChunks.map((c: any) => c.content.substring(0, 150) + "..."),
          final_system_prompt: orchestratorPayload.messages[0].content
        },
        project_name: env.LANGSMITH_PROJECT || "default"
      });
      await trace.postRun();
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    try {
      let fullResponse = "";
      let metadata: any = {};

      if (isEmpty) {
        fullResponse = "I don't have enough information from the uploaded documents.";
        metadata = { provider: "system", reason: "empty_retrieval_fallback" };
        
        // Write it to stream immediately
        res.write(`data: ${JSON.stringify({ text: fullResponse })}\n\n`);
      } else {
        const result = await OrchestratorService.generateStream(
          orchestratorPayload.messages,
          (chunk) => {
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
          }
        );
        fullResponse = result.content;
        metadata = result.metadata;
      }

      res.write("event: done\ndata: {}\n\n");
      res.end();

      await ChatService.saveAssistantMessage(actualSessionId, fullResponse, retrievedChunkIds);

      if (trace) {
        await trace.end({
          outputs: { final_answer: fullResponse, ...metadata }
        });
        await trace.patchRun();
      }
    } catch (err: any) {
      if (trace) {
        await trace.end({ error: err.message });
        await trace.patchRun();
      }
      throw err;
    }

  } catch (error: any) {
    console.error("[StreamMessage Error]", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.end();
    }
  }
};

export const nonStreamMessage = async (req: Request, res: Response) => {
  try {
    const chatbotId = req.params.chatbotId as string;
    const { sessionId, message, channel = "api", formData } = req.body;
    
    const userId = req.user?.id || "anonymous";
    const accessLevel = req.user?.role || "viewer";

    const apiKeyWorkspaceId = (req as any).apiKeyWorkspaceId;
    let targetWorkspaceId = apiKeyWorkspaceId;

    if (!targetWorkspaceId) {
      const { prisma } = require("../../lib/prisma");
      const chatbot = await prisma.chatbot.findUnique({ where: { id: chatbotId } });
      if (!chatbot) return res.status(404).json({ error: "Chatbot not found" });
      targetWorkspaceId = chatbot.workspaceId;
    }

    let actualSessionId = sessionId;
    if (!actualSessionId) {
      const embedPublicKey = (req as any).embedPublicKey as string | undefined;
      const session = await ChatService.createSession(chatbotId, formData, embedPublicKey);
      actualSessionId = session.sessionId;
    }

    const { orchestratorPayload, retrievedChunkIds, retrievedChunks, isEmpty } = await ChatService.prepareMessagePayload(
      chatbotId,
      targetWorkspaceId,
      actualSessionId,
      userId,
      channel,
      accessLevel,
      message
    );

    let trace: RunTree | undefined;
    if (env.LANGSMITH_TRACING && env.LANGSMITH_API_KEY) {
      trace = new RunTree({
        name: "ChatMessage",
        run_type: "chain",
        inputs: {
          user_message: message,
          session_id: actualSessionId,
          chatbot_id: chatbotId,
          retrieved_chunk_ids: retrievedChunkIds,
          source_ids: retrievedChunks.map((c: any) => c.sourceId),
          similarity_scores: retrievedChunks.map((c: any) => c.similarity),
          chunk_previews: retrievedChunks.map((c: any) => c.content.substring(0, 150) + "..."),
          final_system_prompt: orchestratorPayload.messages[0].content
        },
        project_name: env.LANGSMITH_PROJECT || "default"
      });
      await trace.postRun();
    }

    try {
      let assistantMessage = "";
      let metadata: any = {};

      if (isEmpty) {
        assistantMessage = "I don't have enough information from the uploaded documents.";
        metadata = { provider: "system", reason: "empty_retrieval_fallback" };
      } else {
        const result = await OrchestratorService.generateMessage(
          orchestratorPayload.messages
        );
        assistantMessage = result.content;
        metadata = result.metadata;
      }

      await ChatService.saveAssistantMessage(actualSessionId, assistantMessage, retrievedChunkIds);

      if (trace) {
        await trace.end({
          outputs: { final_answer: assistantMessage, ...metadata }
        });
        await trace.patchRun();
      }

      res.json({ response: assistantMessage, sessionId: actualSessionId });
    } catch (err: any) {
      if (trace) {
        await trace.end({ error: err.message });
        await trace.patchRun();
      }
      throw err;
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
