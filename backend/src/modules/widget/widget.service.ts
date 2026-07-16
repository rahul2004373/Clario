import { prisma } from "../../lib/prisma";
import { WidgetTheme, BubbleAlignment } from "@prisma/client";
import { env } from "../../config/env";

export class WidgetService {
  static async getWidgetConfig(chatbotId: string) {
    return prisma.chatWidget.upsert({
      where: { chatbotId },
      update: {},
      create: {
        chatbotId,
        isActive: false,
        initialMessages: ["Hi there! How can I help you today?"]
      }
    });
  }

  static async updateWidgetConfig(chatbotId: string, data: any) {
    // Only allow specific fields to be updated
    const updateData: any = {};
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.initialMessages !== undefined) updateData.initialMessages = data.initialMessages;
    if (data.messagePlaceholder !== undefined) updateData.messagePlaceholder = data.messagePlaceholder;
    if (data.footerText !== undefined) updateData.footerText = data.footerText;
    if (data.theme !== undefined) updateData.theme = data.theme;
    if (data.profilePictureUrl !== undefined) updateData.profilePictureUrl = data.profilePictureUrl;
    if (data.chatIconUrl !== undefined) updateData.chatIconUrl = data.chatIconUrl;
    if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor;
    if (data.bubbleColor !== undefined) updateData.bubbleColor = data.bubbleColor;
    if (data.bubbleAlignment !== undefined) updateData.bubbleAlignment = data.bubbleAlignment;

    return prisma.chatWidget.upsert({
      where: { chatbotId },
      update: updateData,
      create: {
        chatbotId,
        isActive: false,
        initialMessages: ["Hi there! How can I help you today?"],
        ...updateData
      }
    });
  }

  static async activateWidget(chatbotId: string, isActive: boolean) {
    return prisma.chatWidget.upsert({
      where: { chatbotId },
      update: { isActive },
      create: {
        chatbotId,
        isActive,
        initialMessages: ["Hi there! How can I help you today?"]
      }
    });
  }

  static async getEmbedCode(chatbotId: string) {
    const widget = await prisma.chatWidget.upsert({
      where: { chatbotId },
      update: {},
      create: {
        chatbotId,
        isActive: false,
        initialMessages: ["Hi there! How can I help you today?"]
      },
      select: { embedPublicKey: true }
    });

    const embedCode = `<script src="${env.WIDGET_SCRIPT_URL}" data-key="${widget.embedPublicKey}"></script>`;
    return { embedCode };
  }

  static async getPublicWidgetConfig(embedPublicKey: string) {
    const widget = await prisma.chatWidget.findUnique({
      where: { embedPublicKey },
      include: {
        chatbot: {
          select: { name: true } // Need this for fallback displayName
        }
      }
    });

    if (!widget) {
      throw new Error("Widget not found");
    }

    if (!widget.isActive) {
      return { isActive: false };
    }

    // Return only safe fields needed for rendering
    return {
      isActive: true,
      displayName: widget.displayName || widget.chatbot.name,
      initialMessages: widget.initialMessages,
      messagePlaceholder: widget.messagePlaceholder,
      footerText: widget.footerText,
      theme: widget.theme,
      profilePictureUrl: widget.profilePictureUrl,
      chatIconUrl: widget.chatIconUrl,
      primaryColor: widget.primaryColor,
      bubbleColor: widget.bubbleColor,
      bubbleAlignment: widget.bubbleAlignment
    };
  }
}
