// ============================================================
// src/backend/modules/perfil/perfil.controller.ts
// ============================================================
// Controller para o endpoint "Meu Perfil".
// Permite que QUALQUER usuário logado (gestor, opp, professor)
// atualize seu próprio nome, senha e foto de perfil.
// ============================================================
import { PerfilService } from './perfil.service.js';
export class PerfilController {
    service = new PerfilService();
    /**
     * GET /api/perfil
     * Retorna os dados do próprio usuário logado.
     */
    async meuPerfil(req, res) {
        try {
            const usuario = req.usuario;
            const result = await this.service.buscarPerfil(usuario.idUsuario);
            if (!result)
                return res.status(404).json({ message: 'Usuário não encontrado' });
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    /**
     * PUT /api/perfil
     * Atualiza nome e/ou foto do usuário logado.
     */
    async atualizarPerfil(req, res) {
        try {
            const usuario = req.usuario;
            const { nome, email, fotoPerfil } = req.body;
            const result = await this.service.atualizarPerfil(usuario.idUsuario, { nome, email, fotoPerfil });
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    /**
     * PUT /api/perfil/senha
     * Altera a senha do usuário logado.
     * Não requer a senha atual a pedido do usuário.
     */
    async alterarSenha(req, res) {
        try {
            const usuario = req.usuario;
            const { novaSenha } = req.body;
            if (!novaSenha) {
                return res.status(400).json({ message: 'Nova senha é obrigatória' });
            }
            await this.service.alterarSenha(usuario.idUsuario, novaSenha);
            return res.status(200).json({ message: 'Senha alterada com sucesso' });
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}
//# sourceMappingURL=perfil.controller.js.map