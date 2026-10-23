import { timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/jwt.js';
import { jwtSecret, readOnly, readOnlyAccessKey } from '../config/env.js';
import { HttpError } from '../types/errors.js';
import { LoginInput } from '../schemas/auth.schema.js';
import { db } from '../config/db.js';
import { verifyPassword } from './password.service.js';
export interface AuthUser { id: string; email: string; name: string; role: string; station: string; }
export interface AuthResponse { token: string; expiresInSeconds: number; user: AuthUser; }
export class AuthService {
  private sign(user: AuthUser): AuthResponse {
    if (!jwtSecret || jwtSecret.length < 32) throw new HttpError(503, 'Configure JWT_SECRET con al menos 32 caracteres.');
    return { token: jwt.sign({ id: user.id, ...(user.role === 'LECTOR_LOCAL' ? { scope: 'read-only-local' } : {}) }, JWT_CONFIG.secret, { expiresIn: '30m', algorithm: 'HS256', issuer: 'biotrace', audience: 'biotrace-web' }), expiresInSeconds: 1800, user };
  }
  localReadOnlySession(key: string) {
    if (!readOnly || !readOnlyAccessKey || readOnlyAccessKey.length < 64) throw new HttpError(404, 'Acceso local de consulta no disponible.');
    const supplied = Buffer.from(key); const expected = Buffer.from(readOnlyAccessKey);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new HttpError(401, 'Clave local incorrecta.');
    return this.sign(this.localReader());
  }
  private localReader(): AuthUser { return { id:'local-read-only', email:'', name:'Consulta local', role:'LECTOR_LOCAL', station:'Solo lectura' }; }
  async login(credentials: LoginInput) {
    const user = await db.usuario.findUnique({ where: { email: credentials.email.trim().toLowerCase() } });
    if (!user || !user.activo || !await verifyPassword(credentials.password, user.password)) throw new HttpError(401, 'Credenciales inválidas o contraseña pendiente de actualización segura.');
    return this.sign({ id: user.id, email: user.email, name: user.nombre, role: user.rol, station: user.estacion ?? '' });
  }
  async refreshToken(token: string) { return this.sign(await this.verifyToken(token)); }
  async verifyToken(token: string): Promise<AuthUser> {
    let id: string;
    try {
      if (!jwtSecret || jwtSecret.length < 32) throw new Error();
      const decoded = jwt.verify(token, JWT_CONFIG.secret, { algorithms: ['HS256'], issuer: 'biotrace', audience: 'biotrace-web' });
      if (typeof decoded === 'string' || typeof decoded.id !== 'string') throw new Error();
      if (decoded.id === 'local-read-only' && decoded.scope === 'read-only-local' && readOnly && readOnlyAccessKey && readOnlyAccessKey.length >= 64) return this.localReader();
      id = decoded.id;
    } catch { throw new HttpError(401, 'Token inválido o expirado.'); }
    const user = await db.usuario.findUnique({ where: { id } });
    if (!user?.activo) throw new HttpError(401, 'Usuario inactivo o inexistente.');
    return { id: user.id, email: user.email, name: user.nombre, role: user.rol, station: user.estacion ?? '' };
  }
}
export const authService = new AuthService();
