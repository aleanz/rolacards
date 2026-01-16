import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixExistingUsers() {
  try {
    console.log('🔧 Actualizando usuarios existentes...');

    // Actualizar todos los usuarios ADMIN y STAFF para que tengan emailVerified: true
    const result = await prisma.user.updateMany({
      where: {
        role: {
          in: ['ADMIN', 'STAFF'],
        },
      },
      data: {
        emailVerified: true,
      },
    });

    console.log(`✅ ${result.count} usuarios actualizados con emailVerified: true`);

    // Mostrar usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      },
    });

    console.log('\n📋 Usuarios en la base de datos:');
    users.forEach((user) => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role} - Verificado: ${user.emailVerified}`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingUsers();
