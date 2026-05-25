import { ProfessorUC } from '../disciplina/professor-uc.entity.js';
import { UnidadeCurricular } from '../disciplina/unidade-curricular.entity.js';
export declare class ProfessorUCRepository {
    private repo;
    private ucRepo;
    findByProfessor(idProfessor: number): Promise<ProfessorUC[]>;
    findUCsByArea(idArea: number): Promise<UnidadeCurricular[]>;
    findByProfessorAndUC(idProfessor: number, idUC: number): Promise<ProfessorUC | null>;
    create(idProfessor: number, idUC: number, nivelCompetencia: number): Promise<ProfessorUC>;
    update(id: number, data: Partial<ProfessorUC>): Promise<ProfessorUC | null>;
    delete(id: number): Promise<void>;
}
//# sourceMappingURL=professor-uc.repository.d.ts.map