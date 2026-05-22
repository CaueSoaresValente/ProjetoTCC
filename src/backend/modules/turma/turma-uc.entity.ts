import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Turma } from './turma.entity.js';
import { UnidadeCurricular } from '../disciplina/unidade-curricular.entity.js';

@Entity('turma_uc')
@Unique(['idTurma', 'diaSemana', 'periodo'])
export class TurmaUC {
  @PrimaryGeneratedColumn({ name: 'id_turma_uc' })
  idTurmaUC: number;

  @Column({ name: 'id_turma', type: 'int' })
  idTurma: number;

  @Column({ name: 'id_uc', type: 'int' })
  idUC: number;

  @Column({ name: 'dia_semana', type: 'varchar', length: 20 })
  diaSemana: string;

  @Column({ type: 'varchar', length: 10 })
  periodo: string; // 'M01', 'M02', 'T01', 'T02', 'N01', 'N02', 'INT'

  @ManyToOne(() => Turma, (turma) => turma.turmaUCs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_turma' })
  turma: Turma;

  @ManyToOne(() => UnidadeCurricular, (uc) => uc.turmaUCs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_uc' })
  unidadeCurricular: UnidadeCurricular;
}
