// ============================================================
// src/backend/modules/professor/certificacao.repository.ts
// ============================================================
// REPOSITORY para a tabela "certificacao".
// Guarda as certificações de cada professor, como:
// "AWS Cloud Practitioner", "Scrum Foundation", etc.
//
// Cada certificação tem: nome, instituição, data e carga horária.
// ============================================================
import { AppDataSource } from '../../config/data-source.js';
import { Certificacao } from './certificacao.entity.js';
export class CertificacaoRepository {
    // Repositório do TypeORM para a entidade Certificacao
    repo = AppDataSource.getRepository(Certificacao);
    // ====================== LISTAR POR PROFESSOR ======================
    // Busca todas as certificações de um professor específico.
    async findByProfessor(idProfessor) {
        return await this.repo.find({
            where: { idProfessor },
            order: { dataObtencao: 'DESC' }, // Mais recentes primeiro
        });
    }
    // ====================== BUSCAR POR ID ======================
    // Busca uma certificação pelo seu ID.
    async findById(id) {
        return await this.repo.findOne({
            where: { idCertificacao: id },
        });
    }
    // ====================== CRIAR ======================
    // Cria uma nova certificação.
    async create(data) {
        const certificacao = this.repo.create(data);
        return await this.repo.save(certificacao);
    }
    // ====================== ATUALIZAR ======================
    // Atualiza uma certificação existente.
    async update(id, data) {
        await this.repo.update(id, data);
        return await this.findById(id);
    }
    // ====================== EXCLUIR ======================
    // Remove uma certificação.
    async delete(id) {
        await this.repo.delete(id);
    }
}
//# sourceMappingURL=certificacao.repository.js.map