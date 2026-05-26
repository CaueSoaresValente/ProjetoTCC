import { GestorService } from './gestor.service.js';
export class GestorController {
    service = new GestorService();
    async findById(req, res) {
        try {
            const result = await this.service.findById(Number(req.params.id));
            if (!result)
                return res.status(404).json({ message: 'Gestor não encontrado' });
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}
//# sourceMappingURL=gestor.controller.js.map