import { neon } from '@neondatabase/serverless';

const databaseUrl = 'postgresql://neondb_owner:npg_yFawQGx8l0oY@ep-still-bread-aqyrtrfk-pooler.c-8.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

async function main() {
  try {
    console.log("Conectando via Neon HTTP...");
    const sql = neon(databaseUrl);
    const rows = await sql`SELECT id_usuario, email, nome, funcao, status, senha FROM cadastro`;
    console.log("Usuários encontrados:");
    console.log(rows);
  } catch (err) {
    console.error("Erro ao consultar Neon via HTTP:", err);
  }
}

main();
