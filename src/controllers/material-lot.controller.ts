import { Request, Response, NextFunction } from 'express';
import { materialLotService } from '../services/material-lot.service.js';
import { schemas, paginationSchema } from '../schemas/validation.js';

export class MaterialLotController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = paginationSchema.parse(req.query);
      const lots = await materialLotService.getAll(pagination);
      return res.status(200).json(lots);
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = schemas['material-lots'].parse(req.body);
      const lot = await materialLotService.create(validatedData);
      return res.status(201).json(lot);
    } catch (error) {
      return next(error);
    }
  }
}

export const materialLotController = new MaterialLotController();
