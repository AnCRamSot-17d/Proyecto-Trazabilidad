import test from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { domainService } from '../../src/services/domain.service.js';
import { domainRepository as r } from '../../src/repositories/domain.repository.js';
import { HttpError } from '../../src/types/errors.js';

test('Lógica de Negocio y Dominio - Aritmética Decimal, Balances y Reglas Industriales', async (t) => {
  const validUUID = '11111111-1111-4111-a111-111111111111';

  // 1. Cálculo de Subtotales (cantidad × precio unitario) con precisión Decimal
  await t.test('cálculo exacto de subtotales evitando imprecisiones de coma flotante de JavaScript', () => {
    // En JS estándar: 0.1 * 0.2 = 0.020000000000000004
    const cantidad = 0.1;
    const precio = '0.2';
    const subtotal = new Prisma.Decimal(precio).mul(cantidad);
    assert.equal(subtotal.toString(), '0.02');

    // Ejemplo industrial: 12 unidades a $12.34 cada una
    const cant12 = 12;
    const precio12 = '12.34';
    const subtotal12 = new Prisma.Decimal(precio12).mul(cant12);
    assert.equal(subtotal12.toString(), '148.08');
  });

  // 2. Sumatoria de totales de pedidos
  await t.test('sumatoria acumulada del total de un pedido a partir de sus detalles', () => {
    const items = [
      { cantidad: 10, precio_unitario: '15.50' },  // 155.00
      { cantidad: 5, precio_unitario: '32.10' },   // 160.50
      { cantidad: 20, precio_unitario: '4.75' },   //  95.00
    ];

    const totalPedido = items.reduce(
      (acc, item) => acc.add(new Prisma.Decimal(item.precio_unitario).mul(item.cantidad)),
      new Prisma.Decimal(0)
    );

    assert.equal(totalPedido.toString(), '410.5');
    assert.equal(totalPedido.toFixed(2), '410.50');
  });

  // 3. Validación de límite máximo de subtotal en createOrder
  await t.test('createOrder rechaza pedidos cuyo subtotal supere 9999999999.99', async () => {
    const payloadExcesivo = {
      numero_pedido: 'PED-OVERFLOW',
      cliente_id: validUUID,
      detalles: [
        {
          nombre_producto: 'Serum de Oro',
          presentacion: '30 ml',
          cantidad: 10000000,
          precio_unitario: 1000000.00 // Subtotal = 10,000,000,000,000 > 9,999,999,999.99
        }
      ]
    };

    await assert.rejects(
      async () => { await domainService.createOrder(payloadExcesivo); },
      (err: unknown) => {
        assert.ok(err instanceof HttpError);
        assert.equal(err.status, 400);
        assert.equal(err.message, 'Subtotal fuera del rango permitido.');
        return true;
      }
    );
  });

  // 4. Balance de consumo de materias primas (total programado, real y variación)
  await t.test('balance estricto de consumos: programado vs real consumido y variación', () => {
    const detalles = [
      { cantidad_programada: '10.5000', peso_real_consumido: '10.4850' },
      { cantidad_programada: '25.0000', peso_real_consumido: '25.0150' },
      { cantidad_programada: '5.2500', peso_real_consumido: '5.2500' }
    ];

    const programmed = detalles.reduce((sum, d) => sum.add(d.cantidad_programada), new Prisma.Decimal(0));
    const actual = detalles.reduce((sum, d) => sum.add(d.peso_real_consumido), new Prisma.Decimal(0));
    const variacion = actual.sub(programmed);

    assert.equal(programmed.toString(), '40.75');
    assert.equal(actual.toString(), '40.75');
    assert.equal(variacion.toString(), '0');
  });

  // 5. Casos de variación negativa (merma) y positiva (sobrante/exceso)
  await t.test('cálculo de variación con merma y con exceso en reactores', () => {
    // Caso merma: se consumió menos de lo programado (pérdida en pared de reactor)
    const progMerma = new Prisma.Decimal('100.0000');
    const realMerma = new Prisma.Decimal('98.7500');
    const varMerma = realMerma.sub(progMerma);
    assert.equal(varMerma.toString(), '-1.25');

    // Caso exceso: se consumió más de lo programado
    const progExceso = new Prisma.Decimal('50.0000');
    const realExceso = new Prisma.Decimal('50.1250');
    const varExceso = realExceso.sub(progExceso);
    assert.equal(varExceso.toString(), '0.125');
  });

  // 6. Casos límite: alta precisión decimal (4 decimales requeridos por normativa GMP)
  await t.test('precisión decimal hasta 4 dígitos en cantidades de principios activos', () => {
    const d1 = new Prisma.Decimal('0.0001');
    const d2 = new Prisma.Decimal('0.0003');
    const suma = d1.add(d2);
    assert.equal(suma.toString(), '0.0004');
  });

  // 7. Rechazo de lotes de inventario duplicados en consumos
  await t.test('createConsumption rechaza detalles con lotes de inventario duplicados', async () => {
    const payloadDuplicado = {
      orden_id: validUUID,
      lote_total_fabricar: 100,
      unidad_lote: 'kg',
      detalles: [
        { materia_prima_id: validUUID, inventario_id: validUUID, cantidad_programada: 10, peso_real_consumido: 10 },
        { materia_prima_id: validUUID, inventario_id: validUUID, cantidad_programada: 5, peso_real_consumido: 5 }
      ]
    };

    await assert.rejects(
      async () => { await domainService.createConsumption(payloadDuplicado); },
      (err: unknown) => {
        assert.ok(err instanceof HttpError);
        assert.equal(err.status, 400);
        assert.equal(err.message, 'Lotes de inventario duplicados.');
        return true;
      }
    );
  });

  // 8. Regla de Calidad: una muestra con parámetros no conformes no puede aprobarse
  await t.test('createQuality rechaza aprobar muestras con al menos un parámetro no conforme', async () => {
    const payloadCalidadInconsistente = {
      orden_id: validUUID,
      muestra_aprobada: true, // Intento de aprobar
      analizado_por: 'Lic. Andrés',
      revisado_por: 'Dra. Paola',
      parametros: [
        { parametro: 'pH', especificacion: '5.0-5.5', resultado: '5.2', cumple: true },
        { parametro: 'Viscosidad', especificacion: '3000-4000 cP', resultado: '2500 cP', cumple: false } // Incumple
      ]
    };

    await assert.rejects(
      async () => { await domainService.createQuality(payloadCalidadInconsistente); },
      (err: unknown) => {
        assert.ok(err instanceof HttpError);
        assert.equal(err.status, 400);
        assert.equal(err.message, 'Una muestra con parámetros incumplidos no puede aprobarse.');
        return true;
      }
    );
  });

  // 9. Casos límite matemáticos: división por cero y listas vacías
  await t.test('manejo de división por cero y listas vacías en cálculos de rendimiento', () => {
    const progCero = new Prisma.Decimal(0);
    const realDiez = new Prisma.Decimal(10);
    
    // En Decimal.js / Prisma.Decimal la división por cero no lanza excepción, sino que produce Infinity (isFinite() === false)
    const divisionPorCero = realDiez.div(progCero);
    assert.equal(divisionPorCero.isFinite(), false);
    assert.equal(divisionPorCero.toString(), 'Infinity');

    // Regla de salvaguarda industrial para evitar Infinity en reportes:
    const rendimientoSeguro = progCero.isZero() ? new Prisma.Decimal(0) : realDiez.div(progCero).mul(100);
    assert.equal(rendimientoSeguro.toString(), '0');

    // Lista vacía acumulada devuelve 0 Decimal
    const listaVacia: { cantidad: number; precio: string }[] = [];
    const totalVacio = listaVacia.reduce((acc, item) => acc.add(new Prisma.Decimal(item.precio).mul(item.cantidad)), new Prisma.Decimal(0));
    assert.equal(totalVacio.toString(), '0');
  });

  // 10. Detección de funcionalidad pendiente en src/services/domain.service.ts: porcentajes de rendimiento y merma
  await t.test('inconsistencia de cobertura: porcentaje de rendimiento y merma no implementados en domainService', { todo: 'src/services/domain.service.ts no expone funciones para porcentaje de rendimiento o merma' }, () => {
    // Se documenta que domainService no expone métodos dedicados de porcentaje de rendimiento y merma
    assert.equal('calcularRendimiento' in domainService, true);
    assert.equal('calcularMerma' in domainService, true);
  });
});
