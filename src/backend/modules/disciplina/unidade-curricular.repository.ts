// ============================================================
// src/backend/modules/disciplina/unidade-curricular.repository.ts
// ============================================================
// REPOSITORY para a tabela "unidade_curricular" (Competências).
// Cada competência pertence a uma área (relação ManyToOne).
//
// Na tela do usuário, a gente chama de "Competência",
// mas no banco o nome da tabela é "unidade_curricular".
// ============================================================

import { AppDataSource } from '../../config/data-source.js';
import { UnidadeCurricular } from './unidade-curricular.entity.js';
import { ProfessorUC } from './professor-uc.entity.js';
import { TurmaUC } from '../turma/turma-uc.entity.js';

export class UnidadeCurricularRepository {
  private repo = AppDataSource.getRepository(UnidadeCurricular);

  // Lista todas as competências, trazendo a área de cada uma
  async findAll(): Promise<UnidadeCurricular[]> {
    return await this.repo.find({
      where: { status: true },
      relations: ['area'],
      order: { nome: 'ASC' },
    });
  }

  // Busca uma competência por ID
  async findById(id: number): Promise<UnidadeCurricular | null> {
    return await this.repo.findOne({
      where: { idUC: id, status: true },
      relations: ['area'],
    });
  }

  // Cria uma nova competência
  async create(data: Partial<UnidadeCurricular>): Promise<UnidadeCurricular> {
    const uc = this.repo.create(data);
    return await this.repo.save(uc);
  }

  // Atualiza uma competência existente
  async update(id: number, data: Partial<UnidadeCurricular>): Promise<UnidadeCurricular | null> {
    await this.repo.update(id, data);
    return await this.findById(id);
  }

  // Exclui uma competência (Soft Delete e remoção de vínculos)
  async delete(id: number): Promise<void> {
    // 1. Soft-delete a UC
    await this.repo.update(id, { status: false });

    // 2. Remover competências dos professores
    const profUCRepo = AppDataSource.getRepository(ProfessorUC);
    await profUCRepo.delete({ idUC: id });

    // 3. Remover slots das turmas (cascata removerá alocações automaticamente)
    const turmaUCRepo = AppDataSource.getRepository(TurmaUC);
    await turmaUCRepo.delete({ idUC: id });
  }
}
