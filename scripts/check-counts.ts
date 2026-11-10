import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [clientes, productos, materias, inventario, ingresos, pedidos, ordenes, consumos, fabricacion, calidad, usuarios] = await Promise.all([
    prisma.cliente.count(),
    prisma.producto.count(),
    prisma.materiaPrima.count(),
    prisma.inventarioMateriaPrima.count(),
    prisma.ingresoMateriaPrima.count(),
    prisma.pedido.count(),
    prisma.ordenProduccion.count(),
    prisma.consumoMateriaPrima.count(),
    prisma.registroFabricacion.count(),
    prisma.registroControlCalidad.count(),
    prisma.usuario.count()
  ]);
  console.log('TABLE_COUNTS:', JSON.stringify({ clientes, productos, materias, inventario, ingresos, pedidos, ordenes, consumos, fabricacion, calidad, usuarios }, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

