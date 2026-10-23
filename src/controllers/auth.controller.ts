import { z } from 'zod';
import { HttpError } from '../types/errors.js';
import { Request, Response, NextFunction } from 'express';
import { loginSchema } from '../schemas/auth.schema.js';
import { authService } from '../services/auth.service.js';

export class AuthController {
  async readOnlySession(req: Request, res: Response, next: NextFunction) {
    try {
      if (!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '')) throw new HttpError(403, 'Acceso solo desde este equipo.');
      const {key} = z.object({key:z.string().min(64).max(256)}).strict().parse(req.body);
      return res.json(authService.localReadOnlySession(key));
    } catch(error) { next(error); }
  }

  /**
   * POST /api/auth/login
   * Valida payload con Zod y devuelve token JWT con 30 minutos de vida
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.login(validatedData);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   * Permite renovar el token JWT por otros 30 minutos mientras el usuario interactúa
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : req.body?.token;

      if (!token) {
        return res.status(401).json({ error: 'Token de sesión requerido para renovación.' });
      }

      const result = await authService.refreshToken(token);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Retorna los datos del usuario autenticado actual a partir del token
   */
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado.' });
      }

      const user = await authService.verifyToken(token);
      return res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
