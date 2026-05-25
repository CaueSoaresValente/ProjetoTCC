import { AppDataSource, isNeon } from "../config/data-source.js";
import { Client } from "pg";
import dotenv from "dotenv";
import { Cadastro } from "../modules/cadastro/cadastro.entity.js";
import { Gestor } from "../modules/gestor/gestor.entity.js";
import * as bcrypt from "bcryptjs";

dotenv.config();

async function ensureDatabaseExists() {
  const dbName = process.env.DB_DATABASE || "gestao_professores";

  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: "postgres",
  });

  await client.connect();

  try {
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Banco '${dbName}' criado.`);
    }
  } finally {
    await client.end();
  }
}

async function seedDefaultGestor() {
  const cadastroRepo = AppDataSource.getRepository(Cadastro);
  const gestorRepo = AppDataSource.getRepository(Gestor);

  // Busca o gestor especificamente pelo email principal
  let adminUser = await cadastroRepo.findOne({ where: { email: "admin@senai.br" } });
  
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash("Admin@123", salt);

  if (!adminUser) {
    console.log("🌱 Criando gestor padrão...");
    const cadastroGestor = cadastroRepo.create({
      email: "admin@senai.br",
      senha: hashedPassword,
      funcao: "gestor",
      nome: "Administrador Gestor",
      status: true,
    });

    const salvo = await cadastroRepo.save(cadastroGestor);

    const gestorRecord = gestorRepo.create({
      idCadastro: salvo.idUsuario,
      status: true,
    });
    await gestorRepo.save(gestorRecord);

    console.log("✅ Gestor padrão criado com sucesso!");
    console.log("   E-mail: admin@senai.br");
    console.log("   Senha: Admin@123");
  } else {
    // Se o gestor já existe, garantimos que a senha padrão foi resetada para 'Admin@123'
    console.log("ℹ️ Gestor padrão já existe. Redefinindo senha para garantir acesso...");
    adminUser.senha = hashedPassword;
    adminUser.funcao = "gestor";
    await cadastroRepo.save(adminUser);

    // Garante que existe o registro de gestor correspondente
    const gestorRecord = await gestorRepo.findOne({ where: { idCadastro: adminUser.idUsuario } });
    if (!gestorRecord) {
      const novoGestor = gestorRepo.create({
        idCadastro: adminUser.idUsuario,
        status: true,
      });
      await gestorRepo.save(novoGestor);
    }
    console.log("✅ Senha do gestor padrão redefinida para: Admin@123");
  }
}

export const initializeDatabase = async () => {
  try {
    if (isNeon) {
      console.log("☁️  Modo Neon detectado — conectando ao banco na nuvem...");
    } else if (process.env.NODE_ENV !== "production") {
      // Só tenta criar o banco localmente (não funciona com Neon)
      await ensureDatabaseExists();
    }

    await AppDataSource.initialize();
    console.log("✅ Banco de dados conectado com sucesso!");
    await seedDefaultGestor();
  } catch (error) {
    console.error("❌ Erro ao conectar no banco:", error);
    if (isNeon) {
      console.error("💡 Dica: Verifique se DATABASE_URL no .env está correta e inclui ?sslmode=require");
    }
    process.exit(1);
  }
};
