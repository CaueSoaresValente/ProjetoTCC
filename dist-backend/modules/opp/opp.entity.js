var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// src/backend/modules/opp/opp.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Cadastro } from '../cadastro/cadastro.entity.js';
import { Gestor } from '../gestor/gestor.entity.js';
import { Turma } from '../turma/turma.entity.js';
import { OPPArea } from '../area/opp-area.entity.js';
let OPP = class OPP {
    idOPP;
    idCadastro;
    idGestor;
    status;
    cadastro;
    gestor;
    turmas;
    oppAreas;
};
__decorate([
    PrimaryGeneratedColumn({ name: 'id_opp' }),
    __metadata("design:type", Number)
], OPP.prototype, "idOPP", void 0);
__decorate([
    Column({ name: 'id_cadastro', type: 'int' }),
    __metadata("design:type", Number)
], OPP.prototype, "idCadastro", void 0);
__decorate([
    Column({ name: 'id_gestor', type: 'int' }),
    __metadata("design:type", Number)
], OPP.prototype, "idGestor", void 0);
__decorate([
    Column({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], OPP.prototype, "status", void 0);
__decorate([
    ManyToOne(() => Cadastro, (cadastro) => cadastro.opp, { nullable: false }),
    JoinColumn({ name: 'id_cadastro' }),
    __metadata("design:type", Cadastro)
], OPP.prototype, "cadastro", void 0);
__decorate([
    ManyToOne(() => Gestor, (gestor) => gestor.opps, { nullable: false }),
    JoinColumn({ name: 'id_gestor' }),
    __metadata("design:type", Gestor)
], OPP.prototype, "gestor", void 0);
__decorate([
    OneToMany(() => Turma, (turma) => turma.opp),
    __metadata("design:type", Array)
], OPP.prototype, "turmas", void 0);
__decorate([
    OneToMany(() => OPPArea, (oa) => oa.opp),
    __metadata("design:type", Array)
], OPP.prototype, "oppAreas", void 0);
OPP = __decorate([
    Entity('opp')
], OPP);
export { OPP };
//# sourceMappingURL=opp.entity.js.map