import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const usersData = [
    {
      name: 'System Admin',
      email: 'admin@ops.com',
      passwordHash,
      role: Role.ADMIN,
    },
    {
      name: 'Sales Representative',
      email: 'sales@ops.com',
      passwordHash,
      role: Role.SALES,
    },
    {
      name: 'Warehouse Manager',
      email: 'warehouse@ops.com',
      passwordHash,
      role: Role.WAREHOUSE,
    },
    {
      name: 'Accounts Officer',
      email: 'accounts@ops.com',
      passwordHash,
      role: Role.ACCOUNTS,
    },
  ];

  const seededUsers = [];

  for (const userData of usersData) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        role: userData.role,
        passwordHash: userData.passwordHash,
      },
      create: userData,
    });
    seededUsers.push({
      Role: user.role,
      Email: user.email,
      Password: defaultPassword,
      'User ID': user.id,
    });
  }

  console.log('\n============================================================');
  console.log('           SEED COMPLETED — TEST USER CREDENTIALS           ');
  console.log('============================================================');
  console.table(seededUsers);
  console.log('============================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
