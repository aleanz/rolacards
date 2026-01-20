const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Creando usuario cliente...\n');

  // Hash de la contraseña
  const clientPassword = await bcrypt.hash('cliente123', 10);

  try {
    // Crear usuario CLIENTE
    const client = await prisma.user.upsert({
      where: { email: 'cliente@rolacards.com' },
      update: {
        password: clientPassword,
        role: 'CLIENTE',
        emailVerified: true,
      },
      create: {
        email: 'cliente@rolacards.com',
        password: clientPassword,
        name: 'Cliente Rola Cards',
        role: 'CLIENTE',
        emailVerified: true,
      },
    });

    console.log('✅ Usuario CLIENTE creado:');
    console.log(`   Email: ${client.email}`);
    console.log(`   Password: cliente123`);
    console.log(`   Rol: ${client.role}`);
    console.log(`   Email Verificado: ${client.emailVerified ? 'Sí' : 'No'}\n`);

    // Mostrar resumen de todos los usuarios
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      },
      orderBy: [
        { role: 'asc' },
        { email: 'asc' },
      ],
    });

    console.log('📊 RESUMEN DE TODOS LOS USUARIOS:\n');
    console.table(allUsers.map(u => ({
      Email: u.email,
      Nombre: u.name,
      Rol: u.role,
      Verificado: u.emailVerified ? 'Sí' : 'No',
    })));

    console.log('\n✨ ¡Usuario cliente creado exitosamente!\n');
    console.log('📋 Credenciales disponibles:');
    console.log('  👑 ADMIN:   admin@rolacards.com / admin123');
    console.log('  👔 STAFF:   staff@rolacards.com / staff123');
    console.log('  👤 CLIENTE: cliente@rolacards.com / cliente123\n');
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
