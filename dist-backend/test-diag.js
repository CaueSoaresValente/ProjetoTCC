import { AppDataSource } from './config/data-source.js';
import { initializeDatabase } from './database/index.js';
import { Turma } from './modules/turma/turma.entity.js';
async function main() {
    await initializeDatabase();
    console.log("Connected to database successfully!");
    const repo = AppDataSource.getRepository(Turma);
    const turmas = await repo.find({
        relations: [
            'opp',
            'opp.cadastro',
            'turmaUCs',
            'turmaUCs.unidadeCurricular',
            'turmaUCs.unidadeCurricular.area',
            'professorTurmas',
            'professorTurmas.professor',
            'professorTurmas.professor.cadastro',
        ]
    });
    console.log(`Found ${turmas.length} turmas:`);
    for (const t of turmas) {
        const idArea = t.turmaUCs?.[0]?.unidadeCurricular?.idArea || null;
        const areaNome = t.turmaUCs?.[0]?.unidadeCurricular?.area?.nome || null;
        console.log(`- ID: ${t.idTurma}, Nome: ${t.nome}, idOPP: ${t.idOPP}, OPP Nome: ${t.opp?.cadastro?.nome}, Derived idArea: ${idArea} (${areaNome}), ucsCount: ${t.turmaUCs?.length}`);
    }
    process.exit(0);
}
main().catch(err => {
    console.error("Diagnostic error:", err);
    process.exit(1);
});
//# sourceMappingURL=test-diag.js.map