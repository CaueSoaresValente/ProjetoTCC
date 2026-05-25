import { Cadastro } from '../cadastro/cadastro.entity.js';
import { ProfessorUC } from '../disciplina/professor-uc.entity.js';
import { ProfessorTurma } from '../turma/professor-turma.entity.js';
import { Disponibilidade } from '../disponibilidade/disponibilidade.entity.js';
import { ProfessorArea } from '../area/professor-area.entity.js';
import { Certificacao } from './certificacao.entity.js';
export declare class Professor {
    idProfessor: number;
    idCadastro: number;
    status: boolean;
    cadastro: Cadastro;
    professorUCs: ProfessorUC[];
    professorTurmas: ProfessorTurma[];
    disponibilidades: Disponibilidade[];
    professorAreas: ProfessorArea[];
    certificacoes: Certificacao[];
}
//# sourceMappingURL=professor.entity.d.ts.map