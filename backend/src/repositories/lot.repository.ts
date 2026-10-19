import { db } from '../config/db.js';
import { PaginationQuery } from '../schemas/validation.js';

export class LotRepository {
  async findAll({ limit, offset }: PaginationQuery) {
    return db.finishedProductLot.findMany({
      take: limit,
      skip: offset,
      orderBy: { id: 'asc' },
      include: {
        productionOrder: {
          include: { product: true },
        },
        qualityControls: true,
        movements: true,
        shipments: true,
      },
    });
  }

  async findById(id: string) {
    return db.finishedProductLot.findUnique({
      where: { id },
      include: {
        productionOrder: {
          include: { product: true },
        },
        qualityControls: true,
        movements: true,
        shipments: true,
      },
    });
  }
}

export const lotRepository = new LotRepository();
