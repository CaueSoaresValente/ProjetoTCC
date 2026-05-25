// ============================================================
// src/backend/modules/disciplina/unidade-curricular.repository.ts
// ============================================================
// REPOSITORY para a tabela "unidade_curricular" (Competências).
// Cada competência pertence a uma área (relação ManyToOne).
//
// Na tela do usuário, a gente chama de "Competência",
// mas no banco o nome da tabela é "unidade_curricular".
// ============================================================
import { AppDataSource } from '../../config/data-source.js';
import { UnidadeCurricular } from './unidade-curricular.entity.js';
export class UnidadeCurricularRepository {
    repo = AppDataSource.getRepository(UnidadeCurricular);
    // Lista todas as competências, trazendo a área de cada uma
    async findAll() {
        return await this.repo.find({
            relations: ['area'],
            order: { nome: 'ASC' },
        });
    }
    // Busca uma competência por ID
    async findById(id) {
        return await this.repo.findOne({
            where: { idUC: id },
            relations: ['area'],
        });
    }
    // Cria uma nova competência
    async create(data) {
        const uc = this.repo.create(data);
        return await this.repo.save(uc);
    }
    // Atualiza uma competência existente
    async update(id, data) {
        await this.repo.update(id, data);
        return await this.findById(id);
    }
    // Exclui uma competência
    async delete(id) {
        await this.repo.delete(id);
    }
}
//# sourceMappingURL=unidade-curricular.repository.js.map