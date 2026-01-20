# 🚀 Despliegue a Producción en Vercel

## 📋 Cambios en Base de Datos

### Migración de Prisma Aplicada: `20260120185354_add_payment_proof_fields`

Se actualizó la tabla `EventRegistration` con los siguientes campos:

```sql
-- Agregar campos a la tabla EventRegistration
ALTER TABLE "EventRegistration"
  ADD COLUMN "paymentProof" TEXT,
  ADD COLUMN "paymentProofType" TEXT,
  ADD COLUMN "transferReference" TEXT,
  ADD COLUMN "paymentVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "verifiedBy" TEXT;

-- Crear índice para optimizar consultas por status
CREATE INDEX "EventRegistration_status_idx" ON "EventRegistration"("status");
```

### 🔧 Aplicar Migración en Vercel

**Opción 1: Automático (Recomendado)**
Vercel ejecutará automáticamente `prisma migrate deploy` al hacer deploy si detecta cambios en Prisma.

**Opción 2: Manual (si es necesario)**
Conéctate a tu base de datos de producción y ejecuta:

```bash
npx prisma migrate deploy
```

O ejecuta directamente el SQL:

```sql
-- Verificar si los campos ya existen
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'EventRegistration'
  AND column_name IN ('paymentProof', 'paymentProofType', 'transferReference', 'paymentVerified', 'verifiedAt', 'verifiedBy');

-- Si no existen, ejecutar:
ALTER TABLE "EventRegistration"
  ADD COLUMN IF NOT EXISTS "paymentProof" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentProofType" TEXT,
  ADD COLUMN IF NOT EXISTS "transferReference" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT;

-- Crear índice si no existe
CREATE INDEX IF NOT EXISTS "EventRegistration_status_idx" ON "EventRegistration"("status");
```

## 🔐 Variables de Entorno en Vercel

Ve a tu proyecto en Vercel → Settings → Environment Variables y agrega/actualiza:

### Variables Requeridas (Nuevas/Actualizadas):

```bash
# Mailgun Configuration (REEMPLAZA Resend)
MAILGUN_API_KEY=tu-mailgun-api-key-aqui
MAILGUN_DOMAIN=rolacards.com
MAILGUN_BASE_URL=https://api.mailgun.net
EMAIL_FROM=Rola Cards <noreply@rolacards.com>

# Cloudinary Configuration (Para almacenamiento de imágenes)
CLOUDINARY_CLOUD_NAME=tu-cloud-name-aqui
CLOUDINARY_API_KEY=tu-api-key-aqui
CLOUDINARY_API_SECRET=tu-api-secret-aqui
```

### Variables Existentes (Mantener):

```bash
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=https://rolacards.com  # O tu dominio de producción
NEXTAUTH_SECRET=AMAICw//nbTw+TjDP5n1GCN7wsNDAWJK7GsliqTZXOU=

# YGOProDeck API
YGOPRODECK_API_URL=https://db.ygoprodeck.com/api/v7

# App
NEXT_PUBLIC_APP_NAME=Rola Cards
NEXT_PUBLIC_APP_URL=https://rolacards.com  # Tu URL de producción
```

### ⚠️ Variables ELIMINADAS (Ya no usar):

```bash
# ❌ ELIMINAR (ya no se usa Resend)
RESEND_API_KEY=...  # Eliminar o dejar sin usar
```

## 📦 Nuevos Paquetes Instalados

Vercel instalará automáticamente estos paquetes desde `package.json`:

- `mailgun.js@^11.1.0` - Cliente de Mailgun
- `form-data@^4.0.1` - Requerido por Mailgun
- `cloudinary@^2.6.0` - Almacenamiento de imágenes en la nube
- `uuid@^11.0.5` - Para nombres únicos de archivos (ya instalado)
- `dotenv@^17.2.3` - Para scripts (dev only)

## 📁 Archivos y Directorios Nuevos

### APIs Nuevas:
- ✅ `src/app/api/events/register/route.ts` - POST inscripción a evento
- ✅ `src/app/api/admin/registrations/route.ts` - GET lista de solicitudes
- ✅ `src/app/api/admin/registrations/[id]/route.ts` - PATCH/DELETE gestión
- ✅ `src/app/api/events/my-registrations/route.ts` - GET inscripciones usuario

### Páginas Nuevas:
- ✅ `src/app/admin/solicitudes/page.tsx` - Panel de gestión admin
- ✅ `src/app/mis-inscripciones/page.tsx` - Vista de usuario

### Componentes Nuevos:
- ✅ `src/components/eventos/RegistrationForm.tsx` - Formulario inscripción

### Configuración:
- ✅ `src/lib/email.ts` - Actualizado para usar Mailgun
- ✅ `public/uploads/payment-proofs/` - Directorio para comprobantes

## ✅ Checklist de Despliegue

### Antes del Deploy:

