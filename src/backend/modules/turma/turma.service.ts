import { In, Not } from 'typeorm';
import { AppDataSource } from '../../config/data-source.js';
import { OPP } from '../opp/opp.entity.js';
import { OPPArea } from '../area/opp-area.entity.js';
import { UnidadeCurricular } from '../disciplina/unidade-curricular.entity.js';
import { Turma } from './turma.entity.js';
import { TurmaRepository } from './turma.repository.js';
import { ProfessorUC } from '../disciplina/professor-uc.entity.js';
import { ProfessorTurma } from './professor-turma.entity.js';
import { Disponibilidade } from '../disponibilidade/disponibilidade.entity.js';
import { Professor } from '../professor/professor.entity.js';
import { TurmaUC } from './turma-uc.entity.js';

// Prioridade de ordenação dos períodos (Manhã → Tarde → Noite)
const PERIODO_ORDEM: Record<string, number> = {
  'M01': 1, 'M02': 2, 'Manhã': 3, 'MANHÃ': 3,
  'INT_MT': 4, 'INT': 5, 'INTEGRAL': 5,
  'T01': 6, 'T02': 7, 'Tarde': 8, 'TARDE': 8,
  'INT_TN': 9,
  'N01': 10, 'N02': 11, 'Noite': 12, 'NOITE': 12,
  'INT_MN': 13,
};

const MAPA_DIA_CURTO: Record<string, string> = {
  segunda: 'Seg',
  terca: 'Ter',
  quarta: 'Qua',
  quinta: 'Qui',
  sexta: 'Sex',
  sabado: 'Sáb',
};

const MODALIDADE_LABELS: Record<string, string> = {
  tec: 'Técnico',
  cai: 'Aprendizagem Industrial (CAI)',
  fic: 'Formação Inicial e Continuada (FIC)',
};

interface UsuarioToken {
  idUsuario: number;
  funcao: string;
}

interface ListarFiltros {
  search?: string;
  periodo?: string;
}

interface HorarioInput {
  diaSemana: string;
  periodo: string;
  idUC?: number;
  nomeUC?: string;
}

interface CriarTurmaInput {
  nome: string;
  tipoCurso: string;
  dataInicio: string;
  dataTermino: string;
  idOPP: number;
  idArea?: number;
  aulasSemana?: number;
  totalAulas?: number;
  horarios: HorarioInput[];
}

export class TurmaService {
  private repo = new TurmaRepository();

  async listar(usuario: UsuarioToken, filtros: ListarFiltros = {}) {
    let turmas: Turma[];

    if (usuario.funcao === 'opp') {
      const idOPP = await this.resolverIdOPP(usuario.idUsuario);
      if (!idOPP) {
        throw new Error('OPP não encontrado para este cadastro');
      }
      turmas = await this.repo.findByOPP(idOPP);
    } else {
      turmas = await this.repo.findAll();
    }

    const cards = turmas.map((t) => this.mapTurmaParaCard(t));

    return cards.filter((card) => {
      const matchPeriodo = this.cardMatchesPeriodo(card, filtros.periodo || 'Todas');
      const matchSearch = this.cardMatchesSearch(card, filtros.search || '');
      return matchPeriodo && matchSearch;
    });
  }

