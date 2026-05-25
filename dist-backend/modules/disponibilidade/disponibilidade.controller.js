// src/backend/modules/disponibilidade/disponibilidade.controller.ts
//
// O CONTROLLER recebe as requisições HTTP e devolve respostas JSON.
// Ele não faz lógica — só chama o service e trata erros.
//
// Rotas que ele atende:
//   GET  /api/professor/:idProfessor/disponibilidade  → busca horários do professor
//   PUT  /api/professor/:idProfessor/disponibilidade  → salva/atualiza horários da semana toda
//   POST /api/professor/:idProfessor/disponibilidade  → adiciona um horário avulso
//   DELETE /api/professor/disponibilidade/:id         → remove um horário específico
import { DisponibilidadeService } from './disponibilidade.service.js';
export class DisponibilidadeController {
    service = new DisponibilidadeService();
    // GET /api/professor/:idProfessor/disponibilidade
    // Retorna todos os horários do professor
    async findByProfessor(req, res) {
        try {
            const idProfessor = Number(req.params.idProfessor);
            const result = await this.service.findByProfessorId(idProfessor);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    // PUT /api/professor/:idProfessor/disponibilidade
    // Salva a semana inteira de uma vez.
    // O corpo da requisição deve ser assim:
    //   { "disponibilidades": { "segunda": ["manha", "tarde"], "sexta": ["noite"] } }
    async sincronizarSemana(req, res) {
        try {
            const idProfessor = Number(req.params.idProfessor);
            const { disponibilidades } = req.body;
            if (!disponibilidades || typeof disponibilidades !== 'object') {
                return res.status(400).json({ message: 'Campo "disponibilidades" é obrigatório e deve ser um objeto' });
            }
            const result = await this.service.sincronizarSemana(idProfessor, disponibilidades);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    // POST /api/professor/:idProfessor/disponibilidade
    // Adiciona um horário avulso (útil para clique individual)
    // Corpo: { "diaSemana": "segunda", "periodo": "manha" }
    async adicionar(req, res) {
        try {
            const idProfessor = Number(req.params.idProfessor);
            const { diaSemana, periodo } = req.body;
            if (!diaSemana || !periodo) {
                return res.status(400).json({ message: 'Campos "diaSemana" e "periodo" são obrigatórios' });
            }
            const result = await this.service.adicionar(idProfessor, diaSemana, periodo);
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    // DELETE /api/professor/disponibilidade/:id
    // Remove um horário específico pelo ID
    async remover(req, res) {
        try {
            const id = Number(req.params.id);
            await this.service.remover(id);
            return res.status(200).json({ message: 'Disponibilidade removida com sucesso' });
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}
//# sourceMappingURL=disponibilidade.controller.js.map