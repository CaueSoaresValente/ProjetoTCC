// ============================================================
// src/backend/modules/professor/certificacao.service.ts
// ============================================================
// SERVICE para as certificações do professor.
// Regras de negócio:
//   - O nome da certificação é obrigatório
// ============================================================
import { CertificacaoRepository } from './certificacao.repository.js';
import { WebSocketManager } from '../../shared/websocket.manager.js';
export class CertificacaoService {
    repo = new CertificacaoRepository();
    // Lista todas as certificações de um professor
    async findByProfessor(idProfessor) {
        return await this.repo.findByProfessor(idProfessor);
    }
    // Cria uma nova certificação
    async create(idProfessor, data) {
        // Validação: o nome é obrigatório
        if (!data.nome || data.nome.trim() === '') {
            throw new Error('O nome da certificação é obrigatório');
        }
        // Montamos o objeto completo com o idProfessor
        const result = await this.repo.create({
            ...data,
            idProfessor,
        });
        WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'professores' });
        WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'turmas' });
        return result;
    }
    // Atualiza uma certificação existente
    async update(id, data) {
        // Validação: se informou o nome, ele não pode ser vazio
        if (data.nome !== undefined && data.nome.trim() === '') {
            throw new Error('O nome da certificação não pode ser vazio');
        }
        const result = await this.repo.update(id, data);
        WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'professores' });
        WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'turmas' });
        return result;
    }
    // Exclui uma certificação
    async delete(id) {
        const result = await this.repo.delete(id);
        WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'professores' });
        WebSocketManager.broadcast({ type: 'DATA_UPDATED', entity: 'turmas' });
        return result;
    }
}
//# sourceMappingURL=certificacao.service.js.map