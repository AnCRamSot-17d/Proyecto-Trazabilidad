# Proyecto-Trazabilidad — BioTrace (Rama `front-back`)

> **Actualización técnica:** la API ya está conectada a Neon en solo lectura. Consultar [CONEXION_NEON.md](CONEXION_NEON.md) para resultados, acceso local, endpoints y arranque. Los comandos de migración/seed descritos más abajo pertenecen a documentación anterior: no ejecutarlos contra la base compartida.

Plataforma de Trazabilidad Industrial y Manufactura especializada en **Cosméticos, Dermocosmética y Farmacéutica** (excluyendo alimentos). Permite auditar todo el ciclo de vida: homologación de proveedores de principios activos y excipientes, control de balance de masa en formulaciones, fabricación de lotes terminados, liberación de control de calidad bajo estándares GMP/BPM y trazabilidad 360° ascendente y descendente.

---

## Arquitectura y Stack Tecnológico

El proyecto está organizado bajo una **Arquitectura en Capas** limpia y desacoplada:

- **Frontend (`/frontend`)**: **Angular 19+** con Componentes Standalone, Signals, HttpClient y diseño corporativo de alta gama.
- **Backend (`/backend`)**: **Node.js + Express + TypeScript** estructurado en capas (Controllers, Services, Repositories, Schemas/Validators, Middlewares).
- **ORM & Base de Datos**: **Prisma 6.x** y **Neon PostgreSQL 17** (serverless en la nube) con transacciones con aislamiento `Serializable` para balances de inventario y consumos sin inconsistencias ni pérdidas de precisión decimal.

> **Rendimiento**: Se prescinde del uso de Docker para optimizar el uso de memoria RAM en el equipo y aprovechar la recarga rápida de `npm run dev` y `npm start`.

---

## Estructura del Repositorio

```text
Proyecto-Trazabilidad/
├── backend/            # API REST en Node.js, Express, Prisma y Neon
│   ├── .env.example    # Plantilla de variables para Neon
│   ├── .env            # Credenciales de conexión (no versionado)
│   ├── src/
│   │   ├── config/     # Conexión DB y configuración
│   │   ├── controllers/# Controladores HTTP
│   │   ├── services/   # Lógica de negocio y transacciones serializables
│   │   ├── repositories/# Acceso a datos Prisma
│   │   ├── schemas/    # Validación estricta con Zod
│   │   └── routes/     # Rutas REST (/api/*)
│   ├── prisma/         # Esquema, migraciones y seed idempotente
│   └── tests/          # Tests de validación e integración
├── frontend/           # SPA en Angular 19 (Standalone & Signals)
│   └── src/app/
│       ├── core/       # Modelos e interfaces y servicio ApiService
│       ├── shared/     # Navbar, Sidebar y componentes comunes
│       └── features/   # Dashboard, Proveedores, Insumos, Órdenes, Lotes y Trazabilidad
├── AGENTS.md           # Guía técnica completa para desarrolladores y agentes
└── agent.md            # Puntero rápido
```

---

## Inicio Rápido de Desarrollo

### 1. Configurar Neon en el Backend (`/backend`)
Crea o edita el archivo `backend/.env` con tu cadena de conexión de Neon:
```env
DATABASE_URL="postgresql://usuario:password@ep-sample-project.us-east-2.aws.neon.tech/neondb?sslmode=require"
APP_PORT=3000
```

### 2. Arrancar el Backend
```bash
cd backend
npm install
npm run db:generate    # Genera el cliente Prisma
npm run db:migrate     # Aplica las tablas en Neon
npm run db:seed        # Carga datos de prueba idempotentes (DEMO-*)
npm run dev            # Servidor Express activo en http://localhost:3000/api
```

### 3. Arrancar el Frontend (Angular)
En una terminal separada:
```bash
cd frontend
npm install
npm start              # Abre el cliente en http://localhost:4200
```

---

## Endpoints de la API REST

Base: `http://localhost:3000/api`. JSON en POST con `Content-Type: application/json`.

| Recurso | Métodos | Descripción |
| --- | --- | --- |
| `/health` | GET | Consulta real a Neon/PostgreSQL (503 si falla). |
| `/auth/login` | POST | Autenticación de usuarios y emisión de JWT (30m). |
| `/auth/refresh` | POST | Renovación de token JWT para sesiones activas. |
| `/auth/me` | GET | Consulta de usuario actual autenticado. |
| `/suppliers` | GET, POST | Directorio de proveedores de materias primas. |
| `/materials` | GET, POST | Catálogo de insumos y materias primas. |
| `/material-lots` | GET, POST | Lotes de materia prima recibidos de proveedores. |
| `/products` | GET, POST | Catálogo de productos terminados. |
| `/production-orders` | GET, POST | Órdenes de fabricación con consumo de insumos. |
| `/lots` | GET, POST | Lotes de producto terminado y control de calidad. |
| `/lots/:id/traceability` | GET | **Trazabilidad Ascendente** (Lote Terminado -> Consumos -> Materias Primas -> Proveedor). |
| `/material-lots/:id/traceability` | GET | **Trazabilidad Descendente** (Lote Insumo -> Consumos -> Órdenes -> Lotes Terminados). |
