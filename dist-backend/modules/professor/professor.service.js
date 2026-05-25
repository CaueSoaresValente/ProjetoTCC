// ============================================================
// src/backend/modules/professor/professor.service.ts
// ============================================================
// SERVICE do Professor.
// Camada de regras de negócio entre Controller e Repository.
// ============================================================
import { ProfessorRepository } from './professor.repository.js';
export class ProfessorService {
    repo = new ProfessorRepository();
    // Busca professor pelo ID
    async findById(id) {
        return await this.repo.findById(id);
    }
    // Busca professor pelo ID do cadastro
    async findByCadastro(idCadastro) {
        return await this.repo.findByCadastro(idCadastro);
    }
    // Cria um novo professor
    async create(data) {
        return await this.repo.create(data);
    }
}
//# sourceMappingURL=professor.service.js.map