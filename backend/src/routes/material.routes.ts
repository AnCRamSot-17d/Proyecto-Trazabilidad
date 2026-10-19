import { Router } from 'express';
import { materialController } from '../controllers/material.controller.js';

const router = Router();

router.get('/', (req, res, next) => materialController.getAll(req, res, next));
router.post('/', (req, res, next) => materialController.create(req, res, next));

export default router;
