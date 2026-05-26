var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, } from "typeorm";
import { ProfessorUC } from "./professor-uc.entity.js";
import { TurmaUC } from "../turma/turma-uc.entity.js";
import { Area } from "../area/area.entity.js";
let UnidadeCurricular = class UnidadeCurricular {
    idUC;
    idArea;
    nome;
    descricao;
    status;
    area;
    professorUCs;
    turmaUCs;
};
__decorate([
    PrimaryGeneratedColumn({ name: "id_uc" })
], UnidadeCurricular.prototype, "idUC", void 0);
__decorate([
    Column({ name: "id_area", type: "int" })
], UnidadeCurricular.prototype, "idArea", void 0);
__decorate([
    Column({ type: "varchar", length: 150 })
], UnidadeCurricular.prototype, "nome", void 0);
__decorate([
    Column({ type: "text", nullable: true })
], UnidadeCurricular.prototype, "descricao", void 0);
__decorate([
    Column({ type: "boolean", default: true })
], UnidadeCurricular.prototype, "status", void 0);
__decorate([
    ManyToOne(() => Area, (area) => area.unidadesCurriculares, {
        nullable: false,
    }),
    JoinColumn({ name: "id_area" })
], UnidadeCurricular.prototype, "area", void 0);
__decorate([
    OneToMany(() => ProfessorUC, (puc) => puc.unidadeCurricular)
], UnidadeCurricular.prototype, "professorUCs", void 0);
__decorate([
    OneToMany(() => TurmaUC, (tuc) => tuc.unidadeCurricular)
], UnidadeCurricular.prototype, "turmaUCs", void 0);
UnidadeCurricular = __decorate([
    Entity("unidade_curricular")
], UnidadeCurricular);
export { UnidadeCurricular };
//# sourceMappingURL=unidade-curricular.entity.js.map