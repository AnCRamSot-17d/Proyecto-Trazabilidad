import { domainRepository as r } from '../repositories/domain.repository.js';
import { domainService as s } from './domain.service.js';
export const materialService = { getAll: r.materials, create: s.createMaterial };
