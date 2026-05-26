// ============================================================
// src/backend/modules/area/area.controller.ts
// ============================================================
// CONTROLLER = a camada que recebe as requisições HTTP (GET, POST, PUT, DELETE)
// e devolve as respostas (JSON).
//
// O fluxo é:
//   1. O frontend faz um fetch("/api/areas")
//   2. O Express chama o método correspondente aqui
//   3. O Controller chama o Service
//   4. O Service chama o Repository
//   5. O Repository fala com o banco via TypeORM
//   6. A resposta volta pelo mesmo caminho até o frontend
// ============================================================
import { AreaService } from './area.service.js';
export class AreaController {
    service = new AreaService();
    // GET /api/areas — Lista todas as áreas
    async list(req, res) {
        try {
            const areas = await this.service.findAll();
            return res.json(areas);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    // POST /api/areas — Cria uma nova área
    async create(req, res) {
        try {
            const result = await this.service.create(req.body);
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    // PUT /api/areas/:id — Atualiza uma área existente
    async update(req, res) {
        try {
            const id = Number(req.params.id);
            const result = await this.service.update(id, req.body);
            if (!result) {
                return res.status(404).json({ message: 'Área não encontrada' });
            }
            return res.json(result);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    // DELETE /api/areas/:id — Exclui uma área
    async delete(req, res) {
        try {
            const id = Number(req.params.id);
            await this.service.delete(id);
            return res.json({ message: 'Área excluída com sucesso' });
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}
//# sourceMappingURL=area.controller.js.map