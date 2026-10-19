import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import supplierRoutes from './supplier.routes.js';
import materialRoutes from './material.routes.js';
import materialLotRoutes from './material-lot.routes.js';
import productionOrderRoutes from './production-order.routes.js';
import lotRoutes from './lot.routes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/suppliers', supplierRoutes);
apiRouter.use('/materials', materialRoutes);
apiRouter.use('/material-lots', materialLotRoutes);
apiRouter.use('/production-orders', productionOrderRoutes);
apiRouter.use('/lots', lotRoutes);

export default apiRouter;
