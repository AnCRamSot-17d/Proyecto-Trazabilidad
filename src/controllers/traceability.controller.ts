import { Request, Response, NextFunction } from 'express';
import { traceabilityService } from '../services/traceability.service.js';

export class TraceabilityController {
  async getBackward(req: Request, res: Response, next: NextFunction) {
    try {
      const lotId = req.params.id as string;
      const result = await traceabilityService.getBackward(lotId);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async getForward(req: Request, res: Response, next: NextFunction) {
    try {
      const rawMaterialLotId = req.params.id as string;
      const result = await traceabilityService.getForward(rawMaterialLotId);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }
}

export const traceabilityController = new TraceabilityController();
