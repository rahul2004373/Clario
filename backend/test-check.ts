import { prisma } from './src/lib/prisma';

async function main() {
  const c = await prisma.chatbot.findUnique({ where: { id: 'cmr4txsbp0001nkvsj4ytzgi1' } });
  console.log(c);
  
  const c2 = await prisma.conversation.findUnique({
    where: { id: 'cmr7jstap0000p0vsg9ek6tf5' },
    include: { chatbot: true }
  });
  console.log(c2);
}
main().finally(() => prisma.$disconnect());
