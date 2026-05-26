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
import { Professor } from './professor.entity.js';
let Certificacao = class Certificacao {
    idCertificacao;
    idProfessor;
    nome;
    instituicao;
    dataObtencao;
    cargaHoraria;
    status;
    professor;
};
__decorate([
    PrimaryGeneratedColumn({ name: 'id_certificacao' }),
    __metadata("design:type", Number)
], Certificacao.prototype, "idCertificacao", void 0);
__decorate([
    Column({ name: 'id_professor', type: 'int' }),
    __metadata("design:type", Number)
], Certificacao.prototype, "idProfessor", void 0);
__decorate([
    Column({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], Certificacao.prototype, "nome", void 0);
__decorate([
    Column({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", String)
], Certificacao.prototype, "instituicao", void 0);
__decorate([
    Column({ name: 'data_obtencao', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Certificacao.prototype, "dataObtencao", void 0);
__decorate([
    Column({ name: 'carga_horaria', type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], Certificacao.prototype, "cargaHoraria", void 0);
__decorate([
    Column({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Certificacao.prototype, "status", void 0);
__decorate([
    ManyToOne(() => Professor, (professor) => professor.certificacoes, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'id_professor' }),
    __metadata("design:type", Professor)
], Certificacao.prototype, "professor", void 0);
Certificacao = __decorate([
    Entity('certificacao')
], Certificacao);
export { Certificacao };
//# sourceMappingURL=certificacao.entity.js.map