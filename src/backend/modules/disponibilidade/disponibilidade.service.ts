// src/backend/modules/disponibilidade/disponibilidade.service.ts
//
// O SERVICE é onde ficam as "regras do negócio".
// Por exemplo: antes de salvar, verificamos se já existe.
// O controller chama o service, o service chama o repository.
//
// FLUXO: Controller → Service → Repository → Banco de dados

import { DisponibilidadeRepository } from './disponibilidade.repository.js';
import { WebSocketManager } from '../../shared/websocket.manager.js';

export class DisponibilidadeService {
  // Instancia o repository que criamos
  private repo = new DisponibilidadeRepository();

  // Retorna todas as disponibilidades de um professor
  async findByProfessorId(professorId: number) {
    return await this.repo.findByProfessorId(professorId);
  }

  // Adiciona uma disponibilidade (se ainda não existir)
  // Retorna erro se tentar adicionar a mesma combinação duas vezes
  async adicionar(idProfessor: number, diaSemana: string, periodo: string) {
    // Verificamos se já existe antes de criar
    const jaExiste = await this.repo.findOne(idProfessor, diaSemana, periodo);
    if (jaExiste) {
      throw new Error(`Professor já tem disponibilidade para ${diaSemana} no período ${periodo}`);
    }
    const result = await this.repo.create(idProfessor, diaSemana, periodo);
    WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'professores' });
    WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'turmas' });
    return result;
  }

  // Remove uma disponibilidade pelo ID
  async remover(idDisponibilidade: number) {
    await this.repo.delete(idDisponibilidade);
    WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'professores' });
    WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'turmas' });
  }

  // Sincroniza TODO o horário semanal do professor de uma vez.
  //
  // Recebe um objeto assim:
  //   { segunda: ["manha", "tarde"], sexta: ["noite"] }
  //
  // E garante que o banco fique igual ao que foi enviado:
  //   - Cria os que não existem
  //   - Remove os que foram desmarcados
  async sincronizarSemana(idProfessor: number, disponibilidades: Record<string, string[]>) {
    // 1. Busca o que o professor já tem no banco
    const atuais = await this.repo.findByProfessorId(idProfessor);

    // 2. Converte o que foi enviado para uma lista simples de {dia, periodo}
    const novas: { diaSemana: string; periodo: string }[] = [];
    for (const [dia, periodos] of Object.entries(disponibilidades)) {
      for (const periodo of periodos) {
        novas.push({ diaSemana: dia, periodo });
      }
    }

    // 3. Descobre quais precisam ser CRIADOS (existem no novo mas não no banco)
    for (const nova of novas) {
      const jaExiste = atuais.find(
        (a) => a.diaSemana === nova.diaSemana && a.periodo === nova.periodo
      );
      if (!jaExiste) {
        await this.repo.create(idProfessor, nova.diaSemana, nova.periodo);
      }
    }

    // 4. Descobre quais precisam ser REMOVIDOS (existem no banco mas não no novo)
    for (const atual of atuais) {
      const aindaExiste = novas.find(
        (n) => n.diaSemana === atual.diaSemana && n.periodo === atual.periodo
      );
      if (!aindaExiste) {
        await this.repo.delete(atual.idDisponibilidade);
      }
    }

    // 5. Retorna o estado final
    const finalResult = await this.repo.findByProfessorId(idProfessor);
    WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'professores' });
    WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'turmas' });
    return finalResult;
  }
}

