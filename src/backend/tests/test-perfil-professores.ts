// src/backend/tests/test-perfil-professores.ts
import "reflect-metadata";
import dotenv from "dotenv";
import { AppDataSource } from "../config/data-source.js";
import { Cadastro } from "../modules/cadastro/cadastro.entity.js";
import { Professor } from "../modules/professor/professor.entity.js";
import { CadastroService } from "../modules/cadastro/cadastro.service.js";
import { PerfilProfessorRepository } from "../modules/professor/perfil-professor.repository.js";

dotenv.config();

async function testarPerfis() {
  try {
    console.log("🔄 Inicializando conexão...");
    await AppDataSource.initialize();
    console.log("✅ Conexão OK!");

    const cadRepo = AppDataSource.getRepository(Cadastro);
    const service = new CadastroService();

    // 1. Remove qualquer professor de teste antigo
    const antigoCad = await cadRepo.findOne({ where: { email: "professor.teste@senai.com" } });
    if (antigoCad) {
      console.log("🗑️ Removendo professor de teste antigo...");
      const profRepo = AppDataSource.getRepository(Professor);
      await profRepo.delete({ idCadastro: antigoCad.idUsuario });
      await cadRepo.delete({ idUsuario: antigoCad.idUsuario });
    }

    // 2. Cria um novo cadastro de professor via CadastroService
    console.log("🔄 Criando professor de teste...");
    const novoProfCadastro = await service.create({
      nome: "Professor de Teste",
      email: "professor.teste@senai.com",
      senha: "SenhaSuperSecreta@123",
      funcao: "professor",
      status: true
    });
    console.log("✅ Professor de teste criado! ID:", novoProfCadastro.idUsuario);

    // 3. Busca os perfis de professores usando PerfilProfessorRepository
    const repo = new PerfilProfessorRepository();
    const professores = await repo.findAll();

    console.log(`\n📊 Encontrados ${professores.length} perfis de professores na listagem:`);
    for (const p of professores) {
      console.log(`- ID Professor: ${p.idProfessor}, ID Cadastro: ${p.idCadastro}, Nome: ${p.cadastro?.nome}, Função: ${p.cadastro?.funcao}, Status: ${p.status}`);
    }

    // 4. Verifica se o gestor (ID 1) está presente na listagem
    const contemGestor = professores.some(p => p.cadastro?.funcao === 'gestor');
    if (contemGestor) {
      console.error("❌ ERRO: O gestor está na listagem de professores!");
    } else {
      console.log("✅ SUCESSO: O gestor NÃO está na listagem de professores.");
    }

    // Limpa o professor de teste no final para não sujar o DB do usuário
    console.log("🗑️ Limpando professor de teste...");
    const profRepo = AppDataSource.getRepository(Professor);
    await profRepo.delete({ idCadastro: novoProfCadastro.idUsuario });
    await cadRepo.delete({ idUsuario: novoProfCadastro.idUsuario });
    console.log("✅ Limpeza concluída!");

  } catch (error: any) {
    console.error("❌ ERRO NO TESTE:", error.stack || error.message);
  } finally {
    await AppDataSource.destroy();
  }
}

testarPerfis();
