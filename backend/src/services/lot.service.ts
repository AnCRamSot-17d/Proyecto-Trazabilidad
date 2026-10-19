import { Prisma } from '@prisma/client';
import { db } from '../config/db.js';
import { lotRepository } from '../repositories/lot.repository.js';
import { LotInput, PaginationQuery } from '../schemas/validation.js';
import { HttpError } from '../types/errors.js';

export class LotService {
  async getAll(pagination: PaginationQuery) {
    return lotRepository.findAll(pagination);
  }

  async create(data: LotInput) {
    return db.$transaction(
      async (tx) => {
        const order = await tx.productionOrder.findUnique({
          where: { id: data.productionOrderId },
          include: { lots: true },
        });

        if (!order) {
          throw new HttpError(404, 'Production order not found');
        }

        const produced = order.lots.reduce(
          (sum, lot) => sum.add(lot.quantity),
          new Prisma.Decimal(0)
        );

        if (produced.add(data.quantity).gt(order.quantity)) {
          throw new HttpError(409, 'Quantity exceeds production order');
        }

        return tx.finishedProductLot.create({
          data: {
            ...data,
            qualityControls: {
              create: { status: 'PENDING' },
            },
            movements: {
              create: { type: 'IN', quantity: data.quantity },
            },
            events: {
              create: {
                type: 'MANUFACTURED',
                productionOrderId: order.id,
              },
            },
          },
          include: {
            qualityControls: true,
            movements: true,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  }
}

export const lotService = new LotService();
