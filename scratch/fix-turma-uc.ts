/**
 * Script para corrigir o erro "column dia_semana contains null values"
 * na tabela turma_uc do banco Neon.
 *
 * Este script limpa os registros antigos (sem dia_semana) e também
 * os professor_turma vinculados, permitindo que o TypeORM synchronize
 * a tabela corretamente no próximo deploy.
 *
 * Execute com: npx tsx scratch/fix-turma-uc.ts
 */

import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada no .env');
  process.exit(1);
}

async function fix() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅ Conectado ao banco Neon');

  try {
    // 1. Ver o estado atual da tabela turma_uc
    const colunas = await client.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'turma_uc'
      ORDER BY ordinal_position
    `);
    console.log('\n📋 Colunas atuais da tabela turma_uc:');
    for (const col of colunas.rows) {
      console.log(`   ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    }

    // 2. Contar registros existentes
    const count = await client.query('SELECT COUNT(*) as total FROM turma_uc');
    console.log(`\n📊 Total de registros em turma_uc: ${count.rows[0].total}`);

    if (Number(count.rows[0].total) === 0) {
      console.log('ℹ️  Tabela já está vazia, nada a fazer.');
    } else {
      // Verificar se a coluna dia_semana existe
      const temDiaSemana = colunas.rows.some((c: any) => c.column_name === 'dia_semana');

      if (temDiaSemana) {
        // Verificar quantos têm dia_semana nulo
        const nullCount = await client.query(
          'SELECT COUNT(*) as total FROM turma_uc WHERE dia_semana IS NULL'
        );
        console.log(`📊 Registros com dia_semana NULL: ${nullCount.rows[0].total}`);

        if (Number(nullCount.rows[0].total) > 0) {
          // Limpar apenas os registros com dia_semana NULL
          console.log('\n🗑️  Removendo professor_turma vinculados a turma_uc com dia_semana NULL...');
          await client.query(`
            DELETE FROM professor_turma 
            WHERE id_turma_uc IN (SELECT id_turma_uc FROM turma_uc WHERE dia_semana IS NULL)
          `);
          
          console.log('🗑️  Removendo registros de turma_uc com dia_semana NULL...');
          await client.query('DELETE FROM turma_uc WHERE dia_semana IS NULL');
          console.log('✅ Registros inválidos removidos!');
        } else {
          console.log('ℹ️  Nenhum registro com dia_semana NULL encontrado.');
        }
      } else {
        // A coluna dia_semana nem existe ainda — precisa limpar TUDO
        console.log('\n⚠️  A coluna dia_semana não existe ainda na tabela.');
        console.log('🗑️  Removendo professor_turma vinculados...');
        await client.query(`
          DELETE FROM professor_turma 
          WHERE id_turma_uc IN (SELECT id_turma_uc FROM turma_uc)
        `);
        
        console.log('🗑️  Limpando todos os registros de turma_uc...');
        await client.query('DELETE FROM turma_uc');
        console.log('✅ Tabela turma_uc limpa! O TypeORM poderá adicionar a coluna no próximo sync.');
      }
    }

    // Verificar estado final
    const finalCount = await client.query('SELECT COUNT(*) as total FROM turma_uc');
    console.log(`\n📊 Registros restantes em turma_uc: ${finalCount.rows[0].total}`);
    console.log('\n✅ Pronto! Faça um novo deploy na Vercel (git push) e o erro será resolvido.');

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

fix();
