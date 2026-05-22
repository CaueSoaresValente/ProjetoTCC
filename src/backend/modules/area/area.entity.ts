import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UnidadeCurricular } from '../disciplina/unidade-curricular.entity.js';
import { ProfessorArea } from './professor-area.entity.js';
import { OPPArea } from './opp-area.entity.js';

@Entity('area')
export class Area {
  @PrimaryGeneratedColumn({ name: 'id_area' })
  idArea: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  nome: string;

  @Column({ type: 'boolean', default: true })
  status: boolean;

  @OneToMany(() => UnidadeCurricular, (uc) => uc.area)
  unidadesCurriculares: UnidadeCurricular[];

  @OneToMany(() => ProfessorArea, (pa) => pa.area)
  professorAreas: ProfessorArea[];

  @OneToMany(() => OPPArea, (oa) => oa.area)
  oppAreas: OPPArea[];
}
