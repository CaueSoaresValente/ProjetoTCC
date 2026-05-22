// ============================================================
// src/backend/modules/disciplina/unidade-curricular.controller.ts
// ============================================================
// CONTROLLER para Competências (Unidades Curriculares).
// Recebe as requisições HTTP e devolve JSON.
// ============================================================

import { Request, Response } from 'express';
import { UnidadeCurricularService } from './unidade-curricular.service.js';

export class UnidadeCurricularController {
  private service = new UnidadeCurricularService();

  // GET /api/competencias — Lista todas
  async list(req: Request, res: Response) {
    try {
      const ucs = await this.service.findAll();
      return res.json(ucs);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  // POST /api/competencias — Cria uma nova
  async create(req: Request, res: Response) {
    try {
      const result = await this.service.create(req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  // PUT /api/competencias/:id — Atualiza uma existente
  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const result = await this.service.update(id, req.body);
      if (!result) {
        return res.status(404).json({ message: 'UC não encontrada' });
      }
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  // DELETE /api/competencias/:id — Exclui
  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await this.service.delete(id);
      return res.json({ message: 'UC excluída com sucesso' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}
