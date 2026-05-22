import { Request, Response } from 'express';
import { OPPService } from './opp.service.js';

export class OPPController {
  private service = new OPPService();

  async list(req: Request, res: Response) {
    try {
      const result = await this.service.findAll();
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const result = await this.service.findById(Number(req.params.id));
      if (!result) return res.status(404).json({ message: 'OPP não encontrado' });
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}
