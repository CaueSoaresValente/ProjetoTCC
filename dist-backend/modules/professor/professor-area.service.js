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
export class ProfessorAreaService {
    // Instancia o repository para usar os métodos de banco
    repo = new ProfessorAreaRepository();
    // Lista todas as áreas de um professor
    async findByProfessor(idProfessor) {
        return await this.repo.findByProfessor(idProfessor);
    }
    // Vincula uma nova área ao professor
    async create(idProfessor, idArea) {
        // Validação: o ID da área é obrigatório
        if (!idArea) {
            throw new Error('O ID da área é obrigatório');
        }
        // Validação: verificar se o professor já tem essa área
        const jaExiste = await this.repo.findByProfessorAndArea(idProfessor, idArea);
        if (jaExiste) {
            throw new Error('O professor já possui essa área de atuação');
        }
        return await this.repo.create(idProfessor, idArea);
    }
    // Atualiza o vínculo (troca a área)
    async update(id, idArea) {
        if (!idArea) {
            throw new Error('O ID da área é obrigatório');
        }
        return await this.repo.update(id, idArea);
    }
    // Remove o vínculo
    async delete(id) {
        return await this.repo.delete(id);
    }
}
//# sourceMappingURL=professor-area.service.js.map