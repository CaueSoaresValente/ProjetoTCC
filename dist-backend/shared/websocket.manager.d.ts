import { Server } from 'http';
export declare class WebSocketManager {
    private static wss;
    private static clientsMap;
    static initialize(server: Server): void;
    /**
     * Notifica um usuário que sua sessão expirou e fecha todas as conexões ativas dele
     */
    static notifyUserSessionExpired(idUsuario: number): void;
}
//# sourceMappingURL=websocket.manager.d.ts.map