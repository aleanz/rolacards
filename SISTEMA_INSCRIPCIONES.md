# Sistema de Inscripciones - Guía de Verificación

## Cambios en Base de Datos

### ✅ No se requieren migraciones nuevas

El schema de Prisma actual ya tiene todas las relaciones necesarias:
- `EventRegistration` → `Deck` (relación existente)
- `EventRegistration` → `Event` (relación existente)
- `EventRegistration` → `User` (relación existente)

**Comportamiento de eliminación:**
- Los mazos NO se pueden eliminar si están asociados a inscripciones (comportamiento por defecto `Restrict`)
- Esto protege la integridad de los datos históricos

## Verificación del Sistema

### 1. Verificar estructura de base de datos

Ejecuta el script de verificación:
```bash
psql $DATABASE_URL -f scripts/verify-registration-system.sql
```

Este script te mostrará:
- Todas las inscripciones con sus estados
- Conteo de inscripciones por estado
- Eventos con sus inscripciones aprobadas
- Usuarios con mazos inscritos
- Inscripciones sin comprobante de pago

### 2. Verificar directorio de uploads

El directorio para comprobantes de pago debe existir:
```bash
ls -la public/uploads/payment-proofs/
```

Deberías ver:
- `.gitkeep` - mantiene el directorio en git
- `.gitignore` - evita subir archivos de comprobantes a git

### 3. Verificar permisos

Asegúrate de que el servidor tenga permisos de escritura:
```bash
# En producción
chmod 755 public/uploads/payment-proofs/
```

## Funcionalidades Implementadas

### Página de Eventos (`/eventos`)
✅ Muestra estado de inscripción del usuario (APROBADO, PENDIENTE, RECHAZADO)
✅ Badges con colores distintivos por estado
✅ Solo visible para usuarios autenticados

### Página Mis Inscripciones (`/mis-inscripciones`)
✅ Ver mazo registrado con enlace al detalle
✅ Subir comprobante de pago (JPG, PNG, PDF, máx 5MB)
✅ Cambiar mazo inscrito sin eliminarlo
✅ Validación de formato al cambiar mazo
✅ Solo muestra sección de pago para eventos con costo
✅ Notificaciones toast para feedback

### API Endpoints

#### PATCH `/api/events/my-registrations/[id]`
Permite al usuario actualizar su propia inscripción:
- Subir comprobante de pago
- Actualizar referencia de transferencia
- Cambiar mazo inscrito

**Validaciones:**
- Solo el dueño puede actualizar
- El mazo debe pertenecer al usuario
- El formato del mazo debe coincidir con el evento
- El mazo debe estar activo

#### GET `/api/events`
Ahora incluye el estado de inscripción del usuario autenticado:
- `userRegistrationStatus`: null | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'

## Flujo de Usuario

1. **Usuario se inscribe a un evento**
   - Selecciona un mazo del formato correcto
   - Opcionalmente sube comprobante de pago
   - Recibe email de confirmación

2. **Usuario revisa su inscripción en `/mis-inscripciones`**
   - Ve el estado: PENDIENTE
   - Si no subió comprobante, puede subirlo ahora
   - Puede cambiar su mazo si lo necesita
   - Ve el enlace para ver su mazo completo

3. **Admin revisa la solicitud en `/admin/solicitudes`**
   - Ve el comprobante de pago (si existe)
   - Verifica que el mazo cumple con banlist
   - Aprueba o rechaza la inscripción
   - Usuario recibe email de notificación

4. **Usuario ve estado actualizado**
   - En `/mis-inscripciones`: Estado APROBADO o RECHAZADO
   - En `/eventos`: Badge en la lista de eventos
   - Si rechazado, ve la nota del admin

## Configuración de Producción

### Variables de entorno necesarias
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://tu-dominio.com"
NEXTAUTH_SECRET="tu-secret"

# Mailgun (para emails)
MAILGUN_API_KEY="key-..."
MAILGUN_DOMAIN="mg.tu-dominio.com"
EMAIL_FROM="Rola Cards <noreply@tu-dominio.com>"
```

### Permisos en servidor
```bash
# Crear directorio si no existe
mkdir -p public/uploads/payment-proofs

# Dar permisos de escritura
chmod 755 public/uploads/payment-proofs

# Verificar usuario propietario (debe ser el usuario del servidor web)
chown -R www-data:www-data public/uploads/payment-proofs
```

### Límites de archivo

El límite de tamaño está configurado en:
- Cliente: 5MB (validación en `handleFileChange`)
- Servidor: Sin límite específico (confía en validación de cliente)

Para agregar límite en servidor, modifica `next.config.js`:
```js
module.exports = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
}
```

## Testing

### Pruebas manuales recomendadas

1. **Subir comprobante de pago**
   - Archivo JPG (válido)
   - Archivo PDF (válido)
   - Archivo > 5MB (debe rechazar)
   - Archivo .txt (debe rechazar)

2. **Cambiar mazo**
   - Cambiar a mazo del mismo formato (debe funcionar)
   - Intentar cambiar a mazo de otro formato (debe rechazar)
   - Intentar cambiar a mazo de otro usuario (debe rechazar)
   - Intentar cambiar después de que pasó el evento (debe ocultar opción)

3. **Estados de inscripción**
   - Ver badge en `/eventos` según estado
   - Ver badge en `/mis-inscripciones`
   - Verificar colores correctos (verde, amarillo, rojo)

4. **Emails**
   - Email al crear inscripción (usuario y admin)
   - Email al aprobar inscripción (usuario)
   - Email al rechazar inscripción (usuario)

## Solución de Problemas

### Error: "Cannot read properties of undefined (reading 'id')"
**Causa:** El usuario no está autenticado
**Solución:** Verificar sesión con `getServerSession`

### Error: "No se puede cambiar el mazo"
**Causa:** Formato del mazo no coincide con el evento
**Solución:** Verificar que `deck.format` === `event.format` (case-insensitive)

### Error: "Error al subir comprobante"
**Causa:** Permisos del directorio de uploads
**Solución:** `chmod 755 public/uploads/payment-proofs/`

### Error: "File size exceeds limit"
**Causa:** Archivo mayor a 5MB
**Solución:** Usuario debe comprimir la imagen o usar PDF más ligero

## Mantenimiento

### Limpiar archivos de comprobantes antiguos

```bash
# Buscar comprobantes de eventos pasados hace más de 6 meses
find public/uploads/payment-proofs/ -type f -mtime +180 -name "*.jpg" -o -name "*.png" -o -name "*.pdf"

# Opcional: Eliminarlos (¡cuidado!)
# find public/uploads/payment-proofs/ -type f -mtime +180 \( -name "*.jpg" -o -name "*.png" -o -name "*.pdf" \) -delete
```

### Backup de comprobantes

```bash
# Hacer backup mensual
tar -czf payment-proofs-backup-$(date +%Y%m%d).tar.gz public/uploads/payment-proofs/

# Mover a ubicación segura
mv payment-proofs-backup-*.tar.gz /ruta/backups/
```

## Contacto y Soporte

Si encuentras algún problema:
1. Revisa los logs del servidor
2. Verifica la consola del navegador
3. Ejecuta el script de verificación SQL
4. Revisa los permisos del directorio de uploads
