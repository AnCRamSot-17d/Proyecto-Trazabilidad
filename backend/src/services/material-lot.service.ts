import { domainRepository as r } from '../repositories/domain.repository.js';
import { domainService as s } from './domain.service.js';
export const materialLotService = { getAll: r.receipts, create: s.createReceipt };
