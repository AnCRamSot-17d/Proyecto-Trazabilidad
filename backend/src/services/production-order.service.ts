import { Prisma } from '@prisma/client';
import { db } from '../config/db.js';
import { productionOrderRepository } from '../repositories/production-order.repository.js';
import { ProductionOrderInput, PaginationQuery } from '../schemas/validation.js';
import { HttpError } from '../types/errors.js';

export class ProductionOrderService {
  async getAll(pagination: PaginationQuery) {
    return productionOrderRepository.findAll(pagination);
  }

  async create(input: ProductionOrderInput) {
    const { consumptions, ...data } = input;

    // Validación de unicidad de lotes de materia prima en la orden
    if (new Set(consumptions.map(c => c.rawMaterialLotId)).size !== consumptions.length) {
      throw new HttpError(400, 'Duplicate material lots');
    }

    // Transacción serializable para control estricto de concurrencia y stock
    return db.$transaction(
      async (tx: any) => {
        for (const consumption of consumptions) {
          const lot = await tx.rawMaterialLot.findUnique({
            where: { id: consumption.rawMaterialLotId },
            include: { consumptions: true },
          });

          if (!lot) {
            throw new HttpError(404, 'Raw material lot not found');
          }

          const used = lot.consumptions.reduce(
            (sum: any, c: any) => sum.add(c.quantity),
            new Prisma.Decimal(0)
          );

          if (used.add(consumption.quantity).gt(lot.quantity)) {
            throw new HttpError(409, 'Insufficient raw material quantity');
          }
        }

        return tx.productionOrder.create({
          data: {
            ...data,
            consumptions: { create: consumptions },
            events: {
              create: consumptions.map(c => ({
                type: 'MATERIAL_CONSUMED',
                rawMaterialLotId: c.rawMaterialLotId,
              })),
            },
          },
          include: { consumptions: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  }
}

export const productionOrderService = new ProductionOrderService();
