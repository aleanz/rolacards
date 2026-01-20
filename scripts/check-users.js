const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log('\n=== USUARIOS EN EL SISTEMA ===\n');
  console.table(users.map(u => ({
    Email: u.email,
    Nombre: u.name,
    Rol: u.role,
    Verificado: u.emailVerified ? 'Sí' : 'No',
    Creado: u.createdAt.toLocaleDateString('es-MX'),
  })));

  console.log(`\nTotal: ${users.length} usuarios\n`);
  console.log('=== DESGLOSE POR ROL ===');
  const byRole = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});
  console.table(byRole);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
