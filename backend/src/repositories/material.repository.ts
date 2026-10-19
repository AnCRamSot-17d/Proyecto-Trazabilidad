import { db } from '../config/db.js';
import { MaterialInput, PaginationQuery } from '../schemas/validation.js';

export class MaterialRepository {
  async findAll({ limit, offset }: PaginationQuery) {
    return db.rawMaterial.findMany({
      take: limit,
      skip: offset,
      orderBy: { id: 'asc' },
    });
  }

  async findById(id: string) {
    return db.rawMaterial.findUnique({ where: { id } });
  }

  async create(data: MaterialInput) {
    return db.rawMaterial.create({ data });
  }
}

export const materialRepository = new MaterialRepository();
