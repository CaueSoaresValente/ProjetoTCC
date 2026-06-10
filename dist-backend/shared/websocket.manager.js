import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || "senai-super-secreto-2026";
export class WebSocketManager {
    static wss = null;
    static clientsMap = new Map();
    static initialize(server) {
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
                    const decoded = jwt.verify(token, JWT_SECRET);
                    if (!decoded || !decoded.idUsuario) {
                        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                        socket.destroy();
                        return;
                    }
                    this.wss.handleUpgrade(request, socket, head, (ws) => {
                        ws.idUsuario = Number(decoded.idUsuario);
                        ws.isAlive = true;
                        this.wss.emit('connection', ws, request);
                    });
                }
                catch (err) {
                    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                    socket.destroy();
                }
            }
        });
        this.wss.on('connection', (ws) => {
            if (!ws.idUsuario)
                return;
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
                }
                else {
                    this.clientsMap.delete(userId);
                }
            });
            ws.on('error', (err) => {
                console.error(`❌ Erro no WebSocket do usuario ${userId}:`, err);
            });
        });
        // Ping/Pong para manter conexões ativas e limpar conexões mortas
        const interval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
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
     * Envia uma mensagem para todos os clientes conectados
     */
    static broadcast(message) {
        if (!this.wss) {
            console.log('⚠️ WebSocketManager não está inicializado para fazer broadcast.');
            return;
        }
        const msgString = JSON.stringify(message);
        let count = 0;
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msgString);
                count++;
            }
        });
        console.log(`⚡ Broadcast WebSocket enviado para ${count} clientes: ${msgString}`);
    }
    /**
     * Notifica um usuário que sua sessão expirou e fecha todas as conexões ativas dele
     */
    static notifyUserSessionExpired(idUsuario) {
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
//# sourceMappingURL=websocket.manager.js.map