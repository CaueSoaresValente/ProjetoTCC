import { Request, Response } from 'express';
export declare class PerfilController {
    private service;
    /**
     * GET /api/perfil
     * Retorna os dados do próprio usuário logado.
     */
    meuPerfil(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * PUT /api/perfil
     * Atualiza nome e/ou foto do usuário logado.
     */
    atualizarPerfil(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * PUT /api/perfil/senha
     * Altera a senha do usuário logado.
     * Não requer a senha atual a pedido do usuário.
     */
    alterarSenha(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=perfil.controller.d.ts.map