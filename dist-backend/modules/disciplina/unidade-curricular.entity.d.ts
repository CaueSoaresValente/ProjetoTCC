import { ProfessorUC } from "./professor-uc.entity.js";
import { TurmaUC } from "../turma/turma-uc.entity.js";
import { Area } from "../area/area.entity.js";
export declare class UnidadeCurricular {
    idUC: number;
    idArea: number;
    nome: string;
    descricao: string;
    status: boolean;
    area: Area;
    professorUCs: ProfessorUC[];
    turmaUCs: TurmaUC[];
}
//# sourceMappingURL=unidade-curricular.entity.d.ts.map