import test from 'node:test';
import assert from 'node:assert/strict';

const base = process.env.API_URL ?? 'http://localhost:3000';

test('PostgreSQL API: complete traceability, conflicts and rollback', async () => {
  async function call(path: string, body?: unknown, expected = body ? 201 : 200) {
    const response = await fetch(`${base}/api/${path}`, body ? {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    } : undefined);
    const data = await response.json();
    assert.equal(response.status, expected, JSON.stringify(data));
    return data;
  }

  await call('health');
  await call('products', { code: 'INVALID', name: 'Missing unit' }, 400);
  await call('lots', { code: 'INVALID', productionOrderId: 'missing', quantity: -1 }, 400);

  const code = `TEST-${crypto.randomUUID()}`;
  const supplier = await call('suppliers', { name: code });
  const material = await call('materials', { code, name: 'Sílice', unit: 'kg' });
  const product = await call('products', { code, name: 'Crema', unit: 'unidad' });
  await call('products', { code, name: 'Duplicado', unit: 'unidad' }, 409);

  const raw = await call('material-lots', { code, materialId: material.id, supplierId: supplier.id, quantity: 10 });
  const order = await call('production-orders', { code, productId: product.id, quantity: 20, consumptions: [{ rawMaterialLotId: raw.id, quantity: 5 }] });
  await call('production-orders', { code: `${code}-overflow`, productId: product.id, quantity: 20, consumptions: [{ rawMaterialLotId: raw.id, quantity: 6 }] }, 409);

  const lot = await call('lots', { code, productionOrderId: order.id, quantity: 20 });
  await call('lots', { code: `${code}-overflow`, productionOrderId: order.id, quantity: 1 }, 409);

  const backward = await call(`lots/${lot.id}/traceability`);
  assert.equal(backward.productionOrder.consumptions[0].rawMaterialLot.supplier.id, supplier.id);

  const forward = await call(`material-lots/${raw.id}/traceability`);
  assert.equal(forward.consumptions.length, 1);
  assert.equal(forward.consumptions[0].productionOrder.lots[0].id, lot.id);

  for (const resource of ['products', 'suppliers', 'materials', 'material-lots', 'production-orders', 'lots']) {
    await call(resource);
  }

  await call('lots/nonexistent/traceability', undefined, 404);
  await call('material-lots/nonexistent/traceability', undefined, 404);
});
