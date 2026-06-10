// ============================================================
// src/backend/modules/disciplina/unidade-curricular.service.ts
// ============================================================
// SERVICE para Competências (Unidades Curriculares).
// Mesma lógica do AreaService — valida e repassa para o Repository.
// ============================================================

import { UnidadeCurricularRepository } from './unidade-curricular.repository.js';
import { UnidadeCurricular } from './unidade-curricular.entity.js';

export class UnidadeCurricularService {
  private repo = new UnidadeCurricularRepository();

  // Lista todas as competências
  async findAll() {
    return await this.repo.findAll();
  }

  // Busca uma competência por ID
  async findById(id: number) {
    return await this.repo.findById(id);
  }

  // Cria uma nova competência (com validações e reativação)
  async create(data: Partial<UnidadeCurricular>) {
    // O nome é obrigatório
    if (!data.nome || data.nome.trim() === '') {
      throw new Error('O nome da UC é obrigatório');
    }
    // A área é obrigatória (toda competência pertence a uma área)
    if (!data.idArea) {
      throw new Error('A área é obrigatória');
    }

    const nomeFormatado = data.nome.trim();

    // Verificação de UC ativa/inativa na mesma área
    const existente = await this.repo.findByNameAndAreaAnyStatus(nomeFormatado, data.idArea);
    if (existente) {
      if (existente.status) {
        throw new Error('Já existe uma UC cadastrada com este nome nesta área');
      } else {
        // Se a UC existe mas está inativa (soft-deletada), nós a reativamos!
        existente.status = true;
        if (data.descricao !== undefined) {
          existente.descricao = data.descricao;
        }
        return await this.repo.update(existente.idUC, existente);
      }
    }

    return await this.repo.create({ ...data, nome: nomeFormatado });
  }

  // Atualiza uma competência existente
  async update(id: number, data: Partial<UnidadeCurricular>) {
    if (data.nome !== undefined && data.nome.trim() === '') {
      throw new Error('O nome da UC não pode ser vazio');
    }

    if (data.nome !== undefined) {
      const nomeFormatado = data.nome.trim();
      const ucAtual = await this.repo.findById(id);
      const idArea = data.idArea || ucAtual?.idArea;

      if (idArea) {
        const existente = await this.repo.findByNameAndAreaAnyStatus(nomeFormatado, idArea);
        if (existente && existente.idUC !== id) {
          if (existente.status) {
            throw new Error('Já existe uma UC cadastrada com este nome nesta área');
          } else {
            throw new Error('Já existe uma UC inativa com este nome nesta área. Por favor, escolha outro nome.');
          }
        }
      }
      data.nome = nomeFormatado;
    }

    return await this.repo.update(id, data);
  }

  // Exclui uma competência
  async delete(id: number) {
    return await this.repo.delete(id);
  }
}
