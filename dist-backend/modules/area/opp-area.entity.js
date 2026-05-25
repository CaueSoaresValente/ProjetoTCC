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
import { OPP } from '../opp/opp.entity.js';
import { Area } from './area.entity.js';
let OPPArea = class OPPArea {
    idOPPArea;
    idOPP;
    idArea;
    opp;
    area;
};
__decorate([
    PrimaryGeneratedColumn({ name: 'id_opp_area' }),
    __metadata("design:type", Number)
], OPPArea.prototype, "idOPPArea", void 0);
__decorate([
    Column({ name: 'id_opp', type: 'int' }),
    __metadata("design:type", Number)
], OPPArea.prototype, "idOPP", void 0);
__decorate([
    Column({ name: 'id_area', type: 'int' }),
    __metadata("design:type", Number)
], OPPArea.prototype, "idArea", void 0);
__decorate([
    ManyToOne(() => OPP, (opp) => opp.oppAreas, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'id_opp' }),
    __metadata("design:type", OPP)
], OPPArea.prototype, "opp", void 0);
__decorate([
    ManyToOne(() => Area, (area) => area.oppAreas, { onDelete: 'CASCADE' }),
    JoinColumn({ name: 'id_area' }),
    __metadata("design:type", Area)
], OPPArea.prototype, "area", void 0);
OPPArea = __decorate([
    Entity('opp_area'),
    Unique(['idOPP', 'idArea'])
], OPPArea);
export { OPPArea };
//# sourceMappingURL=opp-area.entity.js.map