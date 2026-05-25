import { Professor } from '../professor/professor.entity.js';
import { TurmaUC } from './turma-uc.entity.js';
export declare class ProfessorTurma {
    idProfessorTurma: number;
    idTurma: number;
    idProfessor: number;
    idTurmaUC: number | null;
    status: boolean;
    turma: any;
    professor: Professor;
    turmaUC: TurmaUC | null;
}
//# sourceMappingURL=professor-turma.entity.d.ts.map