# BioTrace Dermo-Pharma — Backend REST API (`Proyecto-Trazabilidad`)

API REST y motor de datos para el **Sistema de Trazabilidad Industrial y Manufactura Multiproducto (Cosméticos, Dermocosmética y Farmacéutica)**.

Este repositorio contiene exclusivamente el **Backend** desacoplado, desarrollado bajo una estricta **Arquitectura en Capas** con **Node.js, Express, TypeScript, Prisma ORM (6.x) y Neon PostgreSQL**.

El cliente frontend ha sido separado en el proyecto independiente **`front-biotrace`** (Angular 19+ Standalone con Signals). La documentación técnica exhaustiva de arquitectura, modelo de datos y sincronización se encuentra en [backend.md](backend.md).

---

## 1. Arquitectura en Capas

El backend opera de forma modular sin dependencias de frontend:

- **Controladores (`src/controllers/`)**: Manejan las solicitudes y respuestas HTTP, validando códigos de estado.
- **Servicios (`src/services/`)**: Implementan la lógica de negocio, transacciones atómicas con aislamiento `Serializable` y algoritmos de trazabilidad bidireccional 360°.
- **Repositorios / Base de Datos (`src/repositories/`, `src/config/db.ts`)**: Abstracción del cliente Prisma 6.x y consultas tipadas.
- **Validadores / Esquemas (`src/schemas/`)**: Validación estricta en tiempo de ejecución con **Zod** para todos los payloads entrantes.
- **Seguridad (`src/middlewares/auth.middleware.ts`, `src/config/jwt.ts`)**: Autenticación con JSON Web Tokens (JWT) con ciclo de vida de **30 minutos** y auto-renovación para usuarios activos.

---

## 2. Estructura del Proyecto

```text
Proyecto-Trazabilidad/
├── prisma/
│   ├── schema.prisma          # Modelado relacional Neon PostgreSQL (21 modelos)
│   └── seed.ts                # Inicialización y datos de prueba
├── src/
│   ├── config/                # Conexión DB, variables de entorno y JWT
│   ├── controllers/           # Controladores de dominio, auth y health
│   ├── middlewares/           # Autenticación JWT y manejo centralizado de errores
│   ├── repositories/          # Consultas Prisma tipadas
│   ├── routes/                # Enrutador modular Express (/api/*)
│   ├── schemas/               # Validaciones Zod de inputs y paginación
│   ├── services/              # Lógica de balance, trazabilidad y contraseñas scrypt
│   ├── types/                 # Tipos TypeScript compartidos y HttpError
│   ├── app.ts                 # Configuración de Express y CORS
│   └── server.ts              # Punto de arranque del servidor
├── scripts/                   # Herramientas de inspección, test cluster y hash
├── tests/                     # Suite de pruebas unitarias y de integración
├── reports/                   # Evidencias técnicas de ejecución y contratos
├── .env                       # Variables de entorno locales (ignorado por Git)
├── .env.example               # Plantilla de configuración
├── backend.md                 # Documentación técnica completa y contratos
├── package.json               # Dependencias y scripts de backend
└── tsconfig.json              # Configuración TypeScript estricta
```

---

## 3. Configuración y Ejecución

### Variables de Entorno (`.env`)
Configurar en la raíz del proyecto un archivo `.env` basado en `.env.example`:

```env
DATABASE_URL="postgresql://usuario:***@ep-pooler.region.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://usuario:***@ep.region.neon.tech/neondb?sslmode=require"
JWT_SECRET="clave-secreta-de-al-menos-32-caracteres"
APP_HOST="127.0.0.1"
APP_PORT=3000
CORS_ORIGIN="http://localhost:4200"
DB_READ_ONLY=true
```

| Variable | Descripción | Valor por Defecto Neutral |
| :--- | :--- | :--- |
| `DATABASE_URL` | Cadena de conexión con pooler (PgBouncer) para la API en tiempo de ejecución. | Requerida por la aplicación |
| `DIRECT_URL` | Cadena de conexión directa a Neon para Prisma CLI (migraciones/diff). | Requerida por Prisma |
| `JWT_SECRET` | Clave secreta para firma y verificación de tokens JWT (mínimo 32 caracteres). | Generación aleatoria en memoria |
| `APP_HOST` | Host o interfaz de red donde se enlaza el servidor Express. | `127.0.0.1` |
| `APP_PORT` / `PORT` | Puerto TCP de escucha para la API REST. | `3000` |
| `CORS_ORIGIN` | Origen autorizado para el frontend web vía CORS. | `http://localhost:4200` |
| `DB_READ_ONLY` | Modo de protección de solo lectura (bloquea mutaciones accidentales). | `true` |

