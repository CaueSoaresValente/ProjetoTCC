import { Area } from './area.entity.js';
export declare class AreaService {
    private repo;
    findAll(): Promise<Area[]>;
    findById(id: number): Promise<Area | null>;
    create(data: Partial<Area>): Promise<Area>;
    update(id: number, data: Partial<Area>): Promise<Area | null>;
    delete(id: number): Promise<void>;
}
//# sourceMappingURL=area.service.d.ts.map