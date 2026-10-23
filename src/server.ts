import './config/env.js';
import { app } from './app.js';
import { db } from './config/db.js';
import { readOnly, databaseConfigured } from './config/env.js';
const port = Number(process.env.APP_PORT || process.env.PORT || 3000);
const host = process.env.APP_HOST || '127.0.0.1';
const server = app.listen(port, host, () => console.log(JSON.stringify({ url: 'http://' + host + ':' + port + '/api', readOnly, databaseConfigured })));
async function shutdown() { server.close(); await db.$disconnect(); }
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
