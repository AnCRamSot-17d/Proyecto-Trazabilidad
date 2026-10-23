import { Prisma } from '@prisma/client';
import { db } from '../config/db.js';
import { PaginationQuery } from '../schemas/validation.js';
const page = ({ limit, offset }: PaginationQuery) => ({ take: limit, skip: offset, orderBy: { id: 'asc' as const } });
export const publicUser = { id: true, email: true, nombre: true, rol: true, estacion: true, activo: true, fecha_creacion: true } satisfies Prisma.UsuarioSelect;
export const domainRepository = {
  updateProduct: (id: string, data: Prisma.ProductoUncheckedUpdateInput) => db.producto.update({ where: { id }, data }),
  updateMaterial: (id: string, data: Prisma.MateriaPrimaUpdateInput) => db.materiaPrima.update({ where: { id }, data }),
  updateClient: (id: string, data: Prisma.ClienteUpdateInput) => db.cliente.update({ where: { id }, data }),

  products: (p: PaginationQuery) => db.producto.findMany({ ...page(p), include: { cliente: true, formula: { include: { materia_prima: true } } } }),
  product: (id: string) => db.producto.findUnique({ where: { id }, include: { cliente: true, formula: { include: { materia_prima: true } } } }),
  createProduct: (data: Prisma.ProductoUncheckedCreateInput) => db.producto.create({ data }),
  materials: (p: PaginationQuery) => db.materiaPrima.findMany(page(p)),
  material: (id: string) => db.materiaPrima.findUnique({ where: { id } }),
  createMaterial: (data: Prisma.MateriaPrimaCreateInput) => db.materiaPrima.create({ data }),
  clients: (p: PaginationQuery) => db.cliente.findMany(page(p)),
  client: (id: string) => db.cliente.findUnique({ where: { id } }),
  createClient: (data: Prisma.ClienteCreateInput) => db.cliente.create({ data }),
  orders: (p: PaginationQuery) => db.pedido.findMany({ ...page(p), include: { cliente: true, detalles: true, ordenes: true } }),
  order: (id: string) => db.pedido.findUnique({ where: { id }, include: { cliente: true, detalles: true, ordenes: true } }),
  createOrder: (data: Prisma.PedidoUncheckedCreateInput) => db.pedido.create({ data, include: { detalles: true } }),
  productionOrders: (p: PaginationQuery) => db.ordenProduccion.findMany({ ...page(p), include: { producto: true, pedido: true, consumos: { include: { detalles: true } }, controles_calidad: true, envasados: true } }),
  productionOrder: (id: string) => db.ordenProduccion.findUnique({ where: { id }, include: { producto: true, pedido: { include: { cliente: true } }, consumos: { include: { detalles: { include: { inventario: { include: { ingresos: true } }, materia_prima: true } } } }, controles_calidad: { include: { parametros: true } }, envasados: true, dispensacion: true, fabricaciones: { include: { pasos: true } }, etiquetados: true, loteos: true } }),
  createProductionOrder: (data: Prisma.OrdenProduccionUncheckedCreateInput) => db.ordenProduccion.create({ data }),
  receipts: (p: PaginationQuery) => db.ingresoMateriaPrima.findMany({ ...page(p), include: { inventario: true, materia_prima: true } }),
  receipt: (id: string) => db.ingresoMateriaPrima.findUnique({ where: { id }, include: { inventario: true, materia_prima: true } }),
  inventory: (p: PaginationQuery) => db.inventarioMateriaPrima.findMany({ ...page(p), include: { materia_prima: true, ingresos: true } }),
  inventoryLot: (id: string) => db.inventarioMateriaPrima.findUnique({ where: { id }, include: { materia_prima: true, ingresos: true, detalles_consumo: { include: { consumo: { include: { orden: { include: { producto: true, pedido: { include: { cliente: true } }, envasados: true, controles_calidad: { include: { parametros: true } } } } } } } } } }),
  consumptions: (p: PaginationQuery) => db.consumoMateriaPrima.findMany({ ...page(p), include: { orden: true, detalles: { include: { inventario: true, materia_prima: true } } } }),
  consumption: (id: string) => db.consumoMateriaPrima.findUnique({ where: { id }, include: { orden: true, detalles: { include: { inventario: true, materia_prima: true } } } }),
  quality: (p: PaginationQuery) => db.registroControlCalidad.findMany({ ...page(p), include: { parametros: true, orden: true } }),
  qualityRecord: (id: string) => db.registroControlCalidad.findUnique({ where: { id }, include: { parametros: true, orden: true } }),
  createQuality: (data: Prisma.RegistroControlCalidadUncheckedCreateInput) => db.registroControlCalidad.create({ data, include: { parametros: true } }),
  lots: (p: PaginationQuery) => db.registroEnvasado.findMany({ ...page(p), include: { orden: { include: { producto: true, controles_calidad: true } } } }),
  lot: (id: string) => db.registroEnvasado.findUnique({ where: { id }, include: { orden: true } }),
  users: (p: PaginationQuery) => db.usuario.findMany({ ...page(p), select: publicUser }),
  user: (id: string) => db.usuario.findUnique({ where: { id }, select: publicUser }),
  createUser: (data: Prisma.UsuarioCreateInput) => db.usuario.create({ data, select: publicUser }),
  suppliers: async (p: PaginationQuery) => db.ingresoMateriaPrima.findMany({ distinct: ['proveedor'], select: { proveedor: true }, take: p.limit, skip: p.offset, orderBy: { proveedor: 'asc' } }),
};
