// ============================================================
// src/services/api.ts
// ============================================================
// Este arquivo centraliza TODAS as chamadas do frontend
// para o backend. Em vez de escrever "fetch(...)" em cada
// página Vue, chamamos funções daqui.
//
// COMO FUNCIONA:
// 1. O frontend roda na porta 3000 (Vite)
// 2. O backend roda na porta 3001 (Express)
// 3. O Vite tem um "proxy" configurado:
//    quando chamamos "/api/...", ele redireciona para :3001
// 4. Assim, não precisamos escrever "http://localhost:3001"
//    em lugar nenhum do frontend — basta usar "/api/..."
// ============================================================

// --- Onde o token JWT é guardado no navegador ---
const TOKEN_KEY = 'token';
const USER_KEY = 'usuario';

// ============================================================
// FUNÇÃO BASE — todas as outras usam esta
// ============================================================
async function request(url: string, options: RequestInit = {}) {
  // Em dev, o Vite proxy redireciona /api/* para localhost:3001.
  // Em produção (Vercel), frontend e backend estão no mesmo domínio.
  const fullUrl = url;
  
  const token = localStorage.getItem(TOKEN_KEY);

  // Monta os headers padrão
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Se tem token, adiciona no header Authorization
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Faz a requisição HTTP
  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  // Se deu erro, lança uma exceção
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erro ${response.status}`);
  }

  // Se não houver conteúdo (ex: DELETE com status 204), não tentamos parsear o JSON
  if (response.status === 204) {
    return null;
  }

  // Retorna os dados em JSON
  return response.json().catch(() => ({}));
}

// ============================================================
// AUTH — Login e Recuperação de Senha
// ============================================================

/**
 * Faz login com email e senha.
 * Se der certo, salva o token e os dados do usuário no localStorage.
 */
export async function login(email: string, senha: string) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });

  // Salva o token e o usuário no navegador
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.usuario));

  return data;
}

/**
 * Solicita recuperação de senha por e-mail.
 */
export async function recuperarSenha(email: string) {
  return request('/api/auth/recuperar', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Faz logout — apaga o token e os dados do navegador.
 */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Retorna o usuário logado (ou null).
 */
export function getUsuarioLogado() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Verifica se o usuário está logado.
 */
export function estaLogado(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

// ============================================================
// CADASTRO — Criar novo usuário
// ============================================================

/**
 * Cria um novo cadastro (gestor, opp ou professor).
 */
export async function criarCadastro(dados: {
  nome: string;
  email: string;
  senha: string;
  funcao: string;
}) {
  return request('/api/cadastro', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

/**
 * Busca um cadastro pelo ID.
 */
export async function buscarCadastro(id: number) {
  return request(`/api/cadastro/${id}`);
}

/**
 * Lista todos os cadastros (usuários).
 */
export async function listarCadastros() {
  return request('/api/cadastro');
}

/**
 * Atualiza um cadastro existente.
 */
export async function editarCadastro(id: number, dados: any) {
  return request(`/api/cadastro/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });
}

/**
 * Exclui um cadastro.
 */
export async function excluirCadastro(id: number) {
  return request(`/api/cadastro/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// ÁREAS — CRUD completo
// ============================================================
// Estas funções chamam o backend para gerenciar as áreas.
// O backend salva tudo no banco de dados MySQL.
// ============================================================

/**
 * Lista todas as áreas cadastradas.
 * Retorna um array com: idArea, nome, status, unidadesCurriculares[]
 */
export async function listarAreas() {
  return request('/api/areas');
}

/**
 * Cria uma nova área.
 * @param dados - Objeto com o campo "nome" (obrigatório)
 */
export async function criarArea(dados: { nome: string }) {
  return request('/api/areas', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

/**
 * Atualiza uma área existente.
 * @param id - ID da área que será atualizada
 * @param dados - Objeto com os campos que serão alterados
 */
export async function editarArea(id: number, dados: { nome: string }) {
  return request(`/api/areas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });
}

/**
 * Exclui uma área.
 * @param id - ID da área que será excluída
 */
