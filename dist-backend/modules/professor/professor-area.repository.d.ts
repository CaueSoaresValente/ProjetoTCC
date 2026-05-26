import { ProfessorArea } from '../area/professor-area.entity.js';
export declare class ProfessorAreaRepository {
    private repo;
    findByProfessor(idProfessor: number): Promise<ProfessorArea[]>;
    findByProfessorAndArea(idProfessor: number, idArea: number): Promise<ProfessorArea | null>;
    create(idProfessor: number, idArea: number): Promise<ProfessorArea>;
    update(id: number, idArea: number): Promise<ProfessorArea | null>;
    delete(id: number): Promise<void>;
}
//# sourceMappingURL=professor-area.repository.d.ts.map