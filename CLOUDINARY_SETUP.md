# ☁️ Configuración de Cloudinary

## ¿Por qué Cloudinary?

Vercel tiene un **filesystem de solo lectura** en producción, lo que significa que no puedes guardar archivos subidos (como avatares) directamente en el servidor. Para solucionar esto, necesitamos usar un servicio de almacenamiento en la nube como **Cloudinary**.

## 📋 Pasos para configurar Cloudinary

### 1. Crear cuenta gratuita

1. Ve a [https://cloudinary.com/users/register_free](https://cloudinary.com/users/register_free)
2. Regístrate con tu email (plan gratuito incluye):
   - 25 GB de almacenamiento
   - 25 GB de ancho de banda/mes
   - Transformaciones de imagen ilimitadas

### 2. Obtener credenciales

Una vez que inicies sesión:

1. Irás automáticamente al **Dashboard**
2. Verás una sección llamada **"Product Environment Credentials"**
3. Copia las siguientes credenciales:
   - **Cloud Name**: `dxxxxxxxx` (ejemplo)
   - **API Key**: `123456789012345` (ejemplo)
   - **API Secret**: `abcdefghijklmnopqrstuvwxyz123` (ejemplo, haz clic en "Reveal" para verlo)

### 3. Agregar variables de entorno

#### Desarrollo Local (.env)

Agrega estas líneas a tu archivo `.env`:

```bash
# Cloudinary (Image Storage for Production)
CLOUDINARY_CLOUD_NAME="tu-cloud-name-aqui"
CLOUDINARY_API_KEY="tu-api-key-aqui"
CLOUDINARY_API_SECRET="tu-api-secret-aqui"
```

Reemplaza los valores con tus credenciales reales de Cloudinary.

#### Producción (Vercel)

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega las 3 variables:
   - `CLOUDINARY_CLOUD_NAME` = tu cloud name
   - `CLOUDINARY_API_KEY` = tu api key
   - `CLOUDINARY_API_SECRET` = tu api secret
4. Asegúrate de marcar las 3 opciones: **Production**, **Preview**, **Development**

### 4. Redeploy

Después de agregar las variables:
1. Ve a la pestaña **Deployments** en Vercel
2. Haz clic en los 3 puntos del último deployment
3. Selecciona **Redeploy**

## ✅ ¿Cómo funciona?

### Antes (filesystem local - NO funciona en Vercel):
```
Usuario sube imagen → Se guarda en /public/uploads/avatars/ → ❌ Error en producción
```

### Ahora (Cloudinary - funciona en todos lados):
```
Usuario sube imagen → Se envía a Cloudinary → Cloudinary retorna URL → URL se guarda en BD → ✅ Funciona
```

## 🖼️ Características implementadas

El código actual incluye:

1. **Optimización automática**: Las imágenes se optimizan automáticamente
2. **Crop inteligente**: Se recortan a 300x300px enfocándose en la cara
3. **Formato automático**: Cloudinary sirve el formato más eficiente (WebP en navegadores compatibles)
4. **Eliminación de avatares antiguos**: Cuando subes un nuevo avatar, el anterior se elimina de Cloudinary
5. **Carpetas organizadas**: Todos los avatares se guardan en `rolacards/avatars/`

## 🧪 Probar localmente

1. Configura las variables en `.env`
2. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Ve a `/perfil` y sube un avatar
4. Verifica en tu Dashboard de Cloudinary que aparezca en la carpeta `rolacards/avatars/`

## 🔍 Verificar uploads

Para ver tus imágenes subidas:
1. Ve al [Dashboard de Cloudinary](https://cloudinary.com/console/media_library)
2. Selecciona **Media Library** en el menú
3. Navega a la carpeta `rolacards/avatars/`
4. Verás todos los avatares subidos

## 💰 Límites del plan gratuito

- **Almacenamiento**: 25 GB (suficiente para ~250,000 avatares de 100KB)
- **Ancho de banda**: 25 GB/mes (suficiente para ~250,000 cargas de avatares)
- **Transformaciones**: Ilimitadas ✅

Si necesitas más, puedes actualizar al plan de pago ($99/mes) o configurar reglas para eliminar avatares antiguos automáticamente.

## ⚠️ Troubleshooting

### Error: "Invalid cloud_name"
- Verifica que `CLOUDINARY_CLOUD_NAME` esté correctamente configurado
- No incluyas `http://` o espacios

### Error: "Must supply api_key"
- Verifica que `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` estén configurados
- Asegúrate de no tener espacios al inicio o final

### Error: "Unauthorized"
- Verifica que el API Secret sea correcto (es diferente del API Key)
- Regenera las credenciales si es necesario desde el Dashboard

### Imagen no aparece
- Verifica que la URL retornada por Cloudinary sea válida
- Revisa la consola del navegador para errores de CORS
- Cloudinary tiene CORS habilitado por defecto, no debería haber problemas

## 🎯 Próximos pasos

También puedes migrar otros uploads a Cloudinary:
- Comprobantes de pago (`/uploads/payment-proofs/`)
- Fotos de eventos
- Cualquier otro archivo subido por usuarios

Usa el mismo patrón que en `/src/app/api/user/avatar/route.ts` como referencia.

---

**Fecha de implementación**: ${new Date().toLocaleDateString('es-MX')}

¿Dudas? Consulta la [documentación oficial de Cloudinary](https://cloudinary.com/documentation).
