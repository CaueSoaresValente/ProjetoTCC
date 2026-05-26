import { OPPService } from './opp.service.js';
export class OPPController {
    service = new OPPService();
    async list(req, res) {
        try {
            const result = await this.service.findAll();
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
    async findById(req, res) {
        try {
            const result = await this.service.findById(Number(req.params.id));
            if (!result)
                return res.status(404).json({ message: 'OPP não encontrado' });
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}
//# sourceMappingURL=opp.controller.js.map