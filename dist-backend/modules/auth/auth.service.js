// src/backend/modules/auth/auth.service.ts
import jwt from "jsonwebtoken";
import { CadastroRepository } from "../cadastro/cadastro.repository.js";
const JWT_SECRET = process.env.JWT_SECRET || "senai-super-secreto-2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";
export class AuthService {
    cadastroRepo = new CadastroRepository();
    async login(email, senha) {
        console.log(`[LOGIN] Tentativa de login para e-mail: ${email}`);
        const usuario = await this.cadastroRepo.findByEmail(email);
        if (!usuario) {
            console.log(`[LOGIN] ❌ Usuário não encontrado no banco de dados para o e-mail: ${email}`);
            return null;
        }
        if (!usuario.status) {
            console.log(`[LOGIN] ❌ Usuário ${email} encontrado, mas está inativo (status = false)`);
            return null;
        }
        console.log(`[LOGIN] Usuário ${email} encontrado e ativo. Comparando senhas...`);
        const senhaCorreta = await this.cadastroRepo.comparePassword(senha, usuario.senha);
        if (!senhaCorreta) {
            console.log(`[LOGIN] ❌ Senha incorreta para o usuário ${email}`);
            return null;
        }
        console.log(`[LOGIN] ✅ Senha correta para o usuário ${email}! Efetuando login...`);
        // ==================== CORREÇÃO AQUI ====================
        const token = jwt.sign({
            idUsuario: usuario.idUsuario,
            email: usuario.email,
            funcao: usuario.funcao,
            nome: usuario.nome,
        }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } // ← Cast obrigatório aqui
        );
        // =======================================================
        const { senha: _, ...usuarioSemSenha } = usuario;
        return { token, usuario: usuarioSemSenha };
    }
    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        }
        catch {
            return null;
        }
    }
    async solicitarRecuperacao(email) {
        const usuario = await this.cadastroRepo.findByEmail(email);
        if (!usuario)
            return false;
        console.log(`🔑 Link de recuperação enviado para: ${email}`);
        return true;
    }
    async redefinirSenha(email, novaSenha) {
        const usuario = await this.cadastroRepo.findByEmail(email);
        if (!usuario)
            return false;
        // Valida a força da senha (RN002)
        const validacao = this.cadastroRepo.validatePasswordStrength(novaSenha);
        if (!validacao.valid) {
            throw new Error(validacao.message || 'Senha fraca');
        }
        const hashed = await this.cadastroRepo.hashPassword(novaSenha);
        await this.cadastroRepo.update(usuario.idUsuario, { senha: hashed });
        console.log(`🔑 Senha do usuário ${email} redefinida com sucesso!`);
        return true;
    }
}
//# sourceMappingURL=auth.service.js.map