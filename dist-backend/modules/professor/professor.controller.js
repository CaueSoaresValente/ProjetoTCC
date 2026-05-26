// ============================================================
// src/backend/modules/professor/professor.controller.ts
// ============================================================
// CONTROLLER do Professor.
// Aqui temos os métodos para buscar o professor pelo ID
// e também pelo idCadastro (quando o professor faz login,
// sabemos o idCadastro dele, e precisamos descobrir o idProfessor).
// ============================================================
import { ProfessorService } from './professor.service.js';
export class ProfessorController {
    service = new ProfessorService();
    // GET /api/professor/:id — Busca professor pelo ID
    async findById(req, res) {
        try {
            const result = await this.service.findById(Number(req.params.id));
            if (!result)
                return res.status(404).json({ message: 'Professor não encontrado' });
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    // GET /api/professor/cadastro/:idCadastro — Busca professor pelo ID do cadastro
    // Isso é necessário porque quando o professor faz login, o token JWT
    // só tem o idUsuario (do cadastro). Precisamos descobrir o idProfessor.
    async findByCadastro(req, res) {
        try {
            const idCadastro = Number(req.params.idCadastro);
            const result = await this.service.findByCadastro(idCadastro);
            if (!result)
                return res.status(404).json({ message: 'Professor não encontrado para este cadastro' });
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    // POST /api/professor — Cria um novo perfil de professor
    async create(req, res) {
        try {
            const result = await this.service.create(req.body);
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}
//# sourceMappingURL=professor.controller.js.map