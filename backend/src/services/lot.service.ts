import { domainRepository as r } from '../repositories/domain.repository.js';
import { domainService as s } from './domain.service.js';
export const lotService = { getAll: r.lots, create: s.createLot };
