import { Router } from 'express';
import { lotController } from '../controllers/lot.controller.js';
import { traceabilityController } from '../controllers/traceability.controller.js';

const router = Router();

router.get('/', (req, res, next) => lotController.getAll(req, res, next));
router.post('/', (req, res, next) => lotController.create(req, res, next));
router.get('/:id/traceability', (req, res, next) => traceabilityController.getBackward(req, res, next));

export default router;
