/**
 * Configuración centralizada de JSON Web Token (JWT)
 * Tiempo de expiración oficial: 30 minutos (1800 segundos)
 */
export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'biotrace-jwt-super-secret-key-30m-2026',
  expiresIn: '30m', // Expiración exacta de 30 minutos
  inactivityLimitMinutes: 30,
};
