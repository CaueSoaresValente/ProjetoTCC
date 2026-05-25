import { Gestor } from '../gestor/gestor.entity.js';
import { OPP } from '../opp/opp.entity.js';
import { Professor } from '../professor/professor.entity.js';
export declare class Cadastro {
    idUsuario: number;
    email: string;
    senha: string;
    funcao: string;
    nome: string;
    fotoPerfil: string;
    status: boolean;
    gestor?: Gestor;
    opp?: OPP;
    professor?: Professor;
}
//# sourceMappingURL=cadastro.entity.d.ts.map