export async function excluirArea(id: number) {
  return request(`/api/areas/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// COMPETÊNCIAS (Unidades Curriculares) — CRUD completo
// ============================================================
// Na tela do usuário chamamos de "Competência",
// mas no banco o nome da tabela é "unidade_curricular".
// ============================================================

/**
 * Lista todas as competências cadastradas.
 * Retorna um array com: idUC, nome, descricao, idArea, area (objeto)
 */
export async function listarCompetencias() {
  return request('/api/competencias');
}

/**
 * Cria uma nova competência.
 * @param dados - Objeto com: nome, descricao, idArea
 */
export async function criarCompetencia(dados: {
  nome: string;
  descricao?: string;
  idArea: number;
}) {
  return request('/api/competencias', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

/**
 * Atualiza uma competência existente.
 * @param id - ID da competência (idUC)
 * @param dados - Campos que serão alterados
 */
export async function editarCompetencia(id: number, dados: {
  nome?: string;
  descricao?: string;
  idArea?: number;
}) {
  return request(`/api/competencias/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });
}

/**
 * Exclui uma competência.
 * @param id - ID da competência (idUC)
 */
export async function excluirCompetencia(id: number) {
  return request(`/api/competencias/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// OPPs — Listar todos os OPPs
// ============================================================

/**
 * Lista todos os OPPs cadastrados.
 * Retorna array com: idOPP, idCadastro, cadastro, oppAreas[]
 */
export async function listarOpps() {
  return request('/api/opps');
}

// ============================================================
// PROFESSOR — Buscar por Cadastro
// ============================================================
// Quando o professor faz login, o token tem o idUsuario (cadastro).
// Precisamos descobrir o idProfessor para usar nas rotas abaixo.
// ============================================================

/**
 * Busca o professor pelo ID do cadastro.
 * Retorna o objeto professor com idProfessor, idCadastro, status.
 */
export async function buscarProfessorPorCadastro(idCadastro: number) {
  return request(`/api/professor/cadastro/${idCadastro}`);
}

/**
 * Cria o perfil de professor associado a um cadastro.
 */
export async function criarProfessor(idCadastro: number) {
  return request('/api/professor', {
    method: 'POST',
    body: JSON.stringify({ idCadastro }),
  });
}

// ============================================================
// PROFESSOR — ÁREAS DE ATUAÇÃO — CRUD
// ============================================================
// Gerencia quais áreas cada professor escolheu.
// ============================================================

/**
 * Lista as áreas de atuação de um professor.
 * Retorna array com: idProfessorArea, idProfessor, idArea, area (objeto)
 */
export async function listarAreasProfessor(idProfessor: number) {
  return request(`/api/professor/${idProfessor}/areas`);
}

/**
 * Vincula uma nova área ao professor.
 * @param idProfessor - ID do professor
 * @param idArea - ID da área que o professor quer adicionar
 */
export async function adicionarAreaProfessor(idProfessor: number, idArea: number) {
  return request(`/api/professor/${idProfessor}/areas`, {
    method: 'POST',
    body: JSON.stringify({ idArea }),
  });
}

/**
 * Atualiza o vínculo de área do professor (troca a área).
 * @param id - ID do vínculo (idProfessorArea)
 * @param idArea - Novo ID da área
 */
export async function editarAreaProfessor(id: number, idArea: number) {
  return request(`/api/professor/areas/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ idArea }),
  });
}

/**
 * Remove o vínculo de área do professor.
 * @param id - ID do vínculo (idProfessorArea)
 */
