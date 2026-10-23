import { runtimeSecret } from './env.js';
export const JWT_CONFIG = { secret: runtimeSecret, expiresIn: '30m', inactivityLimitMinutes: 30 };
