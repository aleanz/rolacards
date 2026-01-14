-- Seed data for Rola Cards database
-- Run this after executing migration.sql

-- Insert users
INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'admin@rolacards.com', '$2a$12$hpHdEHzRPzEqdmp/5vDR1e1I6E2ofF7FKjqt5gP42vV.xFF01Adie', 'Administrador', 'ADMIN', NOW(), NOW()),
  (gen_random_uuid()::text, 'staff@rolacards.com', '$2a$12$vYP/pTOLx.FA62C8M4CiFO9fg/hF6O9NALcssd/L5IzdMsa1BfBj.', 'Staff Member', 'STAFF', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert categories
INSERT INTO "Category" (id, name, slug, description, "order")
VALUES
  (gen_random_uuid()::text, 'Yu-Gi-Oh!', 'yu-gi-oh', 'Cartas del juego Yu-Gi-Oh! TCG', 1),
  (gen_random_uuid()::text, 'Pokémon', 'pokemon', 'Cartas del juego Pokémon TCG', 2),
  (gen_random_uuid()::text, 'Magic: The Gathering', 'magic', 'Cartas del juego Magic: The Gathering', 3),
  (gen_random_uuid()::text, 'Accesorios', 'accesorios', 'Sleeves, playmats, deckboxes y más', 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert events (using the admin user)
DO $$
DECLARE
  admin_id TEXT;
BEGIN
  -- Get admin user id
  SELECT id INTO admin_id FROM "User" WHERE email = 'admin@rolacards.com' LIMIT 1;

  -- Insert events
  INSERT INTO "Event" (id, title, slug, description, content, date, "endDate", location, type, format, "entryFee", "maxPlayers", "prizeInfo", published, featured, "createdAt", "updatedAt", "creatorId")
  VALUES
    (
      gen_random_uuid()::text,
      'Torneo Semanal Yu-Gi-Oh!',
      'torneo-semanal-yu-gi-oh',
      'Torneo competitivo semanal con premios en producto',
      'Ven y participa en nuestro torneo semanal de Yu-Gi-Oh! Formato Advanced, 4 rondas swiss. Premios garantizados para los primeros lugares.',
      NOW() + INTERVAL '1 day' + INTERVAL '18 hours',
      NULL,
      'Rola Cards - Tienda física',
      'TOURNAMENT',
      'Advanced',
      50.00,
      32,
      '1er lugar: 12 sobres, 2do lugar: 8 sobres, 3er-4to lugar: 4 sobres',
      true,
      true,
      NOW(),
      NOW(),
      admin_id
    ),
    (
      gen_random_uuid()::text,
      'Sneak Peek: Nuevo Set',
      'sneak-peek-nuevo-set',
      'Sé el primero en jugar con las nuevas cartas',
      'Evento oficial Sneak Peek para el nuevo set. Recibe cartas promocionales exclusivas y la oportunidad de jugar con las nuevas cartas antes del lanzamiento oficial.',
      NOW() + INTERVAL '7 days' + INTERVAL '16 hours',
      NULL,
      'Rola Cards - Tienda física',
      'SNEAK_PEEK',
      'Sealed',
      200.00,
      48,
      'Promos exclusivas + Premios por participación',
      true,
      true,
      NOW(),
      NOW(),
      admin_id
    ),
    (
      gen_random_uuid()::text,
      'Locals Championship',
      'locals-championship',
      'Campeonato mensual con invitación a regional',
      'Nuestro campeonato mensual más importante. El ganador recibe una invitación con pago de inscripción al próximo regional. Formato Advanced, 5 rondas swiss + top 8.',
      NOW() + INTERVAL '30 days' + INTERVAL '17 hours',
      NULL,
      'Rola Cards - Tienda física',
      'LOCALS',
      'Advanced',
      100.00,
      64,
      '1er lugar: Invitación Regional + 24 sobres, 2do lugar: 18 sobres, 3er-4to lugar: 12 sobres, 5to-8vo lugar: 6 sobres',
      true,
      true,
      NOW(),
      NOW(),
      admin_id
    )
  ON CONFLICT (slug) DO NOTHING;
END $$;

-- Insert store settings
INSERT INTO "StoreSetting" (id, key, value, type, "updatedAt")
VALUES
  (gen_random_uuid()::text, 'store_address', 'Calle Principal #123', 'STRING', NOW()),
  (gen_random_uuid()::text, 'store_city', 'Ciudad de México', 'STRING', NOW()),
  (gen_random_uuid()::text, 'store_state', 'CDMX', 'STRING', NOW()),
  (gen_random_uuid()::text, 'store_mapsUrl', 'https://maps.google.com', 'STRING', NOW()),
  (gen_random_uuid()::text, 'store_phone', '+52 123 456 7890', 'STRING', NOW()),
  (gen_random_uuid()::text, 'store_whatsapp', '521234567890', 'STRING', NOW()),
  (gen_random_uuid()::text, 'store_email', 'info@rolacards.com', 'STRING', NOW()),
  (gen_random_uuid()::text, 'store_scheduleWeekday', '3PM - 9PM', 'STRING', NOW()),
  (gen_random_uuid()::text, 'store_scheduleWeekend', '12PM - 9PM', 'STRING', NOW())
ON CONFLICT (key) DO NOTHING;

-- Show completion message
DO $$
BEGIN
  RAISE NOTICE '🎉 Seed data inserted successfully!';
  RAISE NOTICE '📧 Admin credentials: admin@rolacards.com / admin123';
  RAISE NOTICE '📧 Staff credentials: staff@rolacards.com / staff123';
END $$;
