import { Cadastro } from "./cadastro.entity.js";
export declare class CadastroRepository {
    private repo;
    create(data: Partial<Cadastro>): Promise<Cadastro>;
    findByEmail(email: string): Promise<Cadastro | null>;
    /**
     * Busca cadastro ATIVO pelo email SEM carregar a senha.
     * Usado no login via Google OAuth onde a senha não é necessária.
     */
    findByEmailPublic(email: string): Promise<Cadastro | null>;
    findByNome(nome: string): Promise<Cadastro | null>;
    findById(id: number): Promise<Cadastro | null>;
    update(id: number, data: Partial<Cadastro>): Promise<Cadastro | null>;
    delete(id: number): Promise<void>;
    listAll(): Promise<Cadastro[]>;
    hashPassword(senha: string): Promise<string>;
    comparePassword(senhaDigitada: string, senhaHash: string): Promise<boolean>;
    validatePasswordStrength(senha: string): {
        valid: boolean;
        message?: string;
    };
}
//# sourceMappingURL=cadastro.repository.d.ts.map