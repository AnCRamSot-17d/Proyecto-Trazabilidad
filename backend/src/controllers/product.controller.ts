import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service.js';
import { schemas, paginationSchema } from '../schemas/validation.js';

export class ProductController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = paginationSchema.parse(req.query);
      const products = await productService.getAll(pagination);
      return res.status(200).json(products);
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = schemas.products.parse(req.body);
      const product = await productService.create(validatedData);
      return res.status(201).json(product);
    } catch (error) {
      return next(error);
    }
  }
}

export const productController = new ProductController();
