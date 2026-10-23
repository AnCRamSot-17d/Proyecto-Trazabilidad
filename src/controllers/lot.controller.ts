import { Request, Response, NextFunction } from 'express';
import { lotService } from '../services/lot.service.js';
import { schemas, paginationSchema } from '../schemas/validation.js';

export class LotController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = paginationSchema.parse(req.query);
      const lots = await lotService.getAll(pagination);
      return res.status(200).json(lots);
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = schemas.lots.parse(req.body);
      const lot = await lotService.create(validatedData);
      return res.status(201).json(lot);
    } catch (error) {
      return next(error);
    }
  }
}

export const lotController = new LotController();
