import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const db: PrismaClient & Record<string, any> = (globalForPrisma.prisma ?? new PrismaClient()) as any;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

