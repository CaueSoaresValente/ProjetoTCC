import { GestorRepository } from './gestor.repository.js';

export class GestorService {
  private repo = new GestorRepository();

  async findById(id: number) {
    return await this.repo.findById(id);
  }

  // Adicionar outros métodos conforme necessário
}
