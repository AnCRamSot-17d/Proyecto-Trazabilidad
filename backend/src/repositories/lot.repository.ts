import { domainRepository as r } from './domain.repository.js';
export const lotRepository = { findAll: r.lots, findById: r.lot };
