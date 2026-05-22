// ============================================================
// src/backend/modules/professor/professor-uc.repository.ts
// ============================================================
// REPOSITORY para a tabela "professor_uc".
// Esta tabela guarda quais Unidades Curriculares cada professor
// sabe ministrar, e o nível de competência dele (0 a 100).
//
// Por exemplo: Professor "João" sabe "Banco de Dados" com nível 80%.
//
// IMPORTANTE: Quando o professor vai adicionar uma UC, ele primeiro
// escolhe uma das suas áreas, e aí o sistema mostra apenas as UCs
// daquela área. Isso é feito pelo método findUCsByArea().
// ============================================================

import { AppDataSource } from '../../config/data-source.js';
import { ProfessorUC } from '../disciplina/professor-uc.entity.js';
import { UnidadeCurricular } from '../disciplina/unidade-curricular.entity.js';

export class ProfessorUCRepository {
  // Repositórios do TypeORM
  private repo = AppDataSource.getRepository(ProfessorUC);
  private ucRepo = AppDataSource.getRepository(UnidadeCurricular);

  // ====================== LISTAR UCs DO PROFESSOR ======================
  // Busca todas as UCs que o professor tem, trazendo os dados da UC junto.
  async findByProfessor(idProfessor: number): Promise<ProfessorUC[]> {
    return await this.repo.find({
      where: { idProfessor },
      relations: ['unidadeCurricular', 'unidadeCurricular.area'],
      order: { idProfessorUC: 'ASC' },
    });
  }

  // ====================== LISTAR UCs POR ÁREA ======================
  // Dado o ID de uma área, retorna todas as UCs que pertencem a ela.
  // Isso é usado no dropdown: o professor escolhe "Tecnologia" e
  // o sistema mostra apenas as UCs de Tecnologia.
  async findUCsByArea(idArea: number): Promise<UnidadeCurricular[]> {
    return await this.ucRepo.find({
      where: { idArea, status: true },
      order: { nome: 'ASC' },
    });
  }

  // ====================== VERIFICAR DUPLICATA ======================
  // Verifica se o professor já tem essa UC vinculada.
  async findByProfessorAndUC(idProfessor: number, idUC: number): Promise<ProfessorUC | null> {
    return await this.repo.findOne({
      where: { idProfessor, idUC },
    });
  }

  // ====================== CRIAR ======================
  // Vincula uma UC ao professor com o nível de competência.
  async create(idProfessor: number, idUC: number, nivelCompetencia: number): Promise<ProfessorUC> {
    const professorUC = this.repo.create({ idProfessor, idUC, nivelCompetencia });
    return await this.repo.save(professorUC);
  }

  // ====================== ATUALIZAR ======================
  // Atualiza o nível de competência do professor naquela UC.
  async update(id: number, data: Partial<ProfessorUC>): Promise<ProfessorUC | null> {
    await this.repo.update(id, data);
    return await this.repo.findOne({
      where: { idProfessorUC: id },
      relations: ['unidadeCurricular', 'unidadeCurricular.area'],
    });
  }

  // ====================== EXCLUIR ======================
  // Remove o vínculo entre professor e UC.
  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
