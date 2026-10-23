import { Prisma } from '@prisma/client';
import { db } from '../config/db.js';
import { domainRepository as r } from '../repositories/domain.repository.js';
import { schemas, updates } from '../schemas/validation.js';
import { HttpError } from '../types/errors.js';
import { hashPassword } from './password.service.js';
export async function required<T>(promise: Promise<T | null>): Promise<T> { const value = await promise; if (!value) throw new HttpError(404, 'Registro no encontrado.'); return value; }
export const domainService = {
  ...r,
  async updateProduct(id: string, input: unknown) { return r.updateProduct(id, updates.products.parse(input)); },
  async updateMaterial(id: string, input: unknown) { return r.updateMaterial(id, updates.materials.parse(input)); },
  async updateClient(id: string, input: unknown) { return r.updateClient(id, updates.clients.parse(input)); },
  async updateUser(id: string, input: unknown) {
    const data = updates.users.parse(input);
    return db.$transaction(async tx => {
      const previous = await required(tx.usuario.findUnique({ where: { id } }));
      if (previous.activo && previous.rol === 'ADMINISTRADOR' && (data.activo === false || (data.rol && data.rol !== 'ADMINISTRADOR'))) {
        if (await tx.usuario.count({ where: { activo: true, rol: 'ADMINISTRADOR' } }) <= 1) throw new HttpError(409, 'No se puede desactivar al ?ltimo administrador.');
      }
      return tx.usuario.update({ where: { id }, data: { ...data, ...(data.password ? { password: await hashPassword(data.password) } : {}) }, select: { id:true, email:true, nombre:true, rol:true, estacion:true, activo:true } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  },

  async createProduct(input: unknown) { return r.createProduct(schemas.products.parse(input)); },
  async createMaterial(input: unknown) { return r.createMaterial(schemas.materials.parse(input)); },
  async createClient(input: unknown) { return r.createClient(schemas.clients.parse(input)); },
  async createOrder(input: unknown) {
    const { detalles, ...data } = schemas.orders.parse(input);
    if (detalles.some(d => new Prisma.Decimal(d.precio_unitario).mul(d.cantidad).gt('9999999999.99'))) throw new HttpError(400, 'Subtotal fuera del rango permitido.');
    return r.createOrder({ ...data, detalles: { create: detalles.map(d => ({ ...d, subtotal: new Prisma.Decimal(d.precio_unitario).mul(d.cantidad) })) } });
  },
  async createProductionOrder(input: unknown) {
    const data = schemas['production-orders'].parse(input);
    return db.$transaction(async tx => {
      const product = await required(tx.producto.findUnique({ where: { id: data.producto_id } }));
      if (data.pedido_id) {
        const order = await required(tx.pedido.findUnique({ where: { id: data.pedido_id }, include: { detalles: true } }));
        if (product.cliente_id && product.cliente_id !== order.cliente_id) throw new HttpError(409, 'El producto y el pedido pertenecen a clientes diferentes.');
        if (!order.detalles.some(d => d.nombre_producto === product.nombre_producto)) throw new HttpError(409, 'El producto no forma parte del pedido.');
      }
      return tx.ordenProduccion.create({ data });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  },
  async createReceipt(input: unknown) {
    const { lote_interno, ...data } = schemas['material-lots'].parse(input);
    return db.$transaction(async tx => {
      await required(tx.materiaPrima.findUnique({ where: { id: data.materia_prima_id } }));
      const existing = await tx.inventarioMateriaPrima.findUnique({ where: { lote_interno } });
      if (existing && existing.materia_prima_id !== data.materia_prima_id) throw new HttpError(409, 'El lote pertenece a otra materia prima.');
      const inventory = existing
        ? await tx.inventarioMateriaPrima.update({ where: { id: existing.id }, data: { stock_disponible: { increment: data.cantidad_recibida }, fecha_actualizacion: new Date() } })
        : await tx.inventarioMateriaPrima.create({ data: { lote_interno, materia_prima_id: data.materia_prima_id, stock_disponible: data.cantidad_recibida } });
      return tx.ingresoMateriaPrima.create({ data: { ...data, inventario_id: inventory.id }, include: { inventario: true, materia_prima: true } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  },
  async createConsumption(input: unknown) {
    const { detalles, ...data } = schemas.consumptions.parse(input);
    if (new Set(detalles.map(d => d.inventario_id)).size !== detalles.length) throw new HttpError(400, 'Lotes de inventario duplicados.');
    return db.$transaction(async tx => {
      await required(tx.ordenProduccion.findUnique({ where: { id: data.orden_id } }));
      for (const d of detalles) {
        const changed = await tx.inventarioMateriaPrima.updateMany({ where: { id: d.inventario_id, materia_prima_id: d.materia_prima_id, stock_disponible: { gte: d.peso_real_consumido }, materia_prima: { unidad_medida: data.unidad_lote } }, data: { stock_disponible: { decrement: d.peso_real_consumido }, fecha_actualizacion: new Date() } });
        if (changed.count !== 1) throw new HttpError(409, 'Stock insuficiente, lote inexistente o materia prima/unidad incompatible.');
      }
      const programmed = detalles.reduce((sum, d) => sum.add(d.cantidad_programada), new Prisma.Decimal(0));
      const actual = detalles.reduce((sum, d) => sum.add(d.peso_real_consumido), new Prisma.Decimal(0));
      return tx.consumoMateriaPrima.create({ data: { ...data, total_programado: programmed, total_real_consumido: actual, variacion_diferencia: actual.sub(programmed), detalles: { create: detalles } }, include: { detalles: true } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  },
  async createQuality(input: unknown) {
    const { parametros, ...data } = schemas.quality.parse(input);
    if (data.muestra_aprobada && parametros.some(p => !p.cumple)) throw new HttpError(400, 'Una muestra con parámetros incumplidos no puede aprobarse.');
    return r.createQuality({ ...data, parametros: { create: parametros } });
  },
  async createLot(input: unknown) {
    const data = schemas.lots.parse(input);
    return db.$transaction(async tx => {
      const order = await required(tx.ordenProduccion.findUnique({ where: { id: data.orden_id } }));
      const totals = await tx.registroEnvasado.aggregate({ where: { orden_id: data.orden_id }, _sum: { total_unidades: true } });
      if (new Prisma.Decimal(totals._sum.total_unidades ?? 0).add(data.total_unidades).gt(order.cantidad_programada)) throw new HttpError(409, 'Las unidades envasadas exceden la cantidad programada.');
      return tx.registroEnvasado.create({ data });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  },
  async createUser(input: unknown) { const data = schemas.users.parse(input); return r.createUser({ ...data, password: await hashPassword(data.password) }); },
  async backward(id: string) { const lot = await required(r.lot(id)); return { ...lot, orden: await required(r.productionOrder(lot.orden_id)) }; },
  async forwardReceipt(id: string) { const receipt = await required(r.receipt(id)); return required(r.inventoryLot(receipt.inventario_id)); },
  async forward(id: string) { return required(r.inventoryLot(id)); },
};
