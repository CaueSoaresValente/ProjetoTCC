import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Cadastro } from '../cadastro/cadastro.entity.js';
import { OPP } from '../opp/opp.entity.js';
import { ProfessorTurma } from './professor-turma.entity.js';
import { TurmaUC } from './turma-uc.entity.js';

@Entity('turma')
export class Turma {
  @PrimaryGeneratedColumn({ name: 'id_turma' })
  idTurma: number;

  @Column({ name: 'id_criador', type: 'int' })
  idCriador: number;

  @Column({ name: 'id_opp', type: 'int', nullable: true })
  idOPP: number | null;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ name: 'tipo_curso', type: 'varchar', length: 10 })
  tipoCurso: string; // 'TEC', 'CAI' ou 'FIC'

  @Column({ type: 'date', name: 'data_inicio' })
  dataInicio: Date;

  @Column({ type: 'date', name: 'data_termino' })
  dataTermino: Date;

  @Column({ name: 'aulas_semana', type: 'int', nullable: true })
  aulasSemana: number;

  @Column({ name: 'total_aulas', type: 'int', nullable: true })
  totalAulas: number;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @Column({ type: 'boolean', default: true })
  status: boolean;

  @ManyToOne(() => Cadastro, { nullable: false })
  @JoinColumn({ name: 'id_criador' })
  criador: Cadastro;

  @ManyToOne(() => OPP, (opp) => opp.turmas, { nullable: true })
  @JoinColumn({ name: 'id_opp' })
  opp: OPP | null;

  @OneToMany(() => TurmaUC, (tuc) => tuc.turma)
  turmaUCs: TurmaUC[];

  @OneToMany(() => ProfessorTurma, (pt) => pt.turma)
  professorTurmas: ProfessorTurma[];
}
