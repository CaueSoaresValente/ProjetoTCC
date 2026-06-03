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
      // Agrupa os slots por turma para facilitar o frontend
      turmas: this.agruparTurmasPorId(prof.professorTurmas || []),
    };
  }

  // ====================== AGRUPAR TURMAS POR ID ======================
  // Cada ProfessorTurma representa UM slot alocado (UC + Dia + Período).
  // Agrupamos por idTurma para o frontend montar o calendário corretamente.
  private agruparTurmasPorId(professorTurmas: any[]) {
    const turmasMap = new Map<number, any>();

    for (const pt of professorTurmas) {
      if (!pt.turma || !pt.turma.status) continue;

      const idTurma = pt.turma.idTurma;

      if (!turmasMap.has(idTurma)) {
        turmasMap.set(idTurma, {
          idTurma,
          nome: pt.turma.nome || '',
          tipoCurso: pt.turma.tipoCurso || '',
          dataInicio: pt.turma.dataInicio,
          dataTermino: pt.turma.dataTermino,
          horarios: [],
        });
      }

      // Adiciona o slot específico do professor
      if (pt.turmaUC) {
        turmasMap.get(idTurma)!.horarios.push({
          diaSemana: pt.turmaUC.diaSemana,
          periodo: pt.turmaUC.periodo,
          uc: pt.turmaUC.unidadeCurricular?.nome || '',
        });
      }
    }

    return [...turmasMap.values()];
  }

  // ====================== CALCULAR OCUPAÇÃO ======================
  // Fórmula: (horas alocadas / horas disponíveis) * 100
  //
  // Cada período disponível = 4 horas.
  // Cada ProfessorTurma alocado tem suas horas de acordo com o sub-período do slot.
  //
  // Exemplo:
  //   - Professor tem 3 períodos disponíveis (12 horas)
  //   - Professor está alocado em 1 slot de 2 horas (M02) e 1 de 4 horas
  //   - Ocupação = (6 / 12) * 100 = 50%
  private calcularOcupacao(professor: Professor): number {
    // Total de horas disponíveis (cada período de disponibilidade = 4 horas)
    const totalHorasDisponiveis = (professor.disponibilidades?.length || 0) * 4;

    // Se não tem disponibilidade cadastrada, retorna 0
    if (totalHorasDisponiveis === 0) {
      return 0;
    }

    // Calcula total de horas alocadas
    let horasAlocadas = 0;
    if (professor.professorTurmas) {
      for (const pt of professor.professorTurmas) {
        if (pt.status && pt.turma?.status) {
          const periodo = pt.turmaUC?.periodo || 'M01'; // Fallback
          horasAlocadas += this.obterHorasDoPeriodo(periodo);
        }
      }
    }

    // Calcula a porcentagem (máximo 100%)
    const ocupacao = (horasAlocadas / totalHorasDisponiveis) * 100;
    return Math.min(Math.round(ocupacao), 100);
  }

  private obterHorasDoPeriodo(periodo: string): number {
    const p = periodo.toUpperCase();
    if (['M01', 'M02', 'T01', 'T02', 'N01', 'N02'].includes(p)) {
      return 2;
    }
    if (p === 'INT' || p === 'INTEGRAL' || p.startsWith('INT_') || p.includes('MANHÃ + TARDE') || p.includes('MANHA + TARDE') || p.includes('MANHÃ + NOITE') || p.includes('MANHA + NOITE') || p.includes('TARDE + NOITE')) {
      return 8;
    }
    if (p === 'MANHÃ' || p === 'MANHA' || p === 'TARDE' || p === 'NOITE') {
      return 4;
    }
    return 2; // padrão 2h para qualquer outro sub-período
  }
}
