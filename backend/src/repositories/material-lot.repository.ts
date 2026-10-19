import { db } from '../config/db.js';
import { MaterialLotInput, PaginationQuery } from '../schemas/validation.js';

export class MaterialLotRepository {
  async findAll({ limit, offset }: PaginationQuery) {
    return db.rawMaterialLot.findMany({
      take: limit,
      skip: offset,
      orderBy: { id: 'asc' },
      include: {
        material: true,
        supplier: true,
      },
    });
  }

  async findById(id: string) {
    return db.rawMaterialLot.findUnique({
      where: { id },
      include: {
        material: true,
        supplier: true,
        consumptions: true,
      },
    });
  }

  async create(data: MaterialLotInput) {
    return db.rawMaterialLot.create({
      data: {
        ...data,
        events: {
          create: { type: 'RECEIVED' },
        },
      },
      include: {
        material: true,
        supplier: true,
      },
    });
  }
}

export const materialLotRepository = new MaterialLotRepository();
