// src/backend/modules/disponibilidade/disponibilidade.repository.ts
//
// Aqui ficam todas as consultas ao banco de dados.
// Pense como: "o repository é o único que fala com o banco".
// O service chama o repository, nunca o contrário.

import { AppDataSource } from '../../config/data-source.js';
import { Disponibilidade } from './disponibilidade.entity.js';

export class DisponibilidadeRepository {
  private repo = AppDataSource.getRepository(Disponibilidade);

  // Busca TODAS as disponibilidades de um professor
  // Retorna uma lista, ex: [{dia:"segunda", periodo:"manha"}, {dia:"segunda", periodo:"tarde"}]
  async findByProfessorId(professorId: number): Promise<Disponibilidade[]> {
    return await this.repo.find({
      where: { idProfessor: professorId },
      order: { diaSemana: 'ASC', periodo: 'ASC' },
    });
  }

  // Cria UMA disponibilidade nova no banco
  // Exemplo: Professor 1 agora está disponível na "segunda" no período "tarde"
  async create(idProfessor: number, diaSemana: string, periodo: string): Promise<Disponibilidade> {
    const nova = this.repo.create({ idProfessor, diaSemana, periodo });
    return await this.repo.save(nova);
  }

  // Remove UMA disponibilidade pelo seu ID
  async delete(idDisponibilidade: number): Promise<void> {
    await this.repo.delete(idDisponibilidade);
  }

  // Remove TODAS as disponibilidades de um professor em um dia específico
  // Isso é útil quando o professor desmarca um dia inteiro
  async deleteByDia(idProfessor: number, diaSemana: string): Promise<void> {
    await this.repo.delete({ idProfessor, diaSemana });
  }

  // Busca uma disponibilidade específica (para saber se já existe antes de criar)
  async findOne(idProfessor: number, diaSemana: string, periodo: string): Promise<Disponibilidade | null> {
    return await this.repo.findOne({ where: { idProfessor, diaSemana, periodo } });
  }
}

