var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
    PrimaryGeneratedColumn({ name: 'id_disponibilidade' })
], Disponibilidade.prototype, "idDisponibilidade", void 0);
__decorate([
    Column({ name: 'dia_semana', type: 'varchar', length: 20 })
], Disponibilidade.prototype, "diaSemana", void 0);
__decorate([
    Column({ type: 'varchar', length: 20 })
], Disponibilidade.prototype, "periodo", void 0);
__decorate([
    Column({ name: 'id_professor', type: 'int' })
], Disponibilidade.prototype, "idProfessor", void 0);
__decorate([
    Column({ type: 'boolean', default: true })
], Disponibilidade.prototype, "status", void 0);
__decorate([
    ManyToOne(() => Professor, (professor) => professor.disponibilidades, { nullable: false }),
    JoinColumn({ name: 'id_professor' })
], Disponibilidade.prototype, "professor", void 0);
Disponibilidade = __decorate([
    Entity('disponibilidade')
], Disponibilidade);
export { Disponibilidade };
//# sourceMappingURL=disponibilidade.entity.js.map