  async criar(usuario: UsuarioToken, dados: CriarTurmaInput) {
    if (!dados.nome?.trim()) {
      throw new Error('Nome da turma é obrigatório');
    }
    if (!dados.dataInicio || !dados.dataTermino) {
      throw new Error('Datas de início e término são obrigatórias');
    }
    if (!dados.horarios?.length) {
      throw new Error('Informe ao menos um horário na grade');
    }

    let idOPP = dados.idOPP;

    if (usuario.funcao === 'opp') {
      const oppId = await this.resolverIdOPP(usuario.idUsuario);
      if (!oppId) throw new Error('OPP não encontrado para este cadastro');
      idOPP = oppId;
    } else if (!idOPP) {
      throw new Error('OPP responsável é obrigatório');
    }

    // Regra 1: Validar que o OPP pertence à Área selecionada
    if (dados.idArea && idOPP) {
      await this.validarOPPPertenceArea(idOPP, dados.idArea);
    }

    const horariosResolvidos = await this.resolverHorarios(dados.horarios, dados.idArea);

    const turma = await this.repo.create({
      idCriador: usuario.idUsuario,
      idOPP,
      nome: dados.nome.trim(),
      tipoCurso: dados.tipoCurso.toUpperCase(),
      dataInicio: new Date(dados.dataInicio),
      dataTermino: new Date(dados.dataTermino),
      aulasSemana: dados.aulasSemana ?? this.contarDiasUnicos(horariosResolvidos),
      totalAulas: dados.totalAulas ?? horariosResolvidos.length,
      status: true,
    });

    await this.repo.saveHorarios(turma.idTurma, horariosResolvidos);

    const salva = await this.repo.findById(turma.idTurma);
    return this.mapTurmaParaCard(salva!);
  }

  async atualizar(idTurma: number, usuario: UsuarioToken, dados: Partial<CriarTurmaInput>) {
    const turma = await this.repo.findById(idTurma);
    if (!turma) return null;

    await this.verificarPermissao(usuario, turma);

    // Regra 1: Validar que o OPP pertence à Área selecionada
    const idOPPFinal = dados.idOPP ?? turma.idOPP;
    const idAreaFinal = dados.idArea ?? turma.turmaUCs?.[0]?.unidadeCurricular?.idArea;
    if (idAreaFinal && idOPPFinal) {
      await this.validarOPPPertenceArea(idOPPFinal, idAreaFinal);
    }

    const updateData: Partial<Turma> = {};
    if (dados.nome) updateData.nome = dados.nome.trim();
    if (dados.tipoCurso) updateData.tipoCurso = dados.tipoCurso.toUpperCase();
    if (dados.dataInicio) updateData.dataInicio = new Date(dados.dataInicio);
    if (dados.dataTermino) updateData.dataTermino = new Date(dados.dataTermino);
    if (dados.idOPP && usuario.funcao === 'gestor') updateData.idOPP = dados.idOPP;

    // Se mudou data ou horários, recalculamos aulasSemana e totalAulas
    const dataInicioFinal = dados.dataInicio ? new Date(dados.dataInicio) : turma.dataInicio;
    const dataTerminoFinal = dados.dataTermino ? new Date(dados.dataTermino) : turma.dataTermino;

    let horariosResolvidos: { idUC: number; diaSemana: string; periodo: string }[] = [];
    const horariosForamPassados = dados.horarios !== undefined;

    if (horariosForamPassados) {
      horariosResolvidos = await this.resolverHorarios(dados.horarios || [], dados.idArea);

      const oldHorarios = turma.turmaUCs || [];
      const oldUCIds = [...new Set(oldHorarios.map(h => h.idUC))];
      const newUCIds = [...new Set(horariosResolvidos.map(h => h.idUC))];

      const profTurmaRepo = AppDataSource.getRepository(ProfessorTurma);
      const profUCRepo = AppDataSource.getRepository(ProfessorUC);

      // Os professores vinculados a slots que forem removidos em saveHorarios 
      // serão automaticamente desalocados pelo CASCADE do banco de dados.
      // Caso um professor possua múltiplos slots, ele permanecerá na turma
      // enquanto tiver ao menos uma atribuição ativa.

      await this.repo.saveHorarios(idTurma, horariosResolvidos);
    }

    const horariosFinais = horariosForamPassados ? horariosResolvidos : (turma.turmaUCs || []);
    updateData.aulasSemana = this.contarDiasUnicos(horariosFinais);
    updateData.totalAulas = this.calcularTotalAulas(dataInicioFinal, dataTerminoFinal, horariosFinais);

    await this.repo.update(idTurma, updateData);

    const atualizada = await this.repo.findById(idTurma);
    return atualizada ? this.mapTurmaParaCard(atualizada) : null;
  }

