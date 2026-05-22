import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Professor } from './professor.entity.js';

@Entity('certificacao')
export class Certificacao {
  @PrimaryGeneratedColumn({ name: 'id_certificacao' })
  idCertificacao: number;

  @Column({ name: 'id_professor', type: 'int' })
  idProfessor: number;

  @Column({ type: 'varchar', length: 200 })
  nome: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  instituicao: string;

  @Column({ name: 'data_obtencao', type: 'date', nullable: true })
  dataObtencao: Date;

  @Column({ name: 'carga_horaria', type: 'varchar', length: 20, nullable: true })
  cargaHoraria: string;

  @Column({ type: 'boolean', default: true })
  status: boolean;

  @ManyToOne(() => Professor, (professor) => professor.certificacoes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_professor' })
  professor: Professor;
}