export async function excluirAreaProfessor(id: number) {
  return request(`/api/professor/areas/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// PROFESSOR — UNIDADES CURRICULARES — CRUD
// ============================================================
// Gerencia quais UCs cada professor sabe ministrar,
// junto com o nível de competência (0 a 100%).
// ============================================================

/**
 * Lista as UCs de um professor.
 * Retorna array com: idProfessorUC, idUC, idProfessor, nivelCompetencia, unidadeCurricular (objeto)
 */
export async function listarUCsProfessor(idProfessor: number) {
  return request(`/api/professor/${idProfessor}/ucs`);
}

/**
 * Lista as UCs de uma área específica (para popular o dropdown).
 * @param idArea - ID da área
 */
export async function listarUCsPorArea(idArea: number) {
  return request(`/api/competencias/area/${idArea}`);
}

/**
 * Vincula uma UC ao professor com nível de competência.
 * @param idProfessor - ID do professor
 * @param idUC - ID da UC
 * @param nivelCompetencia - Nível de 0 a 100
 */
export async function adicionarUCProfessor(idProfessor: number, idUC: number, nivelCompetencia: number) {
  return request(`/api/professor/${idProfessor}/ucs`, {
    method: 'POST',
    body: JSON.stringify({ idUC, nivelCompetencia }),
  });
}

/**
 * Atualiza o nível de competência de uma UC do professor.
 * @param id - ID do vínculo (idProfessorUC)
 * @param nivelCompetencia - Novo nível de 0 a 100
 */
export async function editarUCProfessor(id: number, nivelCompetencia: number) {
  return request(`/api/professor/ucs/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ nivelCompetencia }),
  });
}

/**
 * Remove o vínculo de UC do professor.
 * @param id - ID do vínculo (idProfessorUC)
 */
export async function excluirUCProfessor(id: number) {
  return request(`/api/professor/ucs/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// PROFESSOR — CERTIFICAÇÕES — CRUD
// ============================================================
// Gerencia as certificações do professor (AWS, Scrum, etc.)
// ============================================================

/**
 * Lista as certificações de um professor.
 */
export async function listarCertificacoes(idProfessor: number) {
  return request(`/api/professor/${idProfessor}/certificacoes`);
}

/**
 * Cria uma nova certificação.
 * @param idProfessor - ID do professor
 * @param dados - Objeto com: nome, instituicao, cargaHoraria, dataObtencao
 */
export async function adicionarCertificacao(idProfessor: number, dados: {
  nome: string;
  instituicao?: string;
  cargaHoraria?: string;
  dataObtencao?: string;
}) {
  return request(`/api/professor/${idProfessor}/certificacoes`, {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

/**
 * Atualiza uma certificação existente.
 * @param id - ID da certificação
 * @param dados - Campos que serão alterados
 */
export async function editarCertificacao(id: number, dados: {
  nome?: string;
  instituicao?: string;
  cargaHoraria?: string;
  dataObtencao?: string;
}) {
  return request(`/api/professor/certificacoes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });
}

/**
 * Exclui uma certificação.
 * @param id - ID da certificação
 */
