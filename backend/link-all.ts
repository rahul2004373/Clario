import { prisma } from './src/db';

async function linkAllSources(chatbotId: string) {
    const chatbot = await prisma.chatbot.findUnique({
        where: { id: chatbotId }
    });

    if (!chatbot) {
        console.log("Chatbot not found");
        return;
    }

    const sources = await prisma.source.findMany({
        where: { workspaceId: chatbot.workspaceId }
    });

    console.log(`Found ${sources.length} sources in workspace ${chatbot.workspaceId}`);

    for (const source of sources) {
        await prisma.chatbotSource.upsert({
            where: {
                chatbotId_sourceId: {
                    chatbotId,
                    sourceId: source.id
                }
            },
            update: {},
            create: {
                chatbotId,
                sourceId: source.id
            }
        });
    }

    const sourceIds = sources.map(s => s.id);
    await prisma.chatbot.update({
        where: { id: chatbotId },
        data: { sourceIds }
    });

    console.log(`Successfully linked ${sources.length} sources to chatbot ${chatbot.name}`);
}

const targetId = process.argv[2];
if (targetId) {
    linkAllSources(targetId).catch(console.error);
} else {
    console.log("Please provide chatbotId");
}
