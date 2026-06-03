import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`ALTER TABLE turma_uc ALTER COLUMN periodo TYPE varchar(30)`;
    console.log('Tabela turma_uc atualizada com sucesso no banco de dados!');
  } catch (err) {
    console.error('Erro ao atualizar tabela:', err);
  }
}

run();
