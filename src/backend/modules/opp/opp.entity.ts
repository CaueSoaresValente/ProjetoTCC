// src/backend/modules/opp/opp.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Cadastro } from '../cadastro/cadastro.entity.js';
import { Gestor } from '../gestor/gestor.entity.js';
import { Turma } from '../turma/turma.entity.js';
import { OPPArea } from '../area/opp-area.entity.js';

@Entity('opp')
export class OPP {
  @PrimaryGeneratedColumn({ name: 'id_opp' })
  idOPP: number;

  @Column({ name: 'id_cadastro', type: 'int' })
  idCadastro: number;

  @Column({ name: 'id_gestor', type: 'int' })
  idGestor: number;

  @Column({ type: 'boolean', default: true })
  status: boolean;

  @ManyToOne(() => Cadastro, (cadastro) => cadastro.opp, { nullable: false })
  @JoinColumn({ name: 'id_cadastro' })
  cadastro: Cadastro;

  @ManyToOne(() => Gestor, (gestor) => gestor.opps, { nullable: false })
  @JoinColumn({ name: 'id_gestor' })
  gestor: Gestor;

  @OneToMany(() => Turma, (turma) => turma.opp)
  turmas: Turma[];

  @OneToMany(() => OPPArea, (oa) => oa.opp)
  oppAreas: OPPArea[];
}
