# AGENTS.md — Proyecto Trazabilidad (Rama `front-back` & `main`)

Bienvenido a la guía oficial de arquitectura, estándares de diseño y reglas de desarrollo para el repositorio **Proyecto-Trazabilidad**.

---

## 1. Visión General del Proyecto

- **Repositorio**: [AnCRamSot-17d/Proyecto-Trazabilidad](https://github.com/AnCRamSot-17d/Proyecto-Trazabilidad)
- **Dominio**: Plataforma de trazabilidad industrial y gestión de manufactura especializada exclusivamente en **Cosméticos, Dermocosmética y Farmacéutica** (*BioTrace Dermo-Pharma*).
- **Alcance Operativo**:
  1. Homologación de laboratorios y proveedores de principios activos y excipientes.
  2. Programación de órdenes de formulación y mezclas con balance estricto de consumos en reactores.
  3. Fabricación de lotes de producto terminado con liberación de control de calidad bajo normativa GMP/BPM (`PENDING`, `APPROVED`, `REJECTED`).
  4. Movimientos de inventario (`IN`, `OUT`) y despachos a bodegas o clientes.
  5. **Trazabilidad Bidireccional 360°**: Hacia adelante (forward/descendente) y hacia atrás (backward/ascendente).
- **Restricción de Dominio**: **PROHIBIDO** incluir alimentos o bebidas (responden a normativas agroalimentarias ajenas a este sistema).

---

## 2. Sistema Visual Oficial (Titanio & Cian Glacial)

Para mantener una apariencia moderna, industrial y sofisticada, se establecen reglas visuales estrictas:

### Paleta de Colores Obligatoria
- **Titanio Profundo (Base Primaria)**:
  - `--titanium-950: #090d16` (Fondo ultracontraste)
  - `--titanium-900: #0f172a` (Titanio principal para tarjetas, botones primarios y encabezados)
  - `--titanium-800: #1e293b` (Superficies secundarias y hover)
  - `--titanium-700: #334155` / `--titanium-600: #475569` (Textos secundarios y bordes técnicos)
  - `--titanium-100: #f1f5f9` / `--titanium-50: #f8fafc` (Fondos claros y áreas de lectura)
- **Cian Glacial (Acentos & Acción)**:
  - `--cyan-primary: #0891b2` (Acento institucional de precisión)
  - `--cyan-vibrant: #06b6d4` (Brillo, indicadores de estado, luces y focus)
  - `--cyan-light: #ecfeff` (Píldoras y badges activos)
  - `--cyan-glow: rgba(6, 182, 212, 0.22)` (Efectos de resplandor focal)

> ⚠️ **REGLA ESTRICTA DE DISEÑO**:
> **NO utilizar color rojo ni amarillo**. Se consideran visualmente obsoletos. Para estados de error, rechazo o advertencia, se utiliza titanio oscuro, gris pizarra técnico o acentos en cian glacial con bordes y tipografía sobria.

---

## 3. Estándar de Maquetación: CSS Grid Responsive

Todo el diseño debe emplear **CSS Grid** como estándar de diagramación para garantizar adaptabilidad universal en cualquier dispositivo (móviles, tablets, laptops y pantallas ultra anchas):

- **Grid Fluido Auto-Ajustable**: `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));` para tarjetas y módulos.
- **Grids de 2 Columnas**: `grid-template-columns: 1fr 1fr;` en escritorio que se apilan a `1fr` en dispositivos móviles (`@media (max-width: 840px)`).
- **Proporción y Equilibrio**: Ninguna tarjeta debe tener espacios vacíos desmedidos. Ambas columnas deben mantener simetría visual y altura a la medida.

---

## 4. Stack Tecnológico Oficial

| Capa | Tecnología | Características Clave |
| --- | --- | --- |
| **Frontend** | **Angular 19+** | Standalone Components, Signals reactivos, HttpClient, CSS Grid y diseño corporativo de alta gama. |
| **Backend** | **Node.js + Express** | Servidor REST con Arquitectura en Capas estricta, TypeScript y ESM (`"type": "module"`). |
| **Seguridad** | **JWT (JSON Web Token)** | Tokens firmados con validez de **30 minutos** y auto-renovación en actividad. |
| **ORM** | **Prisma 6.x** | Modelado relacional, cliente tipado y transacciones con aislamiento `Serializable`. |
| **Base de Datos** | **Neon (PostgreSQL 17)** | PostgreSQL serverless en la nube: sin consumo de RAM local y conexión SSL. |
| **Validación** | **Zod** | Esquemas estrictos de validación de payloads en backend. |

---

## 5. Arquitectura de Autenticación & Control de Inactividad (30 Minutos)

1. **Firma y Emisión**: Al autenticarse en `POST /api/auth/login`, el backend firma un JWT con `expiresIn: '30m'`.
2. **Monitor de Inactividad en Cliente**:
   - [AuthService](file:///c:/Users/masterdent-soft/Downloads/Proyecto-Trazabilidad/frontend/src/app/core/services/auth.service.ts) corre un listener pasivo (`mousemove`, `keydown`, `click`, `scroll`, `touchstart`) fuera de la zona de Angular.
   - Muestra un temporizador regresivo reactivo (`auth.timeRemainingFormatted()`).
   - Cada interacción del usuario reinicia el contador a `30:00`.
   - Si transcurren **30 minutos continuos sin interacción**, la sesión se cierra automáticamente (`logout()`), eliminando el token de `localStorage` y redirigiendo al usuario al login con aviso informativo.
3. **Renovación Activa (`POST /api/auth/refresh`)**: Si el usuario se mantiene interactuando, el token se renueva en segundo plano para no interrumpir su trabajo.
4. **Interceptor HTTP**: [auth.interceptor.ts](file:///c:/Users/masterdent-soft/Downloads/Proyecto-Trazabilidad/frontend/src/app/core/interceptors/auth.interceptor.ts) inyecta `Authorization: Bearer <token>` y captura códigos 401.
5. **Guard Funcional**: [auth.guard.ts](file:///c:/Users/masterdent-soft/Downloads/Proyecto-Trazabilidad/frontend/src/app/core/guards/auth.guard.ts) protege rutas internas.
6. **Persistencia en Base de Datos (Modelo `Usuario`)**:
   - Modelo Prisma `Usuario` mapeado a la tabla `usuarios` en PostgreSQL/Neon.
   - Usuario de acceso oficial: `admin@biotrace.com` / `BioTrace2026!` (Rol `ADMINISTRADOR`).
   - Se eliminaron por completo los perfiles ficticios/anteriores (`director@biotrace.com`).

---

## 6. Estructura de Directorios Desacoplada

Los proyectos se encuentran separados para garantizar alta cohesión, seguridad y mejores prácticas de arquitectura web:

### A. Repositorio Backend (`Proyecto-Trazabilidad`)
```text
Proyecto-Trazabilidad/
├── prisma/
│   ├── schema.prisma            # Modelado PostgreSQL / Neon
│   └── seed.ts                  # Datos de prueba iniciales
├── src/
│   ├── config/                  # DB connection y config JWT (30m)
│   ├── types/                   # Tipos TypeScript y HttpError
│   ├── schemas/                 # Esquemas Zod (auth.schema.ts, etc.)
│   ├── services/                # Lógica de negocio (auth.service.ts, etc.)
│   ├── controllers/             # Manejadores HTTP (auth.controller.ts, etc.)
│   ├── middlewares/             # auth.middleware.ts, error.middleware.ts
│   ├── routes/                  # Enrutador modular Express
│   ├── app.ts                   # Instancia Express y CORS
│   └── server.ts                # Arranque del servidor
├── scripts/                     # Scripts de introspección y utilidades
├── tests/                       # Pruebas unitarias e integración aislada
├── reports/                     # Reportes de auditoría y contratos
├── package.json                 # Scripts de backend (npm run dev, test, etc.)
├── tsconfig.json                # TypeScript estricto
├── .env.example                 # Plantilla de variables Neon
└── .gitignore                   # Reglas de exclusión para backend
```

### B. Proyecto Frontend Independiente (`front-biotrace`)
```text
front-biotrace/
├── public/                      # Recursos estáticos públicos (/images)
├── src/
│   ├── index.html               # Fuentes Google (Inter, Plus Jakarta Sans)
│   ├── styles.css               # Tokens globales y utilidades CSS Grid
│   ├── main.ts                  # Bootstrap standalone
│   └── app/
│       ├── app.component.ts     # Componente raíz
│       ├── app.routes.ts        # Enrutador con authGuard
│       ├── app.config.ts        # HttpClient con authInterceptor
│       ├── core/                # Guards, interceptores, modelos y servicios API
│       ├── shared/              # Navbar con temporizador regresivo reactivo
│       └── features/            # Módulos auth (login) y home (dashboard/trazabilidad)
├── angular.json                 # Configuración de build Angular CLI
├── proxy.conf.json              # Proxy inverso de desarrollo (/api -> http://127.0.0.1:3000)
└── package.json                 # Dependencias y scripts de Angular 19
```

---

## 7. Contratos de la API REST (`/api/*`)

| Endpoint | Método | Capa Service | Descripción |
| --- | --- | --- | --- |
| `/api/health` | `GET` | `HealthController` | Verifica conexión real a Neon/PostgreSQL (`200` o `503`). |
| `/api/auth/login` | `POST` | `AuthService` | Autenticación con firma de token **JWT (30 minutos)**. |
| `/api/auth/refresh` | `POST` | `AuthService` | Renovación de token JWT de 30m para usuarios activos. |
| `/api/auth/me` | `GET` | `AuthService` | Consulta datos del usuario autenticado actual. |
| `/api/suppliers` | `GET`, `POST` | `SupplierService` | Listar / Registrar proveedores homologados. |
| `/api/materials` | `GET`, `POST` | `MaterialService` | Listar / Registrar materias primas y principios activos. |
| `/api/material-lots` | `GET`, `POST` | `MaterialLotService` | Listar / Registrar lotes de insumos recibidos. |
| `/api/products` | `GET`, `POST` | `ProductService` | Listar / Registrar catálogo de productos finales. |
| `/api/production-orders` | `GET`, `POST` | `ProductionOrderService` | Listar / Crear órdenes con balance de consumos. |
| `/api/lots` | `GET`, `POST` | `LotService` | Listar / Crear lotes de producto terminado. |
| `/api/lots/:id/traceability` | `GET` | `TraceabilityService` | **Trazabilidad Ascendente**: Lote terminado -> Consumos -> Proveedor. |
| `/api/material-lots/:id/traceability` | `GET` | `TraceabilityService` | **Trazabilidad Descendente**: Insumo -> Órdenes -> Clientes. |

---

## 8. Comandos de Ejecución

Para iniciar el sistema de forma local:

### Terminal 1 — Backend (`Proyecto-Trazabilidad`):
```bash
npm run dev
# Servidor REST activo en http://localhost:3000/api
```

### Terminal 2 — Frontend (`front-biotrace`):
```bash
cd ../front-biotrace
npm run dev
# Aplicación web activa en http://localhost:4200 (con proxy hacia la API)
```

---

## 9. Política Estricta de Git y GitHub

> ⚠️ **REGLA ABSOLUTA DE CONTROL DE VERSIONES**:
> - **PROHIBIDO realizar `git commit` o `git push` de forma automática o por iniciativa propia**.
> - Todo trabajo se realiza, prueba y compila localmente.
> - Solo se confirmarán y enviarán cambios al repositorio remoto (`origin/front-back` o `origin/main`) **cuando el usuario lo solicite expresamente en el chat**.
> - **Mensajes de Commit Humanos y Básicos**: Las descripciones deben ser breves, sencillas, en español y con redacción natural (ej. `organizar menu lateral`, `ajustar login`, `agregar modulo materias primas`). Quedan prohibidos los mensajes largos, técnicos en exceso o que parezcan generados por IA.


