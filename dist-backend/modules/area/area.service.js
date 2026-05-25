// ============================================================
// src/backend/modules/area/area.service.ts
// ============================================================
// SERVICE = a camada de "regras de negócio".
// Fica entre o Controller (que recebe a requisição HTTP)
// e o Repository (que fala com o banco).
//
// Por enquanto as regras são simples, mas é aqui que colocamos
// validações como "o nome não pode ser vazio" ou "não pode
// criar área com nome duplicado".
// ============================================================
import { AreaRepository } from './area.repository.js';
export class AreaService {
    // Instancia o repository para usar os métodos de banco
    repo = new AreaRepository();
    // Lista todas as áreas
    async findAll() {
        return await this.repo.findAll();
    }
    // Busca uma área por ID
    async findById(id) {
        return await this.repo.findById(id);
    }
    // Cria uma nova área (com validação simples)
    async create(data) {
        // Validação: o nome é obrigatório
        if (!data.nome || data.nome.trim() === '') {
            throw new Error('O nome da área é obrigatório');
        }
        return await this.repo.create(data);
    }
    // Atualiza uma área existente
    async update(id, data) {
        // Validação: o nome é obrigatório
        if (data.nome !== undefined && data.nome.trim() === '') {
            throw new Error('O nome da área não pode ser vazio');
        }
        return await this.repo.update(id, data);
    }
    // Exclui uma área
    async delete(id) {
        return await this.repo.delete(id);
    }
}
//# sourceMappingURL=area.service.js.map