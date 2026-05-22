// src/backend/tests/test-login.ts
import "reflect-metadata";
import dotenv from "dotenv";
import { AppDataSource } from "../config/data-source.js";
import { AuthService } from "../modules/auth/auth.service.js";

dotenv.config();

async function testarLogin() {
  try {
    console.log("🔄 Inicializando conexão com o banco...");
    await AppDataSource.initialize();
    console.log("✅ Banco conectado!");

    const authService = new AuthService();

    const resultado = await authService.login("opp.astolfo@senai.com", "Senai@2026");

    if (resultado) {
      console.log("✅ Login realizado com sucesso!");
      console.log("🔑 Token:", resultado.token.substring(0, 60) + "...");
      console.log("👤 Usuário:", {
        id: resultado.usuario.idUsuario,
        nome: resultado.usuario.nome,
        email: resultado.usuario.email,
        funcao: resultado.usuario.funcao,
      });
    } else {
      console.log("❌ Login falhou (email ou senha incorretos)");
    }

  } catch (error: any) {
    console.error("❌ ERRO:", error.message);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

testarLogin();
