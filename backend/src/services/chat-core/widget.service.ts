import { prisma } from '../../db';

export class WidgetService {
    // ─── Management API (Dashboard / Owner) ──────────────────────────────────
    static async getOrCreateWidgetSetting(chatbotId: string, workspaceId: string, userId: string) {
        // Verify chatbot ownership
        const chatbot = await prisma.chatbot.findFirst({
            where: { id: chatbotId, workspace: { id: workspaceId, ownerId: userId } }
        });
        if (!chatbot) throw new Error('Chatbot not found or unauthorized');

        let widgetSetting = await prisma.widgetSetting.findUnique({
            where: { chatbotId }
        });

        if (!widgetSetting) {
            widgetSetting = await prisma.widgetSetting.create({
                data: {
                    chatbotId,
                    allowedDomains: [],
                    welcomeMessage: "Hello! How can I help you today?",
                    isActive: true
                }
            });
        }
        return widgetSetting;
    }

    static async updateWidgetSetting(chatbotId: string, workspaceId: string, userId: string, data: { allowedDomains?: string[]; welcomeMessage?: string; themeConfig?: any; isActive?: boolean }) {
        // Verify chatbot ownership
        const chatbot = await prisma.chatbot.findFirst({
            where: { id: chatbotId, workspace: { id: workspaceId, ownerId: userId } }
        });
        if (!chatbot) throw new Error('Chatbot not found or unauthorized');

        return prisma.widgetSetting.upsert({
            where: { chatbotId },
            create: {
                chatbotId,
                allowedDomains: data.allowedDomains || [],
                welcomeMessage: data.welcomeMessage || "Hello! How can I help you today?",
                themeConfig: data.themeConfig || {},
                isActive: data.isActive !== undefined ? data.isActive : true
            },
            update: {
                ...(data.allowedDomains && { allowedDomains: data.allowedDomains }),
                ...(data.welcomeMessage && { welcomeMessage: data.welcomeMessage }),
                ...(data.themeConfig !== undefined && { themeConfig: data.themeConfig }),
                ...(data.isActive !== undefined && { isActive: data.isActive })
            }
        });
    }

    // ─── Public Widget API (Embedded Chat) ───────────────────────────────────

    static async validateWidgetOrigin(widgetToken: string, originOrReferer: string | undefined) {
        const widgetSetting = await prisma.widgetSetting.findUnique({
            where: { widgetToken },
            include: { chatbot: true }
        });

        if (!widgetSetting || !widgetSetting.isActive) {
            throw new Error('Widget is inactive or not found');
        }

        if (widgetSetting.allowedDomains && widgetSetting.allowedDomains.length > 0) {
            if (!originOrReferer) throw new Error('Missing origin header for domain validation');
            try {
                const url = new URL(originOrReferer);
                const host = url.hostname;
                const matches = widgetSetting.allowedDomains.some(domain => {
                    const cleanDomain = domain.replace(/^(https?:\/\/)/, '').trim();
                    return host === cleanDomain || host.endsWith('.' + cleanDomain);
                });

                if (!matches) {
                    throw new Error(`Domain ${host} is not authorized for this widget`);
                }
            } catch (err: any) {
                throw new Error(err.message || 'Invalid origin for widget');
            }
        }

        return widgetSetting;
    }

    static async getOrCreateVisitor(widgetToken: string, visitorId?: string, userMeta?: { externalId?: string; name?: string; email?: string }) {
        let visitor;
        if (visitorId) {
            visitor = await prisma.visitor.findFirst({
                where: { id: visitorId, widgetToken }
            });
        }

        // If externalId provided, try finding by externalId
        if (!visitor && userMeta?.externalId) {
            visitor = await prisma.visitor.findFirst({
                where: { widgetToken, externalId: userMeta.externalId }
            });
        }

        if (!visitor) {
            visitor = await prisma.visitor.create({
                data: {
                    widgetToken,
                    externalId: userMeta?.externalId || null,
                    name: userMeta?.name || null,
                    email: userMeta?.email || null,
                    metadata: userMeta || {}
                }
            });
        } else if (userMeta && (userMeta.name || userMeta.email || userMeta.externalId)) {
            // Update metadata if new info passed
            visitor = await prisma.visitor.update({
                where: { id: visitor.id },
                data: {
                    ...(userMeta.externalId && { externalId: userMeta.externalId }),
                    ...(userMeta.name && { name: userMeta.name }),
                    ...(userMeta.email && { email: userMeta.email }),
                    metadata: {
                        ...(visitor.metadata as any || {}),
                        ...userMeta
                    }
                }
            });
        }

        return visitor;
    }

    static async identifyVisitor(widgetToken: string, visitorId: string, externalId: string, name?: string, email?: string) {
        const visitor = await prisma.visitor.findFirst({
            where: { id: visitorId, widgetToken }
        });
        if (!visitor) throw new Error('Visitor not found');

        return prisma.visitor.update({
            where: { id: visitorId },
            data: {
                externalId,
                name: name || visitor.name,
                email: email || visitor.email,
                metadata: {
                    ...(visitor.metadata as any || {}),
                    externalId,
                    name,
                    email
                }
            }
        });
    }

    static async manageConversationSession(visitorId: string, chatbotId: string) {
        // Find latest conversation for visitor
        const latestConv = await prisma.conversation.findFirst({
            where: { visitorId, chatbotId },
            orderBy: { updatedAt: 'desc' }
        });

        const now = new Date();

        if (latestConv) {
            const diffMins = (now.getTime() - latestConv.updatedAt.getTime()) / (1000 * 60);

            if (latestConv.status === 'closed' || diffMins >= 60) {
                // If previously closed or inactive > 60 mins -> mark closed if not already, and create new
                if (latestConv.status !== 'closed') {
                    await prisma.conversation.update({
                        where: { id: latestConv.id },
                        data: { status: 'closed' }
                    });
                }
                // Continue to create new
            } else if (diffMins >= 20) {
                // Inactive between 20 and 60 mins. If we are checking session status, it's inactive
                if (latestConv.status === 'active') {
                    const updated = await prisma.conversation.update({
                        where: { id: latestConv.id },
                        data: { status: 'inactive' }
                    });
                    return updated;
                }
                return latestConv;
            } else {
                // Active session < 20 mins
                if (latestConv.status === 'inactive') {
                    // Woke up within 60 mins -> resume active
                    const updated = await prisma.conversation.update({
                        where: { id: latestConv.id },
                        data: { status: 'active', updatedAt: now }
                    });
                    return updated;
                }
                return latestConv;
            }
        }

        // Create new active session
        return prisma.conversation.create({
            data: {
                chatbotId,
                visitorId,
                title: 'Widget Chat - ' + now.toLocaleDateString(),
                status: 'active',
                channel: 'widget'
            }
        });
    }

    static async closeWidgetConversation(conversationId: string, visitorId: string, reason?: string) {
        const conv = await prisma.conversation.findFirst({
            where: { id: conversationId, visitorId }
        });
        if (!conv) throw new Error('Conversation not found or unauthorized');

        return prisma.conversation.update({
            where: { id: conversationId },
            data: { status: 'closed', updatedAt: new Date() }
        });
    }

    static async getWidgetConversation(conversationId: string, visitorId: string) {
        return prisma.conversation.findFirst({
            where: { id: conversationId, visitorId },
            include: {
                chatbot: true,
                messages: { orderBy: { createdAt: 'asc' } }
            }
        });
    }
}
