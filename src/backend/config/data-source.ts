// src/backend/config/data-source.ts
import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

import { Cadastro } from "../modules/cadastro/cadastro.entity.js";
import { Gestor } from "../modules/gestor/gestor.entity.js";
import { OPP } from "../modules/opp/opp.entity.js";
import { Professor } from "../modules/professor/professor.entity.js";
import { UnidadeCurricular } from "../modules/disciplina/unidade-curricular.entity.js";
import { ProfessorUC } from "../modules/disciplina/professor-uc.entity.js";
import { ProfessorTurma } from "../modules/turma/professor-turma.entity.js";
import { Turma } from "../modules/turma/turma.entity.js";
import { Disponibilidade } from "../modules/disponibilidade/disponibilidade.entity.js";
import { Area } from "../modules/area/area.entity.js";
import { ProfessorArea } from "../modules/area/professor-area.entity.js";
import { OPPArea } from "../modules/area/opp-area.entity.js";
import { Certificacao } from "../modules/professor/certificacao.entity.js";
import { TurmaUC } from "../modules/turma/turma-uc.entity.js";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT!),
  username: process.env.DB_USERNAME!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_DATABASE!,

  synchronize: true, // true = TypeORM cria as tabelas automaticamente (APENAS em desenvolvimento!)
  logging: process.env.NODE_ENV === "development",

  entities: [
    Cadastro,
    Gestor,
    OPP,
    Professor,
    UnidadeCurricular,
    ProfessorUC,
    ProfessorTurma,
    Turma,
    Disponibilidade,
    Area,
    ProfessorArea,
    OPPArea,
    Certificacao,
    TurmaUC,
  ],

  migrations: ["src/backend/database/migrations/*.ts"],
  subscribers: [],
});
