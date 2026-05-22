import 'reflect-metadata';
import app from './app.js';
import { initializeDatabase } from './database/index.js';

const PORT = Number(process.env.PORT) || 3001;

const startServer = async () => {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('❌ Erro fatal ao iniciar servidor:', error);
});
