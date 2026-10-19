import { db } from '../config/db.js';

export class TraceabilityRepository {
  async getBackwardTraceability(lotId: string) {
    return db.finishedProductLot.findUnique({
      where: { id: lotId },
      include: {
        productionOrder: {
          include: {
            product: true,
            events: true,
            consumptions: {
              include: {
                rawMaterialLot: {
                  include: {
                    material: true,
                    supplier: true,
                    events: true,
                  },
                },
              },
            },
          },
        },
        qualityControls: true,
        movements: true,
        shipments: true,
        events: true,
      },
    });
  }

  async getForwardTraceability(rawMaterialLotId: string) {
    return db.rawMaterialLot.findUnique({
      where: { id: rawMaterialLotId },
      include: {
        material: true,
        supplier: true,
        events: true,
        consumptions: {
          include: {
            productionOrder: {
              include: {
                product: true,
                lots: {
                  include: {
                    qualityControls: true,
                    movements: true,
                    shipments: true,
                    events: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}

export const traceabilityRepository = new TraceabilityRepository();
