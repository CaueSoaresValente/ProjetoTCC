import { Request, Response } from 'express';
import { CalendarioService } from './calendario.service.js';

export class CalendarioController {
  private service = new CalendarioService();

  async meuCalendario(req: Request, res: Response) {
    try {
      const usuario = (req as any).usuario;
      if (!usuario) {
        return res.status(401).json({ message: 'Não autorizado' });
      }

      const result = await this.service.obterCalendario(usuario.idUsuario);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}
