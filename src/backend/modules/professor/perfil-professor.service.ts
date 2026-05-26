// ============================================================
// src/backend/modules/professor/perfil-professor.service.ts
// ============================================================
// SERVICE para a tela de "Perfil dos Professores".
// Aqui ficam as regras de negócio:
//   - Gestor vê TODOS os professores
//   - OPP vê apenas os professores das SUAS áreas
//   - Calcula a porcentagem de ocupação do professor
//
// A porcentagem de ocupação é calculada assim:
//   1. Contamos quantos períodos o professor tem disponíveis (tabela disponibilidade)
//   2. Contamos quantos períodos ele está alocado em turmas (tabela professor_turma → turma → turma_uc)
//   3. Ocupação = (períodos alocados / períodos disponíveis) * 100
// ============================================================

import { PerfilProfessorRepository } from './perfil-professor.repository.js';
import { Professor } from './professor.entity.js';

export class PerfilProfessorService {
  private repo = new PerfilProfessorRepository();

  // ====================== LISTAR PROFESSORES ======================
  // Se receber idOPP, filtra por áreas do OPP.
  // Se não receber, retorna todos (caso do Gestor).
  async listarProfessores(idOPP?: number) {
    let professores: Professor[];

    if (idOPP) {
      // OPP: busca apenas professores das suas áreas
      professores = await this.repo.findByOPPAreas(idOPP);
    } else {
      // Gestor: busca todos
      professores = await this.repo.findAll();
    }

    // Monta a resposta com dados resumidos + % de ocupação
    return professores.map(prof => ({
      idProfessor: prof.idProfessor,
      nome: prof.cadastro?.nome || 'Sem nome',
      email: prof.cadastro?.email || '',
      areas: prof.professorAreas?.map(pa => ({
        idArea: pa.area?.idArea,
        nome: pa.area?.nome,
      })) || [],
      ocupacao: this.calcularOcupacao(prof),
    }));
  }

  // ====================== BUSCAR PERFIL COMPLETO ======================
  // Retorna todos os dados do professor para o modal.
  async buscarPerfilCompleto(idProfessor: number) {
    const prof = await this.repo.findFullProfile(idProfessor);

    if (!prof) {
      return null;
    }

    return {
      idProfessor: prof.idProfessor,
      nome: prof.cadastro?.nome || 'Sem nome',
      email: prof.cadastro?.email || '',

      // Porcentagem de ocupação
      ocupacao: this.calcularOcupacao(prof),

      // Áreas do professor
      areas: prof.professorAreas?.map(pa => ({
        idProfessorArea: pa.idProfessorArea,
        idArea: pa.area?.idArea,
        nome: pa.area?.nome,
      })) || [],

      // UCs do professor com nível de competência
      ucs: prof.professorUCs?.map(puc => ({
        idProfessorUC: puc.idProfessorUC,
        idUC: puc.idUC,
        nome: puc.unidadeCurricular?.nome || '',
        descricao: puc.unidadeCurricular?.descricao || '',
        area: puc.unidadeCurricular?.area?.nome || '',
        nivelCompetencia: Number(puc.nivelCompetencia),
      })) || [],

      // Certificações do professor
      certificacoes: prof.certificacoes?.map(cert => ({
        idCertificacao: cert.idCertificacao,
        nome: cert.nome,
        instituicao: cert.instituicao || '',
        dataObtencao: cert.dataObtencao,
        cargaHoraria: cert.cargaHoraria || '',
      })) || [],

      // Disponibilidade semanal
      disponibilidade: prof.disponibilidades?.map(disp => ({
        idDisponibilidade: disp.idDisponibilidade,
        diaSemana: disp.diaSemana,
        periodo: disp.periodo,
      })) || [],

      // Turmas vinculadas (para o calendário)
      turmas: prof.professorTurmas?.map(pt => ({
        idTurma: pt.turma?.idTurma,
        nome: pt.turma?.nome || '',
        tipoCurso: pt.turma?.tipoCurso || '',
        dataInicio: pt.turma?.dataInicio,
        dataTermino: pt.turma?.dataTermino,
        // Dias e períodos da turma (para montar o calendário)
        horarios: pt.turma?.turmaUCs?.map((tuc: any) => ({
          diaSemana: tuc.diaSemana,
          periodo: tuc.periodo,
          uc: tuc.unidadeCurricular?.nome || '',
        })) || [],
      })) || [],
    };
  }

  // ====================== CALCULAR OCUPAÇÃO ======================
  // Fórmula: (períodos alocados / períodos disponíveis) * 100
  //
  // Exemplo:
  //   - Professor tem disponibilidade: seg-manhã, seg-tarde, ter-manhã (3 períodos)
  //   - Professor está em turmas que ocupam: seg-manhã, ter-manhã (2 períodos)
  //   - Ocupação = (2/3) * 100 = 66.67%
  private calcularOcupacao(professor: Professor): number {
    // Total de períodos disponíveis
    const totalDisponivel = professor.disponibilidades?.length || 0;

    // Se não tem disponibilidade cadastrada, retorna 0
    if (totalDisponivel === 0) {
      return 0;
    }

    // Conta os períodos alocados em turmas
    // Para cada turma do professor, pega os horários (turma_uc)
    let periodosAlocados = 0;
    if (professor.professorTurmas) {
      for (const pt of professor.professorTurmas) {
        if (pt.turma?.turmaUCs) {
          periodosAlocados += pt.turma.turmaUCs.length;
        }
      }
    }

    // Calcula a porcentagem (máximo 100%)
    const ocupacao = (periodosAlocados / totalDisponivel) * 100;
    return Math.min(Math.round(ocupacao), 100);
  }
}
