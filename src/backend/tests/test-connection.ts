import "reflect-metadata";
import dotenv from "dotenv";
import { AppDataSource } from "../config/data-source.js";

dotenv.config();

async function testConnection() {
  try {
    await AppDataSource.initialize();
    console.log("✅ CONEXÃO COM O POSTGRESQL FUNCIONANDO PERFEITAMENTE!");
    await AppDataSource.destroy();
  } catch (error: any) {
    console.error("❌ ERRO DE CONEXÃO:", error.message);
  }
}

testConnection();
