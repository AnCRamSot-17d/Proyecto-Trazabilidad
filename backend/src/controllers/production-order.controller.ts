import { Request, Response, NextFunction } from 'express';
import { productionOrderService } from '../services/production-order.service.js';
import { schemas, paginationSchema } from '../schemas/validation.js';

export class ProductionOrderController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = paginationSchema.parse(req.query);
      const orders = await productionOrderService.getAll(pagination);
      return res.status(200).json(orders);
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = schemas['production-orders'].parse(req.body);
      const order = await productionOrderService.create(validatedData);
      return res.status(201).json(order);
    } catch (error) {
      return next(error);
    }
  }
}

export const productionOrderController = new ProductionOrderController();
