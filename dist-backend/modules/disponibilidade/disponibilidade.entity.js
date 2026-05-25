var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Professor } from '../professor/professor.entity.js';
let Disponibilidade = class Disponibilidade {
    idDisponibilidade;
    diaSemana;
    periodo;
    idProfessor;
    status;
    professor;
};
__decorate([
    PrimaryGeneratedColumn({ name: 'id_disponibilidade' }),
    __metadata("design:type", Number)
], Disponibilidade.prototype, "idDisponibilidade", void 0);
__decorate([
    Column({ name: 'dia_semana', type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Disponibilidade.prototype, "diaSemana", void 0);
__decorate([
    Column({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Disponibilidade.prototype, "periodo", void 0);
__decorate([
    Column({ name: 'id_professor', type: 'int' }),
    __metadata("design:type", Number)
], Disponibilidade.prototype, "idProfessor", void 0);
__decorate([
    Column({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Disponibilidade.prototype, "status", void 0);
__decorate([
    ManyToOne(() => Professor, (professor) => professor.disponibilidades, { nullable: false }),
    JoinColumn({ name: 'id_professor' }),
    __metadata("design:type", Professor)
], Disponibilidade.prototype, "professor", void 0);
Disponibilidade = __decorate([
    Entity('disponibilidade')
], Disponibilidade);
export { Disponibilidade };
//# sourceMappingURL=disponibilidade.entity.js.map