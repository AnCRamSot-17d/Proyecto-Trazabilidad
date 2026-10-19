import { materialRepository } from '../repositories/material.repository.js';
import { MaterialInput, PaginationQuery } from '../schemas/validation.js';

export class MaterialService {
  async getAll(pagination: PaginationQuery) {
    return materialRepository.findAll(pagination);
  }

  async create(data: MaterialInput) {
    return materialRepository.create(data);
  }
}

export const materialService = new MaterialService();
