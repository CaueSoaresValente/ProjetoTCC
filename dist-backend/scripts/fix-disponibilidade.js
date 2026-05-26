// Script para corrigir o constraint do banco de disponibilidade
// Executa: npx tsx src/backend/scripts/fix-disponibilidade.ts
import 'reflect-metadata';
async function main() {
    // Conecta sem synchronize para não dar erro
    const ds = new (await import('typeorm')).DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'gestao_professores',
        synchronize: false,
        logging: true,
    });
    await ds.initialize();
    const qr = ds.createQueryRunner();
    try {
        // 1. Descobre o nome da FK que referencia id_professor no PostgreSQL
        const fks = await qr.query(`
      SELECT tc.constraint_name 
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'disponibilidade'
        AND tc.constraint_type = 'FOREIGN KEY'
    `);
        console.log('FKs encontradas:', fks);
        for (const fk of fks) {
            console.log(`Dropando FK: ${fk.constraint_name}`);
            await qr.query(`ALTER TABLE disponibilidade DROP CONSTRAINT "${fk.constraint_name}"`);
        }
        // 2. Dropa o index antigo se existir
        try {
            await qr.query(`DROP INDEX IF EXISTS "IDX_28e6a22297a94a35994065ca94"`);
            console.log('Index antigo removido!');
        }
        catch (e) {
            console.log('Index não existia ou já foi removido');
        }
        // 3. Recria a FK
        await qr.query(`ALTER TABLE disponibilidade ADD CONSTRAINT "FK_disp_professor" FOREIGN KEY (id_professor) REFERENCES professor(id_professor)`);
        console.log('FK recriada!');
        // 4. Limpa dados antigos duplicados (se houver) usando sintaxe PostgreSQL
        await qr.query(`
      DELETE FROM disponibilidade 
      WHERE id_disponibilidade IN (
        SELECT id_disponibilidade FROM (
          SELECT id_disponibilidade,
                 ROW_NUMBER() OVER (PARTITION BY id_professor, dia_semana, periodo ORDER BY id_disponibilidade) as rn
          FROM disponibilidade
        ) t
        WHERE t.rn > 1
      )
    `);
        console.log('Duplicados removidos!');
        console.log('TUDO PRONTO! Agora pode reiniciar o backend.');
    }
    catch (e) {
        console.error('Erro:', e);
    }
    finally {
        await qr.release();
        await ds.destroy();
    }
}
main();
//# sourceMappingURL=fix-disponibilidade.js.map