- [x] ✅ Código subido a GitHub (`main` branch)
- [ ] Verificar que Mailgun esté configurado y dominio verificado
- [ ] Confirmar que DATABASE_URL de producción sea correcta
- [ ] Confirmar que NEXTAUTH_URL apunte a producción

### Durante el Deploy:

1. **Push a GitHub** (Ya hecho ✅)
   ```bash
   git push origin main
   ```

2. **Vercel detectará cambios automáticamente**
   - Vercel iniciará el build
   - Ejecutará `prisma generate`
   - Ejecutará `prisma migrate deploy` (si es necesario)

3. **Agregar Variables de Entorno en Vercel**
   - Ve a: https://vercel.com/tu-usuario/rolacards/settings/environment-variables
   - Agrega las 4 variables de Mailgun
   - Actualiza NEXTAUTH_URL y NEXT_PUBLIC_APP_URL si es necesario
   - **Redeploy** después de agregar variables

### Después del Deploy:

- [ ] Verificar que el sitio cargue correctamente
- [ ] Probar registro de usuario (debe enviar email)
- [ ] Verificar que emails lleguen correctamente
- [ ] Probar inscripción a un evento como cliente
- [ ] Probar gestión de solicitudes como admin
- [ ] Verificar que se puedan subir comprobantes de pago
- [ ] Revisar logs en Vercel por errores

## 🧪 Testing en Producción

### 1. Test de Email de Verificación:
```bash
# Registrar nuevo usuario en producción
# Ir a: https://rolacards.com/auth/register
# Usar email real
# Verificar que llegue el email
```

### 2. Test de Inscripción a Evento:
```bash
# 1. Login como cliente: cliente@rolacards.com / cliente123
# 2. Ir a un evento
# 3. Inscribirse con un mazo
# 4. Subir comprobante (opcional)
# 5. Verificar que aparezca en "Mis Inscripciones"
```

### 3. Test de Gestión Admin:
```bash
# 1. Login como admin: admin@rolacards.com / admin123
# 2. Ir a /admin/solicitudes
# 3. Verificar badge de notificaciones
# 4. Aprobar/rechazar solicitud
# 5. (Opcional) Verificar que se envíe email de notificación
```

## 📊 Monitoreo

### Logs de Mailgun:
https://app.mailgun.com/app/sending/domains/rolacards.com/logs

### Logs de Vercel:
https://vercel.com/tu-usuario/rolacards/logs

### Errores comunes y soluciones:

**Error: "prisma migrate deploy failed"**
- Solución: Ejecutar migración manualmente en la base de datos

**Error: "Mailgun Unauthorized"**
- Solución: Verificar MAILGUN_API_KEY en variables de entorno

**Error: "Cannot find module mailgun.js"**
- Solución: Vercel debe reinstalar dependencias, hacer redeploy

**Email no llega**
- Verificar logs de Mailgun
- Confirmar que dominio esté verificado
- Revisar carpeta de spam

## 🔄 Comandos Útiles en Producción

### Regenerar cliente de Prisma:
```bash
vercel env pull .env.production  # Descargar variables de entorno
npx prisma generate
```

### Ver estado de migraciones:
```bash
npx prisma migrate status
```

### Crear usuarios admin/staff:
```bash
# Conectar a BD de producción y ejecutar:
node scripts/create-admin-staff.js
```

## 📝 Notas Importantes

1. **Comprobantes de Pago**: Se guardan en `public/uploads/payment-proofs/`
   - Asegúrate de que Vercel tenga permisos de escritura
   - O considera usar un servicio externo (S3, Cloudinary) para producción

2. **Emails**: Mailgun con dominio `rolacards.com` no tiene restricciones
   - Puedes enviar a cualquier email
   - Monitorea el límite de tu plan

3. **Migraciones**: Prisma ejecutará migraciones automáticamente en Vercel
   - Si falla, ejecuta manualmente el SQL proporcionado arriba

4. **Usuarios de Prueba**: Los usuarios creados localmente NO estarán en producción
   - Usa los scripts para crear usuarios admin/staff en producción

## 🎯 Resumen de Cambios

### Base de Datos:
- ✅ Tabla `EventRegistration` actualizada con 6 campos nuevos
- ✅ Índice agregado para optimizar queries

### Backend:
- ✅ 4 nuevos endpoints API para inscripciones
- ✅ Sistema de upload de archivos
- ✅ Integración completa con Mailgun

### Frontend:
- ✅ Formulario de inscripción con validaciones
- ✅ Panel de administración de solicitudes
- ✅ Página de inscripciones del usuario
- ✅ Sistema de notificaciones en sidebar
- ✅ Actualización de Header con nuevo enlace

### Emails:
- ✅ Email de verificación de cuenta
- ✅ Notificaciones de inscripción (aprobada/rechazada)

---

**Última actualización**: ${new Date().toLocaleDateString('es-MX')}

¿Dudas? Revisa los logs de Vercel y Mailgun.
