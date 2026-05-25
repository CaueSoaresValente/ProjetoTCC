import { Disponibilidade } from './disponibilidade.entity.js';
export declare class DisponibilidadeRepository {
    private repo;
    findByProfessorId(professorId: number): Promise<Disponibilidade[]>;
    create(idProfessor: number, diaSemana: string, periodo: string): Promise<Disponibilidade>;
    delete(idDisponibilidade: number): Promise<void>;
    deleteByDia(idProfessor: number, diaSemana: string): Promise<void>;
    findOne(idProfessor: number, diaSemana: string, periodo: string): Promise<Disponibilidade | null>;
}
//# sourceMappingURL=disponibilidade.repository.d.ts.map