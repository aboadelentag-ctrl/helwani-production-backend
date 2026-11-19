import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const username = 'admin';
  const password = 'Admin@2026';
  const fullName = 'System Administrator';
  const email = 'admin@helwani-production.local';

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`✅ Admin user '${username}' already exists (id=${existing.id})`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      fullName,
      email,
      role: 'admin',
      isActive: true,
    },
    select: { id: true, username: true, role: true },
  });

  console.log('✅ Admin user created:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Username: ${user.username}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Password: ${password} (change this after first login)`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
