import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';

const authRoutes = Router();

// Endpoint de autenticación (genera JWT de 30 minutos)
authRoutes.post('/login', (req, res, next) => authController.login(req, res, next));

// Endpoint para renovar el token si el usuario se mantiene activo
authRoutes.post('/refresh', (req, res, next) => authController.refresh(req, res, next));

// Endpoint para consultar datos de la sesión actual
authRoutes.get('/me', (req, res, next) => authController.me(req, res, next));

export default authRoutes;
