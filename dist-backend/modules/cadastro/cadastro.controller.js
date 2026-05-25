import { CadastroService } from './cadastro.service.js';
export class CadastroController {
    service = new CadastroService();
    async create(req, res) {
        try {
            const result = await this.service.create(req.body);
            return res.status(201).json(result);
        }
        catch (error) {
            const status = error.message.includes("em uso") ? 400 : 500;
            return res.status(status).json({ message: error.message });
        }
    }
    async findById(req, res) {
        try {
            const result = await this.service.findById(Number(req.params.id));
            if (!result)
                return res.status(404).json({ message: 'Cadastro não encontrado' });
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    async listAll(req, res) {
        try {
            const result = await this.service.listAll();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    async update(req, res) {
        try {
            const result = await this.service.update(Number(req.params.id), req.body);
            return res.status(200).json(result);
        }
        catch (error) {
            const status = error.message.includes("em uso") ? 400 : 500;
            return res.status(status).json({ message: error.message });
        }
    }
    async delete(req, res) {
        try {
            await this.service.delete(Number(req.params.id));
            return res.status(204).send();
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}
//# sourceMappingURL=cadastro.controller.js.map