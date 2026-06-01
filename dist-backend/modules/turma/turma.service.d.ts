interface UsuarioToken {
    idUsuario: number;
    funcao: string;
}
interface ListarFiltros {
    search?: string;
    periodo?: string;
}
interface HorarioInput {
    diaSemana: string;
    periodo: string;
    idUC?: number;
    nomeUC?: string;
}
interface CriarTurmaInput {
    nome: string;
    tipoCurso: string;
    dataInicio: string;
    dataTermino: string;
    idOPP: number;
    idArea?: number;
    aulasSemana?: number;
    totalAulas?: number;
    descricao?: string;
    horarios: HorarioInput[];
}
export declare class TurmaService {
    private repo;
    listar(usuario: UsuarioToken, filtros?: ListarFiltros): Promise<{
        idTurma: number;
        label: string;
        value: string;
        modalidade: string;
        siglas: string;
        areas: string[];
        idArea: number | null;
        grade: {
            periodo: string;
            aulas: Record<string, {
                disciplina: string;
                professor: string;
                idProfessor: number | null;
                idUC: number | null;
            }>;
        }[];
        aulasSemana: number;
        totalAulas: number;
        duracaoDias: number;
        dataInicio: string;
        dataTermino: string;
        dataInicioISO: string;
        dataTerminoISO: string;
        criadorNome: string;
        oppNome: string;
        idOPP: number;
        professores: {
            idProfessor: number;
            nome: string;
            foto: string;
        }[];
        descricao: string;
    }[]>;
    criar(usuario: UsuarioToken, dados: CriarTurmaInput): Promise<{
        idTurma: number;
        label: string;
        value: string;
        modalidade: string;
        siglas: string;
        areas: string[];
        idArea: number | null;
        grade: {
            periodo: string;
            aulas: Record<string, {
                disciplina: string;
                professor: string;
                idProfessor: number | null;
                idUC: number | null;
            }>;
        }[];
        aulasSemana: number;
        totalAulas: number;
        duracaoDias: number;
        dataInicio: string;
        dataTermino: string;
        dataInicioISO: string;
        dataTerminoISO: string;
        criadorNome: string;
        oppNome: string;
        idOPP: number;
        professores: {
            idProfessor: number;
            nome: string;
            foto: string;
        }[];
        descricao: string;
    }>;
    atualizar(idTurma: number, usuario: UsuarioToken, dados: Partial<CriarTurmaInput>): Promise<{
        idTurma: number;
        label: string;
        value: string;
        modalidade: string;
        siglas: string;
        areas: string[];
        idArea: number | null;
        grade: {
            periodo: string;
            aulas: Record<string, {
                disciplina: string;
                professor: string;
                idProfessor: number | null;
                idUC: number | null;
            }>;
        }[];
        aulasSemana: number;
        totalAulas: number;
        duracaoDias: number;
        dataInicio: string;
        dataTermino: string;
        dataInicioISO: string;
        dataTerminoISO: string;
        criadorNome: string;
        oppNome: string;
        idOPP: number;
        professores: {
            idProfessor: number;
            nome: string;
            foto: string;
        }[];
        descricao: string;
    } | null>;
    excluir(idTurma: number, usuario: UsuarioToken): Promise<boolean>;
    private verificarPermissao;
    private validarOPPPertenceArea;
    private resolverIdOPP;
    private resolverHorarios;
    private contarDiasUnicos;
    private mapTurmaParaCard;
    private buildGrade;
    private formatarData;
    private cardMatchesPeriodo;
    private periodoMatchesFiltro;
    private calcularTotalAulas;
    private cardMatchesSearch;
    /**
     * Busca professores elegíveis para um slot específico da turma.
     * Aplica todas as regras de negócio:
     *   1. Professor tem a UC (professor_uc)
     *   2. Professor tem disponibilidade no dia/período
     *   3. Ocupação < 80%
     *   4. Sem conflito de horário (não está em outra turma no mesmo dia+período)
     *   5. Professor ativo
     *   6. Não está já nesta turma
     *   7. Ordenado por nível de competência (decrescente)
     */
    buscarProfessoresElegiveis(idTurma: number, idUC: number, diaSemana: string, periodo: string, usuario: UsuarioToken): Promise<{
        idProfessor: number;
        nome: string;
        email: string;
        fotoPerfil: string;
        ocupacao: number;
        nivelCompetencia: number;
        areas: {
            idArea: number;
            nome: string;
        }[];
    }[]>;
    /**
     * Aloca um professor a um SLOT específico da turma (UC + Dia + Período).
     * Revalida todas as regras de negócio no momento da alocação.
     */
    alocarProfessor(idTurma: number, idProfessor: number, idUC: number, diaSemana: string, periodo: string, usuario: UsuarioToken): Promise<{
        idTurma: number;
        label: string;
        value: string;
        modalidade: string;
        siglas: string;
        areas: string[];
        idArea: number | null;
        grade: {
            periodo: string;
            aulas: Record<string, {
                disciplina: string;
                professor: string;
                idProfessor: number | null;
                idUC: number | null;
            }>;
        }[];
        aulasSemana: number;
        totalAulas: number;
        duracaoDias: number;
        dataInicio: string;
        dataTermino: string;
        dataInicioISO: string;
        dataTerminoISO: string;
        criadorNome: string;
        oppNome: string;
        idOPP: number;
        professores: {
            idProfessor: number;
            nome: string;
            foto: string;
        }[];
        descricao: string;
    } | null>;
    /**
     * Remove um professor de uma turma.
     * Se idUC + diaSemana + periodo forem fornecidos, remove apenas daquele slot.
     * Caso contrário, remove TODAS as alocações do professor naquela turma.
     */
    desalocarProfessor(idTurma: number, idProfessor: number, usuario: UsuarioToken, idUC?: number, diaSemana?: string, periodo?: string): Promise<{
        idTurma: number;
        label: string;
        value: string;
        modalidade: string;
        siglas: string;
        areas: string[];
        idArea: number | null;
        grade: {
            periodo: string;
            aulas: Record<string, {
                disciplina: string;
                professor: string;
                idProfessor: number | null;
                idUC: number | null;
            }>;
        }[];
        aulasSemana: number;
        totalAulas: number;
        duracaoDias: number;
        dataInicio: string;
        dataTermino: string;
        dataInicioISO: string;
        dataTerminoISO: string;
        criadorNome: string;
        oppNome: string;
        idOPP: number;
        professores: {
            idProfessor: number;
            nome: string;
            foto: string;
        }[];
        descricao: string;
    } | null>;
    /**
     * Mapeia um período de turma_uc (M01, T01, etc.) para o período
     * de disponibilidade do professor (manha, tarde, noite).
     */
    private mapearPeriodoParaDisponibilidade;
    private obterHorasDoPeriodo;
}
export {};
//# sourceMappingURL=turma.service.d.ts.map