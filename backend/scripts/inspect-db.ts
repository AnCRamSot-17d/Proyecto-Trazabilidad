import 'dotenv/config';
import { Client } from 'pg';
if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL. Configúrela localmente sin publicar credenciales.');
const client = new Client({ connectionString: process.env.DATABASE_URL, options: '-c default_transaction_read_only=on', connectionTimeoutMillis:15000, statement_timeout:15000 });
try {
  await client.connect();
  await client.query('BEGIN READ ONLY');
  const version = await client.query('SHOW server_version');
  const protection = await client.query('SHOW transaction_read_only');
  const tables = await client.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY 1,2");
  const columns = await client.query("SELECT table_schema, table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY table_schema,table_name,ordinal_position");
  const keys = await client.query("SELECT n.nspname AS schema, c.relname AS table_name, con.conname AS name, con.contype AS type, pg_get_constraintdef(con.oid) AS definition FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') ORDER BY 1,2,3");
  const indexes = await client.query("SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY 1,2,3");
  const counts: {schema:string;table:string;rows:string}[] = [];
  const quote = (value:string) => '"' + value.replaceAll('"','""') + '"';
  for (const table of tables.rows) { const result = await client.query('SELECT count(*) AS total FROM ' + quote(table.table_schema) + '.' + quote(table.table_name)); counts.push({schema:table.table_schema,table:table.table_name,rows:result.rows[0].total}); }
  console.log(JSON.stringify({ serverVersion:version.rows[0].server_version, transactionReadOnly:protection.rows[0].transaction_read_only, indexes:indexes.rows, counts, tables: tables.rows, columns: columns.rows, constraints: keys.rows }, null, 2));
  await client.query('ROLLBACK');
} catch (error) { console.error('Codigo de conexion:', typeof error === 'object' && error && 'code' in error ? String(error.code) : 'UNKNOWN'); console.error('No se pudo inspeccionar PostgreSQL. Verifique conexión y permisos; no se realizaron escrituras.'); process.exitCode=1; }
finally { await client.end(); }
