import { hashPassword } from '../src/services/password.service.js';
// Password is read from stdin to keep it out of process arguments/history.
let input = ''; for await (const chunk of process.stdin) input += chunk;
const password = input.trimEnd();
if (password.length < 12 || password.length > 128) throw new Error('Se requieren entre 12 y 128 caracteres.');
console.log(await hashPassword(password));
