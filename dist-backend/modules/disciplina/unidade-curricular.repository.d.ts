import { UnidadeCurricular } from './unidade-curricular.entity.js';
export declare class UnidadeCurricularRepository {
    private repo;
    findAll(): Promise<UnidadeCurricular[]>;
    findById(id: number): Promise<UnidadeCurricular | null>;
    findByNameAndAreaAnyStatus(nome: string, idArea: number): Promise<UnidadeCurricular | null>;
    create(data: Partial<UnidadeCurricular>): Promise<UnidadeCurricular>;
    update(id: number, data: Partial<UnidadeCurricular>): Promise<UnidadeCurricular | null>;
    delete(id: number): Promise<void>;
}
//# sourceMappingURL=unidade-curricular.repository.d.ts.map