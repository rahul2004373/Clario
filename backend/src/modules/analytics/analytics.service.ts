import { prisma } from "../../lib/prisma";

export class AnalyticsService {
  static async getDashboardMetrics(chatbotId: string, startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    const conversationWhere = {
      chatbotId,
      ...(Object.keys(dateFilter).length > 0 && { startedAt: dateFilter })
    };

    const messageWhere = {
      conversation: {
        chatbotId,
        ...(Object.keys(dateFilter).length > 0 && { startedAt: dateFilter })
      }
    };

    const analyticsWhere = {
      chatbotId,
      // For Analytics table, we might filter based on created date if we had one, but we don't.
      // So we filter via conversation relationship if needed, but since it's just questions,
      // we'll fetch them. We could add a date filter if we add a createdAt to ConversationAnalytics,
      // but for now let's just filter by chatbotId.
    };

    // 1. Total Conversations
    const totalConversations = await prisma.conversation.count({
      where: conversationWhere
    });

    // 2. Total Messages
    const totalMessages = await prisma.message.count({
      where: messageWhere
    });

    // 3. Average Conversation Length
    const avgConversationLength = totalConversations > 0 ? (totalMessages / totalConversations).toFixed(1) : 0;

    // 4. Cost and Token Tracking
    const costAndTokens = await prisma.message.aggregate({
      where: messageWhere,
      _sum: {
        estimatedCostUsd: true,
        inputTokens: true,
        outputTokens: true
      }
    });

    // 5. Traffic Source (Widget vs Dashboard/API)
    const trafficSourceGroups = await prisma.conversation.groupBy({
      by: ['embedPublicKey'],
      where: conversationWhere,
      _count: {
        id: true
      }
    });

    const trafficSource = {
      widget: 0,
      dashboard: 0,
      api: 0 // currently not distinctly tracked unless we add an api flag
    };

    trafficSourceGroups.forEach(group => {
      if (group.embedPublicKey) {
        trafficSource.widget += group._count.id;
      } else {
        trafficSource.dashboard += group._count.id;
      }
    });

    // 6. Top Questions Asked
    const topQuestionsGroup = await prisma.conversationAnalytics.groupBy({
      by: ['questionTopicTag'],
      where: {
        chatbotId,
        questionTopicTag: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    const topQuestions = topQuestionsGroup.map(item => ({
      topic: item.questionTopicTag,
      count: item._count.id
    }));

    // 7. Topic Trends (Raw SQL since we need to join Message or Conversation for the date)
    // We will group by Conversation startedAt
    const topicTrendsQuery = `
      SELECT 
        DATE_TRUNC('day', c."startedAt") as date, 
        a."questionTopicTag" as topic, 
        COUNT(a.id)::int as count 
      FROM "conversation_analytics" a
      JOIN "conversations" c ON a."conversationId" = c.id
      WHERE a."chatbotId" = $1
      AND a."questionTopicTag" IS NOT NULL
      ${startDate ? `AND c."startedAt" >= $2::timestamp` : ''}
      ${endDate ? `AND c."startedAt" <= $3::timestamp` : ''}
      GROUP BY date, topic
      ORDER BY date ASC
    `;

    const queryArgs: any[] = [chatbotId];
    if (startDate) queryArgs.push(new Date(startDate));
    if (endDate) queryArgs.push(new Date(endDate));

    const topicTrendsRaw: any[] = await prisma.$queryRawUnsafe(topicTrendsQuery, ...queryArgs);

    const topicTrends = topicTrendsRaw.map(item => ({
      date: item.date,
      topic: item.topic,
      count: item.count
    }));

    return {
      totalConversations,
      totalMessages,
      avgConversationLength: Number(avgConversationLength),
      totalCostUsd: costAndTokens._sum.estimatedCostUsd || 0,
      totalInputTokens: costAndTokens._sum.inputTokens || 0,
      totalOutputTokens: costAndTokens._sum.outputTokens || 0,
      trafficSource,
      topQuestions,
      topicTrends
    };
  }
}
