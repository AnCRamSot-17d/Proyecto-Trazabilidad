import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';

const router = Router();

router.get('/', (req, res, next) => productController.getAll(req, res, next));
router.post('/', (req, res, next) => productController.create(req, res, next));

export default router;
