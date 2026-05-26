import { Cadastro } from '../cadastro/cadastro.entity.js';
import { Gestor } from '../gestor/gestor.entity.js';
import { Turma } from '../turma/turma.entity.js';
import { OPPArea } from '../area/opp-area.entity.js';
export declare class OPP {
    idOPP: number;
    idCadastro: number;
    idGestor: number;
    status: boolean;
    cadastro: Cadastro;
    gestor: Gestor;
    turmas: Turma[];
    oppAreas: OPPArea[];
}
//# sourceMappingURL=opp.entity.d.ts.map