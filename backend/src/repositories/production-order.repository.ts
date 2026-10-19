import { db } from '../config/db.js';
import { PaginationQuery } from '../schemas/validation.js';

export class ProductionOrderRepository {
  async findAll({ limit, offset }: PaginationQuery) {
    return db.productionOrder.findMany({
      take: limit,
      skip: offset,
      orderBy: { id: 'asc' },
      include: {
        product: true,
        consumptions: true,
        lots: true,
      },
    });
  }

  async findById(id: string) {
    return db.productionOrder.findUnique({
      where: { id },
      include: {
        product: true,
        consumptions: true,
        lots: true,
      },
    });
  }
}

export const productionOrderRepository = new ProductionOrderRepository();
