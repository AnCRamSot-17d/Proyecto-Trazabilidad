# Implementación inicial y verificación de la API

> Documento histórico de la ejecución aislada inicial. La conexión real con Neon ya se completó; el estado y las evidencias actuales están en [CONEXION_NEON.md](CONEXION_NEON.md).

Fecha: 22 de octubre de 2026. Estado: **PARCIALMENTE FUNCIONAL**.

El backend compila y funciona contra PostgreSQL independiente. La conexión con Neon sigue bloqueada: en esta sesión no existe `backend/.env` y no hay variables `DATABASE_URL` o `DIRECT_URL` disponibles. No se verificó ni se modificó la estructura real de Neon. El esquema Prisma del equipo se conserva como referencia provisional, sin cambios.

## Servicios ejecutados

| Servicio | Dirección | Verificación |
| --- | --- | --- |
| API normal, protegida | `http://127.0.0.1:3000/api` | `/health`: 503, base desconectada, `readOnly: true` |
| API con PostgreSQL aislado | `http://127.0.0.1:3001/api` | `/health`: 200, base conectada, `readOnly: false` |
| Angular para la base aislada | `http://localhost:4201` | HTML y proxy `/api` comprobados por HTTP |

La instancia aislada contiene exclusivamente registros de prueba. Usa PostgreSQL 18.4 distribuido por `embedded-postgres`; no representa una comprobación de la versión o estructura de Neon. Las credenciales aleatorias de acceso de la instancia aislada se guardan en `backend/.env.isolated`, ignorado por Git, y no se imprimen. No existe administrador alternativo dentro del backend.

Los servicios dependen de los procesos locales iniciados durante la sesión. Los comandos siguientes permiten reiniciarlos.

## Protección de la base compartida

- Toda base ajena a `localhost`/`127.0.0.1` y cuyo nombre no comience por `biotrace_test_` se fuerza a modo de solo lectura, incluso si se configura incorrectamente `DB_READ_ONLY=false`.
- PostgreSQL recibe `default_transaction_read_only=on`; Prisma bloquea operaciones de escritura y las rutas HTTP rechazan modificaciones.
- `scripts/inspect-db.ts` consulta metadatos, restricciones, índices y cantidades dentro de `BEGIN READ ONLY`, y termina con `ROLLBACK`. No muestra registros personales ni contraseñas.
- El health check comprueba conexión y presencia de tablas/columnas del esquema Prisma. No sustituye una comparación completa de tipos, restricciones e índices.
- No se ejecutaron migraciones, seeds, `db push` ni escrituras en Neon. No se hicieron commits, pushes ni merges.
- Se retiraron los accesos directos `db:migrate` y `db:seed` del package.json; el seed anterior quedó deshabilitado para evitar recrear contraseñas incorporadas.

## Endpoints

Todas las rutas de negocio requieren un JWT válido y un usuario activo consultado en PostgreSQL. Las escrituras están disponibles únicamente en la instancia aislada. Se permiten a administradores; el rol `CALIDAD` también puede registrar controles. La administración de usuarios requiere rol administrador incluso para lecturas.

| Ruta bajo `/api` | Métodos | Persistencia / significado |
| --- | --- | --- |
| `/health` | GET | Conexión, compatibilidad de columnas y modo de protección |
| `/auth/login` | POST | Verificación de hash scrypt, JWT de 30 minutos |
| `/auth/refresh` | POST | Revalida usuario activo y renueva JWT |
| `/auth/me` | GET | Consulta el usuario actual; no devuelve contraseña |
| `/users` | GET, POST | Listar y crear usuarios con hash scrypt de contraseña |
| `/users/:id` | GET, PATCH | Consultar y modificar usuario; protege al último administrador |
| `/products` | GET, POST | Modelo `Producto` y campos reales en español |
| `/products/:id` | GET, PATCH | Consultar y actualizar catálogo |
| `/materials` | GET, POST | Modelo `MateriaPrima` |
| `/materials/:id` | GET, PATCH | Consultar y actualizar código/nombre; no cambia unidades de stock existente |
| `/clients` | GET, POST | Modelo `Cliente` |
| `/clients/:id` | GET, PATCH | Consultar y actualizar cliente |
| `/orders` | GET, POST | Pedido con detalles y subtotales calculados en Decimal |
| `/orders/:id` | GET | Pedido con cliente, detalles y órdenes |
| `/production-orders` | GET, POST | Orden de producción, validación de producto/pedido/cliente |
| `/production-orders/:id` | GET | Relaciones reales de producción |
| `/material-lots` | GET, POST | Ingresos de materia prima; creación/incremento transaccional del inventario |
| `/material-lots/:id` | GET | `id` del ingreso |
| `/consumptions` | GET, POST | Consumos y detalles; decremento condicionado de stock dentro de transacción serializable |
| `/consumptions/:id` | GET | Consumo y detalles |
| `/inventory` | GET | Inventario con materia prima e ingresos |
| `/inventory/:id` | GET | Inventario y consumo de ese lote |
| `/quality` | GET, POST | Registro de calidad con parámetros; impide aprobar parámetros incumplidos |
| `/quality/:id` | GET | Control y parámetros |
| `/lots` | GET, POST | Registros de envasado vinculados al lote de la orden; no crea una tabla de lotes antigua |
| `/lots/:id` | GET | Registro de envasado |
| `/suppliers` | GET | Nombres distintos de proveedores documentados en ingresos |
| `/lots/:id/traceability` | GET | Envasado → orden → consumos → inventario → ingresos/proveedores |
| `/material-lots/:id/traceability` | GET | Ingreso → inventario → consumos → órdenes/productos/clientes |
| `/inventory/:id/traceability` | GET | Trazabilidad hacia adelante usando UUID del inventario |
| `/production-orders/:id/traceability` | GET | Genealogía de una orden y sus registros de fabricación/calidad |

