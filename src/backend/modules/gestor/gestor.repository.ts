import { AppDataSource } from '../../config/data-source.js';
import { Gestor } from './gestor.entity.js';

export class GestorRepository {
  private repo = AppDataSource.getRepository(Gestor);

  // Exemplo de findById
  async findById(id: number): Promise<Gestor | null> {
    return await this.repo.findOne({ where: { idGestor: id } });
  }

  // Adicionar outros métodos conforme necessário
}
