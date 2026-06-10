import { Cadastro } from '../cadastro/cadastro.entity.js';
import { OPP } from '../opp/opp.entity.js';
import { ProfessorTurma } from './professor-turma.entity.js';
import { TurmaUC } from './turma-uc.entity.js';
export declare class Turma {
    idTurma: number;
    idCriador: number;
    idOPP: number | null;
    nome: string;
    tipoCurso: string;
    dataInicio: Date;
    dataTermino: Date;
    aulasSemana: number;
    totalAulas: number;
    descricao: string | null;
    status: boolean;
    criador: Cadastro;
    opp: OPP | null;
    turmaUCs: TurmaUC[];
    professorTurmas: ProfessorTurma[];
}
//# sourceMappingURL=turma.entity.d.ts.map