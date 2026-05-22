import { Request, Response } from 'express';
import { TurmaService } from './turma.service.js';

export class TurmaController {
  private service = new TurmaService();

  async listar(req: Request, res: Response) {
    try {
      const usuario = (req as any).usuario;
      const { search, periodo } = req.query;

      const result = await this.service.listar(usuario, {
        search: typeof search === 'string' ? search : undefined,
        periodo: typeof periodo === 'string' ? periodo : undefined,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  async criar(req: Request, res: Response) {
    try {
      const usuario = (req as any).usuario;
      const result = await this.service.criar(usuario, req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async atualizar(req: Request, res: Response) {
    try {
      const usuario = (req as any).usuario;
      const id = Number(req.params.id);
      const result = await this.service.atualizar(id, usuario, req.body);

      if (!result) {
        return res.status(404).json({ message: 'Turma não encontrada' });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      const status = error.message?.includes('permissão') ? 403 : 400;
      return res.status(status).json({ message: error.message });
    }
  }

  async excluir(req: Request, res: Response) {
    try {
      const usuario = (req as any).usuario;
      const id = Number(req.params.id);
      const ok = await this.service.excluir(id, usuario);

      if (!ok) {
        return res.status(404).json({ message: 'Turma não encontrada' });
      }

      return res.status(200).json({ message: 'Turma excluída com sucesso' });
    } catch (error: any) {
      const status = error.message?.includes('permissão') ? 403 : 400;
      return res.status(status).json({ message: error.message });
    }
  }

  // ====================== GESTÃO DE PROFESSORES ======================

  async buscarProfessoresElegiveis(req: Request, res: Response) {
    try {
      const usuario = (req as any).usuario;
      const idTurma = Number(req.params.id);
      const { idUC, diaSemana, periodo } = req.query;

      if (!idUC || !diaSemana || !periodo) {
        return res.status(400).json({ message: 'Parâmetros idUC, diaSemana e periodo são obrigatórios' });
      }

      const result = await this.service.buscarProfessoresElegiveis(
        idTurma,
        Number(idUC),
        String(diaSemana),
        String(periodo),
        usuario,
      );

      return res.status(200).json(result);
    } catch (error: any) {
      const status = error.message?.includes('permissão') ? 403 : 400;
      return res.status(status).json({ message: error.message });
    }
  }

  async alocarProfessor(req: Request, res: Response) {
    try {
      const usuario = (req as any).usuario;
      const idTurma = Number(req.params.id);
      const { idProfessor, idUC, diaSemana, periodo } = req.body;

      if (!idProfessor || !idUC || !diaSemana || !periodo) {
        return res.status(400).json({ message: 'idProfessor, idUC, diaSemana e periodo são obrigatórios' });
      }

      const result = await this.service.alocarProfessor(
        idTurma,
        Number(idProfessor),
        Number(idUC),
        String(diaSemana),
        String(periodo),
        usuario,
      );
      return res.status(201).json(result);
    } catch (error: any) {
      const status = error.message?.includes('permissão') ? 403 : 400;
      return res.status(status).json({ message: error.message });
    }
  }

  async desalocarProfessor(req: Request, res: Response) {
    try {
      const usuario = (req as any).usuario;
      const idTurma = Number(req.params.id);
      const idProfessor = Number(req.params.idProfessor);
      const { idUC, diaSemana, periodo } = req.query;

      const result = await this.service.desalocarProfessor(
        idTurma,
        idProfessor,
        usuario,
        idUC ? Number(idUC) : undefined,
        diaSemana ? String(diaSemana) : undefined,
        periodo ? String(periodo) : undefined,
      );
      return res.status(200).json(result);
    } catch (error: any) {
      const status = error.message?.includes('permissão') ? 403 : 400;
      return res.status(status).json({ message: error.message });
    }
  }
}
