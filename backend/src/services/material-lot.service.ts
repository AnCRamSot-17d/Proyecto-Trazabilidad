import { materialLotRepository } from '../repositories/material-lot.repository.js';
import { MaterialLotInput, PaginationQuery } from '../schemas/validation.js';

export class MaterialLotService {
  async getAll(pagination: PaginationQuery) {
    return materialLotRepository.findAll(pagination);
  }

  async create(data: MaterialLotInput) {
    return materialLotRepository.create(data);
  }
}

export const materialLotService = new MaterialLotService();
