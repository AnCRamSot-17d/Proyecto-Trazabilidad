import 'dotenv/config';
import { Client } from 'pg';
import { randomUUID } from 'node:crypto';
import { hashPassword } from '../src/services/password.service.js';

async function seedAdmin() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error('Falta DIRECT_URL o DATABASE_URL en .env');

  const client = new Client({
    connectionString: url,
    ssl: true,
  });

  try {
    await client.connect();
    console.log('Conectado a Neon PostgreSQL...');

    const email = 'admin@biotrace.com';
    const plainPassword = 'admin123';
    const hashedPassword = await hashPassword(plainPassword);
    const id = randomUUID();
    const nombre = 'Ing. Administrador de Trazabilidad';
    const rol = 'ADMINISTRADOR';
    const estacion = 'Estación Central de Control y Liberación';

    const query = `
      INSERT INTO usuarios (id, email, nombre, password, rol, estacion, activo, fecha_creacion)
      VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        nombre = EXCLUDED.nombre,
        rol = EXCLUDED.rol,
        estacion = EXCLUDED.estacion,
        activo = true
      RETURNING id, email, nombre, rol, estacion, activo;
    `;

    const res = await client.query(query, [id, email, nombre, hashedPassword, rol, estacion]);
    console.log('Usuario administrador configurado con éxito:', res.rows[0]);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

seedAdmin();
