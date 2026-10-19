import { Request, Response, NextFunction } from 'express';
import { authService, AuthUser } from '../services/auth.service.js';

// Extendemos Request de Express para incluir req.user
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/**
 * Middleware para proteger endpoints con JWT de 30 minutos
 * Retorna 401 si no hay token o si ya expiró por inactividad/tiempo
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      error: 'Acceso no autorizado: Se requiere token JWT válido.',
      code: 'TOKEN_MISSING',
    });
  }

  try {
    const user = authService.verifyToken(token);
    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      error: 'Sesión expirada o token inválido (límite de 30 minutos alcanzado).',
      code: 'TOKEN_EXPIRED',
    });
  }
}