  async excluir(idTurma: number, usuario: UsuarioToken) {
    const turma = await this.repo.findById(idTurma);
    if (!turma) return false;

    await this.verificarPermissao(usuario, turma);
    await this.repo.softDelete(idTurma);
    return true;
  }

  private async verificarPermissao(usuario: UsuarioToken, turma: Turma) {
    if (usuario.funcao === 'gestor') return;

    if (usuario.funcao === 'opp') {
      const idOPP = await this.resolverIdOPP(usuario.idUsuario);
      if (idOPP !== turma.idOPP) {
        throw new Error('Você não tem permissão para alterar esta turma');
      }
      return;
    }

    throw new Error('Acesso negado');
  }

  private async validarOPPPertenceArea(idOPP: number, idArea: number) {
    const oppAreaRepo = AppDataSource.getRepository(OPPArea);
    const vinculo = await oppAreaRepo.findOne({
      where: { idOPP, idArea }
    });
    if (!vinculo) {
      throw new Error('O OPP selecionado não pertence à área informada. Selecione um OPP compatível.');
    }
  }

  private async resolverIdOPP(idCadastro: number): Promise<number | null> {
    const oppRepo = AppDataSource.getRepository(OPP);
    const opp = await oppRepo.findOne({ where: { idCadastro } });
    return opp?.idOPP ?? null;
  }

  private async resolverHorarios(horarios: HorarioInput[], idArea?: number) {
    const ucRepo = AppDataSource.getRepository(UnidadeCurricular);
    const resolvidos: { idUC: number; diaSemana: string; periodo: string }[] = [];

    for (const h of horarios) {
      let idUC = h.idUC;

      if (!idUC && h.nomeUC) {
        // Buscamos a UC pelo nome. Removido o filtro por idArea para permitir UCs de qualquer área.
        const uc = await ucRepo.findOne({ where: { nome: h.nomeUC } });
        if (!uc) {
          throw new Error(`Unidade curricular "${h.nomeUC}" não encontrada`);
        }
        idUC = uc.idUC;
      }

      if (!idUC) {
        throw new Error('Cada horário precisa de idUC ou nomeUC');
      }

      resolvidos.push({
        idUC,
        diaSemana: h.diaSemana.toLowerCase(),
        periodo: h.periodo,
      });
    }

    return resolvidos;
  }

  private contarDiasUnicos(
    horarios: { diaSemana: string }[],
  ): number {
    return new Set(horarios.map((h) => h.diaSemana)).size;
  }

