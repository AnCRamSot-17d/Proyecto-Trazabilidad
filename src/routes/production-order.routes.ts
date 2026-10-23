import { Router } from 'express';
import { productionOrderController } from '../controllers/production-order.controller.js';

const router = Router();

router.get('/', (req, res, next) => productionOrderController.getAll(req, res, next));
router.post('/', (req, res, next) => productionOrderController.create(req, res, next));

export default router;
