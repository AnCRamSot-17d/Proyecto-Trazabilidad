# Conexión real con Neon y verificación

Fecha: 22 de octubre de 2026.

**Estado: FUNCIONANDO EN SOLO LECTURA.** API: `http://127.0.0.1:3000/api`. Angular: `http://localhost:4200`.

## Base real inspeccionada

La conexión autenticada con Neon funciona. El servidor informa PostgreSQL **18.6**, no la versión 17 indicada en la documentación anterior. Se inspeccionaron 21 tablas, 135 columnas, claves, restricciones, relaciones e índices. Las **21 tablas están vacías**, incluida `usuarios`.

La introspección se guardó como archivo local, sin aplicar SQL. La comparación entre ese archivo y `prisma/schema.prisma` produjo `This is an empty migration`: no hay diferencias estructurales que requieran cambiar Prisma o PostgreSQL. Las diferencias textuales corresponden al orden de campos y a valores por defecto equivalentes de Prisma. No se modificó el esquema Prisma del equipo.

Evidencias sin credenciales:

- [Metadatos y cantidades](backend/reports/neon-inspection.json).
- [Representación introspectada](backend/reports/neon-introspected.prisma).
- [Resultados HTTP directos](backend/reports/neon-http.json).
- [Resultados HTTP por Angular](backend/reports/angular-neon-http.json).
- [Prueba de navegador](backend/reports/angular-neon-browser.json).
- [Captura de productos en Angular](backend/reports/angular-neon-products.png).

## Resultados HTTP

Se implementan **64 operaciones método + URL**, contando alias: **46 principales y 18 alias**. La respuesta explícita 501 de `/api/shipments` no se cuenta como una funcionalidad implementada.

Se probaron las 64 operaciones tanto directamente en la API como mediante el proxy de Angular:

| Resultado por ejecución | Cantidad | Interpretación |
| --- | --- | --- |
| 200 | 22 | Health, sesión de consulta/renovación, perfil y listados |
| 404 esperado | 21 | Detalles y trazabilidad para UUID sin registro |
| 403 esperado | 20 | Todas las creaciones y actualizaciones de negocio bloqueadas antes de acceder a Prisma |
| 401 esperado | 1 | Login institucional sin usuario existente |

Las respuestas 404 y 403 son comprobaciones satisfactorias de sus contratos, **no consultas que hayan devuelto datos**. Los listados devuelven `[]` desde PostgreSQL real. No se pueden comprobar en Neon árboles de trazabilidad con registros existentes porque no hay datos. Esa funcionalidad sí se comprobó con relaciones reales en PostgreSQL aislado.

| Ruta principal bajo `/api` | Métodos |
| --- | --- |
| `/health` | GET |
| `/auth/login` | POST |
| `/auth/read-only-session` | POST |
| `/auth/refresh` | POST |
| `/auth/me` | GET |
| `/users`, `/products`, `/materials`, `/clients` | GET, POST |
| `/users/:id`, `/products/:id`, `/materials/:id`, `/clients/:id` | GET, PATCH |
| `/orders`, `/production-orders`, `/material-lots`, `/consumptions`, `/quality`, `/lots` | GET, POST |
| Los seis recursos anteriores con `/:id` | GET |
| `/inventory`, `/inventory/:id`, `/suppliers` | GET |
| `/lots/:id/traceability` | GET |
| `/material-lots/:id/traceability` | GET |
| `/inventory/:id/traceability` | GET |
| `/production-orders/:id/traceability` | GET |

Alias: `clientes`, `pedidos`, `ingresos-mp`, `consumos`, `inventario`, `calidad`. El inventario se modifica exclusivamente mediante ingresos y consumos en el entorno aislado, no mediante actualizaciones arbitrarias de saldo.

## Autenticación sin crear usuarios en Neon

Como `usuarios` está vacía y no hay autorización para insertar, el login institucional no puede autenticar usuarios todavía. No se creó un administrador ni se ejecutó seed.

Se agregó un acceso **explícito de consulta local**:

1. Abrir Angular en `http://localhost:4200`.
2. Marcar **Consulta local de solo lectura**.
3. Leer privadamente `READ_ONLY_ACCESS_KEY` desde `backend/.env` y usarlo en **Clave local de consulta**. El correo no se requiere en este modo.

La clave es aleatoria, no está incorporada en el código y no se muestra en informes. La sesión usa rol `LECTOR_LOCAL`, no representa una cuenta persistida y no otorga administración ni escritura. El endpoint que emite esta sesión solo acepta conexiones de loopback, requiere modo protegido y conserva la duración JWT de 30 minutos. En la API aislada con escrituras habilitadas no se ofrece este acceso.

El login institucional, contraseñas scrypt y verificación de usuarios activos se conservan para cuentas reales cuando existan. No hay administrador alternativo ni acceso por contraseña en texto plano.

## Protección comprobada

- `backend/.env` contiene las conexiones entregadas y secretos aleatorios locales. Git lo ignora.
- Se conservó `backend/.env.isolated`; el arranque aislado ahora reutiliza sus credenciales en vez de reemplazarlas.
- Toda conexión remota se fuerza a solo lectura, independientemente de un `DB_READ_ONLY=false` accidental.
- La conexión Prisma configura PostgreSQL con `default_transaction_read_only=on`; la inspección usa además `BEGIN READ ONLY` y termina con `ROLLBACK`.
- Las rutas de negocio rechazan las escrituras antes de validar o persistir sus payloads. La extensión Prisma también bloquea operaciones mutadoras.
- Se verificaron 20 rechazos HTTP con payloads vacíos: no se enviaron sentencias SQL de escritura a Neon para probar la protección.
- En PostgreSQL aislado sí se comprobó que también se rechazan operaciones Prisma y SQL directo al habilitar el modo protegido.
- Las cantidades antes y después de las comprobaciones de Neon coinciden: cero registros en cada tabla.

