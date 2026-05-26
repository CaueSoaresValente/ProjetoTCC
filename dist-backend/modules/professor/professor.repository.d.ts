import { Professor } from './professor.entity.js';
export declare class ProfessorRepository {
    private repo;
    findById(id: number): Promise<Professor | null>;
    findByCadastro(idCadastro: number): Promise<Professor | null>;
    create(data: Partial<Professor>): Promise<Professor>;
}
//# sourceMappingURL=professor.repository.d.ts.map