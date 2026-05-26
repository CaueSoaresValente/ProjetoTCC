// ============================================================
// src/backend/modules/area/area.repository.ts
// ============================================================
// REPOSITORY = a camada que fala diretamente com o banco de dados.
// Aqui usamos o TypeORM para fazer as operações de CRUD.
// É parecido com o CadastroRepository, mas para a tabela "area".
// ============================================================
import { AppDataSource } from '../../config/data-source.js';
import { Area } from './area.entity.js';
export class AreaRepository {
    // Pega o "repositório" do TypeORM para a entidade Area
    // Isso nos dá métodos prontos como: find, findOne, save, delete...
    repo = AppDataSource.getRepository(Area);
    // ====================== LISTAR TODAS ======================
    // Busca todas as áreas do banco de dados.
    // O "relations: ['unidadesCurriculares']" traz as competências
    // de cada área junto, para podermos contar quantas são.
    async findAll() {
        return await this.repo.find({
            relations: ['unidadesCurriculares'],
            order: { nome: 'ASC' }, // Ordena por nome em ordem alfabética
        });
    }
    // ====================== BUSCAR POR ID ======================
    // Busca uma única área pelo seu ID.
    async findById(id) {
        return await this.repo.findOne({
            where: { idArea: id },
            relations: ['unidadesCurriculares'],
        });
    }
    // ====================== CRIAR ======================
    // Cria uma nova área no banco.
    // O "this.repo.create()" monta o objeto, e o "this.repo.save()" salva.
    async create(data) {
        const area = this.repo.create(data);
        return await this.repo.save(area);
    }
    // ====================== ATUALIZAR ======================
    // Atualiza uma área existente.
    // Primeiro faz o update, depois busca de novo para retornar atualizada.
    async update(id, data) {
        await this.repo.update(id, data);
        return await this.findById(id);
    }
    // ====================== EXCLUIR ======================
    // Remove a área do banco de dados.
    async delete(id) {
        await this.repo.delete(id);
    }
}
//# sourceMappingURL=area.repository.js.map