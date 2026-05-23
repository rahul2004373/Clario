import { prisma } from './src/db';

async function checkChatbot(chatbotId: string) {
    const chatbot = await prisma.chatbot.findUnique({
        where: { id: chatbotId },
        include: { chatbotSources: { include: { source: true } } }
    });
    
    if (!chatbot) {
        console.log("Chatbot not found");
        return;
    }

    console.log(`Chatbot: ${chatbot.name} (${chatbot.id})`);
    console.log(`Source IDs in array:`, chatbot.sourceIds);
    console.log(`Linked Sources in ChatbotSource table:`);
    chatbot.chatbotSources.forEach(cs => {
        console.log(`- ${cs.source.name} (${cs.sourceId}) - Status: ${cs.source.status}`);
    });
}

const targetId = process.argv[2];
if (targetId) {
    checkChatbot(targetId).catch(console.error);
} else {
    console.log("Please provide chatbotId");
}
