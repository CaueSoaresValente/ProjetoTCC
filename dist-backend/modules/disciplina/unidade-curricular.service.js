// ============================================================
// src/backend/modules/disciplina/unidade-curricular.service.ts
// ============================================================
// SERVICE para Competências (Unidades Curriculares).
// Mesma lógica do AreaService — valida e repassa para o Repository.
// ============================================================
import { UnidadeCurricularRepository } from './unidade-curricular.repository.js';
export class UnidadeCurricularService {
    repo = new UnidadeCurricularRepository();
    // Lista todas as competências
    async findAll() {
        return await this.repo.findAll();
    }
    // Busca uma competência por ID
    async findById(id) {
        return await this.repo.findById(id);
    }
    // Cria uma nova competência (com validações)
    async create(data) {
        // O nome é obrigatório
        if (!data.nome || data.nome.trim() === '') {
            throw new Error('O nome da UC é obrigatório');
        }
        // A área é obrigatória (toda competência pertence a uma área)
        if (!data.idArea) {
            throw new Error('A área é obrigatória');
        }
        return await this.repo.create(data);
    }
    // Atualiza uma competência existente
    async update(id, data) {
        if (data.nome !== undefined && data.nome.trim() === '') {
            throw new Error('O nome da UC não pode ser vazio');
        }
        return await this.repo.update(id, data);
    }
    // Exclui uma competência
    async delete(id) {
        return await this.repo.delete(id);
    }
}
//# sourceMappingURL=unidade-curricular.service.js.map