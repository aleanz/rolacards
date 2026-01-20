/**
 * Script para limpiar avatares rotos de usuarios
 *
 * Este script actualiza todos los usuarios que tienen avatares con rutas locales
 * (/uploads/avatars/*) y los establece como null para que puedan subir nuevos
 * avatares a Cloudinary.
 *
 * Uso:
 *   npx tsx scripts/clean-broken-avatars.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanBrokenAvatars() {
  console.log('🔍 Buscando avatares con rutas locales rotas...\n');

  try {
    // Buscar usuarios con avatares locales
    const usersWithLocalAvatars = await prisma.user.findMany({
      where: {
        avatar: {
          startsWith: '/uploads/',
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    if (usersWithLocalAvatars.length === 0) {
      console.log('✅ No se encontraron avatares con rutas locales.');
      return;
    }

    console.log(`📊 Se encontraron ${usersWithLocalAvatars.length} usuario(s) con avatares locales:\n`);

    usersWithLocalAvatars.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Avatar actual: ${user.avatar}\n`);
    });

    // Actualizar usuarios estableciendo avatar como null
    const result = await prisma.user.updateMany({
      where: {
        avatar: {
          startsWith: '/uploads/',
        },
      },
      data: {
        avatar: null,
      },
    });

    console.log(`\n✅ Se limpiaron ${result.count} avatar(es) exitosamente.`);
    console.log('📝 Los usuarios ahora pueden subir nuevos avatares a Cloudinary desde su perfil.\n');

  } catch (error) {
    console.error('❌ Error al limpiar avatares:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
cleanBrokenAvatars()
  .then(() => {
    console.log('🎉 Script completado exitosamente.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
