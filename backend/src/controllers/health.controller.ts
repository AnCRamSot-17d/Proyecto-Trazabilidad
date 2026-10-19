import { Request, Response } from 'express';
import { db } from '../config/db.js';

export class HealthController {
  async check(_req: Request, res: Response) {
    try {
      await db.$queryRaw`SELECT 1`;
      return res.status(200).json({ status: 'ok', database: 'connected' });
    } catch {
      return res.status(503).json({ status: 'unavailable', database: 'disconnected' });
    }
  }
}

export const healthController = new HealthController();
