export declare class DisponibilidadeService {
    private repo;
    findByProfessorId(professorId: number): Promise<import("./disponibilidade.entity.js").Disponibilidade[]>;
    adicionar(idProfessor: number, diaSemana: string, periodo: string): Promise<import("./disponibilidade.entity.js").Disponibilidade>;
    remover(idDisponibilidade: number): Promise<void>;
    sincronizarSemana(idProfessor: number, disponibilidades: Record<string, string[]>): Promise<import("./disponibilidade.entity.js").Disponibilidade[]>;
}
//# sourceMappingURL=disponibilidade.service.d.ts.map