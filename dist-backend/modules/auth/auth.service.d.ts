export declare class AuthService {
    private cadastroRepo;
    login(email: string, senha: string): Promise<{
        token: string;
        usuario: any;
    } | null>;
    verifyToken(token: string): any | null;
    solicitarRecuperacao(email: string): Promise<boolean>;
    redefinirSenha(email: string, novaSenha: string): Promise<boolean>;
}
//# sourceMappingURL=auth.service.d.ts.map