**No se creó, modificó o eliminó ninguna tabla, columna, relación ni registro de Neon. No se ejecutaron migraciones, seeds o db push contra esa base. No se hicieron commits, merges ni pushes.**

La primera lectura del adjunto reprodujo su contenido en la salida de la herramienta; no se repitieron posteriormente las cadenas. Un escaneo de los archivos versionables del repositorio encontró cero coincidencias con las conexiones, contraseña o secretos locales. Los reportes no contienen sus valores.

## Angular verificado en navegador

Chrome ejecutó el flujo de acceso local y recibió diez listados de Neon con HTTP 200: productos, materias primas, clientes, ingresos, inventario, pedidos, producción, consumos, envasado y calidad.

Se comprobó la tabla de productos sin registros y los botones de guardado de productos y materias primas deshabilitados. No hubo errores JavaScript de página ni solicitudes de escritura de negocio durante esa prueba. El diseño existente se conserva, con la opción adicional de consulta en el login.

La aplicación está conectada a Neon, pero **no hay filas que mostrar**. No se añadieron registros de demostración para hacer parecer que la base tiene información.

## Pruebas y compilación

| Verificación | Resultado |
| --- | --- |
| Generación del cliente Prisma 6.19.3 | Aprobada |
| TypeScript de código, scripts y pruebas | Aprobado |
| Pruebas unitarias | 3 aprobadas |
| Suite HTTP con PostgreSQL aislado | 8 subpruebas aprobadas; Node contabiliza 9 incluyendo el contenedor |
| HTTP real contra Neon | 64 contratos comprobados |
| HTTP a través del proxy Angular–Neon | 64 contratos comprobados |
| Chrome con Angular–Neon | Acceso, listados y formularios bloqueados comprobados |
| Proxy Angular–PostgreSQL aislado | Creación y consulta persistida aprobadas |
| Build backend y frontend | Aprobados |

Se corrigió además el cierre de conexiones HTTP de las pruebas aisladas para que el proceso termine tras aprobar la suite.

El entorno aislado permanece separado: API `http://127.0.0.1:3001/api`, Angular `http://localhost:4201`. Sus pruebas construyen su propia conexión local, sin reutilizar Neon ni una variable TEST_DATABASE_URL externa. Las escrituras de negocio se probaron exclusivamente allí.

## Archivos de esta etapa

- `backend/.env`: creado, privado e ignorado por Git.
- `backend/src/config/env.ts`: clave local de consulta; se conservan las protecciones de conexión.
- `backend/src/services/auth.service.ts`: sesión JWT limitada a lectura, sin usuario persistido alternativo.
- `backend/src/controllers/auth.controller.ts`, `backend/src/routes/auth.routes.ts`: entrada local validada y restringida a loopback.
- `backend/src/routes/index.ts`: permisos de consulta y catálogo verificable de operaciones HTTP.
- `backend/scripts/inspect-db.ts`: introspección, versión, restricciones, índices y cantidades en solo lectura.
- `backend/scripts/verify-neon.ts`: comprobación HTTP y comparación de cantidades antes/después.
- `backend/scripts/verify-angular-neon-browser.ts`: prueba Chrome sin registrar claves ni tokens.
- `backend/scripts/read-only-check.ts`, `backend/tests/api.integration.ts`: pruebas de sesión limitada y cierre de conexiones.
- `backend/scripts/isolated-server.ts`: conserva el archivo de credenciales existente.
- `backend/package.json`, `backend/package-lock.json`: comandos de verificación y dependencia de pruebas de navegador.
- `frontend/src/app/core/services/auth.service.ts`, `frontend/src/app/features/auth/login.component.ts`: acceso local de consulta integrado al flujo existente.
- `backend/reports/*`: evidencias sin credenciales.
- `README.md`, `IMPLEMENTACION_API.md`, `CONEXION_NEON.md`: documentación actualizada.

No fue necesario modificar repositorios, validaciones de negocio o `schema.prisma`: la estructura real es compatible con la implementación previa.

## Reiniciar

Desde la raíz de `Proyecto-Trazabilidad`, en terminales separadas y después de detener las instancias anteriores:

```powershell
npm --prefix backend start
npm --prefix frontend run dev
```

Tras cambios de código:

```powershell
npm --prefix backend run typecheck
npm --prefix backend run build
npm --prefix frontend run build
```

La generación Prisma se hace con las API detenidas para evitar bloqueo de su DLL en Windows:

```powershell
npm --prefix backend run db:generate
```

Verificaciones reproducibles:

```powershell
npm --prefix backend run db:inspect
npm --prefix backend run test:neon:read
npm --prefix backend run test:neon:browser
npm --prefix backend test
npm --prefix backend run test:api
```

`test:neon:browser` utiliza Chrome instalado; puede configurarse `CHROME_PATH` si su ubicación es distinta. No registra cuerpos de autenticación ni tokens.

Para el entorno aislado, en terminales separadas:

```powershell
npm --prefix backend run dev:isolated
npm --prefix frontend run dev:isolated
```

## Pendientes

1. No hay usuarios ni datos de negocio en Neon. No se puede verificar un login institucional exitoso o una trazabilidad poblada allí sin que el equipo cargue datos mediante un procedimiento autorizado independiente.
2. Los registros de proveedores se representan mediante ingresos; no existe catálogo independiente. Tampoco hay tabla de despachos.
3. Las creaciones y actualizaciones de Neon permanecen deliberadamente bloqueadas. Haberlas probado en PostgreSQL aislado no cambia esa restricción.

