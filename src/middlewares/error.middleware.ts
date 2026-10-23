import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { HttpError } from '../types/errors.js';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: 'Invalid input', details: error.issues });
  }

  if (error instanceof SyntaxError) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const status =
      error.code === 'P2002' || error.code === 'P2034'
        ? 409
        : error.code === 'P2003' || error.code === 'P2025'
        ? 404
        : 500;

    return res.status(status).json({
      error:
        status === 409
          ? 'Conflict: duplicate value or concurrent operation; retry'
          : status === 404
          ? 'Related resource not found'
          : 'Database operation failed',
    });
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return res.status(503).json({ error: 'Database unavailable' });
  }

  console.error('Unhandled server error:', error);
  return res.status(500).json({ error: 'Internal server error' });
}
