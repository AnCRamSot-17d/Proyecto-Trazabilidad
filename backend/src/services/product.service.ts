import { productRepository } from '../repositories/product.repository.js';
import { ProductInput, PaginationQuery } from '../schemas/validation.js';

export class ProductService {
  async getAll(pagination: PaginationQuery) {
    return productRepository.findAll(pagination);
  }

  async create(data: ProductInput) {
    return productRepository.create(data);
  }
}

export const productService = new ProductService();
