// ============================================================
// src/backend/modules/professor/certificacao.service.ts
// ============================================================
// SERVICE para as certificações do professor.
// Regras de negócio:
//   - O nome da certificação é obrigatório
// ============================================================

import { CertificacaoRepository } from './certificacao.repository.js';
import { Certificacao } from './certificacao.entity.js';

export class CertificacaoService {
  private repo = new CertificacaoRepository();

  // Lista todas as certificações de um professor
  async findByProfessor(idProfessor: number) {
    return await this.repo.findByProfessor(idProfessor);
  }

  // Cria uma nova certificação
  async create(idProfessor: number, data: Partial<Certificacao>) {
    // Validação: o nome é obrigatório
    if (!data.nome || data.nome.trim() === '') {
      throw new Error('O nome da certificação é obrigatório');
    }

    // Montamos o objeto completo com o idProfessor
    return await this.repo.create({
      ...data,
      idProfessor,
    });
  }

  // Atualiza uma certificação existente
  async update(id: number, data: Partial<Certificacao>) {
    // Validação: se informou o nome, ele não pode ser vazio
    if (data.nome !== undefined && data.nome.trim() === '') {
      throw new Error('O nome da certificação não pode ser vazio');
    }
    return await this.repo.update(id, data);
  }

  // Exclui uma certificação
  async delete(id: number) {
    return await this.repo.delete(id);
  }
}
