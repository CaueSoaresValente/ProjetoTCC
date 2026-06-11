import { Turma } from './turma.entity.js';
export declare class TurmaRepository {
    private repo;
    private turmaUCRepo;
    findAll(): Promise<Turma[]>;
    findByOPP(idOPP: number): Promise<Turma[]>;
    findByOPPAreas(idOPP: number, idsAreas: number[]): Promise<Turma[]>;
    findById(idTurma: number): Promise<Turma | null>;
    create(data: Partial<Turma>): Promise<Turma>;
    saveHorarios(idTurma: number, horarios: {
        idUC: number;
        diaSemana: string;
        periodo: string;
    }[]): Promise<void>;
    update(idTurma: number, data: Partial<Turma>): Promise<Turma | null>;
    softDelete(idTurma: number): Promise<void>;
}
//# sourceMappingURL=turma.repository.d.ts.map