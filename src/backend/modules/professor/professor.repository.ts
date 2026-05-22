// ============================================================
// src/backend/modules/professor/professor.repository.ts
// ============================================================
// REPOSITORY do Professor.
// Fala com o banco de dados usando TypeORM.
// ============================================================

import { AppDataSource } from '../../config/data-source.js';
import { Professor } from './professor.entity.js';

export class ProfessorRepository {
  private repo = AppDataSource.getRepository(Professor);

  // Busca um professor pelo ID
  async findById(id: number): Promise<Professor | null> {
    return await this.repo.findOne({ where: { idProfessor: id } });
  }

  // Busca um professor pelo ID do cadastro (idUsuario)
  // Isso é necessário porque o login retorna o idUsuario,
  // mas precisamos do idProfessor para as operações.
  async findByCadastro(idCadastro: number): Promise<Professor | null> {
    return await this.repo.findOne({ where: { idCadastro } });
  }

  // Cria um novo professor no banco de dados
  async create(data: Partial<Professor>): Promise<Professor> {
    const professor = this.repo.create(data);
    return await this.repo.save(professor);
  }
}

