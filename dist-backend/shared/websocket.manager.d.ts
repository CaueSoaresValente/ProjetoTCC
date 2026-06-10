import { Server } from 'http';
export declare class WebSocketManager {
    private static wss;
    private static clientsMap;
    static initialize(server: Server): void;
    /**
     * Envia uma mensagem para todos os clientes conectados
     */
    static broadcast(message: {
        type: string;
        [key: string]: any;
    }): void;
    /**
     * Notifica um usuário que sua sessão expirou e fecha todas as conexões ativas dele
     */
    static notifyUserSessionExpired(idUsuario: number): void;
}
//# sourceMappingURL=websocket.manager.d.ts.map