import './env.js';
import { PrismaClient } from '@prisma/client';
import { readOnly, datasourceUrl } from './env.js';
import { HttpError } from '../types/errors.js';
const client = new PrismaClient({ datasourceUrl: datasourceUrl() });
const writes = new Set(['create','createMany','createManyAndReturn','update','updateMany','updateManyAndReturn','upsert','delete','deleteMany']);
export const db = client.$extends({ query: { $allModels: { async $allOperations({ operation, args, query }) {
  if (readOnly && writes.has(operation)) throw new HttpError(403, 'Base protegida: servidor en modo de solo lectura.');
  return query(args);
} } } });
