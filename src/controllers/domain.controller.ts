import { Request, Response, NextFunction } from 'express';
import { paginationSchema, id, PaginationQuery } from '../schemas/validation.js';
import { required } from '../services/domain.service.js';
export const wrap = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => { Promise.resolve(fn(req,res)).catch(next); };
export const domainController = {
  list: (fn: (p: PaginationQuery) => Promise<unknown>) => wrap(async (req,res) => res.json(await fn(paginationSchema.parse(req.query)))),
  get: (fn: (key: string) => Promise<unknown>) => wrap(async (req,res) => res.json(await required(fn(id.parse(req.params.id))))),
  create: (fn: (data: unknown) => Promise<unknown>) => wrap(async (req,res) => res.status(201).json(await fn(req.body))),
  update: (fn: (key: string, data: unknown) => Promise<unknown>) => wrap(async (req,res) => res.json(await fn(id.parse(req.params.id),req.body))),
};
