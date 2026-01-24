# Manual de Administrador
## RolaCards - Sistema de Gestión de Tienda TCG

---

## Tabla de Contenidos
1. [Acceso al Panel de Administración](#acceso-al-panel-de-administración)
2. [Dashboard Principal](#dashboard-principal)
3. [Gestión de Eventos](#gestión-de-eventos)
4. [Gestión de Inscripciones](#gestión-de-inscripciones)
5. [Gestión de Inventario](#gestión-de-inventario)
6. [Gestión de Ventas](#gestión-de-ventas)
7. [Gestión de Usuarios](#gestión-de-usuarios)
8. [Reportes y Estadísticas](#reportes-y-estadísticas)
9. [Configuración del Sistema](#configuración-del-sistema)
10. [Mejores Prácticas](#mejores-prácticas)

---

## Acceso al Panel de Administración

### Roles de Usuario

El sistema maneja tres roles:

**🔴 ADMIN (Administrador)**
- Acceso completo al sistema
- Puede gestionar usuarios
- Acceso a todas las funciones
- Puede modificar configuraciones

**🟡 STAFF (Personal)**
- Gestión de eventos
- Gestión de inscripciones
- Gestión de inventario
- Gestión de ventas
- No puede gestionar usuarios

**🟢 CLIENTE (Cliente)**
- Solo acceso al área pública
- Constructor de mazos
- Inscripciones a eventos

### Iniciar Sesión

1. Ve a `/auth/login`
2. Ingresa tus credenciales de administrador
3. Serás redirigido al dashboard

**Credenciales por defecto (cambiar inmediatamente):**
```
Email: admin@rolacards.com
Password: admin123
```

### Cambiar Contraseña Inicial

⚠️ **IMPORTANTE: Cambiar la contraseña por defecto inmediatamente**

1. Ve a tu perfil (esquina superior derecha)
2. Haz clic en "Cambiar Contraseña"
3. Ingresa:
   - Contraseña actual: admin123
   - Nueva contraseña: [tu contraseña segura]
   - Confirmar nueva contraseña
4. Guarda los cambios

**Recomendaciones de Seguridad:**
- Mínimo 12 caracteres
- Incluye mayúsculas y minúsculas
- Incluye números
- Incluye símbolos especiales
- No uses información personal

---

## Dashboard Principal

### Ubicación
```
URL: /admin/dashboard
```

### Estadísticas Principales

El dashboard muestra métricas clave en tiempo real:

**📊 Ventas**
```
💰 Ventas del Día: $X,XXX.XX
📈 Ventas del Mes: $XX,XXX.XX
📊 Promedio Diario: $X,XXX.XX
```

**📦 Inventario**
```
🏷️ Total de Productos: XXX
⚠️ Productos con Stock Bajo: XX
💰 Valor Total del Inventario: $XXX,XXX.XX
```

**🎫 Eventos**
```
📅 Eventos Próximos: X
👥 Total de Inscritos: XX
⏰ Eventos Hoy: X
```

**👥 Usuarios**
```
📊 Total de Clientes: XXX
📈 Nuevos este Mes: XX
✉️ Emails Verificados: XX%
```

### Navegación Rápida

El menú lateral permite acceso rápido a:

```
📊 Dashboard
🎫 Eventos
📝 Solicitudes de Inscripción
📦 Inventario
💰 Ventas
👥 Usuarios
📊 Reportes
🔧 Configuración
🔍 Buscador de Cartas
```

---

## Gestión de Eventos

### Ubicación
```
URL: /admin/eventos
```

### Crear un Nuevo Evento

#### Paso 1: Información Básica

1. Haz clic en "Nuevo Evento"
2. Completa el formulario:

```
📝 Título del Evento
Ejemplo: "Torneo Regional Yu-Gi-Oh! TCG - Enero 2026"

📄 Slug (URL)
Se genera automáticamente del título
Ejemplo: torneo-regional-yu-gi-oh-tcg-enero-2026

📝 Descripción Corta
Máximo 300 caracteres
Aparece en la lista de eventos

📄 Contenido Completo
Descripción detallada con reglas, premios, etc.
Soporta formato de texto enriquecido
```

#### Paso 2: Fechas y Ubicación

```
📅 Fecha de Inicio
Selecciona fecha y hora exacta
Ejemplo: 2026-01-25 10:00 AM

📅 Fecha de Finalización (Opcional)
Para eventos de múltiples días

📍 Ubicación
Ejemplo: "RolaCards - Av. Principal #123, Col. Centro"
```

#### Paso 3: Configuración del Torneo

**Tipo de Evento:**
```
🏆 Torneo (TOURNAMENT)
   - Competencia formal
   - Requiere inscripción y validación

👁️ Sneak Peek (SNEAK_PEEK)
   - Pre-lanzamiento
   - Productos nuevos

🎮 Locals (LOCALS)
   - Torneo casual semanal
   - Más relajado

⭐ Evento Especial (SPECIAL_EVENT)
   - Celebraciones
   - Eventos únicos

📢 Anuncio (ANNOUNCEMENT)
   - Solo informativo
   - No requiere inscripción
```

**Formato de Juego:**
```
🎯 TCG - Formato oficial actual
🎯 OCG - Formato japonés
🎯 GOAT - Formato histórico (Abril 2005)
🎯 Edison - Formato histórico (Abril 2010)
🎯 Genesys - Formato especial con sistema de puntos
```

**Límite de Puntos Genesys (solo para formato Genesys):**
```
📊 Puntos Máximos
Ejemplo: 100
Define cuántos puntos puede tener un mazo
```

#### Paso 4: Configuración de Inscripción

```
💰 Costo de Inscripción
Ejemplo: 150.00
Dejar vacío si es gratis

👥 Cupo Máximo
Ejemplo: 32
Límite de jugadores inscritos

🏆 Información de Premios
Ejemplo:
"1er Lugar: $2,000 + 3 sobres
2do Lugar: $1,000 + 2 sobres
3er-4to: 2 sobres"
```

#### Paso 5: Imagen del Evento

```
🖼️ Subir Imagen
Formatos: JPG, PNG, WEBP
Tamaño recomendado: 1200x630 px
Máximo: 5MB
```

1. Haz clic en "Seleccionar Imagen"
2. Elige el archivo
3. Espera a que se suba
4. Verás la previsualización

#### Paso 6: Opciones de Publicación

```
✅ Publicado
Marca para que sea visible a los clientes
Desmarca para mantener como borrador

⭐ Destacado
Aparecerá en la sección destacada
Máximo 3 eventos destacados simultáneamente
```

#### Paso 7: Guardar

1. Revisa toda la información
2. Haz clic en "Crear Evento"
3. Verás el evento en la lista

### Editar un Evento Existente

1. Encuentra el evento en la lista
2. Haz clic en el botón "Editar" (✏️)
3. Modifica los campos necesarios
4. Guarda los cambios

**⚠️ Precauciones al Editar:**
- Si cambias el formato, verifica que los mazos inscritos sean compatibles
- Si reduces el cupo, puede afectar inscripciones aprobadas
- Cambios importantes requieren notificar a los inscritos

### Eliminar un Evento

1. Haz clic en el botón "Eliminar" (🗑️)
2. Confirma la eliminación

**⚠️ ADVERTENCIA:**
- Esto eliminará todas las inscripciones asociadas
- La acción no se puede deshacer
- Solo elimina si no hay inscripciones o si es realmente necesario

### Ver Inscritos en un Evento

En cada tarjeta de evento verás:

```
👥 Inscritos (X/Y)
├─ Nombre del Usuario
│  └─ Email
│  └─ Mazo: [Nombre del mazo]
│  └─ Formato: [TCG/GOAT/etc]
├─ [Más usuarios...]
└─ ⚠️ X pendiente(s) de aprobación
```

**Información Mostrada:**
- Total de aprobados vs máximo
- Lista de jugadores confirmados
- Mazo que usarán
- Alertas de pendientes

### Filtrar y Buscar Eventos

**Búsqueda:**
```
🔍 Buscar por nombre del evento
```

**Filtros:**
- 📅 Solo próximos eventos
- 📜 Todos los eventos
- ⭐ Solo destacados
- 📝 Solo borradores (no publicados)

---

## Gestión de Inscripciones

### Ubicación
```
URL: /admin/solicitudes
```

### Panel de Solicitudes

Muestra todas las inscripciones con filtros:

**Filtros Disponibles:**
```
📊 Todas
🟡 Pendientes (requieren acción)
🟢 Aprobadas
🔴 Rechazadas
```

### Información de Cada Solicitud

```
📅 Evento
├─ Título del evento
├─ Fecha del evento
└─ Formato requerido

👤 Jugador
├─ Nombre completo
└─ Email

🃏 Mazo
├─ Nombre del mazo
└─ Formato

💰 Pago
├─ Monto: $XXX.XX
├─ Estado del comprobante
└─ Referencia de transferencia

📊 Estado
└─ PENDIENTE / APROBADO / RECHAZADO

📅 Fecha de Solicitud
└─ DD/MM/YYYY HH:mm
```

### Revisar una Solicitud (Detalles)

1. Haz clic en cualquier solicitud
2. Se abrirá un modal con información completa:

```
DETALLES DE LA SOLICITUD

📅 Evento
[Nombre del evento]
[Fecha del evento]

👤 Jugador
Nombre: [Nombre completo]
Email: [email@ejemplo.com]

🃏 Mazo
Nombre: [Nombre del mazo]
Formato: [TCG/GOAT/etc]

💵 Comprobante de Pago
[Imagen/PDF del comprobante]
o
"No se ha subido comprobante"

📝 Referencia
[Referencia de transferencia si existe]
```

### Aprobar una Solicitud

#### Validaciones Automáticas

El sistema verifica automáticamente:

✅ **Validación de Cupo**
```
❌ No hay cupo disponible en el evento
✓ Hay cupo disponible
```

✅ **Validación de Comprobante**
```
❌ No se puede aprobar sin comprobante de pago
✓ Comprobante presente
```

✅ **Validación de Mazo**
```
❌ El mazo no cumple con la banlist del formato
   Razón: [Cartas específicas que incumplen]
✓ Mazo válido según banlist
```

✅ **Validación de Formato**
```
❌ El mazo es formato X pero el evento requiere Y
✓ Formato correcto
```

#### Proceso de Aprobación

1. **Revisar Comprobante**
   - Verifica que el pago sea correcto
   - Confirma el monto
   - Valida la referencia si hay

2. **Verificar Mazo (automático)**
   - El sistema valida automáticamente
   - Te avisará si hay problemas
   - Puedes ver las cartas problemáticas

3. **Aprobar**
   - Haz clic en "Aprobar"
   - Se envía email de confirmación al jugador
   - El jugador queda oficialmente inscrito

**Email Automático al Aprobar:**
```
Para: [email del jugador]
Asunto: ¡Inscripción Aprobada! - [Nombre del Evento]

Contenido:
- Confirmación de inscripción
- Fecha y hora del evento
- Ubicación
- Información del mazo registrado
- Instrucciones adicionales
```

### Rechazar una Solicitud

#### Cuándo Rechazar

Razones comunes:
- ❌ Comprobante de pago inválido o incorrecto
- ❌ Mazo no cumple con las reglas
- ❌ Información incorrecta o incompleta
- ❌ Jugador no cumple requisitos
- ❌ Cupo lleno (si aprobaste a otro primero)

#### Proceso de Rechazo

1. **Escribir Nota de Rechazo**
   ```
   Ejemplos de notas:

   "El comprobante de pago no coincide con el monto
   de inscripción. Por favor, sube el comprobante
   correcto mostrando el pago de $150.00"

   "Tu mazo incluye cartas prohibidas en formato GOAT:
   - Raigeki (Forbidden)
   - Monster Reborn (Forbidden)
   Por favor, ajusta tu mazo y vuelve a inscribirte."

   "El evento ya alcanzó su cupo máximo. Te sugerimos
   inscribirte en el próximo torneo."
   ```

2. **Contador de Caracteres**
   - El sistema muestra cuántos caracteres llevas
   - Sé claro y conciso
   - Sé respetuoso y profesional

3. **Confirmar Rechazo**
   - Haz clic en "Rechazar"
   - Se envía email al jugador con la nota

**Email Automático al Rechazar:**
```
Para: [email del jugador]
Asunto: Inscripción Rechazada - [Nombre del Evento]

Contenido:
- Estado: Rechazado
- Razón del rechazo (tu nota)
- Instrucciones para corregir
- Cómo volver a inscribirse
```

### Subir Comprobante como Admin

Si el jugador tiene problemas para subir el comprobante:

1. En los detalles de la solicitud
2. Sección "Subir Comprobante (Opcional)"
3. Haz clic en el área de carga:
   ```
   📤 Seleccionar archivo (JPG, PNG, WEBP, PDF)
   ```
4. Elige el archivo
5. Se sube automáticamente
6. Verás confirmación verde

### Estadísticas de Inscripciones

En la parte superior del panel:

```
📊 Totales
├─ Total de Solicitudes: XXX
├─ 🟡 Pendientes: XX
├─ 🟢 Aprobadas: XX
└─ 🔴 Rechazadas: XX
```

### Mejores Prácticas - Inscripciones

✅ **Recomendaciones:**

1. **Tiempo de Respuesta**
   - Revisa solicitudes diariamente
   - Responde en máximo 48 horas
   - Prioriza eventos próximos

2. **Comunicación Clara**
   - Notas de rechazo específicas y útiles
   - Indica exactamente qué debe corregir
   - Sé cordial y profesional

3. **Validación de Pagos**
   - Verifica montos exactos
   - Cruza referencias bancarias
   - Confirma que coincida el nombre

4. **Validación de Mazos**
   - Confía en las validaciones automáticas
   - Si hay duda, consulta la banlist oficial
   - Comunica claramente las infracciones

5. **Gestión de Cupos**
   - Aprueba en orden de llegada
   - Si hay lista de espera, mantenla organizada
   - Notifica cuando se abran cupos

---

## Gestión de Inventario

### Ubicación
```
URL: /admin/inventario
```

### Panel de Inventario

Muestra todos los productos con información clave:

```
📦 Producto
├─ SKU: [código único]
├─ Nombre
├─ Tipo
├─ 💰 Precio: $XXX.XX
├─ 📊 Stock: XX unidades
└─ 🏷️ Categoría
```

### Tipos de Productos

```
🃏 SINGLE - Carta individual
📦 BOOSTER - Sobre individual
📦 BOX - Caja de sobres
🎁 STRUCTURE - Estructura/Starter
🎁 TIN - Lata coleccionable
🎨 ACCESSORY - Accesorios (sleeves, mats, etc.)
📦 OTHER - Otros productos
```

### Agregar Nuevo Producto

#### Productos Generales

1. Haz clic en "Nuevo Producto"
2. Completa el formulario:

```
🏷️ Información Básica
├─ SKU: [Código único, ej: BOX-ROTA-001]
├─ Nombre: [Nombre del producto]
├─ Tipo: [Seleccionar tipo]
└─ Categoría: [Opcional]

💰 Precios e Inventario
├─ Precio de Venta: $XXX.XX
├─ Costo: $XXX.XX (opcional, para reportes)
├─ Stock Inicial: XX unidades
└─ Stock Mínimo: X (alerta cuando baje de este número)

📝 Descripción
└─ [Descripción del producto]

🖼️ Imagen
└─ [Subir imagen JPG/PNG/WEBP]

📍 Ubicación Física
└─ [Ej: "Estante A, Nivel 2"]

📝 Notas
└─ [Notas internas]
```

#### Productos Tipo "SINGLE" (Cartas)

Para cartas individuales, campos adicionales:

```
🃏 Información de Carta
├─ ID de Carta: [ID de YGOProDeck API]
├─ Nombre de Carta: [Se llena automático]
├─ Set: [Set de la carta]
├─ Rareza: [Common, Rare, Super, Ultra, etc.]
├─ Condición:
│   ├─ MINT - Perfecta
│   ├─ NEAR_MINT - Casi perfecta
│   ├─ LIGHT_PLAY - Uso ligero
│   ├─ MODERATE_PLAY - Uso moderado
│   ├─ HEAVY_PLAY - Uso pesado
│   └─ DAMAGED - Dañada
├─ Idioma: [EN, ES, JP, etc.]
└─ Datos de Carta: [Se llena automático del API]
```

**Búsqueda de Cartas:**
1. En lugar del ID manual, usa el buscador integrado
2. Busca la carta por nombre
3. Selecciónala
4. Los datos se llenan automáticamente

### Editar Producto

1. Encuentra el producto
2. Haz clic en "Editar" (✏️)
3. Modifica los campos
4. Guarda cambios

**Campos Editables:**
- Precio de venta
- Stock (o usa ajuste de inventario)
- Descripción
- Ubicación
- Notas

**Campos No Editables:**
- SKU (identificador único)
- Tipo de producto

### Ajustar Stock

#### Desde el Listado

```
📊 Stock Actual: XX unidades
[+] [-] Botones de ajuste rápido
```

Cada clic:
- `[+]` suma 1 unidad
- `[-]` resta 1 unidad

#### Desde Edición (Ajuste Mayor)

1. Edita el producto
2. Ve a "Ajuste de Inventario"
3. Selecciona tipo de movimiento:
   ```
   ➕ PURCHASE - Compra a proveedor
   ➖ SALE - Venta (normalmente automático)
   🔧 ADJUSTMENT - Ajuste manual
   ↩️ RETURN - Devolución de cliente
   💔 DAMAGE - Producto dañado/perdido
   ```

4. Ingresa:
   ```
   📊 Cantidad: [número]
   📝 Nota: [razón del ajuste]
   ```

5. El sistema:
   - Registra el movimiento en historial
   - Actualiza el stock automáticamente
   - Guarda quién hizo el cambio y cuándo

### Historial de Movimientos

Cada producto tiene un historial completo:

```
📊 HISTORIAL DE STOCK

[Fecha] Tipo de Movimiento
├─ Stock Anterior: XX
├─ Cantidad: +/-X
├─ Stock Nuevo: XX
├─ Nota: [razón]
└─ Usuario: [quien lo hizo]
```

**Tipos de Información:**
- Compras a proveedores
- Ventas registradas
- Ajustes manuales
- Devoluciones
- Mermas por daño

### Alertas de Stock Bajo

El sistema alerta automáticamente cuando:

```
⚠️ STOCK BAJO
Stock actual (5) ≤ Stock mínimo (10)
```

**En el Dashboard:**
- Contador de productos con stock bajo
- Lista de productos afectados

**En el Inventario:**
- Badge rojo en productos con stock bajo
- Filtro para ver solo productos con alerta

### Búsqueda y Filtros

**Búsqueda:**
```
🔍 Buscar por:
├─ Nombre del producto
├─ SKU
└─ Descripción
```

**Filtros:**
```
📁 Por Tipo
├─ Singles
├─ Boosters
├─ Boxes
├─ Structures
├─ Tins
├─ Accessories
└─ Other

🏷️ Por Categoría
[Categorías personalizadas]

⚠️ Por Estado
├─ Todos
├─ Stock bajo
├─ Sin stock
└─ Con stock
```

### Categorías

Organiza productos en categorías personalizadas:

```
📁 Ejemplos de Categorías
├─ Sets Recientes
├─ Sets Antiguos
├─ Productos de Temporada
├─ Promociones
└─ [Personalizado]
```

**Crear Categoría:**
1. Configuración → Categorías
2. Agregar nueva categoría
3. Asignar productos

### Eliminar Producto

1. Haz clic en "Eliminar" (🗑️)
2. Confirma la eliminación

**⚠️ Restricciones:**
- No se puede eliminar si hay ventas registradas
- Se archiva en lugar de eliminar permanentemente
- El historial se conserva

### Mejores Prácticas - Inventario

✅ **Recomendaciones:**

1. **SKUs Consistentes**
   ```
   Formato sugerido:
   [TIPO]-[SET]-[NÚMERO]

   Ejemplos:
   SINGLE-ROTA-001
   BOX-DUNE-001
   STRUCT-CBLS-001
   ```

2. **Actualización Regular**
   - Revisa stock diariamente
   - Ajusta cuando recibas mercancía
   - Audita mensualmente

3. **Stock Mínimo**
   - Define niveles realistas
   - Considera tiempo de reabastecimiento
   - Productos populares: stock mínimo más alto

4. **Condiciones de Cartas**
   - Sé consistente en la evaluación
   - Fotos para cartas valiosas
   - Describe daños específicos en notas

5. **Organización Física**
   - Actualiza ubicación física
   - Mantén el orden en tienda
   - Facilita encontrar productos

---

## Gestión de Ventas

### Ubicación
```
URL: /admin/ventas
```

### Crear Nueva Venta

1. Haz clic en "Nueva Venta"
2. Se abre el punto de venta (POS)

#### Paso 1: Agregar Productos

**Búsqueda de Productos:**
```
🔍 Buscar por:
├─ Nombre
├─ SKU
└─ Código de barras (si aplica)
```

**Agregar al Carrito:**
1. Busca el producto
2. Haz clic para agregarlo
3. Se muestra en el carrito

**Ajustar Cantidad:**
```
📦 Producto X
├─ Precio: $XX.XX
├─ Cantidad: [1] [+] [-]
├─ Subtotal: $XX.XX
└─ [🗑️] Eliminar
```

**Aplicar Descuento (por producto):**
```
💰 Descuento
├─ Tipo: [Porcentaje] [Monto Fijo]
├─ Valor: [X%] o [$X.XX]
└─ Aplicar
```

#### Paso 2: Información del Cliente (Opcional)

```
👤 Datos del Cliente
├─ Nombre: [opcional]
├─ Email: [opcional]
├─ Teléfono: [opcional]
└─ [Solo para factura o seguimiento]
```

#### Paso 3: Método de Pago

```
💳 Seleccionar Método
├─ 💵 CASH - Efectivo
├─ 💳 CARD - Tarjeta
├─ 📱 TRANSFER - Transferencia
└─ 🔄 MIXED - Mixto
```

**Para pago MIXTO:**
```
💰 Distribuir Pago
├─ Efectivo: $XXX.XX
├─ Tarjeta: $XXX.XX
└─ Total: $XXX.XX
```

#### Paso 4: Resumen de Venta

```
📊 RESUMEN
├─ Subtotal: $XXX.XX
├─ Descuento: -$XX.XX
├─ IVA (16%): $XX.XX
└─ TOTAL: $XXX.XX
```

#### Paso 5: Procesar Venta

1. Verifica el total
2. Confirma el método de pago
3. Haz clic en "Procesar Venta"

**El Sistema:**
- ✅ Reduce stock automáticamente
- ✅ Genera número de venta único
- ✅ Registra en historial
- ✅ Actualiza estadísticas
- ✅ Genera ticket/recibo

#### Paso 6: Ticket de Venta

Después de procesar:

```
🧾 TICKET GENERADO

Opciones:
├─ 🖨️ Imprimir Ticket
├─ 📧 Enviar por Email
├─ 📄 Descargar PDF
└─ ✅ Finalizar
```

### Ver Historial de Ventas

**Información Mostrada:**
```
📋 Venta #XXXX
├─ 📅 Fecha: DD/MM/YYYY HH:mm
├─ 👤 Cliente: [Nombre o "Venta General"]
├─ 💰 Total: $XXX.XX
├─ 💳 Método: [CASH/CARD/etc]
├─ 📊 Estado: [COMPLETED/PENDING/etc]
└─ 🧾 [Ver Detalles] [PDF]
```

### Ver Detalles de una Venta

1. Haz clic en cualquier venta
2. Se muestra información completa:

```
VENTA #XXXX

📅 Información General
├─ Fecha: DD/MM/YYYY HH:mm
├─ Vendedor: [Tu nombre]
├─ Cliente: [Nombre]
└─ Estado: COMPLETADA

🛒 Productos Vendidos
├─ [Producto 1]
│   ├─ Cantidad: X
│   ├─ Precio Unit.: $XX.XX
│   ├─ Descuento: $X.XX
│   └─ Subtotal: $XX.XX
├─ [Producto 2]
└─ [...]

💰 Totales
├─ Subtotal: $XXX.XX
├─ Descuento Total: $XX.XX
├─ IVA: $XX.XX
└─ TOTAL: $XXX.XX

💳 Pago
└─ Método: [Efectivo/Tarjeta/etc]
```

### Modificar/Cancelar Venta

**Cancelar Venta:**

⚠️ **IMPORTANTE: Solo para ventas del mismo día**

1. Abre la venta
2. Haz clic en "Cancelar Venta"
3. Ingresa razón de cancelación
4. Confirma

**El Sistema:**
- Revierte el stock
- Marca la venta como CANCELLED
- Registra quién y cuándo canceló
- Guarda la razón

**No se puede cancelar si:**
- La venta es de días anteriores
- Ya fue procesada en corte de caja

### Generar PDF de Venta

1. Desde el detalle de la venta
2. Haz clic en "Descargar PDF"
3. Se genera ticket en PDF

**Contenido del PDF:**
```
🧾 ROLACARDS
    [Logo/Nombre]

Venta #XXXX
Fecha: DD/MM/YYYY HH:mm
Atendió: [Vendedor]

─────────────────────
PRODUCTOS
─────────────────────
[Lista de productos]

─────────────────────
Subtotal    $XXX.XX
Descuento   -$XX.XX
IVA (16%)    $XX.XX
─────────────────────
TOTAL       $XXX.XX
─────────────────────

Método: [Efectivo/etc]

¡Gracias por tu compra!
```

### Filtros y Búsqueda de Ventas

**Por Fecha:**
```
📅 Filtros de Fecha
├─ Hoy
├─ Esta Semana
├─ Este Mes
└─ Rango Personalizado
```

**Por Estado:**
```
📊 Por Estado
├─ Todas
├─ Completadas
├─ Pendientes
├─ Canceladas
└─ Reembolsadas
```

**Por Método de Pago:**
```
💳 Método de Pago
├─ Todos
├─ Efectivo
├─ Tarjeta
├─ Transferencia
└─ Mixto
```

**Búsqueda:**
```
🔍 Buscar por:
├─ Número de venta
├─ Nombre de cliente
└─ Email de cliente
```

### Mejores Prácticas - Ventas

✅ **Recomendaciones:**

1. **Verificación de Stock**
   - El sistema verifica automáticamente
   - No vendas productos sin stock
   - Actualiza precios regularmente

2. **Información del Cliente**
   - Solicita email para ventas grandes
   - Útil para seguimiento
   - Respeta la privacidad

3. **Descuentos**
   - Aplica con autorización
   - Documenta la razón
   - Sé consistente con políticas

4. **Métodos de Pago**
   - Confirma el pago antes de procesar
   - Para tarjeta: espera confirmación
   - Guarda comprobantes

5. **Tickets**
   - Imprime siempre para el cliente
   - Guarda copia digital
   - Incluye políticas de devolución

---

## Gestión de Usuarios

### Ubicación
```
URL: /admin/usuarios
```

**⚠️ SOLO ADMIN:** Esta sección solo está disponible para usuarios con rol ADMIN.

### Listado de Usuarios

Muestra todos los usuarios del sistema:

```
👤 Usuario
├─ Nombre Completo
├─ Email
├─ Rol: [ADMIN/STAFF/CLIENTE]
├─ Email Verificado: [✓/✗]
├─ ID Konami: [si tiene]
└─ Fecha de Registro
```

### Crear Nuevo Usuario

#### Tipos de Usuario que Puedes Crear

**🔴 Administrador (ADMIN)**
- Acceso total al sistema
- Usa con precaución
- Máximo 2-3 admins recomendados

**🟡 Staff (STAFF)**
- Para empleados de la tienda
- Acceso a ventas, inventario, eventos
- Sin acceso a gestión de usuarios

**🟢 Cliente (CLIENTE)**
- Usuario normal
- Mejor que se registren ellos mismos
- Crear solo si es necesario

#### Proceso de Creación

1. Haz clic en "Nuevo Usuario"
2. Completa el formulario:

```
📧 Email
[email@ejemplo.com]
Debe ser único

👤 Nombre Completo
[Nombre del usuario]

🔑 Contraseña
[Contraseña temporal]
El usuario debe cambiarla

🎭 Rol
[Seleccionar: ADMIN/STAFF/CLIENTE]

🖼️ Avatar (Opcional)
[Subir imagen]
```

3. Haz clic en "Crear Usuario"

**⚠️ Después de Crear:**
- Proporciona las credenciales al usuario
- Pídele que cambie la contraseña inmediatamente
- Verifica que pueda acceder

### Editar Usuario

1. Encuentra el usuario
2. Haz clic en "Editar" (✏️)

**Puedes Modificar:**
```
✏️ Campos Editables
├─ Nombre
├─ Rol (cambiar CLIENTE a STAFF, etc.)
├─ Avatar
└─ ID Konami
```

**No Puedes Modificar:**
- Email (es el identificador único)
- Contraseña (solo el usuario puede cambiarla)
- Fecha de registro

### Verificar Email Manualmente

Si un usuario tiene problemas con la verificación:

1. Edita el usuario
2. Marca "Email Verificado"
3. Guarda cambios

**Cuándo Hacerlo:**
- Emails de verificación no llegan
- Problemas técnicos
- Casos especiales autorizados

### Eliminar Usuario

1. Haz clic en "Eliminar" (🗑️)
2. Confirma la eliminación

**⚠️ PRECAUCIÓN:**
- Verifica que sea la acción correcta
- Los datos se eliminarán permanentemente
- Si tiene ventas/eventos, considerar desactivar en lugar de eliminar

**No se puede eliminar si:**
- Tiene inscripciones activas en eventos
- Es el único ADMIN del sistema
- Tiene ventas recientes pendientes

### Buscar Usuarios

```
🔍 Buscar por:
├─ Nombre
├─ Email
└─ ID Konami
```

### Filtrar por Rol

```
🎭 Filtros
├─ Todos los Usuarios
├─ Solo Administradores
├─ Solo Staff
└─ Solo Clientes
```

### Ver Actividad de Usuario

1. Haz clic en un usuario
2. Ver información:

```
📊 Actividad del Usuario

📅 Registro
└─ Fecha: DD/MM/YYYY

✉️ Verificación
└─ Estado: [Verificado/Pendiente]

🎫 Eventos
└─ Inscripciones: X
   ├─ Pendientes: X
   ├─ Aprobadas: X
   └─ Rechazadas: X

🃏 Mazos
└─ Total: X mazos creados

💰 Compras (solo visible para clientes)
└─ Total gastado: $X,XXX.XX
```

### Resetear Contraseña (Admin)

Si un usuario olvida su contraseña:

**Opción 1: Envío Automático**
1. Encuentra el usuario
2. Haz clic en "Resetear Contraseña"
3. Se envía email con instrucciones

**Opción 2: Establecer Nueva Contraseña**
1. Edita el usuario
2. "Establecer Nueva Contraseña"
3. Ingresa contraseña temporal
4. Comunica al usuario de forma segura
5. Pídele que la cambie

### Mejores Prácticas - Usuarios

✅ **Recomendaciones:**

1. **Seguridad**
   - Mínimos usuarios ADMIN necesarios
   - Contraseñas temporales fuertes
   - Revoca acceso de ex-empleados inmediatamente

2. **Roles Apropiados**
   - ADMIN: Solo dueños/gerentes
   - STAFF: Empleados de confianza
   - CLIENTE: Registro propio preferible

3. **Auditoría**
   - Revisa lista de usuarios mensualmente
   - Identifica cuentas inactivas
   - Verifica permisos apropiados

4. **Privacidad**
   - No compartas información de clientes
   - Respeta datos personales
   - Solo accede cuando sea necesario

---

## Reportes y Estadísticas

### Ubicación
```
URL: /admin/reportes
```

### Reporte de Ventas

#### Selección de Período

```
📅 Período del Reporte
├─ Fecha Inicio: [DD/MM/YYYY]
└─ Fecha Fin: [DD/MM/YYYY]

Atajos Rápidos:
├─ Hoy
├─ Esta Semana
├─ Este Mes
└─ Mes Anterior
```

#### Métricas Principales

```
💰 VENTAS TOTALES
└─ $XX,XXX.XX

📊 NÚMERO DE TRANSACCIONES
└─ XXX ventas

💵 TICKET PROMEDIO
└─ $XXX.XX

📈 PRODUCTOS VENDIDOS
└─ XXX unidades

🏆 PRODUCTO MÁS VENDIDO
└─ [Nombre del producto] (XX unidades)
```

#### Desglose por Método de Pago

```
💳 MÉTODOS DE PAGO

💵 Efectivo
├─ Transacciones: XX
└─ Total: $X,XXX.XX

💳 Tarjeta
├─ Transacciones: XX
└─ Total: $X,XXX.XX

📱 Transferencia
├─ Transacciones: XX
└─ Total: $X,XXX.XX

🔄 Mixto
├─ Transacciones: XX
└─ Total: $X,XXX.XX
```

#### Ventas por Categoría

```
📁 CATEGORÍA          VENTAS      TOTAL
├─ Singles            XX      $X,XXX.XX
├─ Boosters           XX      $X,XXX.XX
├─ Boxes              XX      $X,XXX.XX
├─ Structures         XX      $X,XXX.XX
├─ Accessories        XX        $XXX.XX
└─ Other              XX        $XXX.XX
```

#### Top 10 Productos

```
🏆 PRODUCTOS MÁS VENDIDOS

#1  [Producto A]
    XX unidades | $X,XXX.XX

#2  [Producto B]
    XX unidades | $X,XXX.XX

#3  [Producto C]
    XX unidades | $XXX.XX

[...]
```

#### Gráficas y Visualizaciones

**Ventas por Día:**
```
📊 [Gráfica de barras]
Muestra ventas diarias del período
```

**Distribución por Método de Pago:**
```
🥧 [Gráfica de pastel]
Porcentaje de cada método
```

**Tendencia de Ventas:**
```
📈 [Gráfica de línea]
Tendencia del período
```

#### Exportar Reporte

```
📤 Exportar Como:
├─ 📄 PDF (para imprimir)
├─ 📊 Excel (.xlsx)
└─ 📋 CSV
```

### Reporte de Inventario

```
📦 ESTADO DEL INVENTARIO

💰 Valor Total
└─ $XXX,XXX.XX

📊 Total de Productos
└─ XXX productos

⚠️ Productos con Stock Bajo
└─ XX productos

❌ Productos Sin Stock
└─ XX productos

📈 Productos Más Valiosos
[Top 10 por valor de inventario]

⚠️ Alertas de Reabastecimiento
[Lista de productos que necesitan pedido]
```

### Reporte de Eventos

```
🎫 ESTADÍSTICAS DE EVENTOS

📅 Período: [Mes/Año]

📊 Total de Eventos
└─ XX eventos realizados

👥 Total de Inscritos
└─ XXX participantes

💰 Ingresos por Inscripciones
└─ $XX,XXX.XX

📈 Promedio de Inscritos por Evento
└─ XX participantes

🎯 Eventos por Formato
├─ TCG: XX eventos
├─ GOAT: XX eventos
├─ Edison: XX eventos
└─ Genesys: XX eventos

🏆 Evento Más Popular
└─ [Nombre] (XX inscritos)
```

### Mejores Prácticas - Reportes

✅ **Recomendaciones:**

1. **Frecuencia de Revisión**
   - Diario: Ventas del día
   - Semanal: Tendencias y stock
   - Mensual: Análisis completo
   - Trimestral: Estrategias a largo plazo

2. **Toma de Decisiones**
   - Identifica productos más vendidos
   - Detecta productos de baja rotación
   - Planifica compras basándote en datos
   - Ajusta precios según demanda

3. **Optimización**
   - Productos con stock bajo: reordenar
   - Productos sin movimiento: descuentos
   - Horarios pico: más personal
   - Métodos de pago preferidos: promocionar

---

## Configuración del Sistema

### Ubicación
```
URL: /admin/ubicacion-contacto
```

### Información de la Tienda

```
🏪 DATOS DE LA TIENDA

Nombre de la Tienda
[RolaCards]

📍 Dirección Completa
[Calle, número, colonia, ciudad]

📞 Teléfono
[(XXX) XXX-XXXX]

📧 Email de Contacto
[contacto@rolacards.com]

🌐 Redes Sociales
├─ Facebook: [URL]
├─ Instagram: [URL]
├─ Twitter: [URL]
└─ Discord: [URL]

⏰ Horario
[Lunes a Sábado: 10:00 AM - 8:00 PM]
```

### Configuración de Emails

**Proveedor: Mailgun**

```
📧 CONFIGURACIÓN DE CORREO

API Key
[Tu API key de Mailgun]
⚠️ Mantener confidencial

Dominio
[ejemplo: mg.rolacards.com]

Remitente
Nombre: RolaCards
Email: noreply@rolacards.com
```

**Plantillas de Email:**

El sistema usa plantillas para:
- Bienvenida y verificación
- Confirmación de inscripción
- Aprobación/Rechazo de solicitud
- Recordatorios de eventos
- Notificaciones administrativas

### Configuración de Pagos

```
💳 MÉTODOS DE PAGO ACEPTADOS

Transferencia Bancaria
Banco: [Nombre del banco]
Cuenta: [XXXX-XXXX-XXXX]
CLABE: [XXXXXXXXXXXXXX]
Titular: [Nombre]

Efectivo
Aceptado en tienda física

Tarjeta (en tienda)
Terminal punto de venta
```

### Banners y Anuncios

```
📢 GESTIÓN DE ANUNCIOS

Banner Principal (Home)
├─ Imagen: [Subir JPG/PNG]
├─ Texto: [Mensaje]
└─ Enlace: [URL opcional]

Anuncio de Evento Destacado
├─ Automático desde eventos destacados
└─ Máximo 3 simultáneos
```

### Límites y Restricciones

```
⚙️ CONFIGURACIÓN AVANZADA

Inscripciones
├─ Máximo por usuario: Sin límite
├─ Días antes para inscripción: 1 día
└─ Requiere comprobante: Configurable por evento

Mazos
├─ Máximo por usuario: Sin límite
├─ Cartas por mazo: 40-60 (Main)
└─ Validación automática: Activa

Uploads
├─ Tamaño máximo: 5MB
├─ Formatos imagen: JPG, PNG, WEBP
└─ Formato documentos: PDF
```

---

## Mejores Prácticas

### Seguridad

✅ **Obligatorio:**

1. **Contraseñas Fuertes**
   - Mínimo 12 caracteres
   - Combinación de mayúsculas, minúsculas, números, símbolos
   - Cambiar cada 90 días
   - No compartir con nadie

2. **Sesiones**
   - Cerrar sesión al terminar turno
   - No dejar sesión abierta en computadoras compartidas
   - Verificar que nadie vea la pantalla al ingresar contraseña

3. **Permisos**
   - Dar el mínimo privilegio necesario
   - Solo 2-3 ADMINs máximo
   - Revisar y revocar accesos periódicamente

4. **Datos Sensibles**
   - No compartir información de clientes
   - No tomar fotos de pantallas con datos
   - Respetar privacidad

### Operación Diaria

✅ **Rutina Recomendada:**

**Al Inicio del Día:**
```
☐ Revisar dashboard
☐ Verificar solicitudes pendientes
☐ Revisar eventos del día
☐ Verificar alertas de inventario
☐ Revisar emails importantes
```

**Durante el Día:**
```
☐ Procesar inscripciones (máx 4 horas)
☐ Registrar ventas en tiempo real
☐ Responder consultas de clientes
☐ Actualizar stock si llega mercancía
```

**Al Cierre:**
```
☐ Revisar ventas del día
☐ Verificar caja (efectivo vs sistema)
☐ Procesar solicitudes restantes
☐ Actualizar notas/pendientes
☐ Cerrar sesión
```

### Atención al Cliente

✅ **Estándares de Servicio:**

1. **Tiempo de Respuesta**
   - Inscripciones: Máximo 48 horas
   - Consultas: Máximo 24 horas
   - Problemas urgentes: Mismo día

2. **Comunicación**
   - Clara y profesional
   - Amable pero concisa
   - Soluciones, no excusas

3. **Resolución de Problemas**
   - Escucha primero
   - Verifica la información
   - Ofrece soluciones
   - Documenta el caso

### Gestión de Eventos

✅ **Organización:**

1. **Planificación**
   - Crear eventos con 2 semanas de anticipación mínimo
   - Publicar inmediatamente si están confirmados
   - Mantener información actualizada

2. **Inscripciones**
   - Aprobar en orden de llegada
   - Comunicar claramente rechazos
   - Mantener lista de espera si aplica

3. **Día del Evento**
   - Lista de inscritos impresa
   - Verificar mazos (opcional pero recomendado)
   - Registrar asistencia
   - Actualizar resultados post-evento

### Inventario

✅ **Control:**

1. **Auditorías**
   - Semanal: Productos populares
   - Mensual: Inventario completo
   - Trimestral: Valorización

2. **Reabastecimiento**
   - Revisar alertas diariamente
   - Ordenar con anticipación
   - Registrar inmediatamente al recibir

3. **Organización**
   - Ubicaciones claras y actualizadas
   - Productos similares juntos
   - Fácil acceso a más vendidos

### Respaldo y Recuperación

⚠️ **Crítico:**

1. **Copias de Seguridad**
   - Automáticas diarias (sistema)
   - Verificar que funcionen
   - Probar restauración periódicamente

2. **Documentación**
   - Procedimientos por escrito
   - Contactos de emergencia
   - Información de acceso (segura)

3. **Plan de Contingencia**
   - Qué hacer si falla internet
   - Procedimientos manuales temporales
   - Contacto con soporte técnico

---

## Solución de Problemas Comunes

### Problemas de Acceso

**P: No puedo iniciar sesión**
```
R: Verificar:
1. Email correcto
2. Contraseña correcta (mayúsculas/minúsculas)
3. Cuenta activa
4. Usar recuperación de contraseña
```

**P: Me dice "No autorizado"**
```
R:
1. Verificar tu rol (ADMIN/STAFF)
2. Cerrar sesión y volver a entrar
3. Contactar al administrador principal
```

### Problemas con Eventos

**P: No puedo aprobar una inscripción**
```
R: Verificar:
1. ¿Hay cupo disponible?
2. ¿Tiene comprobante de pago?
3. ¿El mazo cumple con la banlist?
4. Ver mensaje de error específico
```

**P: No se envió el email de confirmación**
```
R:
1. Verificar configuración de Mailgun
2. Revisar email del usuario
3. Reenviar manualmente si es necesario
```

### Problemas con Inventario

**P: No puedo reducir el stock**
```
R:
1. Verificar que haya stock disponible
2. Usar ajuste manual de inventario
3. Revisar permisos de usuario
```

**P: El producto no aparece en ventas**
```
R:
1. Verificar que esté activo
2. Verificar que tenga stock > 0
3. Verificar que tenga precio asignado
```

### Problemas con Ventas

**P: No se procesó la venta**
```
R:
1. Verificar stock de productos
2. Verificar método de pago seleccionado
3. Revisar consola del navegador (F12)
4. Intentar nuevamente
```

**P: Necesito cancelar una venta de hace días**
```
R:
1. Solo puedes cancelar ventas del mismo día
2. Para ventas anteriores, contactar administrador
3. Hacer ajuste manual de inventario si es necesario
```

---

## Contacto y Soporte Técnico

### Soporte del Sistema

```
📧 Email de Soporte
soporte.tecnico@rolacards.com

📱 Teléfono de Emergencia
(XXX) XXX-XXXX

🌐 Portal de Ayuda
https://help.rolacards.com

💬 Chat en Vivo
Disponible en horario laboral
```

### Reportar Errores

Al reportar un error, incluye:

```
🐛 REPORTE DE ERROR

1. ¿Qué estabas haciendo?
[Descripción de la acción]

2. ¿Qué esperabas que pasara?
[Comportamiento esperado]

3. ¿Qué pasó en realidad?
[Comportamiento actual]

4. ¿Se puede reproducir?
[Pasos para reproducir]

5. Información adicional
├─ Navegador: [Chrome/Firefox/etc]
├─ Hora del error: [HH:mm]
└─ Captura de pantalla: [Si es posible]
```

### Sugerencias de Mejora

```
💡 SUGERIR MEJORA

1. Función que te gustaría ver
[Descripción]

2. ¿Qué problema resuelve?
[Beneficio]

3. ¿Qué tan frecuente lo usarías?
[Diario/Semanal/Mensual]
```

---

## Actualizaciones y Novedades

El sistema se actualiza regularmente. Las nuevas funciones incluyen:

**Próximamente:**
- 📊 Reportes avanzados con más métricas
- 📱 App móvil para punto de venta
- 🔔 Notificaciones push
- 📸 Escáner de código de barras
- 🤖 Sugerencias automáticas de reabastecimiento
- 📧 Campañas de email marketing
- 🎁 Sistema de puntos de lealtad

**Actualizaciones se notificarán por:**
- Email a administradores
- Banner en el dashboard
- Notas de versión

---

## Glosario Técnico

**API**: Interfaz de programación de aplicaciones. Permite comunicación entre sistemas.

**Dashboard**: Panel principal con resumen de información clave.

**Endpoint**: Punto de acceso específico en el sistema (URL).

**Session**: Sesión activa de un usuario en el sistema.

**SKU**: Stock Keeping Unit, código único de producto.

**Slug**: Versión limpia de un texto para URL (ej: "mi-evento").

**Stock**: Inventario disponible de un producto.

**Timestamp**: Marca de fecha y hora de un evento.

**Upload**: Subida de archivos al servidor.

**Validación**: Verificación de que los datos son correctos.

---

**Manual para Administradores**
*RolaCards - Sistema de Gestión v1.0*
*Actualizado: Enero 2026*

📧 ¿Preguntas? soporte@rolacards.com
🌐 Más información: www.rolacards.com
