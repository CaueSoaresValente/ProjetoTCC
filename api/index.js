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
import app from '../dist/backend/app.js';
import { initializeDatabase } from '../dist/backend/database/index.js';

let initialized = false;

export default async function handler(req, res) {
  if (!initialized) {
    await initializeDatabase();
    initialized = true;
  }
  return app(req, res);
}
