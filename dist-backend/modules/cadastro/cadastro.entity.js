var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { Gestor } from '../gestor/gestor.entity.js';
import { OPP } from '../opp/opp.entity.js';
import { Professor } from '../professor/professor.entity.js';
let Cadastro = class Cadastro {
    idUsuario;
    email;
    senha;
    funcao;
    nome;
    fotoPerfil;
    status;
    gestor;
    opp;
    professor;
};
__decorate([
    PrimaryGeneratedColumn({ name: 'id_usuario' })
], Cadastro.prototype, "idUsuario", void 0);
__decorate([
    Column({ type: 'varchar', length: 255 })
], Cadastro.prototype, "email", void 0);
__decorate([
    Column({ select: false, type: 'varchar', length: 255 })
], Cadastro.prototype, "senha", void 0);
__decorate([
    Column({ name: 'funcao', type: 'varchar', length: 50 })
], Cadastro.prototype, "funcao", void 0);
__decorate([
    Column({ type: 'varchar', length: 100 })
], Cadastro.prototype, "nome", void 0);
__decorate([
    Column({ name: 'foto_perfil', type: 'text', nullable: true })
], Cadastro.prototype, "fotoPerfil", void 0);
__decorate([
    Column({ type: 'boolean', default: true })
], Cadastro.prototype, "status", void 0);
__decorate([
    OneToOne(() => Gestor, (gestor) => gestor.cadastro, { nullable: true })
], Cadastro.prototype, "gestor", void 0);
__decorate([
    OneToOne(() => OPP, (opp) => opp.cadastro, { nullable: true })
], Cadastro.prototype, "opp", void 0);
__decorate([
    OneToOne(() => Professor, (professor) => professor.cadastro, { nullable: true })
], Cadastro.prototype, "professor", void 0);
Cadastro = __decorate([
    Entity('cadastro')
], Cadastro);
export { Cadastro };
//# sourceMappingURL=cadastro.entity.js.map