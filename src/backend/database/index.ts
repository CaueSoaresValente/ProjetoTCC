import { AppDataSource, isNeon } from "../config/data-source.js";
import { Client } from "pg";
import { Cadastro } from "../modules/cadastro/cadastro.entity.js";
import { Gestor } from "../modules/gestor/gestor.entity.js";
import * as bcrypt from "bcryptjs";

// dotenv.config() removido — na Vercel as variáveis vêm do dashboard.
// Em dev local, o dotenv é carregado pelo app.ts antes de importar este módulo.

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

  // Busca o gestor especificamente pelo email principal incluindo o campo senha (que tem select: false)
  let adminUser = await cadastroRepo
    .createQueryBuilder("cadastro")
    .addSelect("cadastro.senha")
    .where("cadastro.email = :email", { email: "admin@senai.br" })
    .getOne();

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
    // Verifica se a senha salva confere com a padrão Admin@123
    const isSenhaPadrao = await bcrypt.compare("Admin@123", adminUser.senha);
    if (!isSenhaPadrao) {
      console.log("ℹ️ Gestor padrão já existe, mas a senha é diferente de Admin@123. Redefinindo para garantir acesso...");
      adminUser.senha = hashedPassword;
      adminUser.funcao = "gestor";
      adminUser.status = true; // Garante que está ativo
      await cadastroRepo.save(adminUser);
      console.log("✅ Senha do gestor padrão redefinida com sucesso!");
    } else {
      console.log("ℹ️ Gestor padrão já existe com a senha padrão ou alterada correta.");
    }

    // Garante que existe o registro de gestor correspondente
    const gestorRecord = await gestorRepo.findOne({ where: { idCadastro: adminUser.idUsuario } });
    if (!gestorRecord) {
      const novoGestor = gestorRepo.create({
        idCadastro: adminUser.idUsuario,
        status: true,
      });
      await gestorRepo.save(novoGestor);
    }
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
      console.error("💡 Dica: Verifique se DATABASE_URL está configurada nas Environment Variables da Vercel.");
    }
    // NÃO usar process.exit(1) em serverless functions!
    // Lançamos o erro para que a requisição retorne HTTP 500 graciosamente,
    // sem matar a instância inteira.
    throw error;
  }
};
