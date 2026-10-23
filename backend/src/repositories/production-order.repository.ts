import { domainRepository as r } from './domain.repository.js';
export const productionOrderRepository = { findAll: r.productionOrders, findById: r.productionOrder };
