export declare class ProfessorAreaService {
    private repo;
    findByProfessor(idProfessor: number): Promise<import("../area/professor-area.entity.js").ProfessorArea[]>;
    create(idProfessor: number, idArea: number): Promise<import("../area/professor-area.entity.js").ProfessorArea>;
    update(id: number, idArea: number): Promise<import("../area/professor-area.entity.js").ProfessorArea | null>;
    delete(id: number): Promise<void>;
}
//# sourceMappingURL=professor-area.service.d.ts.map