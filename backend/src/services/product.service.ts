import { domainRepository as r } from '../repositories/domain.repository.js';
import { domainService as s } from './domain.service.js';
export const productService = { getAll: r.products, create: s.createProduct };
