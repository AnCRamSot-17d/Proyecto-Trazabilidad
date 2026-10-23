import test from 'node:test';
import assert from 'node:assert/strict';
import { schemas, paginationSchema, updates } from '../../src/schemas/validation.js';
import { loginSchema } from '../../src/schemas/auth.schema.js';

test('Esquemas de Validación Zod - Contratos, Tipos y Límites de Entrada', async (t) => {
  const validUUID = '11111111-1111-4111-a111-111111111111';
  const secondUUID = '22222222-2222-4222-a222-222222222222';

  // 1. loginSchema
  await t.test('loginSchema: casos válidos y rechazos de formato', () => {
    assert.equal(loginSchema.safeParse({ email: 'admin@biotrace.com', password: 'Password123' }).success, true);
    // Correo inválido
    assert.equal(loginSchema.safeParse({ email: 'correo-sin-arroba', password: 'Password123' }).success, false);
    // Contraseña menor a 6 caracteres
    assert.equal(loginSchema.safeParse({ email: 'admin@biotrace.com', password: '12345' }).success, false);
    // Ausencia de campos obligatorios
    assert.equal(loginSchema.safeParse({ email: 'admin@biotrace.com' }).success, false);
    assert.equal(loginSchema.safeParse({}).success, false);
  });

  // 2. schemas.products
  await t.test('schemas.products: catálogo de productos', () => {
    assert.equal(schemas.products.safeParse({ codigo_unico: 'PROD-001', nombre_producto: 'Serum Retinol', presentaciones: '30 ml', cliente_id: validUUID }).success, true);
    // Campos obligatorios ausentes
    assert.equal(schemas.products.safeParse({ codigo_unico: 'PROD-001' }).success, false);
    assert.equal(schemas.products.safeParse({ nombre_producto: 'Serum' }).success, false);
    // UUID inválido en cliente_id
    assert.equal(schemas.products.safeParse({ codigo_unico: 'P1', nombre_producto: 'P1', cliente_id: 'no-uuid' }).success, false);
    // Campos desconocidos rechazados por .strict()
    assert.equal(schemas.products.safeParse({ codigo_unico: 'P1', nombre_producto: 'P1', extra: true }).success, false);
    // Desbordamiento de longitud (> 200 caracteres)
    assert.equal(schemas.products.safeParse({ codigo_unico: 'P'.repeat(201), nombre_producto: 'P1' }).success, false);
  });

  // 3. schemas.materials
  await t.test('schemas.materials: catálogo de materias primas', () => {
    assert.equal(schemas.materials.safeParse({ codigo_materia_prima: 'MP-001', nombre_insumo: 'Niacinamida', unidad_medida: 'kg' }).success, true);
    // Campos obligatorios ausentes
    assert.equal(schemas.materials.safeParse({ codigo_materia_prima: 'MP-001', nombre_insumo: 'Niacinamida' }).success, false);
    // Tipos incorrectos
    assert.equal(schemas.materials.safeParse({ codigo_materia_prima: 12345, nombre_insumo: 'Niacinamida', unidad_medida: 'kg' }).success, false);
    // Desbordamiento de longitud
    assert.equal(schemas.materials.safeParse({ codigo_materia_prima: 'MP-1', nombre_insumo: 'X'.repeat(201), unidad_medida: 'kg' }).success, false);
  });

  // 4. schemas.suppliers
  await t.test('schemas.suppliers: directorio de proveedores', () => {
    assert.equal(schemas.suppliers.safeParse({ proveedor: 'Químicos del Caribe SAS' }).success, true);
    // Campo ausente o vacío
    assert.equal(schemas.suppliers.safeParse({}).success, false);
    assert.equal(schemas.suppliers.safeParse({ proveedor: '   ' }).success, false);
    // Desbordamiento de longitud
    assert.equal(schemas.suppliers.safeParse({ proveedor: 'P'.repeat(201) }).success, false);
  });

  // 5. schemas.clients
  await t.test('schemas.clients: directorio de clientes', () => {
    assert.equal(schemas.clients.safeParse({
      nombre_empresa: 'Laboratorios DermoTech SAS',
      persona_contacto: 'Dra. María Elena',
      email: 'contacto@dermotech.com',
      telefono: '+57 310 9876543',
      direccion: 'Parque Industrial Lote 14'
    }).success, true);
    // Correo inválido
    assert.equal(schemas.clients.safeParse({
      nombre_empresa: 'DermoTech', persona_contacto: 'María', email: 'correo-invalido', telefono: '123'
    }).success, false);
    // Desbordamiento de teléfono (> 50 caracteres)
    assert.equal(schemas.clients.safeParse({
      nombre_empresa: 'DermoTech', persona_contacto: 'María', email: 'a@b.com', telefono: '1'.repeat(51)
    }).success, false);
    // Campos obligatorios ausentes
    assert.equal(schemas.clients.safeParse({ nombre_empresa: 'DermoTech' }).success, false);
  });

  // 6. schemas.orders
  await t.test('schemas.orders: pedidos y validación de subtotales', () => {
    assert.equal(schemas.orders.safeParse({
      numero_pedido: 'PED-2026-001',
      cliente_id: validUUID,
      detalles: [{ nombre_producto: 'Serum Vitamina C', presentacion: '30 ml', cantidad: 10, precio_unitario: 15.50 }]
    }).success, true);
    // Lista de detalles vacía (mínimo 1)
    assert.equal(schemas.orders.safeParse({
      numero_pedido: 'PED-2026-001', cliente_id: validUUID, detalles: []
    }).success, false);
    // Cantidad cero o negativa
    assert.equal(schemas.orders.safeParse({
      numero_pedido: 'PED-2026-001', cliente_id: validUUID,
      detalles: [{ nombre_producto: 'Serum', presentacion: '30 ml', cantidad: 0, precio_unitario: 10 }]
    }).success, false);
    assert.equal(schemas.orders.safeParse({
      numero_pedido: 'PED-2026-001', cliente_id: validUUID,
      detalles: [{ nombre_producto: 'Serum', presentacion: '30 ml', cantidad: -3, precio_unitario: 10 }]
    }).success, false);
    // Precio unitario negativo
    assert.equal(schemas.orders.safeParse({
      numero_pedido: 'PED-2026-001', cliente_id: validUUID,
      detalles: [{ nombre_producto: 'Serum', presentacion: '30 ml', cantidad: 1, precio_unitario: -5.0 }]
    }).success, false);
    // Precio unitario con más de 2 decimales (múltiplo de 0.01)
    assert.equal(schemas.orders.safeParse({
      numero_pedido: 'PED-2026-001', cliente_id: validUUID,
      detalles: [{ nombre_producto: 'Serum', presentacion: '30 ml', cantidad: 1, precio_unitario: 12.345 }]
    }).success, false);
    // UUID inválido
    assert.equal(schemas.orders.safeParse({
      numero_pedido: 'PED-2026-001', cliente_id: 'no-uuid',
      detalles: [{ nombre_producto: 'Serum', presentacion: '30 ml', cantidad: 1, precio_unitario: 10 }]
    }).success, false);
  });

  // 7. schemas['production-orders']
  await t.test('schemas.production-orders: programación de reactores', () => {
    assert.equal(schemas['production-orders'].safeParse({
      producto_id: validUUID,
      lote: 'LOTE-OP-01',
      nombre_producto: 'Crema Hidratante Ceramid',
      marca: 'BioTrace Derm',
      cantidad_programada: 250.5,
      presentacion: '50 g'
    }).success, true);
    // Cantidad programada negativa o cero
    assert.equal(schemas['production-orders'].safeParse({
      producto_id: validUUID, lote: 'LOTE-1', nombre_producto: 'Crema', marca: 'BioTrace', cantidad_programada: 0, presentacion: '50 g'
    }).success, false);
    assert.equal(schemas['production-orders'].safeParse({
      producto_id: validUUID, lote: 'LOTE-1', nombre_producto: 'Crema', marca: 'BioTrace', cantidad_programada: -10, presentacion: '50 g'
    }).success, false);
    // UUID inválido en producto_id
    assert.equal(schemas['production-orders'].safeParse({
      producto_id: 'bad-uuid', lote: 'LOTE-1', nombre_producto: 'Crema', marca: 'BioTrace', cantidad_programada: 10, presentacion: '50 g'
    }).success, false);
  });

  // 8. schemas['material-lots']
  await t.test('schemas.material-lots: recepción de insumos', () => {
    assert.equal(schemas['material-lots'].safeParse({
      materia_prima_id: validUUID,
      lote_interno: 'LI-2026-001',
      lote_proveedor: 'LP-BASF-9988',
      cantidad_recibida: 120.75,
      proveedor: 'BASF Química'
    }).success, true);
    // Cantidad recibida no positiva
    assert.equal(schemas['material-lots'].safeParse({
      materia_prima_id: validUUID, lote_interno: 'LI-1', lote_proveedor: 'LP-1', cantidad_recibida: 0, proveedor: 'BASF'
    }).success, false);
    // Materia prima UUID inválido
    assert.equal(schemas['material-lots'].safeParse({
      materia_prima_id: '1234', lote_interno: 'LI-1', lote_proveedor: 'LP-1', cantidad_recibida: 10, proveedor: 'BASF'
    }).success, false);
  });

  // 9. schemas.consumptions
  await t.test('schemas.consumptions: pesaje y balance en reactores', () => {
    assert.equal(schemas.consumptions.safeParse({
      orden_id: validUUID,
      lote_total_fabricar: 200,
      unidad_lote: 'kg',
      detalles: [{
        materia_prima_id: validUUID,
        inventario_id: secondUUID,
        cantidad_programada: 25.5,
        peso_real_consumido: 25.48
      }]
    }).success, true);
    // Detalles vacíos
    assert.equal(schemas.consumptions.safeParse({
      orden_id: validUUID, lote_total_fabricar: 100, unidad_lote: 'kg', detalles: []
    }).success, false);
    // Peso consumido negativo o cero
    assert.equal(schemas.consumptions.safeParse({
      orden_id: validUUID, lote_total_fabricar: 100, unidad_lote: 'kg',
      detalles: [{ materia_prima_id: validUUID, inventario_id: secondUUID, cantidad_programada: 10, peso_real_consumido: 0 }]
    }).success, false);
  });

  // 10. schemas.quality
  await t.test('schemas.quality: dictamen analítico GMP', () => {
    assert.equal(schemas.quality.safeParse({
      orden_id: validUUID,
      muestra_aprobada: true,
      analizado_por: 'Lic. Andrés Soto',
      revisado_por: 'Dra. Paola Mora',
      parametros: [{ parametro: 'pH a 25°C', especificacion: '5.0 - 5.5', resultado: '5.2', cumple: true }]
    }).success, true);
    // Parámetros vacíos
    assert.equal(schemas.quality.safeParse({
      orden_id: validUUID, muestra_aprobada: true, analizado_por: 'Andrés', revisado_por: 'Paola', parametros: []
    }).success, false);
    // UUID orden inválido
    assert.equal(schemas.quality.safeParse({
      orden_id: 'invalido', muestra_aprobada: true, analizado_por: 'Andrés', revisado_por: 'Paola',
      parametros: [{ parametro: 'pH', especificacion: '5.0', resultado: '5.0', cumple: true }]
    }).success, false);
  });

  // 11. schemas.lots
  await t.test('schemas.lots: envasado de producto terminado', () => {
    assert.equal(schemas.lots.safeParse({
      orden_id: validUUID,
      total_unidades: 1000,
      densidad: 1.035,
      balance_cantidad_envasada: 98.5,
      firma_responsable_nombre: 'Ing. Carlos Mendoza'
    }).success, true);
    // Densidad no positiva o cero
    assert.equal(schemas.lots.safeParse({
      orden_id: validUUID, total_unidades: 1000, densidad: 0, balance_cantidad_envasada: 50, firma_responsable_nombre: 'Carlos'
    }).success, false);
    // Total unidades no positivo
    assert.equal(schemas.lots.safeParse({
      orden_id: validUUID, total_unidades: -5, densidad: 1.0, balance_cantidad_envasada: 50, firma_responsable_nombre: 'Carlos'
    }).success, false);
  });

  // 12. schemas.users
  await t.test('schemas.users: seguridad y roles de usuario', () => {
    const parsed = schemas.users.safeParse({
      email: 'ADMINISTRADOR@BioTrace.COM',
      nombre: 'Director de Planta',
      password: 'SuperPassword2026#',
      rol: 'ADMINISTRADOR'
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      // Verifica normalización a minúsculas
      assert.equal(parsed.data.email, 'administrador@biotrace.com');
    }
    // Contraseña menor a 12 caracteres (exigencia de seguridad)
    assert.equal(schemas.users.safeParse({
      email: 'user@biotrace.com', nombre: 'Operario 1', password: 'corta', rol: 'OPERADOR'
    }).success, false);
    // Rol inválido
    assert.equal(schemas.users.safeParse({
      email: 'user@biotrace.com', nombre: 'Operario 1', password: 'PasswordValida1234!', rol: 'SUPERVISOR'
    }).success, false);
    // Correo inválido
    assert.equal(schemas.users.safeParse({
      email: 'no-es-correo', nombre: 'Operario 1', password: 'PasswordValida1234!', rol: 'CALIDAD'
    }).success, false);
  });

  // 13. paginationSchema
  await t.test('paginationSchema: coerción y límites', () => {
    // Valores por defecto
    const def = paginationSchema.parse({});
    assert.equal(def.limit, 50);
    assert.equal(def.offset, 0);

    // Coerción desde strings (query params)
    const coerced = paginationSchema.parse({ limit: '25', offset: '10' });
    assert.equal(coerced.limit, 25);
    assert.equal(coerced.offset, 10);

    // Límites fuera de rango
    assert.equal(paginationSchema.safeParse({ limit: 0 }).success, false);
    assert.equal(paginationSchema.safeParse({ limit: 101 }).success, false);
    assert.equal(paginationSchema.safeParse({ offset: -1 }).success, false);
  });

  // 14. updates (esquemas parciales)
  await t.test('updates: validación de modificaciones parciales', () => {
    // Objeto vacío rechazado (debe indicar al menos un campo)
    assert.equal(updates.products.safeParse({}).success, false);
    assert.equal(updates.materials.safeParse({}).success, false);
    assert.equal(updates.clients.safeParse({}).success, false);
    assert.equal(updates.users.safeParse({}).success, false);

    // Campo válido permitido
    assert.equal(updates.products.safeParse({ nombre_producto: 'Nuevo Nombre' }).success, true);
    assert.equal(updates.clients.safeParse({ telefono: '+57 300 0000000' }).success, true);

    // Inmutabilidad de unidad_medida en materias primas (omitido en updates.materials)
    assert.equal(updates.materials.safeParse({ unidad_medida: 'litro' }).success, false);
  });
});