### Comandos de Ejecución

```bash
# Instalación exacta de dependencias (reproducible según package-lock.json)
npm ci

# Generar cliente de Prisma
npm run db:generate

# Iniciar servidor en modo desarrollo (recarga rápida con tsx watch)
npm run dev

# Ejecutar verificación de tipos TypeScript
npm run typecheck

# Ejecutar pruebas unitarias
npm test

# Ejecutar suite de integración HTTP con base aislada
npm run test:api

# Inspeccionar esquema y tablas de Neon PostgreSQL
npm run db:inspect
```

El servidor API estará disponible en:
👉 **`http://localhost:3000/api`**

---

## 4. Catálogo de Endpoints REST (`/api/*`)

| Endpoint | Método | Descripción |
| --- | --- | --- |
| `/api/health` | `GET` | Verificación en vivo de conexión con Neon PostgreSQL y compatibilidad de esquema. |
| `/api/auth/login` | `POST` | Inicio de sesión con JWT válido por 30 minutos. |
| `/api/auth/refresh` | `POST` | Renovación de token JWT activo. |
| `/api/auth/me` | `GET` | Datos de la sesión del usuario actual. |
| `/api/auth/read-only-session` | `POST` | Sesión temporal de consulta local cuando la base está en modo protegido. |
| `/api/users` | `GET`, `POST` | Listado y registro de usuarios con hash scrypt. |
| `/api/users/:id` | `GET`, `PATCH` | Consulta y actualización de usuarios del sistema. |
| `/api/clients` *(alias `/clientes`)* | `GET`, `POST` | Listado y registro de clientes y laboratorios. |
| `/api/clients/:id` *(alias `/clientes/:id`)* | `GET`, `PATCH` | Consulta y actualización de datos de cliente. |
| `/api/products` | `GET`, `POST`, `PATCH` | Catálogo de productos cosméticos y dermofarmacéuticos terminados. |
| `/api/materials` | `GET`, `POST`, `PATCH` | Catálogo de insumos químicos y principios activos. |
| `/api/suppliers` | `GET` | Directorio de proveedores únicos obtenido de los ingresos de materias primas. |
| `/api/material-lots` *(alias `/ingresos-mp`)* | `GET`, `POST` | Recepción de lotes de materias primas con control de inventario. |
| `/api/orders` *(alias `/pedidos`)* | `GET`, `POST` | Pedidos de clientes con cálculo automático de subtotales. |
| `/api/production-orders` | `GET`, `POST` | Programación de reactores y órdenes de manufactura. |
| `/api/consumptions` *(alias `/consumos`)* | `GET`, `POST` | Balance de masa estricto con descuento automático de inventario. |
| `/api/inventory` *(alias `/inventario`)* | `GET` | Estado y saldo en tiempo real de insumos en bodega. |
| `/api/quality` *(alias `/calidad`)* | `GET`, `POST` | Liberación técnica de control de calidad bajo GMP/BPM (`PENDING`, `APPROVED`, `REJECTED`). |
| `/api/lots` | `GET`, `POST` | Registro y listado de lotes de producto terminado envasado. |
| `/api/lots/:id/traceability` | `GET` | **Trazabilidad Ascendente**: Lote terminado -> Reactores -> Materias primas -> Proveedor. |
| `/api/material-lots/:id/traceability` | `GET` | **Trazabilidad Descendente**: Lote de insumo -> Consumos -> Lotes producidos -> Clientes. |
| `/api/inventory/:id/traceability` | `GET` | Trazabilidad hacia adelante desde UUID de lote de inventario. |
| `/api/production-orders/:id/traceability` | `GET` | Genealogía de orden de producción (mezcla, calidad y envasado). |

---

## 5. Proyecto Frontend Vinculado

El frontend correspondiente se encuentra en el directorio independiente:
📁 **`front-biotrace`** (`http://localhost:4200`), el cual consume esta API mediante proxy `/api` o CORS habilitado.
