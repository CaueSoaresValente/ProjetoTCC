var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UnidadeCurricular } from '../disciplina/unidade-curricular.entity.js';
import { ProfessorArea } from './professor-area.entity.js';
import { OPPArea } from './opp-area.entity.js';
let Area = class Area {
    idArea;
    nome;
    status;
    unidadesCurriculares;
    professorAreas;
    oppAreas;
};
__decorate([
    PrimaryGeneratedColumn({ name: 'id_area' }),
    __metadata("design:type", Number)
], Area.prototype, "idArea", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], Area.prototype, "nome", void 0);
__decorate([
    Column({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Area.prototype, "status", void 0);
__decorate([
    OneToMany(() => UnidadeCurricular, (uc) => uc.area),
    __metadata("design:type", Array)
], Area.prototype, "unidadesCurriculares", void 0);
__decorate([
    OneToMany(() => ProfessorArea, (pa) => pa.area),
    __metadata("design:type", Array)
], Area.prototype, "professorAreas", void 0);
__decorate([
    OneToMany(() => OPPArea, (oa) => oa.area),
    __metadata("design:type", Array)
], Area.prototype, "oppAreas", void 0);
Area = __decorate([
    Entity('area')
], Area);
export { Area };
//# sourceMappingURL=area.entity.js.map