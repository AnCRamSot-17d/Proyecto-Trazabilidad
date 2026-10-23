import { cluster } from './test-cluster.js';
import { randomBytes } from 'node:crypto';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
const local=await cluster();
process.env.DATABASE_URL=local.url; process.env.DIRECT_URL=local.url;
process.env.DB_READ_ONLY='false'; process.env.JWT_SECRET=randomBytes(48).toString('hex');
const saved = existsSync('.env.isolated') ? Object.fromEntries(readFileSync('.env.isolated','utf8').trim().split('\n').map(line=>line.split('='))) : null;
const password=saved?.TEST_ADMIN_PASSWORD ?? randomBytes(20).toString('hex');
if(password.length < 16) throw new Error('La clave aislada existente no es valida; no se reemplazo.');
const {db}=await import('../src/config/db.js');
const {hashPassword}=await import('../src/services/password.service.js');
const {app}=await import('../src/app.js');
await db.usuario.create({data:{email:'test-admin@biotrace.invalid',nombre:'Administrador de pruebas aisladas',rol:'ADMINISTRADOR',password:await hashPassword(password)}});
// Ignored local file, never log the password or database URL.
if (!saved) writeFileSync('.env.isolated','TEST_ADMIN_EMAIL=test-admin@biotrace.invalid\nTEST_ADMIN_PASSWORD='+password+'\n',{mode:0o600});
const port=Number(process.env.ISOLATED_API_PORT || 3001);
const server=app.listen(port,'127.0.0.1',()=>console.log(JSON.stringify({mode:'isolated-postgresql',url:'http://127.0.0.1:'+port+'/api',credentialsFile:'backend/.env.isolated'})));
let stopping=false;
async function stop(){if(stopping)return;stopping=true;await new Promise<void>(ok=>server.close(()=>ok()));await db.$disconnect();await local.stop();process.exit(0);}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
server.on('error',async()=>{console.error('No se pudo iniciar el servidor aislado; revise el puerto.');await db.$disconnect();await local.stop();process.exitCode=1;});
