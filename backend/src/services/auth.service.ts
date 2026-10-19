import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/jwt.js';
import { HttpError } from '../types/errors.js';
import { LoginInput } from '../schemas/auth.schema.js';

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
 * Usuarios demo precargados para auditorías y pruebas académicas en Dermo-Cosmética & Farma
 */
const SYSTEM_USERS: (AuthUser & { passwordHash: string })[] = [
  {
    id: 'USR-DIR-01',
    email: 'director@biotrace.com',
    name: 'Dra. Elena Vasquez',
    role: 'Director Técnico (Dermo-Cosmética)',
    station: 'Estación Principal de Control y Liberación',
    passwordHash: 'DermoPharma2026!',
  },
  {
    id: 'USR-AUD-02',
    email: 'auditor.calidad@biotrace.com',
    name: 'Lic. Carlos Mendoza',
    role: 'Auditor Calidad & GMP',
    station: 'Laboratorio de Aseguramiento de Calidad',
    passwordHash: 'CalidadGMP2026!',
  },
  {
    id: 'USR-FORM-03',
    email: 'formulador@biotrace.com',
    name: 'Ing. Sofia Morales',
    role: 'Especialista en Formulación Magistral',
    station: 'Área de Reactores y Mezclas Limpias',
    passwordHash: 'Formulacion2026!',
  },
];

export class AuthService {
  /**
   * Autenticación con verificación de credenciales y generación de JWT de 30 minutos
   */
  async login(credentials: LoginInput): Promise<AuthResponse> {
    const userFound = SYSTEM_USERS.find(
      (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
    );

    if (!userFound || userFound.passwordHash !== credentials.password) {
      throw new HttpError(401, 'Credenciales inválidas. Verifique su correo institucional y contraseña.');
    }

    const authUser: AuthUser = {
      id: userFound.id,
      email: userFound.email,
      name: userFound.name,
      role: userFound.role,
      station: userFound.station,
    };

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
