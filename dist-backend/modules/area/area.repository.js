// ============================================================
// src/backend/modules/area/area.repository.ts
// ============================================================
// REPOSITORY = a camada que fala diretamente com o banco de dados.
// Aqui usamos o TypeORM para fazer as operações de CRUD.
// É parecido com o CadastroRepository, mas para a tabela "area".
// ============================================================
import { ILike } from 'typeorm';
import { AppDataSource } from '../../config/data-source.js';
import { Area } from './area.entity.js';
import { UnidadeCurricular } from '../disciplina/unidade-curricular.entity.js';
import { OPPArea } from './opp-area.entity.js';
import { ProfessorArea } from './professor-area.entity.js';
import { UnidadeCurricularRepository } from '../disciplina/unidade-curricular.repository.js';
export class AreaRepository {
    // Pega o "repositório" do TypeORM para a entidade Area
    // Isso nos dá métodos prontos como: find, findOne, save, delete...
    repo = AppDataSource.getRepository(Area);
    // ====================== LISTAR TODAS ======================
    // Busca todas as áreas do banco de dados.
    // O "relations: ['unidadesCurriculares']" traz as competências
    // de cada área junto, para podermos contar quantas são.
    async findAll() {
        const areas = await this.repo.find({
            where: { status: true },
            relations: ['unidadesCurriculares'],
            order: { nome: 'ASC' }, // Ordena por nome em ordem alfabética
        });
        // Filtra para retornar apenas UCs ativas em cada área
        for (const area of areas) {
            if (area.unidadesCurriculares) {
                area.unidadesCurriculares = area.unidadesCurriculares.filter(uc => uc.status);
            }
        }
        return areas;
    }
    // ====================== BUSCAR POR ID ======================
    // Busca uma única área pelo seu ID.
    async findById(id) {
        const area = await this.repo.findOne({
            where: { idArea: id, status: true },
            relations: ['unidadesCurriculares'],
        });
        if (area && area.unidadesCurriculares) {
            area.unidadesCurriculares = area.unidadesCurriculares.filter(uc => uc.status);
        }
        return area;
    }
    // Busca uma área pelo nome (case-insensitive)
    async findByName(nome) {
        return await this.repo.findOne({
            where: { nome: ILike(nome.trim()), status: true },
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
    // Remove a área do banco de dados de forma lógica (Soft Delete) e limpa cascata.
    async delete(id) {
        // 1. Soft-delete a área
        await this.repo.update(id, { status: false });
        // 2. Soft-delete em cascata de todas as UCs dessa área
        const ucRepo = AppDataSource.getRepository(UnidadeCurricular);
        const ucs = await ucRepo.find({ where: { idArea: id } });
        const ucRepository = new UnidadeCurricularRepository();
        for (const uc of ucs) {
            await ucRepository.delete(uc.idUC);
        }
        // 3. Remover vínculos com OPPs e Professores
        const oppAreaRepo = AppDataSource.getRepository(OPPArea);
        await oppAreaRepo.delete({ idArea: id });
        const profAreaRepo = AppDataSource.getRepository(ProfessorArea);
        await profAreaRepo.delete({ idArea: id });
    }
}
//# sourceMappingURL=area.repository.js.map