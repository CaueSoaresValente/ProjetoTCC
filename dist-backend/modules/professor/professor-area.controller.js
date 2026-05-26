// ============================================================
// src/backend/modules/professor/professor-area.controller.ts
// ============================================================
// CONTROLLER para as áreas do professor.
// Recebe as requisições HTTP e devolve JSON.
//
// Rotas que este controller atende:
//   GET    /api/professor/:idProfessor/areas   → lista áreas do professor
//   POST   /api/professor/:idProfessor/areas   → vincula uma área
//   PUT    /api/professor/areas/:id            → atualiza vínculo
//   DELETE /api/professor/areas/:id            → remove vínculo
// ============================================================
import { ProfessorAreaService } from './professor-area.service.js';
export class ProfessorAreaController {
    // Instancia o service
    service = new ProfessorAreaService();
    // GET /api/professor/:idProfessor/areas
    // Lista todas as áreas que o professor escolheu
    async list(req, res) {
        try {
            const idProfessor = Number(req.params.idProfessor);
            const areas = await this.service.findByProfessor(idProfessor);
            return res.json(areas);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    // POST /api/professor/:idProfessor/areas
    // Vincula uma nova área ao professor
    async create(req, res) {
        try {
            const idProfessor = Number(req.params.idProfessor);
            const { idArea } = req.body;
            const result = await this.service.create(idProfessor, idArea);
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    // PUT /api/professor/areas/:id
    // Atualiza o vínculo (troca a área)
    async update(req, res) {
        try {
            const id = Number(req.params.id);
            const { idArea } = req.body;
            const result = await this.service.update(id, idArea);
            if (!result) {
                return res.status(404).json({ message: 'Vínculo não encontrado' });
            }
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    // DELETE /api/professor/areas/:id
    // Remove o vínculo
    async delete(req, res) {
        try {
            const id = Number(req.params.id);
            await this.service.delete(id);
            return res.json({ message: 'Área removida com sucesso' });
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}
//# sourceMappingURL=professor-area.controller.js.map