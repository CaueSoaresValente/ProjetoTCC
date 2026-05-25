import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://neondb_owner:npg_yFawQGx8l0oY@ep-still-bread-aqyrtrfk-pooler.c-8.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log("Conectado ao Neon com sucesso!");

  try {
    const res = await client.query('SELECT id_usuario, email, nome, funcao, status, senha FROM cadastro');
    console.log("Usuários no cadastro:");
    console.log(res.rows);
  } catch (err) {
    console.error("Erro ao ler tabela cadastro:", err);
  } finally {
    await client.end();
  }
}

main();
