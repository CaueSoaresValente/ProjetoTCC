import { CalendarioService } from './calendario.service.js';
export class CalendarioController {
    service = new CalendarioService();
    async meuCalendario(req, res) {
        try {
            const usuario = req.usuario;
            if (!usuario) {
                return res.status(401).json({ message: 'Não autorizado' });
            }
            const result = await this.service.obterCalendario(usuario.idUsuario);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
}
//# sourceMappingURL=calendario.controller.js.map