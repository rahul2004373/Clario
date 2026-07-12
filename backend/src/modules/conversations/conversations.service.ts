import { prisma } from "../../lib/prisma";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

interface ListConversationsParams {
  workspaceId: string;
  chatbotId?: string;
  page: number;
  limit: number;
  status?: string;
}

export class ConversationsService {
  static async list({ workspaceId, chatbotId, page, limit, status }: ListConversationsParams) {
    const skip = (page - 1) * limit;

    // We must verify the chatbot actually belongs to the workspace, 
    // or if listing across workspace, only include chatbots that belong to workspace
    const chatbotIds = chatbotId
      ? [chatbotId]
      : (await prisma.chatbot.findMany({ where: { workspaceId }, select: { id: true } })).map(c => c.id);

    const whereClause: any = {
      chatbotId: { in: chatbotIds }
    };

    if (status === "active") whereClause.isActive = true;
    if (status === "resolved") whereClause.resolvedAt = { not: null };

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: whereClause,
        orderBy: { lastActivityAt: "desc" },
        skip,
        take: limit,
        include: {
          chatbot: { select: { name: true } }
        }
      }),
      prisma.conversation.count({ where: whereClause })
    ]);

    return {
      data: conversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getDetails(workspaceId: string, conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        chatbot: { select: { workspaceId: true, name: true } }
      }
    });

    if (!conversation || conversation.chatbot.workspaceId !== workspaceId) {
      throw new Error("Conversation not found");
    }

    return conversation;
  }

  static async getMessages(workspaceId: string, conversationId: string) {
    // First authorize
    await this.getDetails(workspaceId, conversationId);

    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" }
    });
  }

  static async updateStatus(workspaceId: string, conversationId: string, updates: { isActive?: boolean, isResolved?: boolean }) {
    await this.getDetails(workspaceId, conversationId);

    const data: any = {};
    if (updates.isActive !== undefined) data.isActive = updates.isActive;
    if (updates.isResolved === true) {
      data.resolvedAt = new Date();
      data.isActive = false;
    } else if (updates.isResolved === false) {
      data.resolvedAt = null;
    }

    return prisma.conversation.update({
      where: { id: conversationId },
      data
    });
  }

  static async delete(workspaceId: string, conversationId: string) {
    await this.getDetails(workspaceId, conversationId);

    return prisma.conversation.delete({
      where: { id: conversationId }
    });
  }

  static async exportTranscriptToPDF(workspaceId: string, conversationId: string): Promise<PassThrough> {
    const conversation = await this.getDetails(workspaceId, conversationId);
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" }
    });

    const doc = new PDFDocument({ margin: 50 });
    const passThrough = new PassThrough();
    doc.pipe(passThrough);

    // Header
    doc.fontSize(20).text(`Conversation Transcript`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Chatbot: ${conversation.chatbot.name}`);
    doc.text(`Session ID: ${conversation.sessionId}`);
    doc.text(`Started At: ${conversation.startedAt.toLocaleString()}`);
    doc.moveDown(2);

    // Messages
    for (const msg of messages) {
      const isUser = msg.role === "USER";
      doc.font("Helvetica-Bold").fontSize(11).fillColor(isUser ? "#0066cc" : "#333333").text(isUser ? "User:" : "Assistant:");
      doc.font("Helvetica").fontSize(11).fillColor("#000000").text(msg.content, { align: 'left' });
      doc.moveDown();
    }

    doc.end();
    return passThrough;
  }
}
