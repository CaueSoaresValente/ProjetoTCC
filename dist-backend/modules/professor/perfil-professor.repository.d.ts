import { Professor } from './professor.entity.js';
import { OPPArea } from '../area/opp-area.entity.js';
export declare class PerfilProfessorRepository {
    private professorRepo;
    private oppAreaRepo;
    private profAreaRepo;
    findAll(): Promise<Professor[]>;
    findByOPPAreas(idOPP: number): Promise<Professor[]>;
    findFullProfile(idProfessor: number): Promise<Professor | null>;
    findOPPAreas(idOPP: number): Promise<OPPArea[]>;
}
//# sourceMappingURL=perfil-professor.repository.d.ts.map