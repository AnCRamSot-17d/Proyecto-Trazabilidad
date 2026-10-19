export interface Supplier {
  id: string;
  name: string;
  email?: string | null;
}

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  unit: string;
}

export interface RawMaterialLot {
  id: string;
  code: string;
  materialId: string;
  supplierId: string;
  quantity: string | number;
  receivedAt: string;
  material?: RawMaterial;
  supplier?: Supplier;
  events?: TraceabilityEvent[];
}

export interface Product {
  id: string;
  code: string;
  name: string;
  unit: string;
}

export interface MaterialConsumption {
  id: string;
  productionOrderId: string;
  rawMaterialLotId: string;
  quantity: string | number;
  rawMaterialLot?: RawMaterialLot;
  productionOrder?: ProductionOrder;
}

export interface ProductionOrder {
  id: string;
  code: string;
  productId: string;
  quantity: string | number;
  createdAt: string;
  product?: Product;
  consumptions?: MaterialConsumption[];
  lots?: FinishedProductLot[];
  events?: TraceabilityEvent[];
}

export type QualityStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type MovementType = 'IN' | 'OUT';

export interface QualityControl {
  id: string;
  lotId: string;
  status: QualityStatus;
  notes?: string | null;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  lotId: string;
  type: MovementType;
  quantity: string | number;
  createdAt: string;
}

export interface Shipment {
  id: string;
  lotId: string;
  destination: string;
  quantity: string | number;
  shippedAt: string;
}

export interface TraceabilityEvent {
  id: string;
  type: string;
  rawMaterialLotId?: string | null;
  productionOrderId?: string | null;
  finishedProductLotId?: string | null;
  createdAt: string;
}

export interface FinishedProductLot {
  id: string;
  code: string;
  productionOrderId: string;
  quantity: string | number;
  manufacturedAt: string;
  productionOrder?: ProductionOrder;
  qualityControls?: QualityControl[];
  movements?: InventoryMovement[];
  shipments?: Shipment[];
  events?: TraceabilityEvent[];
}

export interface BackwardTraceabilityResponse extends FinishedProductLot {
  productionOrder: ProductionOrder & {
    product: Product;
    events: TraceabilityEvent[];
    consumptions: Array<
      MaterialConsumption & {
        rawMaterialLot: RawMaterialLot & {
          material: RawMaterial;
          supplier: Supplier;
          events: TraceabilityEvent[];
        };
      }
    >;
  };
}

export interface ForwardTraceabilityResponse extends RawMaterialLot {
  material: RawMaterial;
  supplier: Supplier;
  events: TraceabilityEvent[];
  consumptions: Array<
    MaterialConsumption & {
      productionOrder: ProductionOrder & {
        product: Product;
        lots: Array<
          FinishedProductLot & {
            qualityControls: QualityControl[];
            movements: InventoryMovement[];
            shipments: Shipment[];
            events: TraceabilityEvent[];
          }
        >;
      };
    }
  >;
}
