import { AppDataSource } from '../../config/data-source.js';
import { Turma } from './turma.entity.js';
import { TurmaUC } from './turma-uc.entity.js';
const RELATIONS = [
    'criador',
    'opp',
    'opp.cadastro',
    'turmaUCs',
    'turmaUCs.unidadeCurricular',
    'turmaUCs.unidadeCurricular.area',
    'professorTurmas',
    'professorTurmas.professor',
    'professorTurmas.professor.cadastro',
    'professorTurmas.turmaUC',
];
export class TurmaRepository {
    repo = AppDataSource.getRepository(Turma);
    turmaUCRepo = AppDataSource.getRepository(TurmaUC);
    async findAll() {
        return this.repo.find({
            where: { status: true },
            relations: [...RELATIONS],
            order: { idTurma: 'DESC' },
        });
    }
    async findByOPP(idOPP) {
        return this.repo.find({
            where: { status: true, idOPP },
            relations: [...RELATIONS],
            order: { idTurma: 'DESC' },
        });
    }
    async findById(idTurma) {
        return this.repo.findOne({
            where: { idTurma, status: true },
            relations: [...RELATIONS],
        });
    }
    async create(data) {
        const turma = this.repo.create(data);
        return this.repo.save(turma);
    }
    async saveHorarios(idTurma, horarios) {
        const existing = await this.turmaUCRepo.find({ where: { idTurma } });
        // Determinar o que deletar: registros que existem mas não estão na nova lista
        const toDelete = existing.filter(ex => !horarios.some(h => h.idUC === ex.idUC &&
            h.diaSemana.toLowerCase() === ex.diaSemana.toLowerCase() &&
            h.periodo === ex.periodo));
        // Determinar o que adicionar: registros novos que não existem
        const toAdd = horarios.filter(h => !existing.some(ex => ex.idUC === h.idUC &&
            ex.diaSemana.toLowerCase() === h.diaSemana.toLowerCase() &&
            ex.periodo === h.periodo));
        if (toDelete.length > 0) {
            await this.turmaUCRepo.remove(toDelete);
        }
        if (toAdd.length > 0) {
            const registros = toAdd.map((h) => this.turmaUCRepo.create({
                idTurma,
                idUC: h.idUC,
                diaSemana: h.diaSemana.toLowerCase(),
                periodo: h.periodo,
            }));
            await this.turmaUCRepo.save(registros);
        }
    }
    async update(idTurma, data) {
        await this.repo.update({ idTurma }, data);
        return this.findById(idTurma);
    }
    async softDelete(idTurma) {
        await this.repo.update({ idTurma }, { status: false });
    }
}
//# sourceMappingURL=turma.repository.js.map