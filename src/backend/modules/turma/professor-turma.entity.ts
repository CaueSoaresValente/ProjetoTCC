import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Professor } from '../professor/professor.entity.js';
import { Turma } from './turma.entity.js';
import { TurmaUC } from './turma-uc.entity.js';

@Entity('professor_turma')
@Unique(['idTurmaUC']) // Garante no máximo 1 professor por slot (UC + Dia + Período)
export class ProfessorTurma {
  @PrimaryGeneratedColumn({ name: 'id_professor_turma' })
  idProfessorTurma: number;

  @Column({ name: 'id_turma', type: 'int' })
  idTurma: number;

  @Column({ name: 'id_professor', type: 'int' })
  idProfessor: number;

  @Column({ name: 'id_turma_uc', type: 'int', nullable: true })
  idTurmaUC: number | null;

  @Column({ type: 'boolean', default: true })
  status: boolean;

  @ManyToOne(() => Turma, (turma) => turma.professorTurmas, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_turma' })
  turma: any;

  @ManyToOne(() => Professor, (professor) => professor.professorTurmas, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_professor' })
  professor: Professor;

  @ManyToOne(() => TurmaUC, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_turma_uc' })
  turmaUC: TurmaUC | null;
}
