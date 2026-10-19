import { Request, Response, NextFunction } from 'express';
import { materialService } from '../services/material.service.js';
import { schemas, paginationSchema } from '../schemas/validation.js';

export class MaterialController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = paginationSchema.parse(req.query);
      const materials = await materialService.getAll(pagination);
      return res.status(200).json(materials);
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = schemas.materials.parse(req.body);
      const material = await materialService.create(validatedData);
      return res.status(201).json(material);
    } catch (error) {
      return next(error);
    }
  }
}

export const materialController = new MaterialController();
