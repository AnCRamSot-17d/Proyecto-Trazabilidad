import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

export const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Montaje de rutas de la API bajo el prefijo /api
app.use('/api', apiRouter);

// Manejador centralizado de errores
app.use(errorHandler);

app.use((_req, res) => { res.status(404).json({ error: 'Ruta no encontrada.' }); });
