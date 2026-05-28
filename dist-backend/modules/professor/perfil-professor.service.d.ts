export declare class PerfilProfessorService {
    private repo;
    listarProfessores(idOPP?: number): Promise<{
        idProfessor: number;
        nome: string;
        email: string;
        areas: {
            idArea: number;
            nome: string;
        }[];
        ocupacao: number;
    }[]>;
    buscarPerfilCompleto(idProfessor: number): Promise<{
        idProfessor: number;
        nome: string;
        email: string;
        ocupacao: number;
        areas: {
            idProfessorArea: number;
            idArea: number;
            nome: string;
        }[];
        ucs: {
            idProfessorUC: number;
            idUC: number;
            nome: string;
            descricao: string;
            area: string;
            nivelCompetencia: number;
        }[];
        certificacoes: {
            idCertificacao: number;
            nome: string;
            instituicao: string;
            dataObtencao: Date;
            cargaHoraria: string;
        }[];
        disponibilidade: {
            idDisponibilidade: number;
            diaSemana: string;
            periodo: string;
        }[];
        turmas: any[];
    } | null>;
    private agruparTurmasPorId;
    private calcularOcupacao;
    private obterHorasDoPeriodo;
}
//# sourceMappingURL=perfil-professor.service.d.ts.map