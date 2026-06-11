import pkg from 'pg';
const { Client } = pkg;

async function executeMigration() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'gestao_professores',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database.');
    
    // Executa a alteração diretamente no banco
    await client.query(`
      ALTER TABLE "turma" ADD COLUMN IF NOT EXISTS "descricao" text NULL;
    `);
    console.log('✅ Column "descricao" successfully added!');
    
    await client.end();
  } catch (err) {
    console.log(`❌ Error adding column: ${err.message}`);
  }
}

executeMigration();
