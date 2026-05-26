import { Certificacao } from './certificacao.entity.js';
export declare class CertificacaoService {
    private repo;
    findByProfessor(idProfessor: number): Promise<Certificacao[]>;
    create(idProfessor: number, data: Partial<Certificacao>): Promise<Certificacao>;
    update(id: number, data: Partial<Certificacao>): Promise<Certificacao | null>;
    delete(id: number): Promise<void>;
}
//# sourceMappingURL=certificacao.service.d.ts.map