import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
interface Fixture { id:string; nombre_producto:string; presentaciones:string; inventario:{id:string}; }
const base='http://localhost:4201';
const config=Object.fromEntries(readFileSync('.env.isolated','utf8').trim().split('\n').map(line=>line.split('=')));
const health=await fetch(base+'/api/health'); assert.equal(health.status,200); assert.equal(((await health.json()) as {readOnly:boolean}).readOnly,false);
const html=await fetch(base); assert.equal(html.status,200); assert.match(await html.text(),/<app-root/);
const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:config.TEST_ADMIN_EMAIL,password:config.TEST_ADMIN_PASSWORD})});
assert.equal(login.status,200); const {token}=await login.json() as {token:string};
const headers={'Content-Type':'application/json',Authorization:'Bearer '+token};
async function create(path:string,data:unknown){const res=await fetch(base+'/api/'+path,{method:'POST',headers,body:JSON.stringify(data)});assert.equal(res.status,201);return await res.json() as Fixture;}
const suffix=randomUUID();
const client=await create('clients',{nombre_empresa:'Angular test '+suffix,persona_contacto:'Test',email:'frontend@biotrace.invalid',telefono:'123'});
const product=await create('products',{codigo_unico:'UI-'+suffix,nombre_producto:'Angular serum '+suffix,presentaciones:'30 ml'});
const material=await create('materials',{codigo_materia_prima:'MP-'+suffix,nombre_insumo:'Angular active',unidad_medida:'kg'});
await create('orders',{numero_pedido:'ORDER-'+suffix,cliente_id:client.id,detalles:[{nombre_producto:product.nombre_producto,presentacion:product.presentaciones,cantidad:10,precio_unitario:25}]});
const receipt=await create('ingresos-mp',{materia_prima_id:material.id,lote_interno:'LOT-'+suffix,lote_proveedor:'SOURCE-'+suffix,proveedor:'Angular test supplier',cantidad_recibida:10});
for(const [resource,id] of [['products',product.id],['materials',material.id],['clients',client.id],['inventory',receipt.inventario.id]]){const res=await fetch(base+'/api/'+resource+'/'+id,{headers});assert.equal(res.status,200);assert.equal(((await res.json()) as {id:string}).id,id);}
console.log('Angular HTML + proxy HTTP + autenticacion + persistencia verificados en PostgreSQL aislado. No se automatizaron clics de formularios.');
