# BioTrace Dermo-Pharma — Documentación Técnica del Backend

Plataforma de trazabilidad industrial y gestión de manufactura especializada en **Cosméticos, Dermocosmética y Farmacéutica** (*BioTrace Dermo-Pharma*). Este repositorio alberga exclusivamente la API REST del backend, construida con arquitectura en capas desacoplada sobre **Node.js, Express, TypeScript, Prisma ORM (6.x) y PostgreSQL (Neon)**.

---

## 1. Arquitectura por Capas

El backend implementa una separación estricta de responsabilidades en capas para garantizar mantenibilidad, tipado estricto y seguridad:

```text
src/
├── config/         # Configuración del entorno, cliente Prisma extendido y ciclo JWT
├── controllers/    # Manejo de peticiones HTTP, extracción de parámetros y respuestas
├── middlewares/    # Interceptores de autenticación JWT y manejador global de errores
├── repositories/   # Capa de persistencia y consultas tipadas con Prisma Client
├── routes/         # Enrutadores modulares de Express, definición de rutas y alias
├── schemas/        # Validación en tiempo de ejecución con esquemas Zod
├── services/       # Reglas de negocio, balance de masas, algoritmos de trazabilidad y criptografía
├── types/          # Definición de tipos TypeScript compartidos y clases de error (HttpError)
├── app.ts          # Configuración de Express, middlewares globales (CORS, JSON) y prefijo /api
└── server.ts       # Arranque del servidor HTTP y listeners de apagado graceful
```

### Funciones por Capa
1. **Rutas (`src/routes/`)**:
   - Monta los endpoints bajo el prefijo `/api`.
   - Define endpoints públicos (`/api/health`, `/api/auth/login`, `/api/auth/read-only-session`) y endpoints protegidos por token.
   - Provee soporte para alias en español (`/clientes`, `/pedidos`, `/ingresos-mp`, `/consumos`, `/inventario`, `/calidad`).
2. **Controladores (`src/controllers/`)**:
   - Extraen y validan parámetros (`req.params`, `req.query`, `req.body`).
   - Delegan el procesamiento a los servicios y devuelven respuestas HTTP estandarizadas (200, 201, 400, 401, 403, 404, 409, 501, 503).
3. **Servicios (`src/services/`)**:
   - Encapsulan la lógica de negocio pura: cálculo de subtotales con precisión decimal, validaciones de stocks, trazabilidad hacia adelante y hacia atrás.
   - Manejo de hashes y verificación de contraseñas mediante `scrypt` con sal única (`password.service.ts`).
4. **Repositorios (`src/repositories/`)**:
   - Abstracción de acceso a datos utilizando Prisma Client.
   - Ejecución de transacciones con aislamiento y proyecciones relacionales.
5. **Esquemas (`src/schemas/`)**:
   - Validación estricta con **Zod** (`validation.ts` y `auth.schema.ts`).
   - Rechazo estricto de campos adicionales no reconocidos (`.strict()`), verificación de formatos UUID, números positivos y límites de paginación.
6. **Middlewares (`src/middlewares/`)**:
   - `auth.middleware.ts`: Verifica tokens JWT firmados, extrae el contexto del usuario (`id`, `role`) e inyecta la identidad en la petición.
   - `error.middleware.ts`: Captura errores de Zod, Prisma (`P2002`, `P2025`, etc.) y `HttpError`, entregando respuestas JSON consistentes.

---

## 2. Variables de Entorno

La configuración se gestiona mediante variables de entorno cargadas con `dotenv`. En la raíz se dispone de `.env.example` como plantilla oficial.

| Variable | Descripción | Obligatoria | Valor por Defecto / Ejemplo Seguro |
| :--- | :--- | :---: | :--- |
| `DATABASE_URL` | Cadena de conexión PostgreSQL con pooling (PgBouncer de Neon). Utilizada por la aplicación en tiempo de ejecución. | **Sí** | `postgresql://usuario:***@ep-pooler.region.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | Cadena de conexión directa a la instancia de Neon (puerto 5432 sin pooler). Utilizada por Prisma CLI para introspección y migraciones. | **Sí** | `postgresql://usuario:***@ep.region.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | Clave criptográfica para firma y validación de tokens JWT (longitud mínima recomendada: 32 caracteres). | No (Autogenera) | Si no se provee o es corta, genera un secreto aleatorio de 48 bytes en memoria. |
| `APP_PORT` / `PORT` | Puerto TCP en el que escucha el servidor Express. | No | `3000` |
| `APP_HOST` | Interfaz de red / host de enlace del servidor. | No | `127.0.0.1` |
| `CORS_ORIGIN` | Origen web autorizado para peticiones CORS (aplicación frontend). | No | `http://localhost:4200` |
| `DB_READ_ONLY` | Flag que controla el modo de solo lectura. En `true` bloquea mutaciones. | No | `true` |
| `READ_ONLY_ACCESS_KEY` | Clave para solicitar sesiones de consulta local (`POST /api/auth/read-only-session`) desde loopback. | No | `undefined` |

