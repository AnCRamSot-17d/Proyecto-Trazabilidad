import '../src/config/env.js';
import { chromium } from 'playwright-core';
import { writeFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const executable=process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
assert.ok(existsSync(executable),'Configure CHROME_PATH con Chrome local.');
assert.ok(process.env.READ_ONLY_ACCESS_KEY);
const browser=await chromium.launch({executablePath:executable,headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100}});
const calls:{method:string;path:string;status:number}[]=[];const errors:string[]=[];
page.on('pageerror',error=>errors.push(error.name));
page.on('response',response=>{const url=new URL(response.url());if(url.pathname.startsWith('/api/'))calls.push({method:response.request().method(),path:url.pathname,status:response.status()});});
try {
  await page.goto('http://localhost:4200/login');
  await page.locator('input[name="readOnlyAccess"]').check();
  await page.locator('#passwordInput').fill(process.env.READ_ONLY_ACCESS_KEY!);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/home');
  const resources=['products','materials','clients','ingresos-mp','inventory','orders','production-orders','consumptions','lots','quality'];
  await page.getByText('Base protegida: consultas disponibles; guardado deshabilitado.',{exact:true}).waitFor();
  for(let attempt=0;attempt<100&&!resources.every(path=>calls.some(c=>c.path==='/api/'+path&&c.status===200));attempt++) await page.waitForTimeout(100);
  for(const path of resources)assert.ok(calls.some(c=>c.path==='/api/'+path&&c.status===200),path);
  await page.locator('.module-box').filter({has:page.locator('h3',{hasText:'Catálogo de Productos'})}).getByRole('button').click();
  assert.equal(await page.locator('.records-table tbody tr').count(),0);
  await page.screenshot({path:'reports/angular-neon-products.png',fullPage:true});
  await page.locator('.tab-pill').filter({hasText:'Llenar formato'}).click();
  assert.equal(await page.locator('button[type="submit"]').isDisabled(),true);
  await page.getByTitle('Inventario y Stock de Materias Primas',{exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Guardar materia prima',exact:true}).isDisabled(),true);
  assert.equal(errors.length,0);
  assert.equal(calls.filter(c=>c.method!=='GET'&&c.path!=='/api/auth/read-only-session').length,0);
  const report={login:'local-read-only',angularRendered:true,productsRows:0,formsDisabled:true,inventoryFormDisabled:true,pageErrors:errors,network:calls};
  writeFileSync('reports/angular-neon-browser.json',JSON.stringify(report,null,2)+'\n');
  console.log('Chrome: acceso local, 10 listados Neon, tabla vacia y formularios bloqueados verificados. Sin escrituras de negocio.');
} catch(error) { const message=(error instanceof Error?error.message:'Error').replaceAll(process.env.READ_ONLY_ACCESS_KEY ?? '__none__','[redacted]'); console.error(message.split('\n').slice(0,4).join('\n')); console.error('Fallo la prueba visual; no se imprimen claves, tokens ni cuerpos HTTP.');process.exitCode=1; }
finally {await browser.close();}
