import { z } from 'zod';

export const text = z.string().trim().min(1).max(200);
export const quantity = z.number().positive().max(1e12).multipleOf(0.0001);

export const schemas = {
  products: z.object({
    code: text,
    name: text,
    unit: text,
  }).strict(),

  suppliers: z.object({
    name: text,
    email: z.string().email().optional(),
  }).strict(),

  materials: z.object({
    code: text,
    name: text,
    unit: text,
  }).strict(),

  'material-lots': z.object({
    code: text,
    materialId: text,
    supplierId: text,
    quantity,
  }).strict(),

  'production-orders': z.object({
    code: text,
    productId: text,
    quantity,
    consumptions: z.array(
      z.object({
        rawMaterialLotId: text,
        quantity,
      }).strict()
    ).min(1).max(100),
  }).strict(),

  lots: z.object({
    code: text,
    productionOrderId: text,
    quantity,
  }).strict(),
};

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type Resource = keyof typeof schemas;
export type ProductInput = z.infer<typeof schemas.products>;
export type SupplierInput = z.infer<typeof schemas.suppliers>;
export type MaterialInput = z.infer<typeof schemas.materials>;
export type MaterialLotInput = z.infer<typeof schemas['material-lots']>;
export type ProductionOrderInput = z.infer<typeof schemas['production-orders']>;
export type LotInput = z.infer<typeof schemas.lots>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
