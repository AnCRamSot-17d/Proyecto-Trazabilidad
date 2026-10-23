import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { db } from '../config/db.js';
import { readOnly } from '../config/env.js';
export class HealthController {
  async check(_req: Request, res: Response) {
    try {
      await db.$queryRaw`SELECT 1`;
      const schema = new URL(process.env.DATABASE_URL!).searchParams.get('schema') || 'public';
      const columns = await db.$queryRaw<{table_name:string;column_name:string}[]>`SELECT table_name,column_name FROM information_schema.columns WHERE table_schema = ${schema}`;
      const actual = new Set(columns.map(c => c.table_name + '.' + c.column_name));
      const missing = Prisma.dmmf.datamodel.models.flatMap(model => model.fields.filter(field => field.kind !== 'object').map(field => (model.dbName || model.name) + '.' + (field.dbName || field.name))).filter(column => !actual.has(column));
      if (missing.length) return res.status(503).json({ status:'unavailable', database:'connected', schema:'mismatch', missingColumns:missing.length, readOnly });
      return res.status(200).json({ status:'ok', database:'connected', schema:'compatible', readOnly });
    } catch { return res.status(503).json({ status:'unavailable', database:'disconnected', readOnly }); }
  }
}
export const healthController = new HealthController();
