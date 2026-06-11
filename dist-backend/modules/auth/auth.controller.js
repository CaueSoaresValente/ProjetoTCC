import { AuthService } from './auth.service.js';
import { CadastroRepository } from '../cadastro/cadastro.repository.js';
export class AuthController {
    authService = new AuthService();
    cadastroRepo = new CadastroRepository();
    async login(req, res) {
        const { email, senha } = req.body;
        try {
            const result = await this.authService.login(email, senha);
            if (!result) {
                return res.status(401).json({ message: 'E-mail ou senha incorretos' });
            }
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    // ============================================================
    // LOGIN COM GOOGLE — Recebe o credential e valida no backend
    // ============================================================
    async loginGoogle(req, res) {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ message: 'Credential do Google não fornecido' });
        }
        try {
            const result = await this.authService.loginWithGoogle(credential);
            if (!result) {
                return res.status(401).json({
                    message: 'Este e-mail não está cadastrado no sistema. Solicite acesso ao gestor.',
                });
            }
            return res.status(200).json(result);
        }
        catch (error) {
            console.error('[GOOGLE LOGIN CONTROLLER] Erro:', error.message);
            return res.status(500).json({ message: error.message });
        }
    }
    async recuperarSenha(req, res) {
        const { email } = req.body;
        try {
            const result = await this.authService.solicitarRecuperacao(email);
            return res.status(200).json({ success: result });
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    async redefinirSenha(req, res) {
        const { email, novaSenha } = req.body;
        try {
            const result = await this.authService.redefinirSenha(email, novaSenha);
            if (!result) {
                return res.status(404).json({ message: 'E-mail não encontrado' });
            }
            return res.status(200).json({ success: true, message: 'Senha redefinida com sucesso' });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    // ============================================================
    // VERIFICAÇÃO DE SESSÃO — Checa se o perfil ainda está ativo
    // ============================================================
    async checkSession(req, res) {
        try {
            const usuario = req.usuario;
            const cadastro = await this.cadastroRepo.findById(usuario.idUsuario);
            if (!cadastro || !cadastro.status) {
                return res.status(200).json({ ativo: false, motivo: 'perfil_excluido' });
            }
            return res.status(200).json({ ativo: true });
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}
//# sourceMappingURL=auth.controller.js.map