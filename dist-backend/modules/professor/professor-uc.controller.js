// ============================================================
// src/backend/modules/professor/professor-uc.controller.ts
// ============================================================
// CONTROLLER para as Unidades Curriculares do professor.
// Recebe as requisições HTTP e devolve JSON.
//
// Rotas:
//   GET    /api/professor/:idProfessor/ucs     → lista UCs do professor
//   GET    /api/competencias/area/:idArea      → lista UCs por área (dropdown)
//   POST   /api/professor/:idProfessor/ucs     → vincula uma UC
//   PUT    /api/professor/ucs/:id              → atualiza nível
//   DELETE /api/professor/ucs/:id              → remove vínculo
// ============================================================
import { ProfessorUCService } from './professor-uc.service.js';
export class ProfessorUCController {
    service = new ProfessorUCService();
    // GET /api/professor/:idProfessor/ucs
    // Lista todas as UCs do professor
    async list(req, res) {
        try {
            const idProfessor = Number(req.params.idProfessor);
            const ucs = await this.service.findByProfessor(idProfessor);
            return res.json(ucs);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    // GET /api/competencias/area/:idArea
    // Lista as UCs de uma área específica (para popular o dropdown)
    async listByArea(req, res) {
        try {
            const idArea = Number(req.params.idArea);
            const ucs = await this.service.findUCsByArea(idArea);
            return res.json(ucs);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    // POST /api/professor/:idProfessor/ucs
    // Vincula uma UC ao professor com nível de competência
    async create(req, res) {
        try {
            const idProfessor = Number(req.params.idProfessor);
            const { idUC, nivelCompetencia } = req.body;
            const result = await this.service.create(idProfessor, idUC, nivelCompetencia);
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    // PUT /api/professor/ucs/:id
    // Atualiza o nível de competência
    async update(req, res) {
        try {
            const id = Number(req.params.id);
            const { nivelCompetencia } = req.body;
            const result = await this.service.update(id, nivelCompetencia);
            if (!result) {
                return res.status(404).json({ message: 'Vínculo não encontrado' });
            }
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    // DELETE /api/professor/ucs/:id
    // Remove o vínculo
    async delete(req, res) {
        try {
            const id = Number(req.params.id);
            await this.service.delete(id);
            return res.json({ message: 'UC removida com sucesso' });
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}
//# sourceMappingURL=professor-uc.controller.js.map