Alias compatibles: `/clientes` → `/clients`, `/pedidos` → `/orders`, `/ingresos-mp` → `/material-lots`, `/consumos` → `/consumptions`, `/inventario` → `/inventory`, `/calidad` → `/quality`.

No existe catálogo relacional independiente de proveedores ni tabla de despachos en el esquema disponible. `/shipments` devuelve 501 explícitamente. No se implementaron borrados de ingresos, consumos o registros de auditoría. Los cambios de estado de pedidos/producción y la corrección de movimientos requieren reglas acordadas con el equipo; no se habilitaron actualizaciones arbitrarias de stock.

## Verificaciones reales

- `npm run typecheck`: incluye código, scripts y pruebas.
- `npm test`: tres pruebas unitarias de validación, paginación y contraseñas.
- `npm run test:api`: nueve pruebas contabilizadas por Node, incluyendo ocho subpruebas HTTP en una base PostgreSQL nueva y aislada.
- Suite integral: login/refresh/me, catálogos, detalles, claves foráneas, duplicados, errores 400/401/403/404/409/501, persistencia consultada nuevamente mediante HTTP y Prisma, subtotales, entradas y consumos, reversión de una operación parcialmente ejecutada, concurrencia sin stock negativo, controles de calidad, límites de envasado, trazabilidad y roles.
- Se verificó por proceso independiente que el modo protegido impide POST, creación Prisma y SQL directo en la base aislada, sin cambiar la cantidad de registros.
- `npm run build` en backend y frontend.
- En Windows, la regeneración del motor Prisma falló por bloqueo de DLL mientras otra API lo utilizaba. Se separó `db:generate` de `build`; la compilación final (`tsc`) pasó con el cliente previamente generado.
- `npm run test:angular-proxy`: HTML servido por Angular, autenticación y altas/consultas a través de su proxy real. No automatiza clics en formularios.

Las pruebas integrales construyen su propia URL local aleatoria; ignoran cualquier URL externa para escrituras. El esquema SQL se deriva del Prisma actual y se aplica exclusivamente a esa nueva base. La limpieza detiene PostgreSQL y elimina únicamente el directorio generado para esa ejecución, previa verificación de su ubicación. La instancia interactiva aislada permanece activa hasta detenerla.

**Ninguna prueba anterior demuestra funcionamiento contra Neon.** Esa comprobación exige primero disponer de la configuración local y comparar el esquema real mediante consultas de lectura.

## Angular

Se conserva la aplicación existente. `ApiService` usa `/api` y proxy configurable; ya no fija un backend remoto en cada servicio. Los contratos reflejan los modelos actuales.

Formularios conectados a POST reales: productos, clientes, pedidos, ingreso de materias primas, consumo y nuevo registro de materias primas. El inventario se consulta y se actualiza por ingresos/consumos. También se consultan producción, envasado, calidad y trazabilidad. Las listas ya no se inicializan con registros de demostración ni los guardados agregan elementos a arreglos como sustituto de PostgreSQL.

Se deshabilitaron campos sin columna equivalente, incluidas especificaciones adicionales, COA, NIT, ciudad, vencimientos y prioridad/fecha de entrega. No se afirma que se conserven. Los precios del pedido sí se envían y el backend calcula subtotales. El precio/costo de ingresos se muestra como no registrado, no como un valor inventado.

La correspondencia HTTP y el build se verificaron; queda pendiente automatizar la interacción completa con cada formulario en navegador. La interfaz puede enviar escrituras únicamente en el entorno aislado; con Neon permanece protegida.

## Historial e integración

Se ejecutó `git fetch origin develop`. La referencia obtenida fue `ade76dc`; `HEAD` inicial era `859671a`. `git diff HEAD origin/develop` no mostró diferencias: el árbol de develop disponible ya estaba incorporado en main. No hubo merge ni checkout.

