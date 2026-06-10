import { Cadastro } from './cadastro.entity.js';
import { OPP } from '../opp/opp.entity.js';
import { Gestor } from '../gestor/gestor.entity.js';
import { Professor } from '../professor/professor.entity.js';
export declare class CadastroService {
    private repo;
    create(data: any): Promise<Cadastro>;
    findById(id: number): Promise<Cadastro | null>;
    listAll(): Promise<{
        areas: string[];
        areaIds: number[];
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
    }[]>;
    update(id: number, data: any): Promise<Cadastro | null>;
    delete(id: number): Promise<void>;
    private garantirGestor;
    private garantirProfessor;
    private criarOppComAreas;
    private atualizarAreasOpp;
}
//# sourceMappingURL=cadastro.service.d.ts.map