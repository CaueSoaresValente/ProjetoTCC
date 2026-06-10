// ============================================================
// src/backend/modules/professor/professor-area.service.ts
// ============================================================
// SERVICE para as áreas do professor.
// Aqui ficam as regras de negócio, como:
//   - "O professor não pode adicionar a mesma área duas vezes"
//   - "O ID da área é obrigatório"
//
// O fluxo é: Controller → Service (aqui) → Repository → Banco
// ============================================================

import { ProfessorAreaRepository } from './professor-area.repository.js';
import { WebSocketManager } from '../../shared/websocket.manager.js';

export class ProfessorAreaService {
  // Instancia o repository para usar os métodos de banco
  private repo = new ProfessorAreaRepository();

  // Lista todas as áreas de um professor
  async findByProfessor(idProfessor: number) {
    return await this.repo.findByProfessor(idProfessor);
  }

  // Vincula uma nova área ao professor
  async create(idProfessor: number, idArea: number) {
    // Validação: o ID da área é obrigatório
    if (!idArea) {
      throw new Error('O ID da área é obrigatório');
    }

    // Validação: verificar se o professor já tem essa área
    const jaExiste = await this.repo.findByProfessorAndArea(idProfessor, idArea);
    if (jaExiste) {
      throw new Error('O professor já possui essa área de atuação');
    }

    const result = await this.repo.create(idProfessor, idArea);
    WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'professores' });
    WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'turmas' });
    return result;
  }

  // Atualiza o vínculo (troca a área)
  async update(id: number, idArea: number) {
    if (!idArea) {
      throw new Error('O ID da área é obrigatório');
    }
    const result = await this.repo.update(id, idArea);
    WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'professores' });
    WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'turmas' });
    return result;
  }

  // Remove o vínculo
  async delete(id: number) {
    const result = await this.repo.delete(id);
    WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'professores' });
    WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'turmas' });
    return result;
  }
}
