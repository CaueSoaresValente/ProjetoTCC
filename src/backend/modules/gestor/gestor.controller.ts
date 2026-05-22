import { Request, Response } from 'express';
import { GestorService } from './gestor.service.js';

export class GestorController {
  private service = new GestorService();

  async findById(req: Request, res: Response) {
    try {
      const result = await this.service.findById(Number(req.params.id));
      if (!result) return res.status(404).json({ message: 'Gestor não encontrado' });
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Adicionar outros métodos conforme necessário
}
