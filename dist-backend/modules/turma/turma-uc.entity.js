var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Turma } from './turma.entity.js';
import { UnidadeCurricular } from '../disciplina/unidade-curricular.entity.js';
let TurmaUC = class TurmaUC {
    idTurmaUC;
    idTurma;
    idUC;
    diaSemana;
    periodo; // 'M01', 'M02', 'T01', 'T02', 'N01', 'N02', 'INT'
    turma;
    unidadeCurricular;
};
__decorate([
    PrimaryGeneratedColumn({ name: 'id_turma_uc' })
], TurmaUC.prototype, "idTurmaUC", void 0);
__decorate([
    Column({ name: 'id_turma', type: 'int' })
], TurmaUC.prototype, "idTurma", void 0);
__decorate([
    Column({ name: 'id_uc', type: 'int' })
], TurmaUC.prototype, "idUC", void 0);
__decorate([
    Column({ name: 'dia_semana', type: 'varchar', length: 20 })
], TurmaUC.prototype, "diaSemana", void 0);
__decorate([
    Column({ type: 'varchar', length: 10 })
], TurmaUC.prototype, "periodo", void 0);
__decorate([
    ManyToOne(() => Turma, (turma) => turma.turmaUCs, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'id_turma' })
], TurmaUC.prototype, "turma", void 0);
__decorate([
    ManyToOne(() => UnidadeCurricular, (uc) => uc.turmaUCs, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'id_uc' })
], TurmaUC.prototype, "unidadeCurricular", void 0);
TurmaUC = __decorate([
    Entity('turma_uc'),
    Unique(['idTurma', 'diaSemana', 'periodo'])
], TurmaUC);
export { TurmaUC };
//# sourceMappingURL=turma-uc.entity.js.map