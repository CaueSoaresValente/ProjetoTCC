import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';

export class AuthController {
  private authService = new AuthService();

  async login(req: Request, res: Response) {
    const { email, senha } = req.body;
    try {
      const result = await this.authService.login(email, senha);
      if (!result) {
        return res.status(401).json({ message: 'E-mail ou senha incorretos' });
      }
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  // ============================================================
  // LOGIN COM GOOGLE — Recebe o credential e valida no backend
  // ============================================================
  async loginGoogle(req: Request, res: Response) {
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
    } catch (error: any) {
      console.error('[GOOGLE LOGIN CONTROLLER] Erro:', error.message);
      return res.status(500).json({ message: error.message });
    }
  }

  async recuperarSenha(req: Request, res: Response) {
    const { email } = req.body;
    try {
      const result = await this.authService.solicitarRecuperacao(email);
      return res.status(200).json({ success: result });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async redefinirSenha(req: Request, res: Response) {
    const { email, novaSenha } = req.body;
    try {
      const result = await this.authService.redefinirSenha(email, novaSenha);
      if (!result) {
        return res.status(404).json({ message: 'E-mail não encontrado' });
      }
      return res.status(200).json({ success: true, message: 'Senha redefinida com sucesso' });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}
