var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Professor } from '../professor/professor.entity.js';
import { Turma } from './turma.entity.js';
import { TurmaUC } from './turma-uc.entity.js';
let ProfessorTurma = class ProfessorTurma {
    idProfessorTurma;
    idTurma;
    idProfessor;
    idTurmaUC;
    status;
    turma;
    professor;
    turmaUC;
};
__decorate([
    PrimaryGeneratedColumn({ name: 'id_professor_turma' }),
    __metadata("design:type", Number)
], ProfessorTurma.prototype, "idProfessorTurma", void 0);
__decorate([
    Column({ name: 'id_turma', type: 'int' }),
    __metadata("design:type", Number)
], ProfessorTurma.prototype, "idTurma", void 0);
__decorate([
    Column({ name: 'id_professor', type: 'int' }),
    __metadata("design:type", Number)
], ProfessorTurma.prototype, "idProfessor", void 0);
__decorate([
    Column({ name: 'id_turma_uc', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], ProfessorTurma.prototype, "idTurmaUC", void 0);
__decorate([
    Column({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], ProfessorTurma.prototype, "status", void 0);
__decorate([
    ManyToOne(() => Turma, (turma) => turma.professorTurmas, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'id_turma' }),
    __metadata("design:type", Object)
], ProfessorTurma.prototype, "turma", void 0);
__decorate([
    ManyToOne(() => Professor, (professor) => professor.professorTurmas, { nullable: false, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'id_professor' }),
    __metadata("design:type", Professor)
], ProfessorTurma.prototype, "professor", void 0);
__decorate([
    ManyToOne(() => TurmaUC, { nullable: true, onDelete: 'CASCADE' }),
    JoinColumn({ name: 'id_turma_uc' }),
    __metadata("design:type", Object)
], ProfessorTurma.prototype, "turmaUC", void 0);
ProfessorTurma = __decorate([
    Entity('professor_turma'),
    Unique(['idTurmaUC']) // Garante no máximo 1 professor por slot (UC + Dia + Período)
], ProfessorTurma);
export { ProfessorTurma };
//# sourceMappingURL=professor-turma.entity.js.map