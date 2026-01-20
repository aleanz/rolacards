const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Creando usuarios admin y staff...\n');

  // Hash de las contraseñas
  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);

  try {
    // Crear usuario ADMIN
    const admin = await prisma.user.upsert({
      where: { email: 'admin@rolacards.com' },
      update: {
        password: adminPassword,
        role: 'ADMIN',
        emailVerified: true,
      },
      create: {
        email: 'admin@rolacards.com',
        password: adminPassword,
        name: 'Admin Rola Cards',
        role: 'ADMIN',
        emailVerified: true,
      },
    });

    console.log('✅ Usuario ADMIN creado:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: admin123`);
    console.log(`   Rol: ${admin.role}\n`);

    // Crear usuario STAFF
    const staff = await prisma.user.upsert({
      where: { email: 'staff@rolacards.com' },
      update: {
        password: staffPassword,
        role: 'STAFF',
        emailVerified: true,
      },
      create: {
        email: 'staff@rolacards.com',
        password: staffPassword,
        name: 'Staff Rola Cards',
        role: 'STAFF',
        emailVerified: true,
      },
    });

    console.log('✅ Usuario STAFF creado:');
    console.log(`   Email: ${staff.email}`);
    console.log(`   Password: staff123`);
    console.log(`   Rol: ${staff.role}\n`);

    // Mostrar resumen de todos los usuarios
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      },
      orderBy: {
        role: 'asc',
      },
    });

    console.log('📊 RESUMEN DE USUARIOS EN EL SISTEMA:\n');
    console.table(allUsers.map(u => ({
      Email: u.email,
      Nombre: u.name,
      Rol: u.role,
      Verificado: u.emailVerified ? 'Sí' : 'No',
    })));

    console.log('\n✨ ¡Usuarios creados exitosamente!\n');
    console.log('Ahora puedes iniciar sesión con:');
    console.log('  - admin@rolacards.com / admin123 (Acceso completo)');
    console.log('  - staff@rolacards.com / staff123 (Gestión de solicitudes)');
    console.log('  - testlocal@example.com (Usuario cliente)\n');
  } catch (error) {
    console.error('❌ Error al crear usuarios:', error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
