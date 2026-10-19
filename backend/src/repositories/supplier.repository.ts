import { db } from '../config/db.js';
import { SupplierInput, PaginationQuery } from '../schemas/validation.js';

export class SupplierRepository {
  async findAll({ limit, offset }: PaginationQuery) {
    return db.supplier.findMany({
      take: limit,
      skip: offset,
      orderBy: { id: 'asc' },
    });
  }

  async findById(id: string) {
    return db.supplier.findUnique({ where: { id } });
  }

  async create(data: SupplierInput) {
    return db.supplier.create({ data });
  }
}

export const supplierRepository = new SupplierRepository();
