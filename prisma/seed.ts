import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Crear usuarios de prueba
  const adminPassword = await hash('admin123', 12);
  const staffPassword = await hash('staff123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@rolacards.com' },
    update: {},
    create: {
      email: 'admin@rolacards.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@rolacards.com' },
    update: {},
    create: {
      email: 'staff@rolacards.com',
      password: staffPassword,
      name: 'Staff Member',
      role: 'STAFF',
    },
  });

  console.log('✅ Created users:');
  console.log('📧 Admin: admin@rolacards.com / admin123');
  console.log('📧 Staff: staff@rolacards.com / staff123');

  // Crear categorías de ejemplo
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'yu-gi-oh' },
      update: {},
      create: {
        name: 'Yu-Gi-Oh!',
        slug: 'yu-gi-oh',
        description: 'Cartas del juego Yu-Gi-Oh! TCG',
        order: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'pokemon' },
      update: {},
      create: {
        name: 'Pokémon',
        slug: 'pokemon',
        description: 'Cartas del juego Pokémon TCG',
        order: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'magic' },
      update: {},
      create: {
        name: 'Magic: The Gathering',
        slug: 'magic',
        description: 'Cartas del juego Magic: The Gathering',
        order: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'accesorios' },
      update: {},
      create: {
        name: 'Accesorios',
        slug: 'accesorios',
        description: 'Sleeves, playmats, deckboxes y más',
        order: 4,
      },
    }),
  ]);

  console.log('✅ Created categories:', categories.length);

  // Crear eventos de prueba
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(16, 0, 0, 0);

  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setHours(17, 0, 0, 0);

  const events = await Promise.all([
    prisma.event.upsert({
      where: { slug: 'torneo-semanal-yu-gi-oh' },
      update: {},
      create: {
        title: 'Torneo Semanal Yu-Gi-Oh!',
        slug: 'torneo-semanal-yu-gi-oh',
        description: 'Torneo competitivo semanal con premios en producto',
        content: 'Ven y participa en nuestro torneo semanal de Yu-Gi-Oh! Formato Advanced, 4 rondas swiss. Premios garantizados para los primeros lugares.',
        date: tomorrow,
        location: 'Rola Cards - Tienda física',
        type: 'TOURNAMENT',
        format: 'Advanced',
        entryFee: 50,
        maxPlayers: 32,
        prizeInfo: '1er lugar: 12 sobres, 2do lugar: 8 sobres, 3er-4to lugar: 4 sobres',
        published: true,
        featured: true,
        creatorId: admin.id,
      },
    }),
    prisma.event.upsert({
      where: { slug: 'sneak-peek-nuevo-set' },
      update: {},
      create: {
        title: 'Sneak Peek: Nuevo Set',
        slug: 'sneak-peek-nuevo-set',
        description: 'Sé el primero en jugar con las nuevas cartas',
        content: 'Evento oficial Sneak Peek para el nuevo set. Recibe cartas promocionales exclusivas y la oportunidad de jugar con las nuevas cartas antes del lanzamiento oficial.',
        date: nextWeek,
        location: 'Rola Cards - Tienda física',
        type: 'SNEAK_PEEK',
        format: 'Sealed',
        entryFee: 200,
        maxPlayers: 48,
        prizeInfo: 'Promos exclusivas + Premios por participación',
        published: true,
        featured: true,
        creatorId: admin.id,
      },
    }),
    prisma.event.upsert({
      where: { slug: 'locals-championship' },
      update: {},
      create: {
        title: 'Locals Championship',
        slug: 'locals-championship',
        description: 'Campeonato mensual con invitación a regional',
        content: 'Nuestro campeonato mensual más importante. El ganador recibe una invitación con pago de inscripción al próximo regional. Formato Advanced, 5 rondas swiss + top 8.',
        date: nextMonth,
        location: 'Rola Cards - Tienda física',
        type: 'LOCALS',
        format: 'Advanced',
        entryFee: 100,
        maxPlayers: 64,
        prizeInfo: '1er lugar: Invitación Regional + 24 sobres, 2do lugar: 18 sobres, 3er-4to lugar: 12 sobres, 5to-8vo lugar: 6 sobres',
        published: true,
        featured: true,
        creatorId: admin.id,
      },
    }),
  ]);

  console.log('✅ Created events:', events.length);

  // Crear configuraciones de la tienda
  const storeSettings = [
    { key: 'store_address', value: 'Calle Principal #123', type: 'STRING' as const },
    { key: 'store_city', value: 'Ciudad de México', type: 'STRING' as const },
    { key: 'store_state', value: 'CDMX', type: 'STRING' as const },
    { key: 'store_mapsUrl', value: 'https://maps.google.com', type: 'STRING' as const },
    { key: 'store_phone', value: '+52 123 456 7890', type: 'STRING' as const },
    { key: 'store_whatsapp', value: '521234567890', type: 'STRING' as const },
    { key: 'store_email', value: 'info@rolacards.com', type: 'STRING' as const },
    { key: 'store_scheduleWeekday', value: '3PM - 9PM', type: 'STRING' as const },
    { key: 'store_scheduleWeekend', value: '12PM - 9PM', type: 'STRING' as const },
  ];

  await Promise.all(
    storeSettings.map((setting) =>
      prisma.storeSetting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting,
      })
    )
  );

  console.log('✅ Created store settings:', storeSettings.length);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
