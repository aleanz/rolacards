-- Script de verificación del sistema de inscripciones
-- Ejecutar este script para verificar el estado actual de las inscripciones

-- 1. Ver todas las inscripciones con sus estados
SELECT
  er.id,
  u.name as usuario,
  e.title as evento,
  d.name as mazo,
  er.status,
  er."paymentProof",
  er."transferReference",
  er."createdAt"
FROM "EventRegistration" er
JOIN "User" u ON er."userId" = u.id
JOIN "Event" e ON er."eventId" = e.id
JOIN "Deck" d ON er."deckId" = d.id
ORDER BY er."createdAt" DESC;

-- 2. Contar inscripciones por estado
SELECT
  status,
  COUNT(*) as total
FROM "EventRegistration"
GROUP BY status;

-- 3. Ver eventos con sus inscripciones aprobadas
SELECT
  e.title,
  e.date,
  e."maxPlayers",
  COUNT(CASE WHEN er.status = 'APROBADO' THEN 1 END) as inscritos_aprobados,
  COUNT(*) as total_solicitudes
FROM "Event" e
LEFT JOIN "EventRegistration" er ON e.id = er."eventId"
WHERE e.published = true AND e.date >= NOW()
GROUP BY e.id, e.title, e.date, e."maxPlayers"
ORDER BY e.date;

-- 4. Ver usuarios con mazos inscritos en eventos
SELECT
  u.name as usuario,
  u.email,
  d.name as mazo,
  d.format,
  e.title as evento,
  er.status
FROM "EventRegistration" er
JOIN "User" u ON er."userId" = u.id
JOIN "Deck" d ON er."deckId" = d.id
JOIN "Event" e ON er."eventId" = e.id
WHERE e.date >= NOW()
ORDER BY u.name, e.date;

-- 5. Verificar integridad de datos
-- Inscripciones sin comprobante de pago para eventos con costo
SELECT
  er.id,
  u.name as usuario,
  e.title as evento,
  e."entryFee",
  er."paymentProof",
  er.status
FROM "EventRegistration" er
JOIN "User" u ON er."userId" = u.id
JOIN "Event" e ON er."eventId" = e.id
WHERE e."entryFee" > 0
  AND er."paymentProof" IS NULL
  AND er.status = 'PENDIENTE'
ORDER BY e.date;
