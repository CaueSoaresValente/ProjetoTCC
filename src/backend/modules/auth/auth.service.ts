// src/backend/modules/auth/auth.service.ts
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { CadastroRepository } from "../cadastro/cadastro.repository.js";
import { Cadastro } from "../cadastro/cadastro.entity.js";

const JWT_SECRET = process.env.JWT_SECRET || "senai-super-secreto-2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

export class AuthService {
  private cadastroRepo = new CadastroRepository();

  async login(email: string, senha: string): Promise<{ token: string; usuario: any } | null> {
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
    const token = jwt.sign(
      {
        idUsuario: usuario.idUsuario,
        email: usuario.email,
        funcao: usuario.funcao,
        nome: usuario.nome,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions   // ← Cast obrigatório aqui
    );
    // =======================================================

    const { senha: _, ...usuarioSemSenha } = usuario;

    return { token, usuario: usuarioSemSenha };
  }

  // ============================================================
  // LOGIN COM GOOGLE — Verifica o ID Token e busca o papel no BD
  // ============================================================
  async loginWithGoogle(credential: string): Promise<{ token: string; usuario: any } | null> {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      console.error("[GOOGLE LOGIN] ❌ GOOGLE_CLIENT_ID não configurado no .env");
      throw new Error("Configuração do Google OAuth ausente no servidor.");
    }

    console.log("[GOOGLE LOGIN] Verificando ID Token do Google...");

    const client = new OAuth2Client(googleClientId);

    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch (error: any) {
      console.error("[GOOGLE LOGIN] ❌ Token do Google inválido:", error.message);
      return null;
    }

    if (!payload || !payload.email) {
      console.error("[GOOGLE LOGIN] ❌ Payload do token não contém email.");
      return null;
    }

    const googleEmail = payload.email;
    const googleName = payload.name || "";
    const googlePicture = payload.picture || "";

    console.log(`[GOOGLE LOGIN] Email do Google: ${googleEmail}`);

    // Busca o usuário pelo email na tabela cadastro (sem senha)
    const usuario = await this.cadastroRepo.findByEmailPublic(googleEmail);

    if (!usuario) {
      console.log(`[GOOGLE LOGIN] ❌ E-mail ${googleEmail} NÃO está cadastrado no sistema.`);
      return null;
    }

    if (!usuario.status) {
      console.log(`[GOOGLE LOGIN] ❌ Usuário ${googleEmail} está inativo (status = false).`);
      return null;
    }

    console.log(`[GOOGLE LOGIN] ✅ Usuário encontrado: ${usuario.nome} | Função: ${usuario.funcao}`);

    // Atualiza foto de perfil do Google se o usuário não tiver uma
    if (!usuario.fotoPerfil && googlePicture) {
      try {
        await this.cadastroRepo.update(usuario.idUsuario, { fotoPerfil: googlePicture });
        usuario.fotoPerfil = googlePicture;
        console.log(`[GOOGLE LOGIN] 📷 Foto de perfil atualizada do Google.`);
      } catch (e) {
        // Não-fatal: apenas log
        console.warn("[GOOGLE LOGIN] ⚠️ Falha ao atualizar foto de perfil:", e);
      }
    }

    // Gera o JWT interno (mesmo formato do login normal)
    const token = jwt.sign(
      {
        idUsuario: usuario.idUsuario,
        email: usuario.email,
        funcao: usuario.funcao,
        nome: usuario.nome,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    return { token, usuario };
  }

  verifyToken(token: string): any | null {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }

  async solicitarRecuperacao(email: string): Promise<boolean> {
    const usuario = await this.cadastroRepo.findByEmail(email);
    if (!usuario) return false;

    console.log(`🔑 Link de recuperação enviado para: ${email}`);
    return true;
  }

  async redefinirSenha(email: string, novaSenha: string): Promise<boolean> {
    const usuario = await this.cadastroRepo.findByEmail(email);
    if (!usuario) return false;

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
