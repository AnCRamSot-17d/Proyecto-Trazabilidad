import { Router } from 'express';
import { supplierController } from '../controllers/supplier.controller.js';

const router = Router();

router.get('/', (req, res, next) => supplierController.getAll(req, res, next));
router.post('/', (req, res, next) => supplierController.create(req, res, next));

export default router;