  private mapTurmaParaCard(turma: Turma) {
    const grade = this.buildGrade(turma);
    const areas = [
      ...new Set(
        turma.turmaUCs
          ?.map((tuc) => tuc.unidadeCurricular?.area?.nome)
          .filter(Boolean) as string[],
      ),
    ];

    // Deduplica professores vinculados (um professor pode estar em vários slots)
    const profsMap = new Map<number, { idProfessor: number; nome: string; foto: string }>();
    for (const pt of turma.professorTurmas || []) {
      if (!pt.status || !pt.professor) continue;
      if (!profsMap.has(pt.idProfessor)) {
        profsMap.set(pt.idProfessor, {
          idProfessor: pt.idProfessor,
          nome: pt.professor?.cadastro?.nome || 'Sem nome',
          foto:
            pt.professor?.cadastro?.fotoPerfil ||
            'https://img.freepik.com/fotos-gratis/professor-senior-olhando-camera-contra-chalkboard-com-matematica-exemplo_23-2148200995.jpg?semt=ais_hybrid&w=740&q=80',
        });
      }
    }
    const professores = [...profsMap.values()];

    const inicio = turma.dataInicio ? new Date(turma.dataInicio) : null;
    const termino = turma.dataTermino ? new Date(turma.dataTermino) : null;

    let duracaoDias = 0;
    if (inicio && termino) {
      duracaoDias =
        Math.ceil((termino.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    const siglas = grade[0]?.periodo || 'N/D';
    const idArea = turma.turmaUCs?.[0]?.unidadeCurricular?.idArea || null;

    return {
      idTurma: turma.idTurma,
      label: turma.nome,
      value: `turma-${turma.idTurma}`,
      modalidade: turma.tipoCurso.toLowerCase(),
      siglas,
      areas,
      idArea,
      grade,
      aulasSemana: turma.aulasSemana ?? this.contarDiasUnicos(turma.turmaUCs || []),
      totalAulas: turma.totalAulas ?? turma.turmaUCs?.length ?? 0,
      duracaoDias,
      dataInicio: inicio ? this.formatarData(inicio) : '',
      dataTermino: termino ? this.formatarData(termino) : '',
      dataInicioISO: inicio?.toISOString().split('T')[0] || '',
      dataTerminoISO: termino?.toISOString().split('T')[0] || '',
      criadorNome: turma.criador?.nome || '',
      oppNome: turma.opp?.cadastro?.nome || '',
      idOPP: turma.idOPP,
      professores,
    };
  }

  private buildGrade(turma: Turma) {
    const periodos: Record<string, { aulas: Record<string, { disciplina: string; professor: string; idProfessor: number | null; idUC: number | null }> }> =
      {};

    // Criar mapa de idTurmaUC → { nome, idProfessor } do professor alocado
    const profPorSlot = new Map<number, { nome: string; idProfessor: number }>();
    for (const pt of turma.professorTurmas || []) {
      if (pt.status && pt.idTurmaUC && pt.professor?.cadastro?.nome) {
        profPorSlot.set(pt.idTurmaUC, {
          nome: pt.professor.cadastro.nome,
          idProfessor: pt.idProfessor,
        });
      }
    }

    for (const tuc of turma.turmaUCs || []) {
      const per = tuc.periodo;
      if (!periodos[per]) {
        periodos[per] = { aulas: {} };
      }
      const targetPeriodo = periodos[per];
      if (targetPeriodo) {
        const dia = MAPA_DIA_CURTO[tuc.diaSemana.toLowerCase()] || tuc.diaSemana;
        // Buscar professor específico deste slot
        const profDoSlot = profPorSlot.get(tuc.idTurmaUC) || { nome: 'A definir', idProfessor: null };
        targetPeriodo.aulas[dia] = {
          disciplina: tuc.unidadeCurricular?.nome || '',
          professor: profDoSlot.nome,
          idProfessor: profDoSlot.idProfessor,
          idUC: tuc.idUC || null,
        };
      }
    }

    // Ordenar períodos: Manhã → Tarde → Noite
    return Object.entries(periodos)
      .sort(([a], [b]) => (PERIODO_ORDEM[a] ?? 99) - (PERIODO_ORDEM[b] ?? 99))
      .map(([periodo, data]) => ({
        periodo,
        aulas: data.aulas,
      }));
  }

  private formatarData(data: Date): string {
    const d = data.getDate().toString().padStart(2, '0');
    const m = (data.getMonth() + 1).toString().padStart(2, '0');
    const y = data.getFullYear();
    return `${d}/${m}/${y}`;
  }

  private cardMatchesPeriodo(
    card: { siglas: string; grade: { periodo: string }[] },
    filtro: string,
  ): boolean {
    if (!filtro || filtro === 'Todas') return true;

    const periodos = card.grade?.length
      ? card.grade.map((g) => g.periodo)
      : [card.siglas];

    return periodos.some((p) => this.periodoMatchesFiltro(p, filtro));
  }

  private periodoMatchesFiltro(periodo: string, filtro: string): boolean {
    const p = periodo.toUpperCase();

    switch (filtro) {
      case 'Manhã':
        return (
          p.startsWith('M') ||
          p === 'MANHÃ' ||
          p.includes('INT_M') ||
          p === 'INT_MT' ||
          p === 'INT_MN'
        );
      case 'Tarde':
        return (
          (p.startsWith('T') && !p.startsWith('INT_TN')) ||
          p === 'TARDE' ||
          p === 'INT_MT' ||
          p === 'INT_TN'
        );
      case 'Noite':
        return p.startsWith('N') || p === 'NOITE' || p === 'INT_MN' || p === 'INT_TN';
      case 'Integral':
        return p === 'INT' || p === 'INTEGRAL' || p.startsWith('INT_');
      default:
        return true;
    }
  }

  private calcularTotalAulas(dataInicio: Date, dataTermino: Date, horarios: { diaSemana: string }[]): number {
    if (!dataInicio || !dataTermino || !horarios.length) return 0;
    if (dataInicio > dataTermino) return 0;

    const mapaDiasJs: Record<string, number> = {
      segunda: 1,
      terca: 2,
      quarta: 3,
      quinta: 4,
      sexta: 5,
      sabado: 6
    };

    const diasSelecionadosJs = [
      ...new Set(
        horarios.map(h => mapaDiasJs[h.diaSemana.toLowerCase()]).filter(d => d !== undefined)
      )
    ];

    let total = 0;
    const current = new Date(dataInicio);
    current.setHours(12, 0, 0, 0);
    const end = new Date(dataTermino);
    end.setHours(12, 0, 0, 0);

    while (current <= end) {
      if (diasSelecionadosJs.includes(current.getDay())) {
        total++;
      }
      current.setDate(current.getDate() + 1);
    }

    return total;
  }

  private cardMatchesSearch(
    card: {
      label: string;
      siglas: string;
      modalidade: string;
      areas: string[];
    },
    termo: string,
  ): boolean {
    const search = termo.trim().toLowerCase();
    if (!search) return true;

    if (card.label.toLowerCase().includes(search)) return true;
    if (card.siglas.toLowerCase().includes(search)) return true;
    if (card.modalidade.toLowerCase().includes(search)) return true;

    const modLabel = MODALIDADE_LABELS[card.modalidade] || '';
    if (modLabel.toLowerCase().includes(search)) return true;

    return card.areas.some((a) => a.toLowerCase().includes(search));
  }

  // ============================================================
  // GESTÃO DE PROFESSORES — Busca, Alocação e Desalocação
  // ============================================================

  /**
   * Busca professores elegíveis para um slot específico da turma.
   * Aplica todas as regras de negócio:
   *   1. Professor tem a UC (professor_uc)
   *   2. Professor tem disponibilidade no dia/período
   *   3. Ocupação < 80%
   *   4. Sem conflito de horário (não está em outra turma no mesmo dia+período)
   *   5. Professor ativo
   *   6. Não está já nesta turma
   *   7. Ordenado por nível de competência (decrescente)
   */
  async buscarProfessoresElegiveis(
    idTurma: number,
    idUC: number,
    diaSemana: string,
    periodo: string,
    usuario: UsuarioToken
  ) {
    const turma = await this.repo.findById(idTurma);
    if (!turma) throw new Error('Turma não encontrada');
    await this.verificarPermissao(usuario, turma);

    // 1. Professores que têm competência nesta UC
    const profUCRepo = AppDataSource.getRepository(ProfessorUC);
    const profsComUC = await profUCRepo.find({
      where: { idUC, status: true },
      relations: ['professor', 'professor.cadastro', 'professor.professorAreas', 'professor.professorAreas.area'],
    });

    if (profsComUC.length === 0) return [];

    // 2. Filtrar por disponibilidade no dia/período
    const dispRepo = AppDataSource.getRepository(Disponibilidade);
    const profTurmaRepo = AppDataSource.getRepository(ProfessorTurma);
    const professorRepo = AppDataSource.getRepository(Professor);

    const resultado: {
      idProfessor: number;
      nome: string;
      email: string;
      ocupacao: number;
      nivelCompetencia: number;
      areas: { idArea: number; nome: string }[];
    }[] = [];

    // Normalizar dia e período para comparação
    const diaNorm = diaSemana.toLowerCase();
    // Mapear período da turma para o tipo de disponibilidade do professor
    const periodosDisponiveis = this.mapearPeriodoParaDisponibilidade(periodo);

    for (const puc of profsComUC) {
      const prof = puc.professor;
      if (!prof || !prof.status || !prof.cadastro || prof.cadastro.funcao !== 'professor' || !prof.cadastro.status) continue; // Regra 5: professor ativo

      // 2. Verificar disponibilidade
      const disponibilidades = await dispRepo.find({
        where: { idProfessor: prof.idProfessor, diaSemana: diaNorm },
      });

      const temDisponibilidade = disponibilidades.some(d => 
        periodosDisponiveis.includes(d.periodo.toLowerCase())
      );
      if (!temDisponibilidade) continue;

      // 6. Verificar se já está neste SLOT específico da turma
      // Buscar o idTurmaUC do slot selecionado
      const turmaUCRepo = AppDataSource.getRepository(TurmaUC);
      const slotTurmaUC = await turmaUCRepo.findOne({
        where: { idTurma, idUC, diaSemana: diaNorm, periodo },
      });
      if (slotTurmaUC) {
        const jaEstaNoSlot = await profTurmaRepo.findOne({
          where: { idTurmaUC: slotTurmaUC.idTurmaUC, idProfessor: prof.idProfessor, status: true },
        });
        if (jaEstaNoSlot) continue;
      }

      // 4. Verificar conflito de horário (outra turma no mesmo dia+período)
      const turmasDoProf = await profTurmaRepo.find({
        where: { idProfessor: prof.idProfessor, status: true },
        relations: ['turmaUC', 'turma'],
      });

      let temConflito = false;
      for (const pt of turmasDoProf) {
        if (!pt.turma?.status) continue;
        if (pt.turmaUC && pt.turmaUC.diaSemana.toLowerCase() === diaNorm && pt.turmaUC.periodo === periodo) {
          temConflito = true;
          break;
        }
      }
      if (temConflito) continue;

      // 3. Calcular ocupação e verificar < 80%
      const profCompleto = await professorRepo.findOne({
        where: { idProfessor: prof.idProfessor },
        relations: [
          'disponibilidades',
          'professorTurmas',
          'professorTurmas.turma',
        ],
      });

      if (!profCompleto) continue;

      const totalDisponivel = profCompleto.disponibilidades?.length || 0;
      let periodosAlocados = 0;
      if (profCompleto.professorTurmas) {
        for (const pt of profCompleto.professorTurmas) {
          if (pt.status && pt.turma?.status) {
            periodosAlocados += 1;
          }
        }
      }
      const ocupacao = totalDisponivel > 0
        ? Math.min(Math.round((periodosAlocados / totalDisponivel) * 100), 100)
        : 0;

      if (ocupacao >= 80) continue; // Regra 3

      resultado.push({
        idProfessor: prof.idProfessor,
        nome: prof.cadastro?.nome || 'Sem nome',
        email: prof.cadastro?.email || '',
        ocupacao,
        nivelCompetencia: Number(puc.nivelCompetencia),
        areas: prof.professorAreas?.map(pa => ({
          idArea: pa.area?.idArea,
          nome: pa.area?.nome || '',
        })) || [],
      });
    }

    // 8. Ordenar por nível de competência (decrescente)
    resultado.sort((a, b) => b.nivelCompetencia - a.nivelCompetencia);

    return resultado;
  }

  /**
   * Aloca um professor a um SLOT específico da turma (UC + Dia + Período).
   * Revalida todas as regras de negócio no momento da alocação.
   */
  async alocarProfessor(
    idTurma: number,
    idProfessor: number,
    idUC: number,
    diaSemana: string,
    periodo: string,
    usuario: UsuarioToken
  ) {
    const turma = await this.repo.findById(idTurma);
    if (!turma) throw new Error('Turma não encontrada');
    if (!turma.status) throw new Error('Não é possível alocar professores em uma turma desativada');

    await this.verificarPermissao(usuario, turma);

    // Verificar professor ativo
    const professorRepo = AppDataSource.getRepository(Professor);
    const professor = await professorRepo.findOne({
      where: { idProfessor, status: true },
      relations: ['cadastro'],
    });
    if (!professor || !professor.cadastro || professor.cadastro.funcao !== 'professor' || !professor.cadastro.status) {
      throw new Error('Professor não encontrado ou inativo');
    }

    // Encontrar o TurmaUC correspondente ao slot
    const turmaUCRepo = AppDataSource.getRepository(TurmaUC);
    const slotTurmaUC = await turmaUCRepo.findOne({
      where: { idTurma, idUC, diaSemana: diaSemana.toLowerCase(), periodo },
    });
    if (!slotTurmaUC) throw new Error('Slot não encontrado na grade da turma');

    const profTurmaRepo = AppDataSource.getRepository(ProfessorTurma);

    // Verificar se já existe alguém neste slot
    const existeNoSlot = await profTurmaRepo.findOne({
      where: { idTurmaUC: slotTurmaUC.idTurmaUC, status: true },
    });

    if (existeNoSlot) {
      if (existeNoSlot.idProfessor === idProfessor) {
        throw new Error('Este professor já está designado para este slot');
      }
      // Substituir o professor anterior neste slot
      await profTurmaRepo.remove(existeNoSlot);
    }

    // Criar novo vínculo específico para o slot
    const novo = profTurmaRepo.create({
      idTurma,
      idProfessor,
      idTurmaUC: slotTurmaUC.idTurmaUC,
      status: true,
    });
    await profTurmaRepo.save(novo);

    const atualizada = await this.repo.findById(idTurma);
    return atualizada ? this.mapTurmaParaCard(atualizada) : null;
  }

  /**
   * Remove um professor de uma turma.
   * Se idUC + diaSemana + periodo forem fornecidos, remove apenas daquele slot.
   * Caso contrário, remove TODAS as alocações do professor naquela turma.
   */
  async desalocarProfessor(
    idTurma: number,
    idProfessor: number,
    usuario: UsuarioToken,
    idUC?: number,
    diaSemana?: string,
    periodo?: string,
  ) {
    const turma = await this.repo.findById(idTurma);
    if (!turma) throw new Error('Turma não encontrada');

    await this.verificarPermissao(usuario, turma);

    const profTurmaRepo = AppDataSource.getRepository(ProfessorTurma);

    if (idUC && diaSemana && periodo) {
      // Remoção por slot específico
      const turmaUCRepo = AppDataSource.getRepository(TurmaUC);
      const slotTurmaUC = await turmaUCRepo.findOne({
        where: { idTurma, idUC, diaSemana: diaSemana.toLowerCase(), periodo },
      });
      if (!slotTurmaUC) throw new Error('Slot não encontrado');

      const vinculo = await profTurmaRepo.findOne({
        where: { idTurmaUC: slotTurmaUC.idTurmaUC, idProfessor, status: true },
      });
      if (!vinculo) throw new Error('Professor não está designado para este slot');

      await profTurmaRepo.remove(vinculo);
    } else {
      // Remoção total — remove todas as alocações do professor nesta turma
      const vinculos = await profTurmaRepo.find({
        where: { idTurma, idProfessor, status: true },
      });
      if (vinculos.length === 0) throw new Error('Professor não está vinculado a esta turma');

      await profTurmaRepo.remove(vinculos);
    }

    const atualizada = await this.repo.findById(idTurma);
    return atualizada ? this.mapTurmaParaCard(atualizada) : null;
  }

  /**
   * Mapeia um período de turma_uc (M01, T01, etc.) para o período
   * de disponibilidade do professor (manha, tarde, noite).
   */
  private mapearPeriodoParaDisponibilidade(periodo: string): string[] {
    const p = periodo.toUpperCase();
    if (p.startsWith('M') || p === 'MANHÃ' || p === 'MANHA') return ['manha'];
    if (p.startsWith('T') || p === 'TARDE') return ['tarde'];
    if (p.startsWith('N') || p === 'NOITE') return ['noite'];
    if (p === 'INT' || p === 'INTEGRAL' || p.startsWith('INT_')) return ['manha', 'tarde'];
    return [periodo.toLowerCase()];
  }
}
