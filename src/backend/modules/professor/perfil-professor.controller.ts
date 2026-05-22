// ============================================================
// src/backend/modules/professor/perfil-professor.controller.ts
// ============================================================
// CONTROLLER para a tela de "Perfil dos Professores".
//
// Este controller tem dois endpoints:
//   GET /api/professores/perfis          → Lista professores (com filtro por OPP)
//   GET /api/professores/perfis/:id      → Perfil completo de um professor
//
// COMO FUNCIONA A PERMISSÃO:
//   - O authMiddleware (no app.ts) já garante que só gestor/opp acessam
//   - O Controller verifica se é OPP para passar o filtro de áreas
//   - O Service aplica a lógica de filtragem
// ============================================================

import { Request, Response } from 'express';
import { PerfilProfessorService } from './perfil-professor.service.js';

export class PerfilProfessorController {
  private service = new PerfilProfessorService();

  // GET /api/professores/perfis
  // Lista todos os professores (ou filtrados por áreas do OPP)
  //
  // O middleware coloca o usuário logado em req.usuario.
  // Se a função for "opp", passamos o idUsuario para o service
  // filtrar os professores pelas áreas do OPP.
  async listar(req: Request, res: Response) {
    try {
      const usuario = (req as any).usuario;

      // Se for OPP, precisamos descobrir o idOPP a partir do idUsuario
      // O idUsuario é o id do cadastro, e na tabela opp, temos id_cadastro
      let idOPP: number | undefined;

      if (usuario.funcao === 'opp') {
        // Busca o OPP pelo idCadastro do usuário logado
        const { AppDataSource } = await import('../../config/data-source.js');
        const { OPP } = await import('../opp/opp.entity.js');
        const oppRepo = AppDataSource.getRepository(OPP);
        const opp = await oppRepo.findOne({ where: { idCadastro: usuario.idUsuario } });

        if (!opp) {
          return res.status(404).json({ message: 'OPP não encontrado para este cadastro' });
        }

        idOPP = opp.idOPP;
      }

      const result = await this.service.listarProfessores(idOPP);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  // GET /api/professores/perfis/:idProfessor
  // Retorna o perfil completo de um professor
  async perfilCompleto(req: Request, res: Response) {
    try {
      const idProfessor = Number(req.params.idProfessor);

      const result = await this.service.buscarPerfilCompleto(idProfessor);

      if (!result) {
        return res.status(404).json({ message: 'Professor não encontrado' });
      }

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}
