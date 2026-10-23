import { Request, Response, NextFunction } from 'express';
import { authService, AuthUser } from '../services/auth.service.js';
import { HttpError } from '../types/errors.js';
export interface AuthenticatedRequest extends Request { user?: AuthUser; }
export async function authenticateToken(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new HttpError(401, 'Token requerido.'));
  try { req.user = await authService.verifyToken(header.slice(7)); next(); } catch (error) { next(error); }
}
