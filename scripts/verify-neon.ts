import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { Client } from 'pg';
import { randomUUID } from 'node:crypto';
import { apiOperations } from '../src/routes/index.js';
import { readOnly, readOnlyAccessKey } from '../src/config/env.js';
import { db } from '../src/config/db.js';
assert.equal(readOnly,true); assert.ok(readOnlyAccessKey);
const base=process.env.VERIFY_API_ORIGIN ?? 'http://127.0.0.1:3000';
assert.ok(['http://127.0.0.1:3000','http://localhost:4200'].includes(base));
const client=new Client({connectionString:process.env.DATABASE_URL,options:'-c default_transaction_read_only=on',connectionTimeoutMillis:15000});
const results:{method:string;path:string;status:number;expected:number;rows?:number}[]=[];
let token='';
async function call(method:string,path:string,expected:number,body?:unknown) {
  const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data:unknown=await res.json();
  results.push({method,path,status:res.status,expected,...(Array.isArray(data)?{rows:data.length}:{})});
  assert.equal(res.status,expected,method+' '+path);
  return data;
}
async function counts() {
  const tables=await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name");
  const result:Record<string,string>={};for(const {table_name} of tables.rows){const q=await client.query('SELECT count(*)::text AS n FROM public."'+String(table_name).replaceAll('"','""')+'"');result[table_name]=q.rows[0].n;}return result;
}
try {
  await client.connect(); await client.query('BEGIN READ ONLY'); const before=await counts(); await client.query('ROLLBACK');
  const state=await db.$queryRaw<{default_transaction_read_only:string}[]>`SHOW default_transaction_read_only`;
  assert.equal(state[0].default_transaction_read_only,'on');
  const login=await call('POST','/api/auth/read-only-session',200,{key:readOnlyAccessKey}) as {token:string};token=login.token;
  const health=await call('GET','/api/health',200) as {readOnly:boolean;database:string};assert.equal(health.readOnly,true);assert.equal(health.database,'connected');
  const empty=Object.values(before).every(n=>n==='0');
  for(const op of apiOperations) {
    if(op.path==='/api/health'||op.path==='/api/auth/read-only-session')continue;
    if(op.path==='/api/auth/login'){await call('POST',op.path,401,{email:'nonexistent@biotrace.invalid',password:'not-a-real-password'});continue;}
    if(op.path==='/api/auth/refresh'){await call('POST',op.path,200,{});continue;}
    if(op.method==='GET') {
      const path=op.path.replace(':id',randomUUID());
      await call('GET',path,op.path.includes(':id')?404:200);
    } else {
      // Probe middleware with invalid empty payloads only: no executable write reaches Prisma.
      await call(op.method,op.path.replace(':id',randomUUID()),403,{});
    }
  }
  await client.query('BEGIN READ ONLY');const after=await counts();await client.query('ROLLBACK');assert.deepEqual(after,before);
  const canonical=apiOperations.filter(op=>!['/api/clientes','/api/pedidos','/api/ingresos-mp','/api/consumos','/api/inventario','/api/calidad'].some(alias=>op.path===alias||op.path.startsWith(alias+'/')));
  const report={canonical:canonical.length,aliases:apiOperations.length-canonical.length,origin:base,implemented:apiOperations.length,checked:results.length,http200:results.filter(r=>r.status===200).length,expectedNotFound:results.filter(r=>r.status===404).length,writeRequestsBlocked:results.filter(r=>r.status===403).length,emptyDatabase:empty,postgresReadOnly:true,countsBefore:before,countsAfter:after,results};
  const filename=base.includes('4200')?'reports/angular-neon-http.json':'reports/neon-http.json';writeFileSync(filename,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({report:filename,implemented:report.implemented,checked:report.checked,http200:report.http200,expectedNotFound:report.expectedNotFound,writeRequestsBlocked:report.writeRequestsBlocked,emptyDatabase:empty,countsUnchanged:true}));
} catch(error) { console.error(error instanceof assert.AssertionError?error.message:'No se pudo verificar Neon; no se muestran credenciales ni tokens.');process.exitCode=1; }
finally {await client.end();await db.$disconnect();}
