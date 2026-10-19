import { traceabilityRepository } from '../repositories/traceability.repository.js';
import { HttpError } from '../types/errors.js';

export class TraceabilityService {
  async getBackward(lotId: string) {
    const lot = await traceabilityRepository.getBackwardTraceability(lotId);
    if (!lot) {
      throw new HttpError(404, 'Finished product lot not found');
    }
    return lot;
  }

  async getForward(rawMaterialLotId: string) {
    const lot = await traceabilityRepository.getForwardTraceability(rawMaterialLotId);
    if (!lot) {
      throw new HttpError(404, 'Raw material lot not found');
    }
    return lot;
  }
}

export const traceabilityService = new TraceabilityService();
