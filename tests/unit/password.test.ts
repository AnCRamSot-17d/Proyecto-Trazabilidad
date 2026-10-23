import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../../src/services/password.service.js';

test('Servicio de Contraseñas - Generación y Validación de Hashes Seguros con scrypt', async (t) => {
  await t.test('el hash generado es diferente a la contraseña en texto plano', async () => {
    const password = 'PasswordSegura2026!';
    const hash = await hashPassword(password);
    assert.notEqual(hash, password);
    assert.match(hash, /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
  });

  await t.test('dos hashes de la misma contraseña son distintos debido al salteado aleatorio', async () => {
    const password = 'MismaPassword123*';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    assert.notEqual(hash1, hash2);
  });

  await t.test('verificar contraseña correcta retorna true', async () => {
    const password = 'ClaveCorrecta!99';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    assert.equal(isValid, true);
  });

  await t.test('verificar contraseña incorrecta retorna false', async () => {
    const password = 'ClaveCorrecta!99';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword('ClaveErrada!00', hash);
    assert.equal(isValid, false);
  });

  await t.test('manejo de contraseña vacía', async () => {
    const emptyPassword = '';
    const hash = await hashPassword(emptyPassword);
    assert.equal(await verifyPassword('', hash), true);
    assert.equal(await verifyPassword('no-vacia', hash), false);
  });

  await t.test('rechazo de hashes con formato inválido o mal formado', async () => {
    const password = 'CualquierPassword1';
    assert.equal(await verifyPassword(password, ''), false);
    assert.equal(await verifyPassword(password, 'texto-plano-sin-formato'), false);
    assert.equal(await verifyPassword(password, 'scrypt$incompleto'), false);
    assert.equal(await verifyPassword(password, 'scrypt$1234$abcd'), false);
    assert.equal(await verifyPassword(password, 'bcrypt$0123456789abcdef0123456789abcdef$' + '0'.repeat(128)), false);
    assert.equal(await verifyPassword(password, 'scrypt$' + 'z'.repeat(32) + '$' + '0'.repeat(128)), false);
  });
});
