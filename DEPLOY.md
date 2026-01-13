# 🚀 Guía de Despliegue en Vercel

## Requisitos Previos
- Cuenta de GitHub
- Cuenta de Vercel (gratis en vercel.com)
- Base de datos PostgreSQL en la nube (recomendado: Supabase o Neon)

## Paso 1: Preparar Base de Datos PostgreSQL

### Opción A: Supabase (Recomendado - Gratis)
1. Ve a [supabase.com](https://supabase.com)
2. Crea un proyecto nuevo
3. En Settings → Database, copia el "Connection String" (modo Pooling)
4. Guarda este URL para el paso 3

### Opción B: Neon (Alternativa)
1. Ve a [neon.tech](https://neon.tech)
2. Crea un proyecto nuevo
3. Copia el Connection String
4. Guarda este URL para el paso 3

## Paso 2: Subir a GitHub

```bash
# Si aún no has inicializado git
git init
git add .
git commit -m "Initial commit"

# Crear repositorio en GitHub y subir
git remote add origin https://github.com/tu-usuario/tu-repo.git
git branch -M main
git push -u origin main
```

## Paso 3: Desplegar en Vercel

1. **Ir a Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Haz clic en "New Project"

2. **Importar Repositorio**
   - Conecta tu cuenta de GitHub
   - Selecciona el repositorio de Rola Cards
   - Haz clic en "Import"

3. **Configurar Variables de Entorno**

   En la sección "Environment Variables", agrega:

   ```
   DATABASE_URL=tu-connection-string-de-postgres
   ```
   Ejemplo: `postgresql://postgres:[password]@db.xxxxx.supabase.co:5432/postgres`

   ```
   NEXTAUTH_SECRET=genera-uno-nuevo
   ```
   Genera uno nuevo ejecutando en tu terminal:
   ```bash
   openssl rand -base64 32
   ```

   ```
   NEXTAUTH_URL=https://tu-app.vercel.app
   ```
   (Vercel te dará este URL, puedes actualizarlo después)

4. **Deploy**
   - Haz clic en "Deploy"
   - Espera 2-3 minutos

5. **Migrar la Base de Datos**

   Una vez desplegado, ve a tu proyecto en Vercel:
   - Ve a "Settings" → "Functions"
   - O mejor, instala Vercel CLI localmente:

   ```bash
   npm i -g vercel
   vercel login
   vercel link
   vercel env pull .env.production

   # Ahora migrar la base de datos
   DATABASE_URL="tu-url-de-produccion" npx prisma migrate deploy
   DATABASE_URL="tu-url-de-produccion" npx prisma db seed
   ```

## Paso 4: Configurar Dominio (Opcional)

1. En Vercel, ve a tu proyecto
2. Settings → Domains
3. Agrega tu dominio personalizado
4. Actualiza la variable `NEXTAUTH_URL` con tu nuevo dominio

## Paso 5: Crear Usuario Admin

Dos opciones:

### Opción A: Desde Supabase/Neon Dashboard
1. Ve a tu base de datos
2. Ejecuta este SQL:

```sql
INSERT INTO "User" (id, email, password, name, role)
VALUES (
  'admin-initial',
  'admin@rolacards.com',
  '$2a$10$ABC...', -- Hash de bcrypt de tu contraseña
  'Admin',
  'ADMIN'
);
```

### Opción B: Crear un script temporal
1. Crear ruta API temporal en `/api/create-admin`
2. Ejecutar una vez
3. Eliminar la ruta

## 🔄 Actualizaciones Futuras

Cada vez que hagas push a `main`, Vercel desplegará automáticamente:

```bash
git add .
git commit -m "Actualización"
git push origin main
```

## ⚙️ Variables de Entorno en Vercel

Para actualizar variables:
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Actualiza y haz "Redeploy"

## 📝 Notas Importantes

- **No commitees el archivo `.env`** (ya está en .gitignore)
- **Guarda tu `NEXTAUTH_SECRET`** en un lugar seguro
- **Haz backups regulares** de tu base de datos
- **Usa diferentes bases de datos** para desarrollo y producción

## 🐛 Troubleshooting

### Error: "Can't connect to database"
- Verifica que el DATABASE_URL esté correcto
- Asegúrate de usar el "Pooling" connection string de Supabase

### Error: "NEXTAUTH_SECRET not defined"
- Verifica que la variable esté en Vercel Environment Variables
- Redeploy después de agregar variables

### Error: "Prisma Client not generated"
- Vercel debería ejecutar `prisma generate` automáticamente
- Si no, verifica que `vercel.json` esté en el repo

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Vercel (Runtime Logs)
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que la base de datos esté accesible desde internet
