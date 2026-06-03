const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT * FROM turma_uc ORDER BY "idTurmaUC" DESC LIMIT 5', (err, res) => {
  console.log(err ? err : res.rows);
  pool.end();
});
