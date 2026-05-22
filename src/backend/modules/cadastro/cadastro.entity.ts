import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { Gestor } from '../gestor/gestor.entity.js';
import { OPP } from '../opp/opp.entity.js';
import { Professor } from '../professor/professor.entity.js';

@Entity('cadastro')
export class Cadastro {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  idUsuario: number;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ select: false, type: 'varchar', length: 255 })
  senha: string;

  @Column({ name: 'funcao', type: 'varchar', length: 50 })
  funcao: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ name: 'foto_perfil', type: 'text', nullable: true })
  fotoPerfil: string;

  @Column({ type: 'boolean', default: true })
  status: boolean;

  @OneToOne(() => Gestor, (gestor) => gestor.cadastro, { nullable: true })
  gestor?: Gestor;

  @OneToOne(() => OPP, (opp) => opp.cadastro, { nullable: true })
  opp?: OPP;

  @OneToOne(() => Professor, (professor) => professor.cadastro, { nullable: true })
  professor?: Professor;
}
