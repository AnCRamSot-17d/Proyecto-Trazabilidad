import test from 'node:test';
import assert from 'node:assert/strict';
import { schemas, paginationSchema } from '../src/schemas/validation.js';

test('rejects invalid quantities and unknown fields', () => {
  assert.equal(schemas.lots.safeParse({ code: 'A', productionOrderId: 'B', quantity: -1 }).success, false);
  assert.equal(schemas.products.safeParse({ code: 'A', name: 'B', unit: 'kg', extra: true }).success, false);
  assert.equal(schemas['production-orders'].safeParse({ code: 'A', productId: 'B', quantity: 1, consumptions: [] }).success, false);
});

test('pagination validates limit and offset boundaries', () => {
  assert.equal(paginationSchema.safeParse({ limit: 101 }).success, false);
  assert.equal(paginationSchema.safeParse({ limit: 0 }).success, false);
  assert.equal(paginationSchema.safeParse({ offset: -1 }).success, false);
  const valid = paginationSchema.safeParse({ limit: '25', offset: '10' });
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.limit, 25);
    assert.equal(valid.data.offset, 10);
  }
});
