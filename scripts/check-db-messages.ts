import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const messages = await prisma.ai_messages.findMany({
    orderBy: { created_at: "desc" },
    take: 5,
  });

  console.log("Last 5 AI Messages:");
  for (const msg of messages.reverse()) {
    console.log(`[${msg.role}] content: ${msg.content === "" ? "(EMPTY STRING)" : msg.content}`);
    if (msg.tool_calls) {
      console.log(`  tool_calls:`, JSON.stringify(msg.tool_calls));
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
