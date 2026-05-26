var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// src/backend/modules/gestor/gestor.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Cadastro } from '../cadastro/cadastro.entity.js';
import { OPP } from '../opp/opp.entity.js';
let Gestor = class Gestor {
    idGestor;
    status;
    idCadastro;
    cadastro;
    opps;
};
__decorate([
    PrimaryGeneratedColumn({ name: 'id_gestor' }),
    __metadata("design:type", Number)
], Gestor.prototype, "idGestor", void 0);
__decorate([
    Column({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Gestor.prototype, "status", void 0);
__decorate([
    Column({ name: 'id_cadastro', type: 'int' }),
    __metadata("design:type", Number)
], Gestor.prototype, "idCadastro", void 0);
__decorate([
    ManyToOne(() => Cadastro, (cadastro) => cadastro.gestor, { nullable: false }),
    JoinColumn({ name: 'id_cadastro' }),
    __metadata("design:type", Cadastro)
], Gestor.prototype, "cadastro", void 0);
__decorate([
    OneToMany(() => OPP, (opp) => opp.gestor),
    __metadata("design:type", Array)
], Gestor.prototype, "opps", void 0);
Gestor = __decorate([
    Entity('gestor')
], Gestor);
export { Gestor };
//# sourceMappingURL=gestor.entity.js.map