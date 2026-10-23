import { z } from 'zod';
export const text = z.string().trim().min(1).max(200);
export const id = z.string().uuid();
export const quantity = z.number().positive().max(99999999.9999).multipleOf(0.0001);
const nonnegative = z.number().nonnegative().max(1e8).multipleOf(0.0001);
export const paginationSchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50), offset: z.coerce.number().int().min(0).default(0) });
export const schemas = {
  products: z.object({ codigo_unico: text, nombre_producto: text, presentaciones: text.optional(), cliente_id: id.optional() }).strict(),
  materials: z.object({ codigo_materia_prima: text, nombre_insumo: text, unidad_medida: text }).strict(),
  suppliers: z.object({ proveedor: text }).strict(),
  clients: z.object({ nombre_empresa: z.string().trim().min(1).max(150), persona_contacto: z.string().trim().min(1).max(150), email: z.string().email().max(150), telefono: z.string().trim().min(1).max(50), direccion: z.string().max(255).optional() }).strict(),
  orders: z.object({ numero_pedido: text, cliente_id: id, detalles: z.array(z.object({ nombre_producto: z.string().min(1).max(255), presentacion: z.string().min(1).max(100), cantidad: z.number().int().positive().max(100000000), precio_unitario: z.number().nonnegative().max(1e8).multipleOf(0.01) }).strict()).min(1).max(100) }).strict(),
  'production-orders': z.object({ producto_id: id, pedido_id: id.optional(), lote: z.string().min(1).max(100), nombre_producto: z.string().min(1).max(255), nombre_fantasia: z.string().max(255).optional(), marca: z.string().min(1).max(100), cantidad_programada: quantity, presentacion: z.string().min(1).max(100), notificacion_sanitaria: z.string().max(100).optional() }).strict(),
  'material-lots': z.object({ materia_prima_id: id, lote_interno: text, lote_proveedor: text, cantidad_recibida: quantity, proveedor: text }).strict(),
  consumptions: z.object({ orden_id: id, lote_total_fabricar: quantity, unidad_lote: text, codigo_balanza: text.optional(), detalles: z.array(z.object({ materia_prima_id: id, inventario_id: id, cantidad_programada: quantity, peso_real_consumido: quantity }).strict()).min(1).max(100) }).strict(),
  quality: z.object({ orden_id: id, muestra_aprobada: z.boolean(), analizado_por: z.string().min(1).max(150), revisado_por: z.string().min(1).max(150), parametros: z.array(z.object({ parametro: z.string().min(1).max(255), especificacion: z.string().min(1).max(255), resultado: z.string().min(1).max(255), cumple: z.boolean() }).strict()).min(1).max(100) }).strict(),
  lots: z.object({ orden_id: id, total_unidades: z.number().positive().max(1e8).multipleOf(0.01), densidad: z.number().positive().max(999999.9999).multipleOf(0.0001), balance_cantidad_envasada: quantity, firma_responsable_nombre: z.string().min(1).max(150) }).strict(),
  users: z.object({ email: z.string().email().transform(v => v.toLowerCase()), nombre: text, password: z.string().min(12).max(128), rol: z.enum(['ADMINISTRADOR','OPERADOR','CALIDAD']).default('OPERADOR'), estacion: text.optional() }).strict(),
};
export type Resource = keyof typeof schemas;
export type ProductInput = z.infer<typeof schemas.products>;
export type SupplierInput = z.infer<typeof schemas.suppliers>;
export type MaterialInput = z.infer<typeof schemas.materials>;
export type MaterialLotInput = z.infer<typeof schemas['material-lots']>;
export type ProductionOrderInput = z.infer<typeof schemas['production-orders']>;
export type LotInput = z.infer<typeof schemas.lots>;
export type PaginationQuery = z.infer<typeof paginationSchema>;

const nonempty = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => schema.partial().refine(v => Object.keys(v).length > 0, 'Debe indicar al menos un campo.');
export const updates = {
  products: nonempty(schemas.products),
  materials: nonempty(schemas.materials.omit({ unidad_medida: true })),
  clients: nonempty(schemas.clients),
  users: nonempty(schemas.users.extend({ activo: z.boolean() })),
};
