import { domainRepository as r } from '../repositories/domain.repository.js';
import { HttpError } from '../types/errors.js';
export const supplierService = { getAll: r.suppliers, async create(_input: unknown) { throw new HttpError(405, 'Proveedores se registran en ingresos; no existe catálogo independiente.'); } };
