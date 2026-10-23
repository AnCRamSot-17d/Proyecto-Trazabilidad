import { domainService as s } from '../services/domain.service.js';
export const traceabilityRepository = { getBackwardTraceability: s.backward, getForwardTraceability: s.forwardReceipt };
