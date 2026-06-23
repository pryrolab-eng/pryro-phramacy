const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const authUsers = await p.auth_users.count();
  const publicUsers = await p.public_users.count();
  const pharmacies = await p.pharmacies.count();
  const apiKeys = await p.api_keys.count();
  
  console.log('auth_users:', authUsers);
  console.log('public_users:', publicUsers);
  console.log('pharmacies:', pharmacies);
  console.log('api_keys:', apiKeys);
  
  if (authUsers > 0) {
    const users = await p.auth_users.findMany({ select: { id: true, email: true }, take: 10 });
    console.log('Auth users:', JSON.stringify(users, null, 2));
  }
  
  await p.$disconnect();
}

main();
