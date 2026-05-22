import { AppDataSource } from "../config/data-source.js";
import { Client } from "pg";
import dotenv from "dotenv";

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

export const initializeDatabase = async () => {
  try {
    // Em produção o banco já existe, pula a criação
    if (process.env.NODE_ENV !== "production") {
      await ensureDatabaseExists();
    }
    await AppDataSource.initialize();
    console.log("✅ Banco de dados conectado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao conectar no banco:", error);
    process.exit(1);
  }
};