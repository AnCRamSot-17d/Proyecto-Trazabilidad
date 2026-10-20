import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/jwt.js';
import { HttpError } from '../types/errors.js';
import { LoginInput } from '../schemas/auth.schema.js';
import { db } from '../config/db.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  station: string;
}

export interface AuthResponse {
  token: string;
  expiresInSeconds: number;
  user: AuthUser;
}

/**
 * Usuario administrador oficial del sistema
 */
const DEFAULT_ADMIN_USER: AuthUser & { passwordHash: string } = {
  id: 'USR-ADMIN-01',
  email: 'admin@biotrace.com',
  name: 'Ing. Administrador de Trazabilidad',
  role: 'ADMINISTRADOR',
  station: 'Estación Central de Control y Liberación',
  passwordHash: 'BioTrace2026!',
};

export class AuthService {
  /**
   * Autenticación con verificación en base de datos PostgreSQL y generación de JWT de 30 minutos
   */
  async login(credentials: LoginInput): Promise<AuthResponse> {
    const emailNormalized = credentials.email.toLowerCase().trim();
    let authUser: AuthUser | null = null;

    try {
      // 1. Intento de consulta en base de datos real (Neon PostgreSQL)
      const dbUser = await db.usuario.findUnique({
        where: { email: emailNormalized },
      });

      if (dbUser) {
        if (!dbUser.activo) {
          throw new HttpError(403, 'El usuario se encuentra inactivo en la base de datos.');
        }

        if (dbUser.password !== credentials.password) {
          throw new HttpError(401, 'Credenciales inválidas. Verifique su correo institucional y contraseña.');
        }

        authUser = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.nombre,
          role: dbUser.rol,
          station: dbUser.estacion || 'Estación Central de Control',
        };
      }
    } catch (dbError: any) {
      // Si el error es de credenciales inválidas o usuario inactivo, propagarlo directamente
      if (dbError instanceof HttpError) {
        throw dbError;
      }
      // Si la base de datos no está disponible temporalmente, registrar aviso
      console.warn('Base de datos no disponible para consulta de usuario, evaluando usuario fallback:', dbError.message);
    }

    // 2. Si la base de datos no está conectada o no retornó usuario, evaluar usuario por defecto
    if (!authUser) {
      if (
        emailNormalized === DEFAULT_ADMIN_USER.email.toLowerCase() &&
        credentials.password === DEFAULT_ADMIN_USER.passwordHash
      ) {
        authUser = {
          id: DEFAULT_ADMIN_USER.id,
          email: DEFAULT_ADMIN_USER.email,
          name: DEFAULT_ADMIN_USER.name,
          role: DEFAULT_ADMIN_USER.role,
          station: DEFAULT_ADMIN_USER.station,
        };
      }
    }

    if (!authUser) {
      throw new HttpError(401, 'Credenciales inválidas. Verifique su correo institucional y contraseña.');
    }

    // 3. Firma de token JWT con validez estricta de 30 minutos
    const token = jwt.sign(authUser, JWT_CONFIG.secret, {
      expiresIn: '30m',
    });

    return {
      token,
      expiresInSeconds: 30 * 60, // 1800 segundos
      user: authUser,
    };
  }

  /**
   * Refresca el token JWT por otros 30 minutos si la sesión sigue activa
   */
  async refreshToken(currentToken: string): Promise<AuthResponse> {
    try {
      const decoded = jwt.verify(currentToken, JWT_CONFIG.secret) as AuthUser;

      const authUser: AuthUser = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        station: decoded.station,
      };

      const newToken = jwt.sign(authUser, JWT_CONFIG.secret, {
        expiresIn: '30m',
      });

      return {
        token: newToken,
        expiresInSeconds: 30 * 60,
        user: authUser,
      };
    } catch {
      throw new HttpError(401, 'Token de sesión expirado o inválido.');
    }
  }

  /**
   * Valida un token JWT y devuelve el usuario decodificado
   */
  verifyToken(token: string): AuthUser {
    try {
      return jwt.verify(token, JWT_CONFIG.secret) as AuthUser;
    } catch {
      throw new HttpError(401, 'Token de autorización inválido o expirado.');
    }
  }
}

export const authService = new AuthService();
