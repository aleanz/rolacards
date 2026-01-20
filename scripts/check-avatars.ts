/**
 * Script para verificar avatares en la base de datos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAvatars() {
  console.log('🔍 Verificando avatares en la base de datos...\n');

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    console.log(`📊 Total de usuarios: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Avatar: ${user.avatar || 'No tiene avatar'}`);

      if (user.avatar) {
        if (user.avatar.includes('cloudinary.com')) {
          console.log(`   ✅ Avatar en Cloudinary`);
        } else if (user.avatar.startsWith('/uploads/')) {
          console.log(`   ⚠️  Avatar local (necesita migración)`);
        } else {
          console.log(`   ❓ Avatar desconocido`);
        }
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkAvatars()
  .then(() => {
    console.log('✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
