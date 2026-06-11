import { AppDataSource } from '../../config/data-source.js';
import { Turma } from './turma.entity.js';
import { TurmaUC } from './turma-uc.entity.js';

const RELATIONS = [
  'criador',
  'opp',
  'opp.cadastro',
  'area',
  'turmaUCs',
  'turmaUCs.unidadeCurricular',
  'turmaUCs.unidadeCurricular.area',
  'professorTurmas',
  'professorTurmas.professor',
  'professorTurmas.professor.cadastro',
  'professorTurmas.turmaUC',
] as const;

export class TurmaRepository {
  private repo = AppDataSource.getRepository(Turma);
  private turmaUCRepo = AppDataSource.getRepository(TurmaUC);

  async findAll(): Promise<Turma[]> {
    return this.repo.find({
      where: { status: true },
      relations: [...RELATIONS],
      order: { idTurma: 'DESC' },
    });
  }

  async findByOPP(idOPP: number): Promise<Turma[]> {
    return this.repo.find({
      where: { status: true, idOPP },
      relations: [...RELATIONS],
      order: { idTurma: 'DESC' },
    });
  }

  async findByOPPAreas(idOPP: number, idsAreas: number[]): Promise<Turma[]> {
    if (idsAreas.length === 0) {
      return this.repo.find({
        where: { status: true, idOPP },
        relations: [...RELATIONS],
        order: { idTurma: 'DESC' },
      });
    }

    return this.repo.createQueryBuilder('turma')
      .leftJoinAndSelect('turma.criador', 'criador')
      .leftJoinAndSelect('turma.opp', 'opp')
      .leftJoinAndSelect('opp.cadastro', 'oppCadastro')
      .leftJoinAndSelect('turma.area', 'turmaArea')
      .leftJoinAndSelect('turma.turmaUCs', 'turmaUCs')
      .leftJoinAndSelect('turmaUCs.unidadeCurricular', 'unidadeCurricular')
      .leftJoinAndSelect('unidadeCurricular.area', 'area')
      .leftJoinAndSelect('turma.professorTurmas', 'professorTurmas')
      .leftJoinAndSelect('professorTurmas.professor', 'professor')
      .leftJoinAndSelect('professor.cadastro', 'professorCadastro')
      .leftJoinAndSelect('professorTurmas.turmaUC', 'turmaUC')
      .where('turma.status = :status', { status: true })
      .andWhere('(turma.idOPP = :idOPP OR unidadeCurricular.idArea IN (:...idsAreas))', { idOPP, idsAreas })
      .orderBy('turma.idTurma', 'DESC')
      .getMany();
  }

  async findById(idTurma: number): Promise<Turma | null> {
    return this.repo.createQueryBuilder('turma')
      .leftJoinAndSelect('turma.criador', 'criador')
      .leftJoinAndSelect('turma.opp', 'opp')
      .leftJoinAndSelect('opp.cadastro', 'oppCadastro')
      .leftJoinAndSelect('turma.area', 'turmaArea')
      .leftJoinAndSelect('turma.turmaUCs', 'turmaUCs')
      .leftJoinAndSelect('turmaUCs.unidadeCurricular', 'unidadeCurricular')
      .leftJoinAndSelect('unidadeCurricular.area', 'area')
      .leftJoinAndSelect('turma.professorTurmas', 'professorTurmas')
      .leftJoinAndSelect('professorTurmas.professor', 'professor')
      .leftJoinAndSelect('professor.cadastro', 'professorCadastro')
      .leftJoinAndSelect('professorTurmas.turmaUC', 'turmaUC')
      .where('turma.idTurma = :idTurma AND turma.status = :status', { idTurma, status: true })
      .getOne();
  }

  async create(data: Partial<Turma>): Promise<Turma> {
    const turma = this.repo.create(data);
    return this.repo.save(turma);
  }

  async saveHorarios(
    idTurma: number,
    horarios: { idUC: number; diaSemana: string; periodo: string }[],
  ): Promise<void> {
    const existing = await this.turmaUCRepo.find({ where: { idTurma } });

    // Determinar o que deletar: registros que existem mas não estão na nova lista
    const toDelete = existing.filter(ex => 
      !horarios.some(h => 
        h.idUC === ex.idUC && 
        h.diaSemana.toLowerCase() === ex.diaSemana.toLowerCase() && 
        h.periodo === ex.periodo
      )
    );

    // Determinar o que adicionar: registros novos que não existem
    const toAdd = horarios.filter(h => 
      !existing.some(ex => 
        ex.idUC === h.idUC && 
        ex.diaSemana.toLowerCase() === h.diaSemana.toLowerCase() && 
        ex.periodo === h.periodo
      )
    );

    if (toDelete.length > 0) {
      await this.turmaUCRepo.delete(toDelete.map(ex => ex.idTurmaUC));
    }

    if (toAdd.length > 0) {
      const registros = toAdd.map((h) => ({
        idTurma,
        idUC: h.idUC,
        diaSemana: h.diaSemana.toLowerCase(),
        periodo: h.periodo,
      }));
      await this.turmaUCRepo.insert(registros);
    }
  }

  async update(idTurma: number, data: Partial<Turma>): Promise<Turma | null> {
    await this.repo.update({ idTurma }, data);
    return this.findById(idTurma);
  }

  async softDelete(idTurma: number): Promise<void> {
    await this.repo.update({ idTurma }, { status: false });
  }
}
