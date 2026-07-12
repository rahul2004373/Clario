import { prisma } from "../../lib/prisma";
import { AgentRole, AgentTone, BusinessType } from "@prisma/client";

export class ChatbotService {
  private static async verifyMembership(workspaceId: string, userId: string, requireAdmin: boolean = false) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } }
    });
    if (!member) {
      throw new Error("Unauthorized: Not a member of this workspace");
    }
    if (requireAdmin && member.role !== "OWNER" && member.role !== "ADMIN") {
      throw new Error("Unauthorized: Only owners and admins can perform this action");
    }
    return member;
  }

  static async listChatbots(workspaceId: string, userId: string) {
    await this.verifyMembership(workspaceId, userId);
    return prisma.chatbot.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" }
    });
  }

  static async createChatbot(
    workspaceId: string, 
    userId: string, 
    data: { name: string; description?: string; agentRole?: AgentRole; businessType?: BusinessType; systemPrompt: string; agentTone?: AgentTone; welcomeMessage?: string; fallbackMessage?: string; }
  ) {
    await this.verifyMembership(workspaceId, userId, true);
    
    return prisma.chatbot.create({
      data: {
        workspaceId,
        ...data,
        widget: {
          create: {
            isActive: false,
            initialMessages: ["Hi there! How can I help you today?"]
          }
        }
      }
    });
  }

  static async getChatbot(workspaceId: string, chatbotId: string, userId: string) {
    await this.verifyMembership(workspaceId, userId);
    
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId }
    });

    if (!chatbot || chatbot.workspaceId !== workspaceId) {
      throw new Error("Chatbot not found in this workspace");
    }

    return chatbot;
  }

  static async updateChatbot(workspaceId: string, chatbotId: string, userId: string, data: any) {
    await this.verifyMembership(workspaceId, userId, true);
    
    const chatbot = await prisma.chatbot.findUnique({ where: { id: chatbotId } });
    if (!chatbot || chatbot.workspaceId !== workspaceId) {
      throw new Error("Chatbot not found in this workspace");
    }

    // If systemPrompt is updated, we might want to bump promptVersion (optional, keeping it simple)
    if (data.systemPrompt && data.systemPrompt !== chatbot.systemPrompt) {
      data.promptVersion = chatbot.promptVersion + 1;
    }

    return prisma.chatbot.update({
      where: { id: chatbotId },
      data
    });
  }

  static async deleteChatbot(workspaceId: string, chatbotId: string, userId: string) {
    await this.verifyMembership(workspaceId, userId, true);
    
    const chatbot = await prisma.chatbot.findUnique({ where: { id: chatbotId } });
    if (!chatbot || chatbot.workspaceId !== workspaceId) {
      return { success: true, message: "Chatbot already deleted or not found" }; // Graceful
    }

    await prisma.chatbot.delete({
      where: { id: chatbotId }
    });

    return { success: true, message: "Chatbot deleted" };
  }

  static async togglePublish(workspaceId: string, chatbotId: string, userId: string, isPublished: boolean) {
    await this.verifyMembership(workspaceId, userId, true);
    
    const chatbot = await prisma.chatbot.findUnique({ where: { id: chatbotId } });
    if (!chatbot || chatbot.workspaceId !== workspaceId) {
      throw new Error("Chatbot not found in this workspace");
    }

    if (chatbot.isPublished === isPublished) {
      return chatbot; // Graceful ignore
    }

    return prisma.chatbot.update({
      where: { id: chatbotId },
      data: { isPublished }
    });
  }

  static async getEmbedCode(workspaceId: string, chatbotId: string, userId: string) {
    await this.verifyMembership(workspaceId, userId);
    
    const chatbot = await prisma.chatbot.findUnique({ where: { id: chatbotId } });
    if (!chatbot || chatbot.workspaceId !== workspaceId) {
      throw new Error("Chatbot not found in this workspace");
    }

    // Generate script tag HTML
    const embedCode = `<script src="https://cdn.clario.co/widget.js" data-chatbot-id="${chatbotId}"></script>`;

    return { embedCode };
  }

  static async getLastTrainedTime(workspaceId: string, chatbotId: string, userId: string) {
    await this.verifyMembership(workspaceId, userId);
    
    const chatbot = await prisma.chatbot.findUnique({ where: { id: chatbotId } });
    if (!chatbot || chatbot.workspaceId !== workspaceId) {
      throw new Error("Chatbot not found in this workspace");
    }

    const lastSource = await prisma.source.findFirst({
      where: {
        chatbotId,
        ingestionStatus: 'COMPLETED'
      },
      orderBy: {
        lastIngestedAt: 'desc'
      },
      select: {
        lastIngestedAt: true
      }
    });

    return { lastTrainedAt: lastSource?.lastIngestedAt || null };
  }
}
