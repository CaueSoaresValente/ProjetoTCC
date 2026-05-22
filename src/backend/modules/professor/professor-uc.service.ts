// ============================================================
// src/backend/modules/professor/professor-uc.service.ts
// ============================================================
// SERVICE para as Unidades Curriculares do professor.
// Regras de negócio:
//   - O professor não pode adicionar a mesma UC duas vezes
//   - O nível de competência deve estar entre 0 e 100
//   - O ID da UC é obrigatório
// ============================================================

import { ProfessorUCRepository } from './professor-uc.repository.js';

export class ProfessorUCService {
  private repo = new ProfessorUCRepository();

  // Lista todas as UCs de um professor
  async findByProfessor(idProfessor: number) {
    return await this.repo.findByProfessor(idProfessor);
  }

  // Lista as UCs de uma área específica (para o dropdown)
  async findUCsByArea(idArea: number) {
    return await this.repo.findUCsByArea(idArea);
  }

  // Vincula uma UC ao professor
  async create(idProfessor: number, idUC: number, nivelCompetencia: number) {
    // Validação: o ID da UC é obrigatório
    if (!idUC) {
      throw new Error('A Unidade Curricular é obrigatória');
    }

    // Validação: nível entre 0 e 100
    if (nivelCompetencia < 0 || nivelCompetencia > 100) {
      throw new Error('O nível de competência deve estar entre 0 e 100');
    }

    // Validação: verificar se já existe
    const jaExiste = await this.repo.findByProfessorAndUC(idProfessor, idUC);
    if (jaExiste) {
      throw new Error('O professor já possui essa Unidade Curricular');
    }

    return await this.repo.create(idProfessor, idUC, nivelCompetencia);
  }

  // Atualiza o nível de competência
  async update(id: number, nivelCompetencia: number) {
    // Validação: nível entre 0 e 100
    if (nivelCompetencia < 0 || nivelCompetencia > 100) {
      throw new Error('O nível de competência deve estar entre 0 e 100');
    }
    return await this.repo.update(id, { nivelCompetencia });
  }

  // Remove o vínculo
  async delete(id: number) {
    return await this.repo.delete(id);
  }
}
