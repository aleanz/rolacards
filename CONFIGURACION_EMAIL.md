# Configuración de Emails con Resend y Hostinger

## Paso 1: Crear cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta gratuita (incluye 100 emails/día y 3,000 emails/mes gratis)
3. Verifica tu email

## Paso 2: Agregar tu dominio rolacards.com

1. En el dashboard de Resend, ve a **Domains**
2. Click en **Add Domain**
3. Ingresa tu dominio: `rolacards.com`
4. Resend te mostrará los registros DNS que debes configurar

## Paso 3: Configurar DNS en Hostinger

Resend te dará registros DNS similares a estos (los valores exactos serán diferentes):

### Registros que debes agregar:

1. **Registro TXT** (para verificación)
   - Nombre/Host: `_resend`
   - Valor: `resend-verify=tu_codigo_de_verificacion`
   - TTL: 3600

2. **Registros MX** (para recibir bounces)
   - Nombre/Host: `@` o `rolacards.com`
   - Valor: `feedback-smtp.us-east-1.amazonses.com`
   - Prioridad: 10
   - TTL: 3600

3. **Registros CNAME** (para DKIM)
   - Nombre/Host: `resend._domainkey`
   - Valor: `resend._domainkey.amazonses.com`
   - TTL: 3600

### Cómo agregar en Hostinger:

1. Inicia sesión en tu cuenta de Hostinger
2. Ve a **Hosting** → Selecciona tu plan
3. Click en **DNS Zone Editor**
4. Agrega cada registro según los valores que te dio Resend:
   - Selecciona el tipo de registro (TXT, MX, CNAME)
   - Ingresa el nombre/host
   - Ingresa el valor
   - Guarda

**IMPORTANTE**: Los cambios de DNS pueden tardar hasta 24-48 horas en propagarse, pero generalmente toman solo unos minutos.

## Paso 4: Verificar el dominio en Resend

1. Después de agregar los registros DNS en Hostinger
2. Regresa a Resend y click en **Verify Domain**
3. Si los registros están correctos, verás un mensaje de éxito ✅

## Paso 5: Obtener tu API Key

1. En Resend, ve a **API Keys**
2. Click en **Create API Key**
3. Dale un nombre (ej: "Rola Cards Production")
4. Selecciona los permisos (deja "Full access" para desarrollo)
5. **Copia la API Key** (¡solo la verás una vez!)

## Paso 6: Configurar en tu proyecto

1. Abre tu archivo `.env` en el proyecto
2. Reemplaza el valor de `RESEND_API_KEY`:

```env
RESEND_API_KEY="re_123456789_tu_api_key_real_aqui"
EMAIL_FROM="noreply@rolacards.com"
```

3. Guarda el archivo
4. Reinicia el servidor: `npm run dev`

## Paso 7: Probar el envío de emails

1. Ve a tu aplicación: http://localhost:3001/auth/register
2. Registra un nuevo cliente con tu email real
3. Deberías recibir el email de verificación en unos segundos

## Solución de problemas

### El dominio no se verifica
- Espera unos minutos más (hasta 15-30 min)
- Usa [https://mxtoolbox.com](https://mxtoolbox.com) para verificar que los registros DNS estén propagados
- Asegúrate de copiar exactamente los valores que te dio Resend

### Los emails no llegan
- Revisa tu carpeta de spam
- Verifica que el dominio esté verificado en Resend (debe tener un check verde ✅)
- Revisa los logs en Resend Dashboard → Logs
- Asegúrate de que la API Key esté correctamente configurada en `.env`

### Error "Invalid API key"
- Verifica que copiaste la API key completa
- Asegúrate de que no tenga espacios al inicio o final
- La API key debe empezar con `re_`

## Alternativa: Emails de prueba sin dominio

Si quieres probar sin configurar el dominio aún, puedes usar el dominio de prueba de Resend:

```env
EMAIL_FROM="onboarding@resend.dev"
```

**Nota**: Con este dominio solo podrás enviar emails a direcciones que hayas verificado en Resend.

## Costos de Resend

- **Plan Gratuito**: 100 emails/día, 3,000 emails/mes
- **Plan Pro**: $20/mes por 50,000 emails/mes
- Más info: [https://resend.com/pricing](https://resend.com/pricing)

## Recursos adicionales

- Documentación de Resend: [https://resend.com/docs](https://resend.com/docs)
- Tutorial DNS en Hostinger: [https://support.hostinger.com/en/articles/1583227-how-to-manage-dns-records](https://support.hostinger.com/en/articles/1583227-how-to-manage-dns-records)
