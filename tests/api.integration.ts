import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { cluster } from '../scripts/test-cluster.js';
import { randomBytes, randomUUID } from 'node:crypto';

interface ApiRecord {
  id: string; token: string; database: string; codigo_unico: string; nombre_producto: string; stock_disponible: string; subtotal: string; presentaciones: string; email: string;
  user: { id: string; role: string }; inventario: ApiRecord; orden: ApiRecord; consumo: ApiRecord; producto: ApiRecord; pedido: ApiRecord; cliente: ApiRecord;
  detalles: ApiRecord[]; consumos: ApiRecord[]; ingresos: {proveedor: string}[]; detalles_consumo: ApiRecord[];
}

test('HTTP + PostgreSQL aislado: persistencia, relaciones, inventario, calidad, trazabilidad y permisos', { timeout: 180000 }, async t => {
  const local = await cluster();
  process.env.DATABASE_URL = local.url; process.env.DIRECT_URL = local.url;
  process.env.DB_READ_ONLY = 'false'; process.env.JWT_SECRET = randomBytes(48).toString('hex');
  const { app } = await import('../src/app.js');
  const { db } = await import('../src/config/db.js');
  const { hashPassword } = await import('../src/services/password.service.js');
  const server = app.listen(0,'127.0.0.1'); await once(server,'listening');
  const address=server.address(); if(!address||typeof address==='string') throw Error('Address');
  const base='http://127.0.0.1:'+address.port+'/api';
  let token='';
  async function call<T = ApiRecord>(path:string, method='GET', body?:unknown, expected=method==='POST'?201:200, bearer=token) {
    const res=await fetch(base+path,{method, headers:{'Content-Type':'application/json',...(bearer?{Authorization:'Bearer '+bearer}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
    const json=await res.json(); assert.equal(res.status,expected,method+' '+path+': '+JSON.stringify(json));return json as T;
  }
  try {
    const password=randomBytes(20).toString('hex');
    await db.usuario.create({data:{email:'test-admin@biotrace.invalid',nombre:'Test administrator',password:await hashPassword(password),rol:'ADMINISTRADOR'}});
    await t.test('health, unauthorized access and login',async()=>{
      assert.equal((await call('/health')).database,'connected');
      await call('/auth/read-only-session','POST',{key:'0'.repeat(64)},404);
      await call('/products','GET',undefined,401,'');
      await call('/auth/login','POST',{email:'test-admin@biotrace.invalid',password:'incorrect-password'},401);
      token=(await call('/auth/login','POST',{email:'test-admin@biotrace.invalid',password},200)).token;
      assert.equal((await call('/auth/me')).user.role,'ADMINISTRADOR');
      assert.ok((await call('/auth/refresh','POST',{},200)).token);
    });
    const client=await call('/clients','POST',{nombre_empresa:'Test laboratory',persona_contacto:'Test',email:'test@biotrace.invalid',telefono:'123'});
    const product=await call('/products','POST',{codigo_unico:'TEST-P',nombre_producto:'Test serum',presentaciones:'30 ml',cliente_id:client.id});
    const material=await call('/materials','POST',{codigo_materia_prima:'TEST-M',nombre_insumo:'Test active',unidad_medida:'kg'});
    const order=await call('/orders','POST',{numero_pedido:'TEST-ORDER',cliente_id:client.id,detalles:[{nombre_producto:product.nombre_producto,presentacion:'30 ml',cantidad:10,precio_unitario:12.34}]});
    const production=await call('/production-orders','POST',{producto_id:product.id,pedido_id:order.id,lote:'TEST-LOT',nombre_producto:product.nombre_producto,marca:'TEST',cantidad_programada:10,presentacion:'30 ml'});
    const receipt=await call('/ingresos-mp','POST',{materia_prima_id:material.id,lote_interno:'TEST-RAW',lote_proveedor:'TEST-SUPPLIER-LOT',proveedor:'Test supplier',cantidad_recibida:10});
    const inventoryId=receipt.inventario.id;
    const consumption={orden_id:production.id,lote_total_fabricar:10,unidad_lote:'kg',detalles:[{materia_prima_id:material.id,inventario_id:inventoryId,cantidad_programada:3,peso_real_consumido:3}]};
    await t.test('records persist and nested relations/subtotals match',async()=>{
      assert.equal((await call('/products/'+product.id)).codigo_unico,'TEST-P');
      assert.equal((await call('/orders/'+order.id)).detalles[0].subtotal,'123.4');
      assert.equal((await call('/inventory/'+inventoryId)).stock_disponible,'10');
      assert.equal((await db.producto.findUniqueOrThrow({where:{id:product.id}})).cliente_id,client.id);
      await call('/products','POST',{codigo_unico:'TEST-P',nombre_producto:'Duplicate'},409);
      await call('/products','POST',{codigo_unico:'X',nombre_producto:'X',unknown:true},400);
      await call('/products','POST',{codigo_unico:'FK',nombre_producto:'X',cliente_id:randomUUID()},404);
      await call('/products/not-a-uuid','GET',undefined,400);
      await call('/products/'+randomUUID(),'GET',undefined,404);
    });
    await t.test('consumption decrements stock, validates units, rolls back and resists concurrency',async()=>{
      await call('/consumptions','POST',consumption);
      assert.equal((await call('/inventory/'+inventoryId)).stock_disponible,'7');
      await call('/consumptions','POST',{...consumption,unidad_lote:'litre'},409);
      await call('/consumptions','POST',{...consumption,detalles:[consumption.detalles[0],{...consumption.detalles[0],inventario_id:randomUUID()}]},409);
      assert.equal((await call('/inventory/'+inventoryId)).stock_disponible,'7');
      const body={...consumption,detalles:[{...consumption.detalles[0],cantidad_programada:5,peso_real_consumido:5}]};
      const statuses=await Promise.all([1,2].map(async()=>{const response=await fetch(base+'/consumptions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});await response.arrayBuffer();return response.status;}));
      assert.deepEqual(statuses.sort(),[201,409]);
      assert.equal((await call('/inventory/'+inventoryId)).stock_disponible,'2');
      assert.equal(await db.consumoMateriaPrima.count(),2);
      const existing=await db.consumoMateriaPrima.findFirstOrThrow();
      assert.equal((await call('/consumptions/'+existing.id)).id,existing.id);
    });
    const quality={orden_id:production.id,muestra_aprobada:true,analizado_por:'Test analyst',revisado_por:'Test reviewer',parametros:[{parametro:'pH',especificacion:'5-6',resultado:'5.5',cumple:true}]};
    const qualityRecord=await call('/quality','POST',quality);
    const lot=await call('/lots','POST',{orden_id:production.id,total_unidades:10,densidad:1,balance_cantidad_envasada:1,firma_responsable_nombre:'Test packer'});
    await t.test('quality, packaging limits and bidirectional traceability use actual relations',async()=>{
      await call('/quality','POST',{...quality,parametros:[{...quality.parametros[0],cumple:false}]},400);
      await call('/lots','POST',{orden_id:production.id,total_unidades:1,densidad:1,balance_cantidad_envasada:1,firma_responsable_nombre:'Test'},409);
      const backward=await call('/lots/'+lot.id+'/traceability');
      assert.equal(backward.orden.consumos[0].detalles[0].inventario.ingresos[0].proveedor,'Test supplier');
      const forward=await call('/inventory/'+inventoryId+'/traceability');
      assert.equal(forward.detalles_consumo[0].consumo.orden.producto.id,product.id);
      assert.equal(forward.detalles_consumo[0].consumo.orden.pedido.cliente.id,client.id);
      assert.equal((await call('/material-lots/'+receipt.id+'/traceability')).id,inventoryId);
      assert.equal((await call('/production-orders/'+production.id+'/traceability')).id,production.id);
    });
    await t.test('all list/detail endpoints and aliases return persisted data',async()=>{
      for(const path of ['products','materials','clients','clientes','orders','pedidos','production-orders','material-lots','ingresos-mp','consumptions','consumos','inventory','inventario','quality','calidad','lots','suppliers','users']) assert.ok((await call<ApiRecord[]>('/'+path)).length>0,path);
      for(const [path,id] of [['materials',material.id],['clients',client.id],['production-orders',production.id],['material-lots',receipt.id],['lots',lot.id],['quality',qualityRecord.id]]) assert.equal((await call('/'+path+'/'+id)).id,id);
      await call('/shipments','GET',undefined,501);
    });
    await t.test('PATCH persists catalog changes and rejects invalid fields',async()=>{
      await call('/products/'+product.id,'PATCH',{presentaciones:'50 ml'},200);
      assert.equal((await call('/products/'+product.id)).presentaciones,'50 ml');
      await call('/materials/'+material.id,'PATCH',{nombre_insumo:'Updated active'},200);
      await call('/clients/'+client.id,'PATCH',{telefono:'456'},200);
      await call('/products/'+product.id,'PATCH',{},400);
      await call('/materials/'+material.id,'PATCH',{unidad_medida:'litre'},400);
    });
    await t.test('read-only mode blocks HTTP, ORM and raw SQL without changing records',async()=>{
      const output=execFileSync(process.execPath,['--import','tsx','scripts/read-only-check.ts'],{env:{...process.env,DB_READ_ONLY:'true',TEST_LOGIN_PASSWORD:password,READ_ONLY_ACCESS_KEY:randomBytes(32).toString('hex')},encoding:'utf8',stdio:['ignore','pipe','pipe']});
      assert.match(output,/row count unchanged/);
    });
    await t.test('users never leak passwords; roles, disabled users and plaintext accounts are rejected',async()=>{
      const operator=await call('/users','POST',{email:'operator@biotrace.invalid',nombre:'Operator',password,rol:'OPERADOR'});
      assert.equal('password' in operator,false);
      assert.equal((await call('/users/'+operator.id)).id,operator.id);
      await call('/users/'+operator.id,'PATCH',{nombre:'Updated operator'},200);
      const administrator=(await call('/auth/me')).user;
      await call('/users/'+administrator.id,'PATCH',{activo:false},409);
      assert.equal((await db.usuario.findUniqueOrThrow({where:{id:operator.id}})).password.startsWith('scrypt$'),true);
      const opToken=(await call('/auth/login','POST',{email:operator.email,password},200)).token;
      await call('/users','GET',undefined,403,opToken);
      await call('/products','POST',{codigo_unico:'DENIED',nombre_producto:'Denied'},403,opToken);
      await db.usuario.update({where:{id:operator.id},data:{activo:false}});
      await call('/auth/me','GET',undefined,401,opToken);
      await db.usuario.create({data:{email:'legacy@biotrace.invalid',nombre:'Legacy',password,rol:'OPERADOR'}});
      await call('/auth/login','POST',{email:'legacy@biotrace.invalid',password},401);
      const users=await call<Record<string,unknown>[]>('/users'); assert.equal(users.some((u:Record<string,unknown>)=>'password' in u),false);
    });
  } finally { server.closeAllConnections(); await new Promise<void>((ok,fail)=>server.close(error=>error?fail(error):ok())); await db.$disconnect(); await local.stop(); }
});
