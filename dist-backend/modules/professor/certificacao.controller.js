// ============================================================
// src/backend/modules/professor/certificacao.controller.ts
// ============================================================
// CONTROLLER para as certificações do professor.
// Recebe as requisições HTTP e devolve JSON.
//
// Rotas:
//   GET    /api/professor/:idProfessor/certificacoes  → lista
//   POST   /api/professor/:idProfessor/certificacoes  → cria
//   PUT    /api/professor/certificacoes/:id           → atualiza
//   DELETE /api/professor/certificacoes/:id           → remove
// ============================================================
import { CertificacaoService } from './certificacao.service.js';
export class CertificacaoController {
    service = new CertificacaoService();
    // GET /api/professor/:idProfessor/certificacoes
    // Lista todas as certificações do professor
    async list(req, res) {
        try {
            const idProfessor = Number(req.params.idProfessor);
            const certificacoes = await this.service.findByProfessor(idProfessor);
            return res.json(certificacoes);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    // POST /api/professor/:idProfessor/certificacoes
    // Cria uma nova certificação
    async create(req, res) {
        try {
            const idProfessor = Number(req.params.idProfessor);
            const result = await this.service.create(idProfessor, req.body);
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    // PUT /api/professor/certificacoes/:id
    // Atualiza uma certificação existente
    async update(req, res) {
        try {
            const id = Number(req.params.id);
            const result = await this.service.update(id, req.body);
            if (!result) {
                return res.status(404).json({ message: 'Certificação não encontrada' });
            }
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    // DELETE /api/professor/certificacoes/:id
    // Remove uma certificação
    async delete(req, res) {
        try {
            const id = Number(req.params.id);
            await this.service.delete(id);
            return res.json({ message: 'Certificação excluída com sucesso' });
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}
//# sourceMappingURL=certificacao.controller.js.map