import { Router } from 'express';
import { materialLotController } from '../controllers/material-lot.controller.js';
import { traceabilityController } from '../controllers/traceability.controller.js';

const router = Router();

router.get('/', (req, res, next) => materialLotController.getAll(req, res, next));
router.post('/', (req, res, next) => materialLotController.create(req, res, next));
router.get('/:id/traceability', (req, res, next) => traceabilityController.getForward(req, res, next));

export default router;
