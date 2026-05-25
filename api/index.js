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
import app from '../dist-backend/app.js';
import { initializeDatabase } from '../dist-backend/database/index.js';

let initialized = false;

export default async function handler(req, res) {
  try {
    if (!initialized) {
      await initializeDatabase();
      initialized = true;
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

