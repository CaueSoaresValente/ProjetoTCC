import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Professor } from '../professor/professor.entity.js';
import { UnidadeCurricular } from './unidade-curricular.entity.js';

@Entity('professor_uc')
@Unique(['idUC', 'idProfessor'])
export class ProfessorUC {
  @PrimaryGeneratedColumn({ name: 'id_professor_uc' })
  idProfessorUC: number;

  @Column({ name: 'id_uc', type: 'int' })
  idUC: number;

  @Column({ name: 'id_professor', type: 'int' })
  idProfessor: number;

  @Column({ name: 'nivel_competencia', type: 'decimal', precision: 5, scale: 2 })
  nivelCompetencia: number;

  @Column({ type: 'boolean', default: true })
  status: boolean;

  @ManyToOne(() => UnidadeCurricular, (uc) => uc.professorUCs, { nullable: false })
  @JoinColumn({ name: 'id_uc' })
  unidadeCurricular: UnidadeCurricular;

  @ManyToOne(() => Professor, (professor) => professor.professorUCs, { nullable: false })
  @JoinColumn({ name: 'id_professor' })
  professor: Professor;
}
