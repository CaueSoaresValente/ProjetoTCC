// src/backend/modules/cadastro/cadastro.repository.ts
import { AppDataSource } from "../../config/data-source.js";
import { Cadastro } from "./cadastro.entity.js";
import * as bcrypt from "bcryptjs";
export class CadastroRepository {
    repo = AppDataSource.getRepository(Cadastro);
    // ====================== CRUD ======================
    async create(data) {
        const cadastro = this.repo.create(data);
        return await this.repo.save(cadastro);
    }
    async findByEmail(email) {
        return await this.repo
            .createQueryBuilder("cadastro")
            .addSelect("cadastro.senha")
            .where("cadastro.email = :email", { email })
            .getOne();
    }
    async findByNome(nome) {
        return await this.repo.findOne({ where: { nome } });
    }
    async findById(id) {
        return await this.repo.findOne({ where: { idUsuario: id } });
    }
    async update(id, data) {
        await this.repo.update(id, data);
        return await this.findById(id);
    }
    async delete(id) {
        // Implementação da Opção B: Soft Delete (Inativação)
        await this.repo.update(id, { status: false });
    }
    async listAll() {
        // Buscamos usuários onde status é verdadeiro (true no PostgreSQL)
        return await this.repo.find({
            where: { status: true },
            order: { nome: 'ASC' }
        });
    }
    // ====================== SENHA (RNF005 + RN002) ======================
    async hashPassword(senha) {
        const salt = await bcrypt.genSalt(12);
        return await bcrypt.hash(senha, salt);
    }
    async comparePassword(senhaDigitada, senhaHash) {
        if (!senhaHash) {
            throw new Error("Senha não carregada do banco");
        }
        return await bcrypt.compare(senhaDigitada, senhaHash);
    }
    // Validação de força de senha (RN002)
    validatePasswordStrength(senha) {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        if (!regex.test(senha)) {
            return {
                valid: false,
                message: "Senha deve ter no mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial (!@#$%^&*)",
            };
        }
        return { valid: true };
    }
}
//# sourceMappingURL=cadastro.repository.js.map