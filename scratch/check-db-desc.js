import pkg from 'pg';
const { Client } = pkg;

async function checkDesc() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'gestao_professores',
  });

  try {
    await client.connect();
    console.log('✅ Connected.');
    
    // Verificando colunas físicas na tabela turma
    const resCol = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'turma';
    `);
    console.log('Colunas reais na tabela "turma":');
    resCol.rows.forEach(r => console.log(`   - ${r.column_name}: ${r.data_type}`));

    // Verificando dados reais de turmas
    const resData = await client.query(`
      SELECT id_turma, nome, descricao FROM turma;
    `);
    console.log('\nDados reais armazenados:');
    resData.rows.forEach(r => console.log(`   - ID: ${r.id_turma}, Nome: ${r.nome}, Descrição: "${r.descricao}"`));

    await client.end();
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
  }
}

checkDesc();
