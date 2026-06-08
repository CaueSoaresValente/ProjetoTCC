// ============================================================
// src/backend/modules/perfil/perfil.service.ts
// ============================================================
// Service para "Meu Perfil".
// Lida com a lógica de negócio: buscar dados, atualizar nome,
// foto e alterar senha com validação.
// ============================================================

import { AppDataSource } from '../../config/data-source.js';
import { Cadastro } from '../cadastro/cadastro.entity.js';
import { CadastroRepository } from '../cadastro/cadastro.repository.js';

export class PerfilService {
  private repo = AppDataSource.getRepository(Cadastro);
  private cadastroRepo = new CadastroRepository();

  /**
   * Busca os dados do perfil do usuário logado.
   */
  async buscarPerfil(idUsuario: number) {
    const usuario = await this.repo.findOne({
      where: { idUsuario },
    });

    if (!usuario) return null;

    return {
      idUsuario: usuario.idUsuario,
      nome: usuario.nome,
      email: usuario.email,
      funcao: usuario.funcao,
      fotoPerfil: (usuario as any).fotoPerfil || null,
    };
  }

  /**
   * Atualiza nome, e-mail e/ou foto de perfil.
   */
  async atualizarPerfil(idUsuario: number, dados: { nome?: string; email?: string; fotoPerfil?: string }) {
    const updateData: any = {};

    if (dados.nome && dados.nome.trim()) {
      updateData.nome = dados.nome.trim();
    }
    
    if (dados.email && dados.email.trim()) {
      // Verifica se o novo e-mail já não está em uso por outro usuário ATIVO
      const existente = await this.repo.findOne({ where: { email: dados.email.trim(), status: true } });
      if (existente && existente.idUsuario !== idUsuario) {
        throw new Error('Este e-mail já está em uso por outro cadastro.');
      }
      updateData.email = dados.email.trim();
    }

    if (dados.fotoPerfil !== undefined) {
      updateData.fotoPerfil = dados.fotoPerfil;
    }

    if (Object.keys(updateData).length > 0) {
      await this.repo.update(idUsuario, updateData);
    }

    // Retorna os dados atualizados
    return await this.buscarPerfil(idUsuario);
  }

  /**
   * Altera a senha do usuário.
   * Não requer a senha atual ou validações de força de senha a pedido do usuário.
   */
  async alterarSenha(idUsuario: number, novaSenha: string) {
    // Busca o usuário COM a senha (que é select: false por padrão)
    const usuario = await this.repo
      .createQueryBuilder('cadastro')
      .addSelect('cadastro.senha')
      .where('cadastro.id_usuario = :id', { id: idUsuario })
      .getOne();

    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }



    // Hash e salva a nova senha
    const senhaHash = await this.cadastroRepo.hashPassword(novaSenha);
    await this.repo.update(idUsuario, { senha: senhaHash });
  }
}
