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
      WHERE table_name = 'disponibilidade'
      ORDER BY ordinal_position
    `);
    console.log('\n📋 Colunas ATUAIS de disponibilidade:');
    for (const col of info.rows) {
      console.log(`   ${col.column_name}: ${col.data_type}(${col.character_maximum_length}), nullable=${col.is_nullable}`);
    }

    const count = await client.query('SELECT COUNT(*) as n FROM disponibilidade');
    console.log(`📊 Registros em disponibilidade: ${count.rows[0].n}`);

    // 2. Dropar disponibilidade
    console.log('\n🗑️  Dropando disponibilidade...');
    await client.query('DROP TABLE IF EXISTS disponibilidade CASCADE');
    console.log('✅ disponibilidade dropada');

    // 3. Verificar que não existem mais
    const check = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'disponibilidade'
    `);
    if (check.rows.length === 0) {
      console.log('\n✅ Tabela removida com sucesso!');
    }

    console.log('\n✅ PRONTO! O TypeORM vai recriar disponibilidade no próximo deploy.');

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

run();
