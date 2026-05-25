var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Professor } from '../professor/professor.entity.js';
import { Area } from './area.entity.js';
let ProfessorArea = class ProfessorArea {
    idProfessorArea;
    idProfessor;
    idArea;
    professor;
    area;
};
__decorate([
    PrimaryGeneratedColumn({ name: 'id_professor_area' }),
    __metadata("design:type", Number)
], ProfessorArea.prototype, "idProfessorArea", void 0);
__decorate([
    Column({ name: 'id_professor', type: 'int' }),
    __metadata("design:type", Number)
], ProfessorArea.prototype, "idProfessor", void 0);
__decorate([
    Column({ name: 'id_area', type: 'int' }),
    __metadata("design:type", Number)
], ProfessorArea.prototype, "idArea", void 0);
__decorate([
    ManyToOne(() => Professor, (professor) => professor.professorAreas, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'id_professor' }),
    __metadata("design:type", Professor)
], ProfessorArea.prototype, "professor", void 0);
__decorate([
    ManyToOne(() => Area, (area) => area.professorAreas, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'id_area' }),
    __metadata("design:type", Area)
], ProfessorArea.prototype, "area", void 0);
ProfessorArea = __decorate([
    Entity('professor_area'),
    Unique(['idProfessor', 'idArea'])
], ProfessorArea);
export { ProfessorArea };
//# sourceMappingURL=professor-area.entity.js.map