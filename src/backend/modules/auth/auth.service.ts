// src/backend/modules/auth/auth.service.ts
import jwt from "jsonwebtoken";
import { CadastroRepository } from "../cadastro/cadastro.repository.js";
import { Cadastro } from "../cadastro/cadastro.entity.js";

const JWT_SECRET = process.env.JWT_SECRET || "senai-super-secreto-2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

export class AuthService {
  private cadastroRepo = new CadastroRepository();

  async login(email: string, senha: string): Promise<{ token: string; usuario: any } | null> {
    const usuario = await this.cadastroRepo.findByEmail(email);

    if (!usuario || !usuario.status) {
      return null;
    }

    const senhaCorreta = await this.cadastroRepo.comparePassword(senha, usuario.senha);
    if (!senhaCorreta) {
      return null;
    }

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
}
