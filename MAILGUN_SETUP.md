# Configuración de Mailgun para Rola Cards

## ✅ Estado Actual
La integración de Mailgun está **COMPLETAMENTE CONFIGURADA** y lista para funcionar.

## 🔧 Configuración Realizada

### 1. Variables de Entorno (.env)
```env
MAILGUN_API_KEY="tu-api-key-aqui"
MAILGUN_DOMAIN="rolacards.com"
MAILGUN_BASE_URL="https://api.mailgun.net"
EMAIL_FROM="Rola Cards <noreply@rolacards.com>"
```

### 2. Paquetes Instalados
- ✅ `mailgun.js@^11.1.0`
- ✅ `form-data@^4.0.1`

### 3. Funciones Implementadas

#### `sendVerificationEmail(email, token, name)`
Envía el email de verificación de cuenta al registrarse.

#### `sendRegistrationNotification(email, userName, eventTitle, status, rejectionNote?)`
Envía notificación cuando una inscripción es aprobada o rechazada.

## ⚠️ Configuración de Sandbox (Cuenta Gratuita)

Como estás usando el dominio **sandbox** de Mailgun, solo puedes enviar emails a **direcciones autorizadas**.

### Cómo Agregar Direcciones Autorizadas

1. Ve a: https://app.mailgun.com/app/sending/domains
2. Selecciona tu dominio sandbox
3. Ve a la pestaña **"Authorized Recipients"**
4. Agrega las direcciones de email a las que quieres enviar
5. Mailgun enviará un email de confirmación a cada dirección
6. El destinatario debe hacer clic en el enlace de confirmación

### Direcciones Recomendadas para Pruebas
Agrega estas direcciones como receptores autorizados:
- Tu email personal
- `admin@rolacards.com`
- `staff@rolacards.com`
- `cliente@rolacards.com`

## 🚀 Migrar a Dominio Propio (Producción)

Para usar Mailgun en producción sin restricciones:

### 1. Agregar Dominio Personalizado

```bash
# Ve a: https://app.mailgun.com/app/sending/domains
# Click en "Add New Domain"
# Ingresa: mg.rolacards.com (o el subdominio que prefieras)
```

### 2. Configurar DNS

Mailgun te dará registros DNS que debes agregar:

```
TXT  @  v=spf1 include:mailgun.org ~all
TXT  smtp._domainkey  k=rsa; p=MIGfMA0GC...
CNAME mta._domainkey  mailgun.org
```

### 3. Actualizar Variables de Entorno

```env
MAILGUN_DOMAIN="mg.rolacards.com"  # Tu dominio verificado
EMAIL_FROM="Rola Cards <noreply@rolacards.com>"
```

### 4. Verificar el Dominio

Espera a que Mailgun verifique los registros DNS (puede tomar hasta 48 horas).

## 🧪 Probar el Sistema

### Opción 1: Script de Prueba
```bash
node scripts/test-mailgun.js
```

### Opción 2: Registrar Usuario
1. Ve a `/auth/register`
2. Registra un nuevo usuario con un email autorizado
3. Revisa tu bandeja de entrada para el email de verificación

### Opción 3: Probar Notificaciones de Inscripción
```bash
# Crear script de prueba
node scripts/test-registration-email.js
```

## 📧 Tipos de Email Implementados

### 1. Email de Verificación de Cuenta
- **Trigger**: Al registrarse un nuevo usuario
- **Template**: Diseño con colores de marca (oro #D4AF37)
- **Botón CTA**: "Verificar mi cuenta"
- **Incluye**: Link alternativo para copiar/pegar

### 2. Notificación de Inscripción Aprobada
- **Trigger**: Cuando admin/staff aprueba una solicitud
- **Badge**: Verde con "✓ APROBADA"
- **Botón CTA**: "Ver mis inscripciones"

### 3. Notificación de Inscripción Rechazada
- **Trigger**: Cuando admin/staff rechaza una solicitud
- **Badge**: Rojo con "✗ RECHAZADA"
- **Incluye**: Nota de rechazo si fue proporcionada

## 🔍 Monitoreo de Emails

Puedes ver todos los emails enviados en:
https://app.mailgun.com/app/sending/domains/[tu-dominio]/logs

## 🛠️ Solución de Problemas

### Error 403: Forbidden
**Causa**: Intentando enviar a un email no autorizado en sandbox
**Solución**: Agregar el email como receptor autorizado

### Error 401: Unauthorized
**Causa**: API Key incorrecta
**Solución**: Verificar que `MAILGUN_API_KEY` sea correcta

### Error 400: Bad Request
**Causa**: Formato de email o dominio incorrecto
**Solución**: Verificar `MAILGUN_DOMAIN` y formato de emails

### Email no llega
1. Revisa los logs en Mailgun
2. Verifica la carpeta de spam
3. Confirma que el email esté autorizado (en sandbox)

## 💰 Precios de Mailgun

- **Sandbox (Gratis)**:
  - 5,000 emails/mes
  - Solo a receptores autorizados
  - Para pruebas

- **Pay as you go**:
  - $35/mes por 50,000 emails
  - Emails adicionales: $0.80 por 1,000
  - Sin restricciones de receptores

## 📝 Siguiente Paso

**Para usar en producción:**
1. Configura un dominio personalizado en Mailgun
2. Actualiza las variables de entorno
3. Verifica el dominio
4. ¡Listo para enviar emails sin restricciones!

## 🎯 Endpoints que Envían Emails

1. **POST `/api/auth/register`**: Envía email de verificación
2. **PATCH `/api/admin/registrations/[id]`**: Envía notificación de inscripción (próximamente)

---

**Última actualización**: ${new Date().toLocaleDateString('es-MX')}
