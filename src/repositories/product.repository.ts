import { domainRepository as r } from './domain.repository.js';
export const productRepository = { findAll: r.products, findById: r.product };
