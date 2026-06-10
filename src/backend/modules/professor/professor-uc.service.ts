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
import { WebSocketManager } from '../../shared/websocket.manager.js';
import { AppDataSource } from '../../config/data-source.js';
import { ProfessorTurma } from '../turma/professor-turma.entity.js';
import { TurmaUC } from '../turma/turma-uc.entity.js';

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

    const result = await this.repo.create(idProfessor, idUC, nivelCompetencia);
    WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'professores' });
    WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'turmas' });
    return result;
  }

  // Atualiza o nível de competência
  async update(id: number, nivelCompetencia: number) {
    // Validação: nível entre 0 e 100
    if (nivelCompetencia < 0 || nivelCompetencia > 100) {
      throw new Error('O nível de competência deve estar entre 0 e 100');
    }
    const result = await this.repo.update(id, { nivelCompetencia });
    WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'professores' });
    WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'turmas' });
    return result;
  }

  // Remove o vínculo e desaloca o professor de todas as turmas com essa UC
  async delete(id: number) {
    // 1. Buscar o vínculo para saber idProfessor e idUC
    const vinculo = await this.repo.findById(id);
    if (vinculo) {
      const { idProfessor, idUC } = vinculo;

      // 2. Buscar todos os slots de turma (turma_uc) com essa UC
      const turmaUCRepo = AppDataSource.getRepository(TurmaUC);
      const slotsDaUC = await turmaUCRepo.find({ where: { idUC } });

      if (slotsDaUC.length > 0) {
        const idsTurmaUC = slotsDaUC.map(s => s.idTurmaUC);

        // 3. Remover todas as alocações do professor nesses slots
        const profTurmaRepo = AppDataSource.getRepository(ProfessorTurma);
        const alocacoes = await profTurmaRepo
          .createQueryBuilder('pt')
          .where('pt.idProfessor = :idProfessor', { idProfessor })
          .andWhere('pt.idTurmaUC IN (:...idsTurmaUC)', { idsTurmaUC })
          .getMany();

        if (alocacoes.length > 0) {
          await profTurmaRepo.remove(alocacoes);
        }
      }
    }

    // 4. Remover o vínculo professor_uc
    const result = await this.repo.delete(id);
    WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'professores' });
    WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'turmas' });
    return result;
  }
}
