import 'reflect-metadata';
import dotenv from 'dotenv';
import { initializeDatabase } from '../database/index.js';
// Carrega as variáveis do .env local
dotenv.config();
async function run() {
    console.log('🌱 Inicializando o banco de dados local PostgreSQL...');
    console.log(`DB_HOST: ${process.env.DB_HOST}`);
    console.log(`DB_DATABASE: ${process.env.DB_DATABASE}`);
    try {
        await initializeDatabase();
        console.log('✅ Banco de dados local inicializado e sincronizado com sucesso!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Falha na inicialização do banco local:', error);
        process.exit(1);
    }
}
run();
//# sourceMappingURL=init-local-db.js.map