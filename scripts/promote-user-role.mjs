import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const role = process.argv[3] ?? 'platform_admin';

  if (!email) {
    console.error('Usage: node scripts/promote-user-role.mjs <email> [role]');
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role },
  });

  console.log(`Updated ${user.email} -> role=${user.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


