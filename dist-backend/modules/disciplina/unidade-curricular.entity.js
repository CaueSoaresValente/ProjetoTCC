var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
    PrimaryGeneratedColumn({ name: "id_uc" }),
    __metadata("design:type", Number)
], UnidadeCurricular.prototype, "idUC", void 0);
__decorate([
    Column({ name: "id_area", type: "int" }),
    __metadata("design:type", Number)
], UnidadeCurricular.prototype, "idArea", void 0);
__decorate([
    Column({ type: "varchar", length: 150 }),
    __metadata("design:type", String)
], UnidadeCurricular.prototype, "nome", void 0);
__decorate([
    Column({ type: "text", nullable: true }),
    __metadata("design:type", String)
], UnidadeCurricular.prototype, "descricao", void 0);
__decorate([
    Column({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], UnidadeCurricular.prototype, "status", void 0);
__decorate([
    ManyToOne(() => Area, (area) => area.unidadesCurriculares, {
        nullable: false,
    }),
    JoinColumn({ name: "id_area" }),
    __metadata("design:type", Area)
], UnidadeCurricular.prototype, "area", void 0);
__decorate([
    OneToMany(() => ProfessorUC, (puc) => puc.unidadeCurricular),
    __metadata("design:type", Array)
], UnidadeCurricular.prototype, "professorUCs", void 0);
__decorate([
    OneToMany(() => TurmaUC, (tuc) => tuc.unidadeCurricular),
    __metadata("design:type", Array)
], UnidadeCurricular.prototype, "turmaUCs", void 0);
UnidadeCurricular = __decorate([
    Entity("unidade_curricular")
], UnidadeCurricular);
export { UnidadeCurricular };
//# sourceMappingURL=unidade-curricular.entity.js.map