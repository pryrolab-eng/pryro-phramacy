const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.public_users.count().then(c => {
  console.log('User count:', c);
  return p.$disconnect();
}).catch(e => {
  console.error(e.message);
  p.$disconnect();
});