export async function excluirCertificacao(id: number) {
  return request(`/api/professor/certificacoes/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================
// PERFIL DOS PROFESSORES — Visualização para Gestor/OPP
// ============================================================
// Estas funções são usadas na tela "Perfil dos Professores".
// O Gestor vê todos os professores, o OPP vê apenas os das suas áreas.
// A filtragem é feita pelo backend com base no token JWT.
// ============================================================

/**
 * Lista os professores com dados resumidos (nome, áreas, % ocupação).
 * O backend filtra automaticamente:
 *   - Gestor: vê todos
 *   - OPP: vê apenas os das suas áreas
 */
export async function listarProfessoresPerfis() {
  return request('/api/professores/perfis');
}

/**
 * Busca o perfil completo de um professor.
 * Retorna: áreas, UCs, certificações, disponibilidade, turmas (calendário).
 * @param idProfessor - ID do professor
 */
export async function buscarPerfilProfessor(idProfessor: number) {
  return request(`/api/professores/perfis/${idProfessor}`);
}

/**
 * Busca o calendário de aulas e ocupação do professor logado.
 */
export async function buscarMeuCalendario() {
  return request('/api/professor/calendario');
}

// ============================================================
// MEU PERFIL — Edição do próprio perfil (todos os perfis)
// ============================================================
// Permite que o usuário logado (gestor, opp ou professor)
// edite seu nome, foto e senha.
// ============================================================

/**
 * Busca os dados do perfil do usuário logado.
 */
export async function buscarMeuPerfil() {
  return request('/api/perfil');
}

/**
 * Atualiza o nome e/ou foto de perfil do usuário logado.
 * @param dados - Objeto com: nome?, email?, fotoPerfil? (base64)
 */
export async function atualizarMeuPerfil(dados: { nome?: string; email?: string; fotoPerfil?: string }) {
  const result = await request('/api/perfil', {
    method: 'PUT',
    body: JSON.stringify(dados),
  });

  // Atualiza os dados no localStorage para refletir no menu
  const usuarioAtual = getUsuarioLogado();
  if (usuarioAtual) {
    if (dados.nome) usuarioAtual.nome = dados.nome;
    if (dados.email) usuarioAtual.email = dados.email;
    if (dados.fotoPerfil !== undefined) usuarioAtual.fotoPerfil = dados.fotoPerfil;
    localStorage.setItem(USER_KEY, JSON.stringify(usuarioAtual));
    window.dispatchEvent(new Event('usuario-atualizado'));
  }

  return result;
}

/**
 * Altera a senha do usuário logado.
 * @param senhaAtual - Senha atual para confirmação
 * @param novaSenha - Nova senha (deve seguir as regras de segurança)
 */
export async function alterarMinhaSenha(senhaAtual: string, novaSenha: string) {
  return request('/api/perfil/senha', {
    method: 'PUT',
    body: JSON.stringify({ senhaAtual, novaSenha }),
  });
}

// ============================================================
// TURMAS — Listagem e CRUD (Gestor / OPP)
// ============================================================

/**
 * Lista turmas criadas por Gestores e OPPs.
 * Suporta filtros: search (texto) e periodo (Todas, Manhã, Tarde, Noite, Integral).
 */
export async function listarTurmas(filtros?: { search?: string; periodo?: string }) {
  const params = new URLSearchParams();
  if (filtros?.search) params.set('search', filtros.search);
  if (filtros?.periodo && filtros.periodo !== 'Todas') params.set('periodo', filtros.periodo);

  const query = params.toString();
  return request(`/api/turmas${query ? `?${query}` : ''}`);
}

/**
 * Cria uma nova turma no banco de dados.
 */
export async function criarTurma(dados: {
  nome: string;
  tipoCurso: string;
  dataInicio: string;
  dataTermino: string;
  idOPP: number;
  idArea?: number;
  aulasSemana?: number;
  totalAulas?: number;
  horarios: { diaSemana: string; periodo: string; idUC?: number; nomeUC?: string }[];
}) {
  return request('/api/turmas', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

/**
 * Atualiza uma turma existente.
 */
export async function editarTurma(id: number, dados: Record<string, unknown>) {
  return request(`/api/turmas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  });
}

/**
 * Exclui (desativa) uma turma.
 */
export async function excluirTurma(id: number) {
  return request(`/api/turmas/${id}`, {
    method: 'DELETE',
  });
}

// ====================== GESTÃO DE PROFESSORES EM TURMAS ======================

/**
 * Busca professores elegíveis para um slot específico da turma.
 * Aplica filtros de competência, disponibilidade, ocupação e conflito.
 */
export async function buscarProfessoresElegiveis(
  idTurma: number,
  idUC: number,
  diaSemana: string,
  periodo: string
) {
  const params = new URLSearchParams({
    idUC: String(idUC),
    diaSemana,
    periodo,
  });
  return request(`/api/turmas/${idTurma}/professores-elegiveis?${params.toString()}`);
}

/**
 * Aloca um professor a um slot específico da turma.
 */
export async function alocarProfessor(
  idTurma: number,
  idProfessor: number,
  idUC: number,
  diaSemana: string,
  periodo: string
) {
  return request(`/api/turmas/${idTurma}/professores`, {
    method: 'POST',
    body: JSON.stringify({ idProfessor, idUC, diaSemana, periodo }),
  });
}

/**
 * Remove um professor de uma turma.
 * Se idUC, diaSemana e periodo forem fornecidos, remove apenas daquele slot.
 * Caso contrário, remove todas as alocações do professor na turma.
 */
export async function desalocarProfessor(
  idTurma: number,
  idProfessor: number,
  idUC?: number,
  diaSemana?: string,
  periodo?: string
) {
  let url = `/api/turmas/${idTurma}/professores/${idProfessor}`;
  if (idUC && diaSemana && periodo) {
    const params = new URLSearchParams({
      idUC: String(idUC),
      diaSemana,
      periodo,
    });
    url += `?${params.toString()}`;
  }
  return request(url, {
    method: 'DELETE',
  });
}

