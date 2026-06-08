import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "senai-super-secreto-2026";

interface CustomWebSocket extends WebSocket {
  idUsuario?: number;
  isAlive?: boolean;
}

export class WebSocketManager {
  private static wss: WebSocketServer | null = null;
  private static clientsMap = new Map<number, CustomWebSocket[]>();

  public static initialize(server: Server) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      
      // Só aceitamos upgrade na rota /api/ws
      if (url.pathname === '/api/ws') {
        const token = url.searchParams.get('token');

        if (!token) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          if (!decoded || !decoded.idUsuario) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
          }

          this.wss!.handleUpgrade(request, socket, head, (ws: CustomWebSocket) => {
            ws.idUsuario = Number(decoded.idUsuario);
            ws.isAlive = true;
            this.wss!.emit('connection', ws, request);
          });
        } catch (err) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
        }
      }
    });

    this.wss.on('connection', (ws: CustomWebSocket) => {
      if (!ws.idUsuario) return;

      const userId = ws.idUsuario;
      console.log(`🔌 Cliente WebSocket conectado: idUsuario=${userId}`);

      const sockets = this.clientsMap.get(userId) || [];
      sockets.push(ws);
      this.clientsMap.set(userId, sockets);

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('close', () => {
        console.log(`🔌 Cliente WebSocket desconectado: idUsuario=${userId}`);
        const sockets = this.clientsMap.get(userId) || [];
        const filtered = sockets.filter(s => s !== ws);
        if (filtered.length > 0) {
          this.clientsMap.set(userId, filtered);
        } else {
          this.clientsMap.delete(userId);
        }
      });

      ws.on('error', (err) => {
        console.error(`❌ Erro no WebSocket do usuario ${userId}:`, err);
      });
    });

    // Ping/Pong para manter conexões ativas e limpar conexões mortas
    const interval = setInterval(() => {
      this.wss!.clients.forEach((ws: CustomWebSocket) => {
        if (ws.isAlive === false) {
          console.log(`🧹 Removendo conexão inativa do usuário: ${ws.idUsuario}`);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  /**
   * Notifica um usuário que sua sessão expirou e fecha todas as conexões ativas dele
   */
  public static notifyUserSessionExpired(idUsuario: number) {
    const sockets = this.clientsMap.get(idUsuario);
    if (!sockets || sockets.length === 0) {
      console.log(`ℹ️ Nenhuma conexão ativa via WebSocket para o usuário: ${idUsuario}`);
      return;
    }

    console.log(`🔔 Notificando exclusão de perfil para o usuário ${idUsuario} via WebSocket`);
    
    sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'SESSION_EXPIRED', reason: 'profile_deleted' }));
        // Código 4001: Código customizado para indicar encerramento forçado do perfil
        ws.close(4001, 'Perfil excluído pelo gestor');
      }
    });

    // Remove do mapa
    this.clientsMap.delete(idUsuario);
  }
}
