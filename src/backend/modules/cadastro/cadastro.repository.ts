// src/backend/modules/cadastro/cadastro.repository.ts
import { AppDataSource } from "../../config/data-source.js";
import { Cadastro } from "./cadastro.entity.js";
import * as bcrypt from "bcryptjs";

export class CadastroRepository {
  private repo = AppDataSource.getRepository(Cadastro);

  // ====================== CRUD ======================
  async create(data: Partial<Cadastro>): Promise<Cadastro> {
    const cadastro = this.repo.create(data);
    return await this.repo.save(cadastro);
  }

  async findByEmail(email: string): Promise<Cadastro | null> {
    return await this.repo
      .createQueryBuilder("cadastro")
      .addSelect("cadastro.senha")
      .where("cadastro.email = :email", { email })
      .andWhere("cadastro.status = :status", { status: true })
      .getOne();
  }

  /**
   * Busca cadastro ATIVO pelo email SEM carregar a senha.
   * Usado no login via Google OAuth onde a senha não é necessária.
   */
  async findByEmailPublic(email: string): Promise<Cadastro | null> {
    return await this.repo.findOne({ where: { email, status: true } });
  }

  async findByNome(nome: string): Promise<Cadastro | null> {
    return await this.repo.findOne({ where: { nome } });
  }

  async findById(id: number): Promise<Cadastro | null> {
    return await this.repo.findOne({ where: { idUsuario: id } });
  }

  async update(id: number, data: Partial<Cadastro>): Promise<Cadastro | null> {
    await this.repo.update(id, data);
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    // Implementação da Opção B: Soft Delete (Inativação)
    await this.repo.update(id, { status: false });
  }

  async listAll(): Promise<Cadastro[]> {
    // Buscamos usuários onde status é verdadeiro (true no PostgreSQL)
    return await this.repo.find({ 
      where: { status: true },
      order: { nome: 'ASC' } 
    });
  }

  // ====================== SENHA (RNF005 + RN002) ======================
  async hashPassword(senha: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(senha, salt);
  }

  async comparePassword(senhaDigitada: string, senhaHash: string): Promise<boolean> {
    if (!senhaHash) {
        throw new Error("Senha não carregada do banco");
    }

    return await bcrypt.compare(senhaDigitada, senhaHash);
   }

  // Validação de força de senha (RN002)
  validatePasswordStrength(senha: string): { valid: boolean; message?: string } {
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
