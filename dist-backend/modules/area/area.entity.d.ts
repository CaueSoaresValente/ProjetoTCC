import { UnidadeCurricular } from '../disciplina/unidade-curricular.entity.js';
import { ProfessorArea } from './professor-area.entity.js';
import { OPPArea } from './opp-area.entity.js';
export declare class Area {
    idArea: number;
    nome: string;
    status: boolean;
    unidadesCurriculares: UnidadeCurricular[];
    professorAreas: ProfessorArea[];
    oppAreas: OPPArea[];
}
//# sourceMappingURL=area.entity.d.ts.map