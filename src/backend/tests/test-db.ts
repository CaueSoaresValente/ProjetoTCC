// src/backend/tests/test-db.ts
import "reflect-metadata";
import dotenv from "dotenv";
import { AppDataSource } from "../config/data-source.js";
import { Cadastro } from "../modules/cadastro/cadastro.entity.js";

dotenv.config();

async function testarBanco() {
  try {
    console.log("🔄 Inicializando conexão...");
    await AppDataSource.initialize();
    console.log("✅ Conexão OK!");

    const cadastroRepo = AppDataSource.getRepository(Cadastro);

    // === TESTE 1: Contar quantos cadastros existem ===
    const total = await cadastroRepo.count();
    console.log(`📊 Total de usuários cadastrados: ${total}`);

    // === TESTE 2: Criar um cadastro de teste (se não existir) ===
    const emailTeste = "teste@senai.com";

    let usuario = await cadastroRepo.findOne({ where: { email: emailTeste } });

    if (!usuario) {
      usuario = cadastroRepo.create({
        email: emailTeste,
        senha: "Teste@123",        // vamos hashear depois
        funcao: "professor",
        nome: "Aluno Teste",
        status: true,
      });

      await cadastroRepo.save(usuario);
      console.log("✅ Cadastro de teste criado com sucesso!");
    } else {
      console.log("✅ Usuário de teste já existia.");
    }

    // === TESTE 3: Buscar o usuário que acabamos de criar ===
    const encontrado = await cadastroRepo.findOne({ where: { email: emailTeste } });
    console.log("👤 Usuário encontrado:", encontrado?.nome);

    console.log("\n🎉 TODOS OS TESTES PASSARAM! TypeORM está funcionando perfeitamente.");

  } catch (error: any) {
    console.error("❌ ERRO NO TESTE:", error.message);
  } finally {
    await AppDataSource.destroy(); // fecha a conexão
  }
}

testarBanco();
