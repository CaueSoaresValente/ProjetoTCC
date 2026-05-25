var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// src/backend/modules/professor/professor.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Cadastro } from '../cadastro/cadastro.entity.js';
import { ProfessorUC } from '../disciplina/professor-uc.entity.js';
import { ProfessorTurma } from '../turma/professor-turma.entity.js';
import { Disponibilidade } from '../disponibilidade/disponibilidade.entity.js';
import { ProfessorArea } from '../area/professor-area.entity.js';
import { Certificacao } from './certificacao.entity.js';
let Professor = class Professor {
    idProfessor;
    idCadastro;
    status;
    cadastro;
    // === RELAÇÕES PARA O "MATCH" DE COMPETÊNCIAS E DISPONIBILIDADE ===
    professorUCs;
    professorTurmas;
    disponibilidades;
    professorAreas;
    certificacoes;
};
__decorate([
    PrimaryGeneratedColumn({ name: 'id_professor' }),
    __metadata("design:type", Number)
], Professor.prototype, "idProfessor", void 0);
__decorate([
    Column({ name: 'id_cadastro', type: 'int' }),
    __metadata("design:type", Number)
], Professor.prototype, "idCadastro", void 0);
__decorate([
    Column({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Professor.prototype, "status", void 0);
__decorate([
    ManyToOne(() => Cadastro, (cadastro) => cadastro.professor, { nullable: false }),
    JoinColumn({ name: 'id_cadastro' }),
    __metadata("design:type", Cadastro)
], Professor.prototype, "cadastro", void 0);
__decorate([
    OneToMany(() => ProfessorUC, (puc) => puc.professor),
    __metadata("design:type", Array)
], Professor.prototype, "professorUCs", void 0);
__decorate([
    OneToMany(() => ProfessorTurma, (pt) => pt.professor),
    __metadata("design:type", Array)
], Professor.prototype, "professorTurmas", void 0);
__decorate([
    OneToMany(() => Disponibilidade, (d) => d.professor),
    __metadata("design:type", Array)
], Professor.prototype, "disponibilidades", void 0);
__decorate([
    OneToMany(() => ProfessorArea, (pa) => pa.professor),
    __metadata("design:type", Array)
], Professor.prototype, "professorAreas", void 0);
__decorate([
    OneToMany(() => Certificacao, (c) => c.professor),
    __metadata("design:type", Array)
], Professor.prototype, "certificacoes", void 0);
Professor = __decorate([
    Entity('professor')
], Professor);
export { Professor };
//# sourceMappingURL=professor.entity.js.map