Se leyó `origin/front-back` (`6400db7`). Sus rutas adicionales sirvieron para reconocer módulos, pero sus servicios incluían columnas ajenas al esquema y almacenamiento alternativo en memoria. No se copiaron esos fallbacks. Se implementaron operaciones tipadas sobre los modelos actuales.

La ruptura original continúa identificada en `069c384`: cambió el esquema sin adaptar los repositorios. Las llamadas a delegados antiguos y conversiones a `any` se retiraron del backend. El esquema Prisma y las migraciones históricas del equipo no fueron reemplazados ni aplicados.

## Ejecutar nuevamente

Desde `Proyecto-Trazabilidad/backend`:

```powershell
npm ci
npm run db:generate
npm run typecheck
npm test
npm run test:api
npm run build
npm start
```

Para conectar Neon, configurar privadamente `backend/.env` usando `.env.example`: `DATABASE_URL`, `DIRECT_URL` y `JWT_SECRET` aleatorio de al menos 32 caracteres. Mantener `DB_READ_ONLY=true`. Luego:

```powershell
npm run db:inspect
npm start
```

La inspección es de lectura. No ejecutar migraciones sobre Neon. Si hay usuarios con contraseña antigua en texto plano, el login los rechaza: su actualización requiere un procedimiento independiente autorizado, que no se ha ejecutado.

Entorno independiente, desde `backend`:

```powershell
npm run dev:isolated
```

Desde `frontend`, en otra terminal:

```powershell
npm ci
npm run dev:isolated
```

Esto usa API 3001 y Angular 4201. Para el entorno normal se utiliza `npm run dev` en frontend (4200, proxy a 3000). Los puertos se mantienen separados para no confundir datos aislados con Neon. `APP_PORT` permite configurar otro puerto del backend; el proxy correspondiente debe apuntar al mismo.

Con ambos servicios aislados iniciados, desde backend:

```powershell
npm run test:angular-proxy
```

## Pendientes externos

1. Hacer accesible en esta copia el archivo local de configuración de Neon, sin publicar sus secretos.
2. Inspeccionar estructura real, relaciones y tipos; adaptar Prisma si difieren. Hasta entonces, la compatibilidad con Neon no está confirmada.
3. Verificar autenticación con hashes seguros existentes. No se cambió ninguna contraseña compartida para obtener acceso.
4. Comprobar lecturas HTTP autenticadas contra Neon. Todas las escrituras permanecen bloqueadas allí.
5. Definir necesidades adicionales sin respaldo en tablas actuales: despachos, catálogo de proveedores y campos deshabilitados.


## Archivos modificados o nuevos

- `.gitignore`
- `README.md`
- `backend/.env.example`
- `backend/package-lock.json`
- `backend/package.json`
- `backend/prisma/seed.ts`
- `backend/src/app.ts`
- `backend/src/config/db.ts`
- `backend/src/config/jwt.ts`
- `backend/src/controllers/auth.controller.ts`
- `backend/src/controllers/health.controller.ts`
- `backend/src/middlewares/auth.middleware.ts`
- `backend/src/repositories/lot.repository.ts`
- `backend/src/repositories/material-lot.repository.ts`
- `backend/src/repositories/material.repository.ts`
- `backend/src/repositories/product.repository.ts`
- `backend/src/repositories/production-order.repository.ts`
- `backend/src/repositories/supplier.repository.ts`
- `backend/src/repositories/traceability.repository.ts`
- `backend/src/routes/index.ts`
- `backend/src/schemas/validation.ts`
- `backend/src/server.ts`
- `backend/src/services/auth.service.ts`
- `backend/src/services/lot.service.ts`
- `backend/src/services/material-lot.service.ts`
- `backend/src/services/material.service.ts`
- `backend/src/services/product.service.ts`
- `backend/src/services/production-order.service.ts`
- `backend/src/services/supplier.service.ts`
- `backend/tests/api.integration.ts`
- `backend/tests/validation.test.ts`
- `frontend/package.json`
- `frontend/src/app/core/models/traceability.models.ts`
- `frontend/src/app/core/services/api.service.ts`
- `frontend/src/app/core/services/auth.service.ts`
- `frontend/src/app/features/home/home.component.ts`
- `IMPLEMENTACION_API.md`
- `backend/scripts/hash-password.ts`
- `backend/scripts/inspect-db.ts`
- `backend/scripts/isolated-server.ts`
- `backend/scripts/read-only-check.ts`
- `backend/scripts/test-cluster.ts`
- `backend/scripts/verify-angular.ts`
- `backend/src/config/env.ts`
- `backend/src/controllers/domain.controller.ts`
- `backend/src/repositories/domain.repository.ts`
- `backend/src/services/domain.service.ts`
- `backend/src/services/password.service.ts`
- `backend/tsconfig.tools.json`
- `frontend/proxy.conf.json`
- `frontend/proxy.isolated.conf.json`
