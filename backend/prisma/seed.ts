import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('Iniciando seed de base de datos...');

  // 1. Creación del usuario administrador oficial en la base de datos
  const adminUser = await db.usuario.upsert({
    where: { email: 'admin@biotrace.com' },
    update: {
      nombre: 'Ing. Administrador de Trazabilidad',
      password: 'BioTrace2026!',
      rol: 'ADMINISTRADOR',
      estacion: 'Estación Central de Control y Liberación',
      activo: true,
    },
    create: {
      email: 'admin@biotrace.com',
      nombre: 'Ing. Administrador de Trazabilidad',
      password: 'BioTrace2026!',
      rol: 'ADMINISTRADOR',
      estacion: 'Estación Central de Control y Liberación',
      activo: true,
    },
  });

  console.log('✅ Usuario creado en base de datos:', adminUser.email);

  // 2. Materia prima de prueba
  const materiaPrima = await db.materiaPrima.upsert({
    where: { codigo_materia_prima: 'MP-AC-HIALURONICO' },
    update: {},
    create: {
      codigo_materia_prima: 'MP-AC-HIALURONICO',
      nombre_insumo: 'Ácido Hialurónico Puro 98%',
      unidad_medida: 'kg',
    },
  });

  console.log('✅ Materia prima inicial lista:', materiaPrima.nombre_insumo);
}

main()
  .catch((error) => {
    console.error('Error durante el seed:', error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
