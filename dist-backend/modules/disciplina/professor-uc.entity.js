var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Professor } from '../professor/professor.entity.js';
import { UnidadeCurricular } from './unidade-curricular.entity.js';
let ProfessorUC = class ProfessorUC {
    idProfessorUC;
    idUC;
    idProfessor;
    nivelCompetencia;
    status;
    unidadeCurricular;
    professor;
};
__decorate([
    PrimaryGeneratedColumn({ name: 'id_professor_uc' })
], ProfessorUC.prototype, "idProfessorUC", void 0);
__decorate([
    Column({ name: 'id_uc', type: 'int' })
], ProfessorUC.prototype, "idUC", void 0);
__decorate([
    Column({ name: 'id_professor', type: 'int' })
], ProfessorUC.prototype, "idProfessor", void 0);
__decorate([
    Column({ name: 'nivel_competencia', type: 'decimal', precision: 5, scale: 2 })
], ProfessorUC.prototype, "nivelCompetencia", void 0);
__decorate([
    Column({ type: 'boolean', default: true })
], ProfessorUC.prototype, "status", void 0);
__decorate([
    ManyToOne(() => UnidadeCurricular, (uc) => uc.professorUCs, { nullable: false }),
    JoinColumn({ name: 'id_uc' })
], ProfessorUC.prototype, "unidadeCurricular", void 0);
__decorate([
    ManyToOne(() => Professor, (professor) => professor.professorUCs, { nullable: false }),
    JoinColumn({ name: 'id_professor' })
], ProfessorUC.prototype, "professor", void 0);
ProfessorUC = __decorate([
    Entity('professor_uc'),
    Unique(['idUC', 'idProfessor'])
], ProfessorUC);
export { ProfessorUC };
//# sourceMappingURL=professor-uc.entity.js.map