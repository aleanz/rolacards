-- =====================================================
-- MIGRACIÓN DE PRODUCCIÓN: Sistema de Inscripciones
-- Fecha: 2026-01-20
-- =====================================================

-- Verificar campos existentes antes de agregar
DO $$
BEGIN
    -- Agregar columna paymentProof si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'EventRegistration' AND column_name = 'paymentProof'
    ) THEN
        ALTER TABLE "EventRegistration" ADD COLUMN "paymentProof" TEXT;
        RAISE NOTICE 'Columna paymentProof agregada';
    ELSE
        RAISE NOTICE 'Columna paymentProof ya existe';
    END IF;

    -- Agregar columna paymentProofType si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'EventRegistration' AND column_name = 'paymentProofType'
    ) THEN
        ALTER TABLE "EventRegistration" ADD COLUMN "paymentProofType" TEXT;
        RAISE NOTICE 'Columna paymentProofType agregada';
    ELSE
        RAISE NOTICE 'Columna paymentProofType ya existe';
    END IF;

    -- Agregar columna transferReference si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'EventRegistration' AND column_name = 'transferReference'
    ) THEN
        ALTER TABLE "EventRegistration" ADD COLUMN "transferReference" TEXT;
        RAISE NOTICE 'Columna transferReference agregada';
    ELSE
        RAISE NOTICE 'Columna transferReference ya existe';
    END IF;

    -- Agregar columna paymentVerified si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'EventRegistration' AND column_name = 'paymentVerified'
    ) THEN
        ALTER TABLE "EventRegistration" ADD COLUMN "paymentVerified" BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Columna paymentVerified agregada';
    ELSE
        RAISE NOTICE 'Columna paymentVerified ya existe';
    END IF;

    -- Agregar columna verifiedAt si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'EventRegistration' AND column_name = 'verifiedAt'
    ) THEN
        ALTER TABLE "EventRegistration" ADD COLUMN "verifiedAt" TIMESTAMP(3);
        RAISE NOTICE 'Columna verifiedAt agregada';
    ELSE
        RAISE NOTICE 'Columna verifiedAt ya existe';
    END IF;

    -- Agregar columna verifiedBy si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'EventRegistration' AND column_name = 'verifiedBy'
    ) THEN
        ALTER TABLE "EventRegistration" ADD COLUMN "verifiedBy" TEXT;
        RAISE NOTICE 'Columna verifiedBy agregada';
    ELSE
        RAISE NOTICE 'Columna verifiedBy ya existe';
    END IF;
END $$;

-- Crear índice para optimizar consultas por status (si no existe)
CREATE INDEX IF NOT EXISTS "EventRegistration_status_idx"
ON "EventRegistration"("status");

-- Verificar estructura final
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'EventRegistration'
ORDER BY ordinal_position;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Migración completada exitosamente';
    RAISE NOTICE 'Tabla EventRegistration actualizada con campos de pago';
END $$;
