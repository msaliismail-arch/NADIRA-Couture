import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@nadira.com';
  const password = 'admin123';
  
  // تشفير الباسوورد بـ bcryptjs
  const hashedPassword = await bcrypt.hash(password, 10);

  // زيادة الـ Admin لـ Supabase
  const admin = await prisma.administrateur.upsert({
    where: { email: email },
    update: { motDePasseHash: hashedPassword },
    create: {
      email: email,
      motDePasseHash: hashedPassword,
      nom: 'Admin',
      role: 'admin',
    },
  });

  console.log('Admin created successfully!', admin);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });