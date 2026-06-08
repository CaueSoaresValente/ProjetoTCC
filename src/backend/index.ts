import 'reflect-metadata';
import app from './app.js';
import { initializeDatabase } from './database/index.js';
import { WebSocketManager } from './shared/websocket.manager.js';

const PORT = Number(process.env.PORT) || 3001;

const startServer = async () => {
  await initializeDatabase();
  const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });
  
  // Inicializa o servidor de WebSockets atrelado ao servidor HTTP
  WebSocketManager.initialize(server);
};

startServer().catch((error) => {
  console.error('❌ Erro fatal ao iniciar servidor:', error);
});
