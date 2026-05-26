export declare class ProfessorUCService {
    private repo;
    findByProfessor(idProfessor: number): Promise<import("../disciplina/professor-uc.entity.js").ProfessorUC[]>;
    findUCsByArea(idArea: number): Promise<import("../disciplina/unidade-curricular.entity.js").UnidadeCurricular[]>;
    create(idProfessor: number, idUC: number, nivelCompetencia: number): Promise<import("../disciplina/professor-uc.entity.js").ProfessorUC>;
    update(id: number, nivelCompetencia: number): Promise<import("../disciplina/professor-uc.entity.js").ProfessorUC | null>;
    delete(id: number): Promise<void>;
}
//# sourceMappingURL=professor-uc.service.d.ts.map