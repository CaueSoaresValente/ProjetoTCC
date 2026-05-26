import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import * as neon from "@neondatabase/serverless";
import ws from "ws";
neon.neonConfig.webSocketConstructor = ws;
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
// Em dev local, carrega as variáveis do arquivo .env.
// Na Vercel, as variáveis vêm do dashboard (Settings > Environment Variables).
if (!process.env.VERCEL) {
    dotenv.config();
}
const isProduction = process.env.NODE_ENV === "production";
const isVercel = !!process.env.VERCEL;
// Detecta se estamos usando Neon (DATABASE_URL ou POSTGRES_URL presente)
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
const isNeon = !!databaseUrl;
const entities = [
    Cadastro, Gestor, OPP, Professor, UnidadeCurricular, ProfessorUC,
    ProfessorTurma, Turma, Disponibilidade, Area, ProfessorArea,
    OPPArea, Certificacao, TurmaUC,
];
// Configuração base que funciona tanto com Neon (dev/prod) quanto PostgreSQL local
const dataSourceConfig = databaseUrl
    ? {
        // Conexão via URL (Neon — tanto em dev quanto em produção)
        type: "postgres",
        ...(isVercel ? {} : { driver: neon }),
        url: databaseUrl,
        ssl: { rejectUnauthorized: false },
        synchronize: true,
        logging: !isProduction,
        entities,
        migrations: [],
        subscribers: [],
        extra: { max: isProduction ? 3 : 10 },
    }
    : {
        // Conexão via host/port (PostgreSQL local)
        type: "postgres",
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        synchronize: true,
        logging: true,
        entities,
        migrations: ["src/backend/database/migrations/*.ts"],
        subscribers: [],
    };
export const AppDataSource = new DataSource(dataSourceConfig);
// Exporta flag para outros módulos saberem se estamos usando Neon
export { isNeon };
//# sourceMappingURL=data-source.js.map