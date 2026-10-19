import { supplierRepository } from '../repositories/supplier.repository.js';
import { SupplierInput, PaginationQuery } from '../schemas/validation.js';

export class SupplierService {
  async getAll(pagination: PaginationQuery) {
    return supplierRepository.findAll(pagination);
  }

  async create(data: SupplierInput) {
    return supplierRepository.create(data);
  }
}

export const supplierService = new SupplierService();
