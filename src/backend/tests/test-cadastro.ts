// src/backend/tests/test-cadastro.ts
import "reflect-metadata";
import dotenv from "dotenv";
import { AppDataSource } from "../config/data-source.js";
import { CadastroRepository } from "../modules/cadastro/cadastro.repository.js";

dotenv.config();

async function testarCadastro() {
  await AppDataSource.initialize();
  const repo = new CadastroRepository();

  const email = "opp.astolfo@senai.com";

  // Verifica se já existe
  let usuario = await repo.findByEmail(email);

  if (!usuario) {
    const senhaHash = await repo.hashPassword("Senai@2026");

    usuario = await repo.create({
      email,
      senha: senhaHash,
      funcao: "opp",
      nome: "Astolfo Silva",
      status: true,
    });

    console.log("✅ Novo usuário OPP criado com senha hasheada!");
  } else {
    console.log("✅ Usuário já existia.");
  }

  console.log("👤 Dados:", {
    id: usuario?.idUsuario,
    nome: usuario?.nome,
    email: usuario?.email,
    funcao: usuario?.funcao,
  });

  await AppDataSource.destroy();
}

testarCadastro();
