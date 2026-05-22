import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { OPP } from '../opp/opp.entity.js';
import { Area } from './area.entity.js';

@Entity('opp_area')
@Unique(['idOPP', 'idArea'])
export class OPPArea {
  @PrimaryGeneratedColumn({ name: 'id_opp_area' })
  idOPPArea: number;

  @Column({ name: 'id_opp', type: 'int' })
  idOPP: number;

  @Column({ name: 'id_area', type: 'int' })
  idArea: number;

  @ManyToOne(() => OPP, (opp) => opp.oppAreas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_opp' })
  opp: OPP;

  @ManyToOne(() => Area, (area) => area.oppAreas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_area' })
  area: Area;
}
