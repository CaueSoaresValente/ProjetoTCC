import { Certificacao } from './certificacao.entity.js';
export declare class CertificacaoRepository {
    private repo;
    findByProfessor(idProfessor: number): Promise<Certificacao[]>;
    findById(id: number): Promise<Certificacao | null>;
    create(data: Partial<Certificacao>): Promise<Certificacao>;
    update(id: number, data: Partial<Certificacao>): Promise<Certificacao | null>;
    delete(id: number): Promise<void>;
}
//# sourceMappingURL=certificacao.repository.d.ts.map