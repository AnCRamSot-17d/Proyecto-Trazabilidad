import { domainRepository as r } from './domain.repository.js';
export const materialRepository = { findAll: r.materials, findById: r.material };
