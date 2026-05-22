import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ProfessorUC } from "./professor-uc.entity.js";
import { TurmaUC } from "../turma/turma-uc.entity.js";
import { Area } from "../area/area.entity.js";

@Entity("unidade_curricular")
export class UnidadeCurricular {
  @PrimaryGeneratedColumn({ name: "id_uc" })
  idUC: number;

  @Column({ name: "id_area", type: "int" })
  idArea: number;

  @Column({ type: "varchar", length: 150 })
  nome: string;

  @Column({ type: "text", nullable: true })
  descricao: string;

  @Column({ type: "boolean", default: true })
  status: boolean;

  @ManyToOne(() => Area, (area) => area.unidadesCurriculares, {
    nullable: false,
  })
  @JoinColumn({ name: "id_area" })
  area: Area;

  @OneToMany(() => ProfessorUC, (puc) => puc.unidadeCurricular)
  professorUCs: ProfessorUC[];

  @OneToMany(() => TurmaUC, (tuc) => tuc.unidadeCurricular)
  turmaUCs: TurmaUC[];
}
