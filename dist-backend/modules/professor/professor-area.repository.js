// ============================================================
// src/backend/modules/professor/professor-area.repository.ts
// ============================================================
// REPOSITORY para a tabela "professor_area".
// Esta tabela guarda quais áreas cada professor escolheu.
//
// Por exemplo: se o professor "João" diz que atua na área
// "Tecnologia", criamos um registro aqui ligando o João à área.
//
// COMO FUNCIONA:
//   1. O Controller recebe a requisição HTTP
//   2. O Controller chama o Service
//   3. O Service chama ESTE Repository
//   4. Este Repository usa o TypeORM para falar com o banco PostgreSQL
// ============================================================
import { AppDataSource } from '../../config/data-source.js';
import { ProfessorArea } from '../area/professor-area.entity.js';
export class ProfessorAreaRepository {
    // Pega o repositório do TypeORM para a entidade ProfessorArea
    // Isso nos dá métodos prontos como: find, findOne, save, delete...
    repo = AppDataSource.getRepository(ProfessorArea);
    // ====================== LISTAR POR PROFESSOR ======================
    // Busca todas as áreas que um professor específico escolheu.
    // O "relations: ['area']" traz os dados da área junto (nome, etc).
    async findByProfessor(idProfessor) {
        return await this.repo.find({
            where: { idProfessor },
            relations: ['area'],
            order: { idProfessorArea: 'ASC' },
        });
    }
    // ====================== VERIFICAR DUPLICATA ======================
    // Antes de vincular uma área, verificamos se o professor já tem ela.
    // Isso evita que o mesmo professor tenha "Tecnologia" duas vezes.
    async findByProfessorAndArea(idProfessor, idArea) {
        return await this.repo.findOne({
            where: { idProfessor, idArea },
        });
    }
    // ====================== CRIAR ======================
    // Vincula uma área ao professor.
    // Recebe o ID do professor e o ID da área.
    async create(idProfessor, idArea) {
        const professorArea = this.repo.create({ idProfessor, idArea });
        return await this.repo.save(professorArea);
    }
    // ====================== ATUALIZAR ======================
    // Atualiza o vínculo (troca a área).
    // Primeiro faz o update, depois busca de novo para retornar atualizado.
    async update(id, idArea) {
        await this.repo.update(id, { idArea });
        return await this.repo.findOne({
            where: { idProfessorArea: id },
            relations: ['area'],
        });
    }
    // ====================== EXCLUIR ======================
    // Remove o vínculo entre professor e área.
    async delete(id) {
        await this.repo.delete(id);
    }
}
//# sourceMappingURL=professor-area.repository.js.map