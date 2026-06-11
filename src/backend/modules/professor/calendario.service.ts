import { AppDataSource } from '../../config/data-source.js';
import { Professor } from './professor.entity.js';

const MAPA_DIAS_JS: Record<string, number> = {
  'segunda': 1,
  'segunda-feira': 1,
  'terca': 2,
  'terça': 2,
  'terça-feira': 2,
  'quarta': 3,
  'quarta-feira': 3,
  'quinta': 4,
  'quinta-feira': 4,
  'sexta': 5,
  'sexta-feira': 5,
  'sabado': 6,
  'sábado': 6,
  'domingo': 0
};

function obterDatasEntre(inicio: Date, fim: Date, diaSemanaDesejado: number): Date[] {
  const datas: Date[] = [];
  const current = new Date(inicio);
  current.setHours(12, 0, 0, 0);
  const targetEnd = new Date(fim);
  targetEnd.setHours(12, 0, 0, 0);

  while (current <= targetEnd) {
    if (current.getDay() === diaSemanaDesejado) {
      datas.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return datas;
}

export class CalendarioService {
  private professorRepo = AppDataSource.getRepository(Professor);

  async obterCalendario(idCadastro: number) {
    // 1. Resolver idProfessor a partir do idCadastro do token
    const professor = await this.professorRepo.findOne({
      where: { idCadastro, status: true },
      relations: [
        'disponibilidades',
        'professorTurmas',
        'professorTurmas.turma',
        'professorTurmas.turma.opp',
        'professorTurmas.turma.opp.cadastro',
        'professorTurmas.turma.turmaUCs',
        'professorTurmas.turmaUC',
        'professorTurmas.turmaUC.unidadeCurricular',
      ]
    });

    if (!professor) {
      throw new Error('Professor não encontrado');
    }

    // 2. Calcular Ocupação Semanal (em horas)
    const totalHorasDisponiveis = (professor.disponibilidades?.length || 0) * 4;
    let ocupacao = 0;
    if (totalHorasDisponiveis > 0 && professor.professorTurmas) {
      let horasAlocadas = 0;
      for (const pt of professor.professorTurmas) {
        if (pt.status && pt.turma?.status) {
          const p = pt.turmaUC?.periodo || 'M01';
          horasAlocadas += this.obterHorasDoPeriodo(p);
        }
      }
      ocupacao = Math.min(Math.round((horasAlocadas / totalHorasDisponiveis) * 100), 100);
    }

    // 3. Expandir Aulas em Datas Concretas
    const aulas: any[] = [];
    if (professor.professorTurmas) {
      for (const pt of professor.professorTurmas) {
        if (!pt.status) continue;
        const turma = pt.turma;
        const tuc = pt.turmaUC;
        if (!turma || !turma.status || !tuc) continue;

        const diaSemanaStr = tuc.diaSemana.toLowerCase();
        const diaSemanaJs = MAPA_DIAS_JS[diaSemanaStr];
        if (diaSemanaJs === undefined) continue;

        const datas = obterDatasEntre(turma.dataInicio, turma.dataTermino, diaSemanaJs);
        for (const data of datas) {
          aulas.push({
            dia: data.getDate(),
            mes: data.getMonth(), // 0-indexed para bater com o Vue dataFoco.value.getMonth()
            ano: data.getFullYear(),
            materia: tuc.unidadeCurricular?.nome || 'Sem matéria',
            turma: turma.nome,
            periodo: tuc.periodo,
            professor: turma.opp?.cadastro?.nome || 'A definir',
            cargo: 'OPP responsável'
          });
        }
      }
    }

    // Ordena as aulas cronologicamente
    aulas.sort((a, b) => {
      const dateA = new Date(a.ano, a.mes, a.dia);
      const dateB = new Date(b.ano, b.mes, b.dia);
      return dateA.getTime() - dateB.getTime();
    });

    return {
      ocupacao,
      aulas
    };
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
