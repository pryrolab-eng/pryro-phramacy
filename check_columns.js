const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.rqhxfzscbrsndvjobbme:k9ZGdt.Km59bYi%24@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require&schema=public"
    }
  }
});

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'sales' AND table_schema = 'public';`;
    console.log('Columns in sales table:', result);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();