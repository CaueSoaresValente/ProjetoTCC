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
        turmas: {
            idTurma: number;
            nome: string;
            tipoCurso: string;
            dataInicio: Date;
            dataTermino: Date;
            horarios: {
                diaSemana: string;
                periodo: string;
                uc: string;
            }[];
        }[];
    } | null>;
    private calcularOcupacao;
}
//# sourceMappingURL=perfil-professor.service.d.ts.map