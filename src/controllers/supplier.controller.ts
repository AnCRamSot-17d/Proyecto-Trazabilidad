import { Request, Response, NextFunction } from 'express';
import { supplierService } from '../services/supplier.service.js';
import { schemas, paginationSchema } from '../schemas/validation.js';

export class SupplierController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = paginationSchema.parse(req.query);
      const suppliers = await supplierService.getAll(pagination);
      return res.status(200).json(suppliers);
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = schemas.suppliers.parse(req.body);
      const supplier = await supplierService.create(validatedData);
      return res.status(201).json(supplier);
    } catch (error) {
      return next(error);
    }
  }
}

export const supplierController = new SupplierController();
