import test from 'node:test';
import assert from 'node:assert/strict';
import { schemas, paginationSchema } from '../src/schemas/validation.js';
import { hashPassword, verifyPassword } from '../src/services/password.service.js';
test('payloads reject unknown fields, nonpositive quantities and empty details', () => {
  assert.equal(schemas.products.safeParse({ codigo_unico:'A', nombre_producto:'B', extra:true }).success, false);
  assert.equal(schemas['material-lots'].safeParse({ cantidad_recibida:-1 }).success, false);
  assert.equal(schemas.consumptions.safeParse({ detalles:[] }).success, false);
  assert.equal(schemas.users.safeParse({ email:'a@b.co', nombre:'A', password:'short' }).success, false);
});
test('pagination validates boundaries and converts numbers', () => {
  for (const input of [{limit:101},{limit:0},{offset:-1}]) assert.equal(paginationSchema.safeParse(input).success,false);
  assert.deepEqual(paginationSchema.parse({limit:'25',offset:'10'}),{limit:25,offset:10});
});
test('passwords use unique salted hashes and reject plaintext, wrong and malformed credentials', async () => {
  const hash = await hashPassword('Test-only-strong-password');
  assert.notEqual(hash,await hashPassword('Test-only-strong-password'));
  assert.equal(await verifyPassword('Test-only-strong-password',hash),true);
  assert.equal(await verifyPassword('incorrect',hash),false);
  assert.equal(await verifyPassword('plain','plain'),false);
  assert.equal(await verifyPassword('x','scrypt$invalid$123'),false);
});
