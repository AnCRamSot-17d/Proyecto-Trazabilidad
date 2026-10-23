# BioTrace Dermo-Pharma — Backend REST API (`Proyecto-Trazabilidad`)

API REST y motor de datos para el **Sistema de Trazabilidad Industrial y Manufactura Multiproducto (Cosméticos, Dermocosmética y Farmacéutica)**.

Este repositorio contiene exclusivamente el **Backend** desacoplado, desarrollado bajo una estricta **Arquitectura en Capas** con **Node.js, Express, TypeScript, Prisma ORM y Neon PostgreSQL**.

El cliente frontend ha sido separado en el proyecto independiente **`front-biotrace`** (Angular 19+ Standalone con Signals).

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
│   ├── schema.prisma          # Modelado relacional Neon PostgreSQL
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
├── package.json               # Dependencias y scripts de backend
└── tsconfig.json              # Configuración TypeScript estricta
```

---

## 3. Configuración y Ejecución

### Variables de Entorno (`.env`)
Configurar en la raíz del proyecto un archivo `.env` basado en `.env.example`:
```env
DATABASE_URL="postgresql://neondb_owner:***@ep-***.us-east-2.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:***@ep-***.us-east-2.aws.neon.tech/neondb?sslmode=require"
PORT=3000
JWT_SECRET="clave-secreta-de-produccion-de-al-menos-32-caracteres"
CORS_ORIGIN="http://localhost:4200"
```

### Comandos de Ejecución

```bash
# Instalar dependencias
npm install

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
| `/api/health` | `GET` | Verificación en vivo de conexión con Neon PostgreSQL. |
| `/api/auth/login` | `POST` | Inicio de sesión con JWT válido por 30 minutos. |
| `/api/auth/refresh` | `POST` | Renovación de token JWT activo. |
| `/api/auth/me` | `GET` | Datos de la sesión del usuario actual. |
| `/api/suppliers` | `GET`, `POST` | Directorio de proveedores de materias primas y principios activos. |
| `/api/materials` | `GET`, `POST`, `PATCH` | Catálogo de insumos químicos y principios activos. |
| `/api/material-lots` | `GET`, `POST` | Recepción de lotes de materias primas con control de stock. |
| `/api/products` | `GET`, `POST`, `PATCH` | Catálogo de productos cosméticos y dermofarmacéuticos terminados. |
| `/api/orders` | `GET`, `POST` | Pedidos de clientes con cálculo automático de subtotales. |
| `/api/production-orders`| `GET`, `POST` | Programación de reactores y órdenes de manufactura. |
| `/api/consumptions` | `GET`, `POST` | Balance de masa estricto con descuento automático de inventario. |
| `/api/quality` | `GET`, `POST` | Liberación técnica de control de calidad bajo GMP/BPM (`PENDING`, `APPROVED`, `REJECTED`). |
| `/api/lots` | `GET`, `POST` | Lotes de producto terminado. |
| `/api/lots/:id/traceability` | `GET` | **Trazabilidad Ascendente**: Lote terminado -> Reactores -> Materias primas -> Proveedor. |
| `/api/material-lots/:id/traceability` | `GET` | **Trazabilidad Descendente**: Lote de insumo -> Consumos -> Lotes producidos -> Clientes. |
| `/api/inventory` | `GET` | Estado y saldo en tiempo real de insumos en bodega. |

---

## 5. Proyecto Frontend Vinculado

El frontend correspondiente se encuentra en el directorio independiente:
📁 **`front-biotrace`** (`http://localhost:4200`), el cual consume esta API mediante proxy `/api` o CORS habilitado.
