import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Professor } from '../professor/professor.entity.js';
import { Area } from './area.entity.js';

@Entity('professor_area')
@Unique(['idProfessor', 'idArea'])
export class ProfessorArea {
  @PrimaryGeneratedColumn({ name: 'id_professor_area' })
  idProfessorArea: number;

  @Column({ name: 'id_professor', type: 'int' })
  idProfessor: number;

  @Column({ name: 'id_area', type: 'int' })
  idArea: number;

  @ManyToOne(() => Professor, (professor) => professor.professorAreas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_professor' })
  professor: Professor;

  @ManyToOne(() => Area, (area) => area.professorAreas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_area' })
  area: Area;
}
