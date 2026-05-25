export declare class PerfilService {
    private repo;
    private cadastroRepo;
    /**
     * Busca os dados do perfil do usuário logado.
     */
    buscarPerfil(idUsuario: number): Promise<{
        idUsuario: number;
        nome: string;
        email: string;
        funcao: string;
        fotoPerfil: any;
    } | null>;
    /**
     * Atualiza nome, e-mail e/ou foto de perfil.
     */
    atualizarPerfil(idUsuario: number, dados: {
        nome?: string;
        email?: string;
        fotoPerfil?: string;
    }): Promise<{
        idUsuario: number;
        nome: string;
        email: string;
        funcao: string;
        fotoPerfil: any;
    } | null>;
    /**
     * Altera a senha do usuário.
     * Não requer a senha atual ou validações de força de senha a pedido do usuário.
     */
    alterarSenha(idUsuario: number, novaSenha: string): Promise<void>;
}
//# sourceMappingURL=perfil.service.d.ts.map