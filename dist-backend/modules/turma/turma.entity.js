var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Cadastro } from '../cadastro/cadastro.entity.js';
import { OPP } from '../opp/opp.entity.js';
import { ProfessorTurma } from './professor-turma.entity.js';
import { TurmaUC } from './turma-uc.entity.js';
let Turma = class Turma {
    idTurma;
    idCriador;
    idOPP;
    nome;
    tipoCurso; // 'TEC', 'CAI' ou 'FIC'
    dataInicio;
    dataTermino;
    aulasSemana;
    totalAulas;
    descricao;
    status;
    criador;
    opp;
    turmaUCs;
    professorTurmas;
};
__decorate([
    PrimaryGeneratedColumn({ name: 'id_turma' })
], Turma.prototype, "idTurma", void 0);
__decorate([
    Column({ name: 'id_criador', type: 'int' })
], Turma.prototype, "idCriador", void 0);
__decorate([
    Column({ name: 'id_opp', type: 'int', nullable: true })
], Turma.prototype, "idOPP", void 0);
__decorate([
    Column({ type: 'varchar', length: 100 })
], Turma.prototype, "nome", void 0);
__decorate([
    Column({ name: 'tipo_curso', type: 'varchar', length: 10 })
], Turma.prototype, "tipoCurso", void 0);
__decorate([
    Column({ type: 'date', name: 'data_inicio' })
], Turma.prototype, "dataInicio", void 0);
__decorate([
    Column({ type: 'date', name: 'data_termino' })
], Turma.prototype, "dataTermino", void 0);
__decorate([
    Column({ name: 'aulas_semana', type: 'int', nullable: true })
], Turma.prototype, "aulasSemana", void 0);
__decorate([
    Column({ name: 'total_aulas', type: 'int', nullable: true })
], Turma.prototype, "totalAulas", void 0);
__decorate([
    Column({ type: 'text', nullable: true })
], Turma.prototype, "descricao", void 0);
__decorate([
    Column({ type: 'boolean', default: true })
], Turma.prototype, "status", void 0);
__decorate([
    ManyToOne(() => Cadastro, { nullable: false }),
    JoinColumn({ name: 'id_criador' })
], Turma.prototype, "criador", void 0);
__decorate([
    ManyToOne(() => OPP, (opp) => opp.turmas, { nullable: true }),
    JoinColumn({ name: 'id_opp' })
], Turma.prototype, "opp", void 0);
__decorate([
    OneToMany(() => TurmaUC, (tuc) => tuc.turma)
], Turma.prototype, "turmaUCs", void 0);
__decorate([
    OneToMany(() => ProfessorTurma, (pt) => pt.turma)
], Turma.prototype, "professorTurmas", void 0);
Turma = __decorate([
    Entity('turma')
], Turma);
export { Turma };
//# sourceMappingURL=turma.entity.js.map