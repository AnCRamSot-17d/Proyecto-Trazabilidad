import dotenv from 'dotenv';
import { app } from './app.js';

dotenv.config();

const PORT = Number(process.env.APP_PORT || process.env.PORT || 3000);
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor de Trazabilidad Universal escuchando en http://${HOST}:${PORT}`);
  console.log(`📡 Endpoints disponibles bajo http://${HOST}:${PORT}/api`);
});
