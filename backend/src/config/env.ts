import 'dotenv/config';
import { randomBytes } from 'node:crypto';
function isolatedDatabase() {
  try { const url = new URL(process.env.DATABASE_URL ?? ''); return ['127.0.0.1','localhost','[::1]'].includes(url.hostname) && /^\/biotrace_test_[a-z0-9_]+$/.test(url.pathname); } catch { return false; }
}
// Shared databases are always read-only, even if a local flag is set incorrectly.
export const readOnly = !(process.env.DB_READ_ONLY === 'false' && isolatedDatabase());
export const jwtSecret = process.env.JWT_SECRET;
export const runtimeSecret = jwtSecret && jwtSecret.length >= 32 ? jwtSecret : randomBytes(48).toString('hex');
export const databaseConfigured = Boolean(process.env.DATABASE_URL);
export function datasourceUrl() {
  if (!process.env.DATABASE_URL) return undefined;
  const url = new URL(process.env.DATABASE_URL);
  if (readOnly) url.searchParams.set('options', (url.searchParams.get('options') ?? '') + ' -c default_transaction_read_only=on');
  return url.toString();
}

export const readOnlyAccessKey = process.env.READ_ONLY_ACCESS_KEY;
