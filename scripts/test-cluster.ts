import EmbeddedPostgres from 'embedded-postgres';
import { randomBytes } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { Client } from 'pg';
import { createServer } from 'node:net';
export async function cluster() {
  const port = await new Promise<number>((ok,fail)=>{const s=createServer();s.once('error',fail);s.listen(0,'127.0.0.1',()=>{const a=s.address();if(!a||typeof a==='string')throw new Error('Port');s.close(()=>ok(a.port));});});
  const password=randomBytes(24).toString('hex');
  const name='biotrace_test_'+randomBytes(6).toString('hex');
  const directory=resolve('.test-data',name);
  const clean = async () => { if (dirname(directory) !== resolve('.test-data') || !name.startsWith('biotrace_test_')) throw new Error('Unsafe cleanup'); await rm(directory,{recursive:true,force:true}); };
  const pg = new EmbeddedPostgres({ databaseDir:directory, user:'postgres', password, port, persistent:true, postgresFlags:['-h','127.0.0.1'], onLog:()=>{}, onError:()=>{} });
  await pg.initialise(); await pg.start();
  try {
    await pg.createDatabase(name);
    const url='postgresql://postgres:'+password+'@127.0.0.1:'+port+'/'+name;
    // This URL is constructed here, never read from the user's environment.
    const client=new Client({connectionString:url}); await client.connect();
    try {
      const sql=execFileSync(process.execPath,['node_modules/prisma/build/index.js','migrate','diff','--from-empty','--to-schema-datamodel','prisma/schema.prisma','--script'],{encoding:'utf8',env:{...process.env,DATABASE_URL:url,DIRECT_URL:url},stdio:['ignore','pipe','pipe']});
      await client.query(sql);
    } finally { await client.end(); }
    return { url, stop:async()=>{await pg.stop();await clean();} };
  } catch(error) { await pg.stop(); await clean(); throw error; }
}
