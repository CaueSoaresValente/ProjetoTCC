import { AppDataSource } from '../../config/data-source.js';
import { Professor } from './professor.entity.js';
const MAPA_DIAS_JS = {
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
function obterDatasEntre(inicio, fim, diaSemanaDesejado) {
    const datas = [];
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
    professorRepo = AppDataSource.getRepository(Professor);
    async obterCalendario(idCadastro) {
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
        // 2. Calcular Ocupação Semanal
        const totalDisponivel = professor.disponibilidades?.length || 0;
        let ocupacao = 0;
        if (totalDisponivel > 0 && professor.professorTurmas) {
            let periodosAlocados = 0;
            for (const pt of professor.professorTurmas) {
                if (pt.status && pt.turma?.status && pt.turma?.turmaUCs) {
                    periodosAlocados += pt.turma.turmaUCs.length;
                }
            }
            ocupacao = Math.min(Math.round((periodosAlocados / totalDisponivel) * 100), 100);
        }
        // 3. Expandir Aulas em Datas Concretas
        const aulas = [];
        if (professor.professorTurmas) {
            for (const pt of professor.professorTurmas) {
                if (!pt.status)
                    continue;
                const turma = pt.turma;
                const tuc = pt.turmaUC;
                if (!turma || !turma.status || !tuc)
                    continue;
                const diaSemanaStr = tuc.diaSemana.toLowerCase();
                const diaSemanaJs = MAPA_DIAS_JS[diaSemanaStr];
                if (diaSemanaJs === undefined)
                    continue;
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
}
//# sourceMappingURL=calendario.service.js.map