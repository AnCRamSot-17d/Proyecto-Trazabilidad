import { Router, Request, Response, NextFunction } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { domainController as c, wrap } from '../controllers/domain.controller.js';
import { domainService as s, required } from '../services/domain.service.js';
import { paginationSchema, id, PaginationQuery } from '../schemas/validation.js';
import { readOnly } from '../config/env.js';
import { HttpError } from '../types/errors.js';
export const apiOperations: {method:string;path:string}[] = [
  {method:'GET',path:'/api/health'}, {method:'POST',path:'/api/auth/login'}, {method:'POST',path:'/api/auth/refresh'}, {method:'GET',path:'/api/auth/me'}, {method:'POST',path:'/api/auth/read-only-session'},
  ...['/lots/:id/traceability','/material-lots/:id/traceability','/inventory/:id/traceability','/production-orders/:id/traceability'].map(path=>({method:'GET',path:'/api'+path}))
];
const router = Router();
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use(authenticateToken);
router.use((req: AuthenticatedRequest, _res, next) => {
  if (!['GET','HEAD','OPTIONS'].includes(req.method)) {
    if (readOnly) return next(new HttpError(403, 'Base protegida: servidor en modo de solo lectura.'));
    if (req.user?.role !== 'ADMINISTRADOR' && !(req.user?.role === 'CALIDAD' && ['/quality','/calidad'].includes(req.path))) return next(new HttpError(403, 'Permisos insuficientes.'));
  }
  next();
});
function resource(paths: string[], list: (p: PaginationQuery) => Promise<unknown>, one?: (id: string) => Promise<unknown>, create?: (data: unknown) => Promise<unknown>, update?: (key: string, data: unknown) => Promise<unknown>) {
  const child = Router();
  child.get('/', c.list(list));
  if (one) child.get('/:id', c.get(one));
  if (create) child.post('/', c.create(create));
  if (update) child.patch('/:id', c.update(update));
  for (const path of paths) {
    apiOperations.push({method:'GET',path:'/api'+path});
    if(one) apiOperations.push({method:'GET',path:'/api'+path+'/:id'});
    if(create) apiOperations.push({method:'POST',path:'/api'+path});
    if(update) apiOperations.push({method:'PATCH',path:'/api'+path+'/:id'});
    router.use(path,child);
  }
}
// Trace routes precede resource identifiers. Material-lot id means inventory UUID.
router.get('/lots/:id/traceability', wrap(async (req,res) => res.json(await s.backward(id.parse(req.params.id)))));
router.get('/material-lots/:id/traceability', wrap(async (req,res) => res.json(await s.forwardReceipt(id.parse(req.params.id)))));
router.get('/inventory/:id/traceability', wrap(async (req,res) => res.json(await s.forward(id.parse(req.params.id)))));
router.get('/production-orders/:id/traceability', wrap(async (req,res) => res.json(await required(s.productionOrder(id.parse(req.params.id))))));
router.use('/users', (req: AuthenticatedRequest, _res, next) => (req.user?.role === 'ADMINISTRADOR' || (readOnly && req.user?.role === 'LECTOR_LOCAL' && ['GET','HEAD'].includes(req.method))) ? next() : next(new HttpError(403, 'Solo administradores.')));
resource(['/users'], s.users, s.user, s.createUser, s.updateUser);
resource(['/products'], s.products, s.product, s.createProduct, s.updateProduct);
resource(['/materials'], s.materials, s.material, s.createMaterial, s.updateMaterial);
resource(['/clients','/clientes'], s.clients, s.client, s.createClient, s.updateClient);
resource(['/orders','/pedidos'], s.orders, s.order, s.createOrder);
resource(['/production-orders'], s.productionOrders, s.productionOrder, s.createProductionOrder);
resource(['/material-lots','/ingresos-mp'], s.receipts, s.receipt, s.createReceipt);
resource(['/consumptions','/consumos'], s.consumptions, s.consumption, s.createConsumption);
resource(['/inventory','/inventario'], s.inventory, s.inventoryLot);
resource(['/quality','/calidad'], s.quality, s.qualityRecord, s.createQuality);
resource(['/lots'], s.lots, s.lot, s.createLot);
resource(['/suppliers'], s.suppliers);
router.all('/shipments', (_req,_res,next) => next(new HttpError(501, 'El esquema actual no contiene despachos.')));
export default router;
