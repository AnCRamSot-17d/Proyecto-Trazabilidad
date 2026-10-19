import { db } from '../config/db.js';
import { ProductInput, PaginationQuery } from '../schemas/validation.js';

export class ProductRepository {
  async findAll({ limit, offset }: PaginationQuery) {
    return db.product.findMany({
      take: limit,
      skip: offset,
      orderBy: { id: 'asc' },
    });
  }

  async findById(id: string) {
    return db.product.findUnique({ where: { id } });
  }

  async create(data: ProductInput) {
    return db.product.create({ data });
  }
}

export const productRepository = new ProductRepository();
