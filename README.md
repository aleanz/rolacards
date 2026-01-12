# Rola Cards 🃏

Sistema de gestión para tienda de cartas TCG. Incluye sitio web público, panel de administración, gestión de inventario, ventas y eventos.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Base de datos**: PostgreSQL + Prisma ORM
- **Estilos**: Tailwind CSS
- **Autenticación**: NextAuth.js
- **API externa**: YGOProDeck (para datos de cartas)

## 📁 Estructura del Proyecto

```
rola-cards/
├── prisma/
│   └── schema.prisma      # Esquema de base de datos
├── src/
│   ├── app/               # Rutas y páginas (Next.js App Router)
│   ├── components/        # Componentes React
│   │   ├── ui/           # Componentes de UI reutilizables
│   │   ├── layout/       # Header, Footer, etc.
│   │   └── home/         # Componentes específicos del home
│   ├── lib/              # Utilidades y configuraciones
│   │   ├── prisma.ts     # Cliente de Prisma
│   │   ├── utils.ts      # Funciones de utilidad
│   │   └── ygoprodeck.ts # Cliente API YGOProDeck
│   ├── hooks/            # Custom React hooks
│   └── types/            # Definiciones de TypeScript
├── public/               # Archivos estáticos
└── ...
```

## 🛠️ Instalación

### Prerrequisitos

- Node.js 18+
- PostgreSQL
- npm o yarn

### Pasos

1. **Clonar el repositorio**
```bash
git clone <url-del-repo>
cd rola-cards
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/rola_cards"
NEXTAUTH_SECRET="tu-secret-seguro"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Configurar la base de datos**
```bash
# Generar cliente de Prisma
npm run db:generate

# Crear tablas en la base de datos
npm run db:push
```

5. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## 📋 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run start` | Inicia el servidor de producción |
| `npm run lint` | Ejecuta ESLint |
| `npm run db:generate` | Genera el cliente de Prisma |
| `npm run db:push` | Sincroniza el schema con la DB |
| `npm run db:migrate` | Ejecuta migraciones |
| `npm run db:studio` | Abre Prisma Studio |

## 🎨 Paleta de Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Black | `#0a0a0f` | Fondo principal |
| Dark | `#1a1a24` | Cards, componentes |
| Gold | `#d4a843` | Acentos, CTAs |
| Purple | `#6b46c1` | Acentos secundarios |

## 📱 Módulos

### Vista Pública
- ✅ Landing page
- 🔲 Eventos y torneos
- 🔲 Noticias
- 🔲 Catálogo de productos
- 🔲 Galería

### Panel Admin
- 🔲 Autenticación
- 🔲 Dashboard
- 🔲 Gestión de eventos
- 🔲 Gestión de noticias
- 🔲 Inventario
- 🔲 Ventas
- 🔲 Reportes

## 🔗 API de YGOProDeck

Este proyecto utiliza la [API de YGOProDeck](https://ygoprodeck.com/api-guide/) para obtener información de cartas Yu-Gi-Oh:

- Búsqueda de cartas por nombre
- Imágenes oficiales
- Información de sets y raridades
- Precios de referencia

## 📄 Licencia

Proyecto privado - Todos los derechos reservados.

---

Desarrollado con ❤️ para Rola Cards
