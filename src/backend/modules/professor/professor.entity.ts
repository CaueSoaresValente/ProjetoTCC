// src/backend/modules/professor/professor.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Cadastro } from '../cadastro/cadastro.entity.js';
import { ProfessorUC } from '../disciplina/professor-uc.entity.js';
import { ProfessorTurma } from '../turma/professor-turma.entity.js';
import { Disponibilidade } from '../disponibilidade/disponibilidade.entity.js';
import { ProfessorArea } from '../area/professor-area.entity.js';
import { Certificacao } from './certificacao.entity.js';

@Entity('professor')
export class Professor {
  @PrimaryGeneratedColumn({ name: 'id_professor' })
  idProfessor: number;

  @Column({ name: 'id_cadastro', type: 'int' })
  idCadastro: number;

  @Column({ type: 'boolean', default: true })
  status: boolean;

  @ManyToOne(() => Cadastro, (cadastro) => cadastro.professor, { nullable: false })
  @JoinColumn({ name: 'id_cadastro' })
  cadastro: Cadastro;

  // === RELAÇÕES PARA O "MATCH" DE COMPETÊNCIAS E DISPONIBILIDADE ===
  @OneToMany(() => ProfessorUC, (puc) => puc.professor)
  professorUCs: ProfessorUC[];

  @OneToMany(() => ProfessorTurma, (pt) => pt.professor)
  professorTurmas: ProfessorTurma[];

  @OneToMany(() => Disponibilidade, (d) => d.professor)
  disponibilidades: Disponibilidade[];

  @OneToMany(() => ProfessorArea, (pa) => pa.professor)
  professorAreas: ProfessorArea[];

  @OneToMany(() => Certificacao, (c) => c.professor)
  certificacoes: Certificacao[];
}
