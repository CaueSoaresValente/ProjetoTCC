/**
 * Script para DROPAR a tabela turma_uc e professor_turma
 * no banco Neon, permitindo que o TypeORM as recrie do zero.
 *
 * Execute com: npx tsx scratch/drop-turma-uc.ts
 */
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada');
  process.exit(1);
}

async function run() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅ Conectado ao banco Neon');

  try {
    // 1. Mostrar estado atual
    const info = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'turma_uc'
      ORDER BY ordinal_position
    `);
    console.log('\n📋 Colunas ATUAIS de turma_uc:');
    for (const col of info.rows) {
      console.log(`   ${col.column_name}: ${col.data_type}(${col.character_maximum_length}), nullable=${col.is_nullable}`);
    }

    const count = await client.query('SELECT COUNT(*) as n FROM turma_uc');
    console.log(`📊 Registros em turma_uc: ${count.rows[0].n}`);

    const ptCount = await client.query('SELECT COUNT(*) as n FROM professor_turma');
    console.log(`📊 Registros em professor_turma: ${ptCount.rows[0].n}`);

    // 2. Dropar professor_turma primeiro (depende de turma_uc via FK)
    console.log('\n🗑️  Dropando professor_turma...');
    await client.query('DROP TABLE IF EXISTS professor_turma CASCADE');
    console.log('✅ professor_turma dropada');

    // 3. Dropar turma_uc
    console.log('🗑️  Dropando turma_uc...');
    await client.query('DROP TABLE IF EXISTS turma_uc CASCADE');
    console.log('✅ turma_uc dropada');

    // 4. Verificar que não existem mais
    const check = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('turma_uc', 'professor_turma')
    `);
    if (check.rows.length === 0) {
      console.log('\n✅ Tabelas removidas com sucesso!');
    } else {
      console.log('\n⚠️  Tabelas restantes:', check.rows.map((r: any) => r.table_name));
    }

    // 5. Listar tabelas restantes
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    console.log('\n📋 Tabelas restantes no banco:');
    for (const t of tables.rows) {
      console.log(`   - ${t.table_name}`);
    }

    console.log('\n✅ PRONTO! O TypeORM vai recriar turma_uc e professor_turma no próximo deploy.');
    console.log('   Faça git push para acionar o deploy na Vercel.');

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

run();