---

## 3. Conexión a Neon PostgreSQL

### Pooler vs Conexión Directa
Neon es una base de datos serverless en la nube con separación de cómputo y almacenamiento:
- **`DATABASE_URL` (Host `-pooler`)**: Conecta a través de PgBouncer. Optimiza conexiones efímeras y concurrentes de la API Express.
- **`DIRECT_URL` (Host sin `-pooler`)**: Conecta directamente al nodo de cómputo de PostgreSQL. Requerida para comandos de Prisma CLI (`migrate diff`, migraciones DDL) que no admiten conexiones pooled.

### Estado de Sincronización del Esquema
- **Resultado del comando `npx prisma migrate diff`**:
  ```sql
  -- This is an empty migration.
  ```
- **Diagnóstico**: Las **21 tablas**, 135 columnas, relaciones e índices declarados en `prisma/schema.prisma` existen y coinciden **al 100%** con la base de datos real en Neon. No hay diferencias estructurales ni pendientes de sincronización DDL.
- **Historial de migraciones**: Existe el registro `20261020003201_init_modulo_materias_primas` en `prisma/migrations`. Aunque en `prisma migrate status` figura pendiente de registrar en `_prisma_migrations`, la base ya posee todas las tablas creadas.

---

## 4. Modelo de Datos (21 Modelos)

Los 21 modelos de Prisma se organizan en 5 dominios funcionales industriales:

### A. Comercial y Clientes
1. **`Cliente` (`clientes`)**: Empresas y laboratorios clientes, información de contacto y direcciones.
2. **`Pedido` (`pedidos`)**: Órdenes de compra comerciales asociadas a clientes, con estado y fecha.
3. **`DetallePedido` (`detalle_pedidos`)**: Ítems de productos solicitados en un pedido con cálculo de subtotales.

### B. Catálogo e Insumos
4. **`Producto` (`productos`)**: Catálogo maestro de productos terminados (cremas, sueros, geles) y presentaciones.
5. **`MateriaPrima` (`materia_prima`)**: Catálogo maestro de principios activos y excipientes con código y unidad de medida.
6. **`ProductoMateriaPrima` (`producto_materia_prima`)**: Fórmula cuali-cuantitativa que define la proporción de cada insumo en un producto.

### C. Inventario y Recepción de Lotes
7. **`InventarioMateriaPrima` (`inventario_materia_prima`)**: Existencias físicas por lote interno y balance de stock disponible.
8. **`IngresoMateriaPrima` (`ingreso_materia_prima`)**: Recepción de lotes de insumos, proveedor, lote de origen y certificado de análisis.
9. **`HistorialIngreso` (`historial_ingresos`)**: Registro de auditoría de modificaciones y trazabilidad de ingresos de materia prima.

### D. Producción, Reactores y Acondicionamiento
10. **`OrdenProduccion` (`orden_produccion`)**: Programación de manufactura asociada a un producto y cantidad programada.
11. **`ConsumoMateriaPrima` (`consumo_materia_prima`)**: Cabecera de consumos y pesaje en reactores para una orden de producción.
12. **`DetalleConsumoMateriaPrima` (`detalle_consumo_materia_prima`)**: Cantidades específicas descontadas de cada lote de inventario.
13. **`RegistroDispensacion` (`registros_dispensacion`)**: Verificación y pesaje previo de materias primas antes de mezcla.
14. **`RegistroFabricacion` (`registros_fabricacion`)**: Registro del proceso de mezclado y reactor asignado.
15. **`PasoFabricacion` (`pasos_fabricacion`)**: Parámetros operativos por etapa (temperatura, agitación, tiempo en minutos).
16. **`RegistroEnvasado` (`registros_envasado`)**: Registro de llenado, lote asignado y unidades envasadas.
17. **`RegistroAcondicionamientoEtiquetado` (`registros_acondicionamiento_etiquetado`)**: Conteo de unidades etiquetadas y operador.
18. **`RegistroAcondicionamientoLoteo` (`registros_acondicionamiento_loteo`)**: Impresión de lote final y fecha de caducidad.

