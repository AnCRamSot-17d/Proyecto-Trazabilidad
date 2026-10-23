import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readOnly } from '../src/config/env.js';
import { db } from '../src/config/db.js';
import { app } from '../src/app.js';
assert.equal(readOnly,true);
const server=app.listen(0,'127.0.0.1'); await once(server,'listening');
try {
  const addr=server.address(); if(!addr||typeof addr==='string')throw Error('Address');
  const base='http://127.0.0.1:'+addr.port+'/api';
  const before=await db.producto.count();
  const rows=await db.$queryRaw<{default_transaction_read_only:string}[]>`SHOW default_transaction_read_only`;
  assert.equal(rows[0].default_transaction_read_only,'on');
  await assert.rejects(db.producto.create({data:{codigo_unico:'READONLY-DENIED',nombre_producto:'Denied'}}));
  // Deliberately exercise the database guard only on the local database created by the test harness.
  const url=new URL(process.env.DATABASE_URL!);
  assert.equal(url.hostname,'127.0.0.1'); assert.match(url.pathname,/^\/biotrace_test_/);
  await assert.rejects(db.$executeRaw`INSERT INTO productos (id,codigo_unico,nombre_producto,fecha_creacion) VALUES (gen_random_uuid(),'RAW-DENIED','Denied',now())`);
  const login=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'test-admin@biotrace.invalid',password:process.env.TEST_LOGIN_PASSWORD})});
  assert.equal(login.status,200); const {token}=await login.json() as {token:string};
  const response=await fetch(base+'/products',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({codigo_unico:'HTTP-DENIED',nombre_producto:'Denied'})});
  assert.equal(response.status,403);
  assert.equal(((await (await fetch(base+'/health')).json()) as {readOnly:boolean}).readOnly,true);
  const localSession=await fetch(base+'/auth/read-only-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:process.env.READ_ONLY_ACCESS_KEY})});
  assert.equal(localSession.status,200); const reader=await localSession.json() as {token:string};
  const me=await fetch(base+'/auth/me',{headers:{Authorization:'Bearer '+reader.token}});assert.equal(me.status,200);
  const readerDenied=await fetch(base+'/products',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+reader.token},body:'{}'});assert.equal(readerDenied.status,403);
  const wrongKey=await fetch(base+'/auth/read-only-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'0'.repeat(64)})});assert.equal(wrongKey.status,401);
  assert.equal(await db.producto.count(),before);
  console.log('Read-only HTTP, Prisma and PostgreSQL guards verified; row count unchanged.');
} finally { server.closeAllConnections(); await new Promise<void>(ok=>server.close(()=>ok())); await db.$disconnect(); }
