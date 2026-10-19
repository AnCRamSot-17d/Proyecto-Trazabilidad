import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  await db.$transaction(async tx => {
    // Stable IDs make repeated runs non-destructive.
    const supplier = await tx.supplier.upsert({ where: { id: 'demo-supplier' }, update: {}, create: { id: 'demo-supplier', name: 'Insumos Académicos SAS', email: 'demo@example.com' } });
    const material = await tx.rawMaterial.upsert({ where: { code: 'DEMO-SILICA' }, update: {}, create: { code: 'DEMO-SILICA', name: 'Sílice', unit: 'kg' } });
    const raw = await tx.rawMaterialLot.upsert({ where: { code: 'DEMO-MP-001' }, update: {}, create: { code: 'DEMO-MP-001', supplierId: supplier.id, materialId: material.id, quantity: 100, events: { create: { type: 'RECEIVED' } } } });
    const product = await tx.product.upsert({ where: { code: 'DEMO-PASTA' }, update: {}, create: { code: 'DEMO-PASTA', name: 'Crema dental académica', unit: 'unidad' } });
    const order = await tx.productionOrder.upsert({ where: { code: 'DEMO-OP-001' }, update: {}, create: { code: 'DEMO-OP-001', productId: product.id, quantity: 200, consumptions: { create: { rawMaterialLotId: raw.id, quantity: 20 } }, events: { create: { type: 'MATERIAL_CONSUMED', rawMaterialLotId: raw.id } } } });
    await tx.finishedProductLot.upsert({ where: { code: 'DEMO-PT-001' }, update: {}, create: { code: 'DEMO-PT-001', productionOrderId: order.id, quantity: 200, qualityControls: { create: { status: 'APPROVED', notes: 'Control ficticio académico' } }, movements: { create: [{ type: 'IN', quantity: 200 }, { type: 'OUT', quantity: 50 }] }, shipments: { create: { destination: 'Bodega académica Bogotá', quantity: 50 } }, events: { create: [{ type: 'MANUFACTURED', productionOrderId: order.id }, { type: 'QUALITY_APPROVED' }, { type: 'SHIPPED' }] } } });
  });
  console.log('Seed académico listo');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
