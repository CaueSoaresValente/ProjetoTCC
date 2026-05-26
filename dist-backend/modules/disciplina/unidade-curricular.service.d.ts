import { UnidadeCurricular } from './unidade-curricular.entity.js';
export declare class UnidadeCurricularService {
    private repo;
    findAll(): Promise<UnidadeCurricular[]>;
    findById(id: number): Promise<UnidadeCurricular | null>;
    create(data: Partial<UnidadeCurricular>): Promise<UnidadeCurricular>;
    update(id: number, data: Partial<UnidadeCurricular>): Promise<UnidadeCurricular | null>;
    delete(id: number): Promise<void>;
}
//# sourceMappingURL=unidade-curricular.service.d.ts.map