### E. Calidad, Usuarios y Seguridad
19. **`RegistroControlCalidad` (`registros_control_calidad`)**: Dictamen analítico bajo normativa GMP (`PENDING`, `APPROVED`, `REJECTED`).
20. **`ParametroCalidad` (`parametros_calidad`)**: Ensayos físico-químicos y microbiológicos (pH, viscosidad, densidad, aspecto) con valores esperados y obtenidos.
21. **`Usuario` (`usuarios`)**: Cuentas del sistema con rol (`ADMINISTRADOR`, `CALIDAD`, `OPERARIO`), contraseña con hash scrypt y estado de actividad.

---

## 5. Catálogo de Endpoints REST (`/api/*`)

Todas las rutas excepto `/api/health`, `/api/auth/login` y `/api/auth/read-only-session` requieren encabezado HTTP `Authorization: Bearer <token>`.

| Método | Ruta | Autenticación / Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Pública | Verifica conectividad real con PostgreSQL y compatibilidad de columnas. |
| `POST` | `/api/auth/login` | Pública | Autenticación institucional con email y contraseña. Retorna JWT (30m). |
| `POST` | `/api/auth/refresh` | Bearer Token | Renueva el token JWT para usuarios con sesión activa. |
| `GET` | `/api/auth/me` | Bearer Token | Retorna los datos del usuario autenticado (sin contraseñas). |
| `POST` | `/api/auth/read-only-session` | Pública (solo Loopback) | Genera sesión de consulta temporal `LECTOR_LOCAL` cuando la base está en modo protegido. |
| `GET` | `/api/users` | Bearer (ADMIN o LECTOR_LOCAL) | Listado paginado de usuarios. |
| `GET` | `/api/users/:id` | Bearer (ADMIN o LECTOR_LOCAL) | Consulta detallada de un usuario por UUID. |
| `POST` | `/api/users` | Bearer (ADMIN, escritura) | Registro de nuevo usuario con contraseña cifrada scrypt. |
| `PATCH` | `/api/users/:id` | Bearer (ADMIN, escritura) | Actualización de usuario (protege al último administrador activo). |
| `GET` | `/api/products` | Bearer | Listado de productos terminados. |
| `GET` | `/api/products/:id` | Bearer | Detalle de producto por UUID. |
| `POST` | `/api/products` | Bearer (ADMIN, escritura) | Alta de producto en catálogo. |
| `PATCH` | `/api/products/:id` | Bearer (ADMIN, escritura) | Actualización de datos de producto. |
| `GET` | `/api/materials` | Bearer | Listado de materias primas y principios activos. |
| `GET` | `/api/materials/:id` | Bearer | Detalle de materia prima por UUID. |
| `POST` | `/api/materials` | Bearer (ADMIN, escritura) | Registro de nueva materia prima. |
| `PATCH` | `/api/materials/:id` | Bearer (ADMIN, escritura) | Actualización de materia prima (nombre/código). |
| `GET` | `/api/clients` *(alias `/clientes`)* | Bearer | Listado de clientes y laboratorios. |
| `GET` | `/api/clients/:id` *(alias `/clientes/:id`)* | Bearer | Detalle de cliente por UUID. |
| `POST` | `/api/clients` *(alias `/clientes`)* | Bearer (ADMIN, escritura) | Registro de nuevo cliente. |
| `PATCH` | `/api/clients/:id` *(alias `/clientes/:id`)* | Bearer (ADMIN, escritura) | Modificación de información de cliente. |
| `GET` | `/api/orders` *(alias `/pedidos`)* | Bearer | Listado de pedidos comerciales. |
| `GET` | `/api/orders/:id` *(alias `/pedidos/:id`)* | Bearer | Detalle de pedido con ítems y subtotales calculados. |
| `POST` | `/api/orders` *(alias `/pedidos`)* | Bearer (ADMIN, escritura) | Creación de pedido con ítems y subtotales en Decimal. |
| `GET` | `/api/production-orders` | Bearer | Listado de órdenes de producción. |
| `GET` | `/api/production-orders/:id` | Bearer | Detalle de orden de producción y sus relaciones. |
| `POST` | `/api/production-orders` | Bearer (ADMIN, escritura) | Programación de orden de manufactura. |
| `GET` | `/api/material-lots` *(alias `/ingresos-mp`)* | Bearer | Listado de recepciones de lotes de materia prima. |
| `GET` | `/api/material-lots/:id` *(alias `/ingresos-mp/:id`)* | Bearer | Detalle de lote de insumo recibido. |
| `POST` | `/api/material-lots` *(alias `/ingresos-mp`)* | Bearer (ADMIN, escritura) | Recepción de insumo con incremento automático de inventario. |
| `GET` | `/api/consumptions` *(alias `/consumos`)* | Bearer | Listado de consumos de materias primas en producción. |
| `GET` | `/api/consumptions/:id` *(alias `/consumos/:id`)* | Bearer | Detalle de consumo y materias primas descontadas. |
| `POST` | `/api/consumptions` *(alias `/consumos`)* | Bearer (ADMIN, escritura) | Registro de consumos con descuento transaccional de stock. |
| `GET` | `/api/inventory` *(alias `/inventario`)* | Bearer | Saldos actuales de inventario por lote interno. |
| `GET` | `/api/inventory/:id` *(alias `/inventario/:id`)* | Bearer | Detalle de existencia de un lote de inventario. |
| `GET` | `/api/quality` *(alias `/calidad`)* | Bearer | Listado de liberaciones de control de calidad. |
| `GET` | `/api/quality/:id` *(alias `/calidad/:id`)* | Bearer | Detalle de dictamen de calidad y parámetros analizados. |
| `POST` | `/api/quality` *(alias `/calidad`)* | Bearer (ADMIN o CALIDAD, escritura) | Registro de control de calidad bajo normativa GMP. |
| `GET` | `/api/lots` | Bearer | Listado de lotes de producto envasado. |
| `GET` | `/api/lots/:id` | Bearer | Detalle de lote envasado. |
| `POST` | `/api/lots` | Bearer (ADMIN, escritura) | Registro de envasado de producto terminado. |
| `GET` | `/api/suppliers` | Bearer | Directorio de proveedores únicos obtenido de ingresos. |
| `GET` | `/api/lots/:id/traceability` | Bearer | **Trazabilidad Ascendente**: Lote terminado → Envasado → Orden → Consumos → Inventario → Ingreso → Proveedor. |
| `GET` | `/api/material-lots/:id/traceability` | Bearer | **Trazabilidad Descendente**: Lote de materia prima → Inventario → Consumos → Órdenes → Productos → Clientes. |
| `GET` | `/api/inventory/:id/traceability` | Bearer | Trazabilidad hacia adelante a partir del UUID de inventario. |
| `GET` | `/api/production-orders/:id/traceability` | Bearer | Trazabilidad de orden de producción (mezcla, calidad y envasado). |
| `ALL` | `/api/shipments` | Cualquiera | Retorna `501 Not Implemented` (*el esquema actual no modela despachos*). |

