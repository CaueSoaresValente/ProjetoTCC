// ============================================================
// api/index.js — Vercel Serverless Function
// ============================================================
// Este arquivo é o ponto de entrada para o Vercel.
// Ele importa o app Express compilado e o expõe como
// uma Serverless Function.
//
// O Vercel chama esta função para CADA requisição /api/*.
// Na primeira chamada (cold start), inicializa o banco.
// ============================================================

import 'reflect-metadata';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';

// --- Debug: mostra onde estamos e quais pastas existem ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('[DEBUG] __dirname:', __dirname);
console.log('[DEBUG] projectRoot:', projectRoot);
console.log('[DEBUG] cwd:', process.cwd());

try {
  const rootContents = readdirSync(projectRoot);
  console.log('[DEBUG] Conteúdo do diretório raiz:', rootContents);
} catch (e) {
  console.error('[DEBUG] Erro ao listar diretório raiz:', e.message);
}

const backendPath = join(projectRoot, 'dist-backend');
console.log('[DEBUG] Caminho esperado do backend:', backendPath);
console.log('[DEBUG] dist-backend existe?', existsSync(backendPath));

if (existsSync(backendPath)) {
  try {
    const backendContents = readdirSync(backendPath);
    console.log('[DEBUG] Conteúdo de dist-backend:', backendContents);
  } catch (e) {
    console.error('[DEBUG] Erro ao listar dist-backend:', e.message);
  }
}

// Também verifica o caminho antigo para comparação
const oldPath = join(projectRoot, 'dist', 'backend');
console.log('[DEBUG] dist/backend (antigo) existe?', existsSync(oldPath));
// --- Fim do debug ---

import app from '../dist-backend/app.js';
import { initializeDatabase } from '../dist-backend/database/index.js';

let initialized = false;

export default async function handler(req, res) {
  try {
    if (!initialized) {
      console.log('[HANDLER] Inicializando banco de dados...');
      await initializeDatabase();
      initialized = true;
      console.log('[HANDLER] Banco inicializado com sucesso!');
    }
    return app(req, res);
  } catch (error) {
    console.error('❌ Erro na serverless function:', error);
    // Reseta o flag para tentar reconectar na próxima requisição
    initialized = false;
    return res.status(500).json({
      message: 'Erro interno do servidor. Verifique os logs da Vercel.',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
}