---

## 6. Modo de Protección (`DB_READ_ONLY`)

Para evitar modificaciones accidentales o corrupción de datos en entornos de demostración y bases de datos compartidas en la nube:

1. **Aislamiento Estricto**:
   - En `src/config/env.ts`, toda base de datos cuya URL no corresponda a `127.0.0.1` o `localhost` y cuyo nombre no comience por `/biotrace_test_` **se fuerza a modo de solo lectura (`readOnly = true`)**, incluso si se intenta configurar `DB_READ_ONLY=false` por error.
2. **PostgreSQL Read-Only**:
   - La cadena de conexión inyecta `default_transaction_read_only=on`.
3. **Bloqueo a Nivel Prisma**:
   - `src/config/db.ts` extiende Prisma Client mediante `$extends` e intercepta las operaciones de escritura (`create`, `update`, `delete`, `upsert`, etc.), lanzando un error HTTP `403 Forbidden` (`Base protegida: servidor en modo de solo lectura`).
4. **Bloqueo a Nivel Middleware HTTP**:
   - En `src/routes/index.ts`, cualquier petición HTTP mutadora (`POST`, `PATCH`, `DELETE`) es rechazada con código `403` antes de ejecutar lógica de negocio o validación de esquemas.

---

## 7. Comandos de Desarrollo y Verificación

Todos los scripts se ejecutan desde la raíz del proyecto:

```bash
# Instalación limpia y exacta de dependencias según package-lock.json
npm ci

# Generación tipada del cliente de Prisma (versión 6.19.3)
npm run db:generate

# Validación sintáctica del esquema de Prisma
npx prisma validate

# Verificación de esquema contra Neon (solo lectura)
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script

# Verificación estricta de tipos TypeScript (código fuente + scripts)
npm run typecheck

# Servidor de desarrollo con recarga en caliente (tsx watch)
npm run dev

# Compilación de TypeScript a JavaScript estándar en dist/
npm run build

# Arranque del build en producción
npm start

# Pruebas unitarias de esquemas, paginación y contraseñas (node:test)
npm test

# Pruebas de integración HTTP completa contra PostgreSQL local aislado
npm run test:api

# Introspección y auditoría de metadatos de Neon (solo lectura)
npm run db:inspect
```
