<script setup lang="ts">
// ============================================================
// VisualizarProfessores.vue
// ============================================================
// Tela de "Perfil dos Professores" — acessível apenas por Gestor e OPP.
// Exibe uma lista de professores em cards e ao clicar abre um modal
// com o perfil completo (áreas, UCs, certificações, calendário, disponibilidade).
// ============================================================

import { ref, computed, onMounted } from "vue";
import {
  listarProfessoresPerfis,
  buscarPerfilProfessor,
  getUsuarioLogado,
  listarOpps,
  listarAreas,
} from "@/services/api";

// ====================== ESTADO DA PÁGINA ======================
const loading = ref(true);
const professores = ref<any[]>([]);
const searchQuery = ref("");
const filtroArea = ref("");
const areasDisponiveis = ref<string[]>([]);

// ====================== ESTADO DO MODAL ======================
const showProfileDialog = ref(false);
const loadingProfile = ref(false);
const perfilSelecionado = ref<any>(null);
const tabAtiva = ref("resumo");

// ====================== CARREGAR PROFESSORES ======================
const erro = ref("");

function obterMensagemErro(e: any): string {
  if (!e) return "Erro desconhecido.";
  const msg = e.message || String(e);
  if (msg.includes("Failed to fetch") || msg.includes("fetch")) {
    return "Não foi possível conectar ao servidor. Verifique se o backend está rodando.";
  }
  return msg;
}

// Quando a página abre, busca a lista de professores do backend.
// O backend já filtra automaticamente (gestor vê todos, opp vê os das suas áreas).
async function carregarProfessores() {
  loading.value = true;
  erro.value = "";
  try {
    const data = await listarProfessoresPerfis();
    professores.value = data;

    const usuario = getUsuarioLogado();
    const isOpp = usuario?.funcao === 'opp';

    if (isOpp) {
      try {
        const opps = await listarOpps();
        const oppLogado = opps.find((o: any) => o.idCadastro === usuario?.idUsuario);
        if (oppLogado && oppLogado.oppAreas) {
          areasDisponiveis.value = oppLogado.oppAreas
            .map((oa: any) => oa.area?.nome)
            .filter(Boolean)
            .sort();
        } else {
          areasDisponiveis.value = [];
        }
      } catch (e) {
        console.error("Erro ao carregar áreas do OPP logado:", e);
        areasDisponiveis.value = [];
      }
    } else {
      // Gestor vê todas: Buscar todas as áreas cadastradas no sistema
      try {
        const areas = await listarAreas();
        areasDisponiveis.value = areas
          .map((a: any) => a.nome)
          .filter(Boolean)
          .sort();
      } catch (e) {
        console.error("Erro ao carregar todas as áreas do sistema:", e);
        // Fallback: extrair das áreas dos professores
        const todasAreas = new Set<string>();
        data.forEach((prof: any) => {
          prof.areas?.forEach((area: any) => {
            if (area.nome) todasAreas.add(area.nome);
          });
        });
        areasDisponiveis.value = [...todasAreas].sort();
      }
    }
  } catch (error: any) {
    console.error("Erro ao carregar professores:", error.message);
    erro.value = obterMensagemErro(error);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await carregarProfessores();
});

// ====================== FILTRAR PROFESSORES ======================
// Filtra por nome e por área ao mesmo tempo
const professoresFiltrados = computed(() => {
  return professores.value.filter((prof: any) => {
    // Filtro por nome
    const matchNome = prof.nome
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase());

    // Filtro por área
    const matchArea =
      !filtroArea.value ||
      prof.areas?.some((a: any) => a.nome === filtroArea.value);

    return matchNome && matchArea;
  });
});

// ====================== ABRIR MODAL DO PERFIL ======================
// Quando clica no card do professor, busca o perfil completo no backend
const abrirPerfil = async (prof: any) => {
  showProfileDialog.value = true;
  loadingProfile.value = true;
  tabAtiva.value = "resumo";

  try {
    const data = await buscarPerfilProfessor(prof.idProfessor);
    perfilSelecionado.value = data;
  } catch (error: any) {
    console.error("Erro ao carregar perfil:", error.message);
  } finally {
    loadingProfile.value = false;
  }
};

// ====================== FECHAR MODAL ======================
const fecharPerfil = () => {
  showProfileDialog.value = false;
  perfilSelecionado.value = null;
};

// ====================== COR DA OCUPAÇÃO ======================
// Muda a cor conforme a porcentagem:
//   - Verde: < 50%  (pouca ocupação)
//   - Amarelo: 50-80% (média ocupação)
//   - Vermelho: > 80% (alta ocupação)
const corOcupacao = (percentual: number) => {
  if (percentual < 50) return "#4CAF50";
  if (percentual <= 80) return "#FF9800";
  return "#F44336";
};

// ====================== HELPERS PARA O CALENDÁRIO ======================
const diasSemana = [
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
];
const diasSemanaLabel: Record<string, string> = {
  segunda: "Seg",
  terca: "Ter",
  quarta: "Qua",
  quinta: "Qui",
  sexta: "Sex",
  sabado: "Sáb",
};
const periodos = ["manha", "tarde", "noite"];
const periodosLabel: Record<string, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

// Normaliza o dia da semana removendo acentos e sufixo -feira para comparações robustas
const normalizarDia = (dia: string): string => {
  if (!dia) return "";
  return dia
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace("-feira", "");
};

// Normaliza o período da turma_uc (M01, T01, N01, INT, etc.)
// para o período do calendário (manha, tarde, noite)
const normalizarPeriodo = (periodo: string): string => {
  const p = periodo.toUpperCase();
  if (p.startsWith('M') || p === 'MANHÃ' || p === 'MANHA') return 'manha';
  if (p.startsWith('T') || p === 'TARDE') return 'tarde';
  if (p.startsWith('N') || p === 'NOITE') return 'noite';
  if (p === 'INT' || p === 'INTEGRAL' || p.startsWith('INT_')) return 'manha'; // integral cai em manhã
  return periodo.toLowerCase();
};

// Busca a turma que o professor tem em determinado dia/período
const getTurmaCalendario = (dia: string, periodo: string) => {
  if (!perfilSelecionado.value?.turmas) return null;

  for (const turma of perfilSelecionado.value.turmas) {
    for (const horario of turma.horarios) {
      if (
        normalizarDia(horario.diaSemana) === normalizarDia(dia) &&
        normalizarPeriodo(horario.periodo) === periodo.toLowerCase()
      ) {
        return { nomeTurma: turma.nome, nomeUC: horario.uc };
      }
    }
  }
  return null;
};

// Verifica se o professor tem disponibilidade em determinado dia/período
const temDisponibilidade = (dia: string, periodo: string) => {
  if (!perfilSelecionado.value?.disponibilidade) return false;

  return perfilSelecionado.value.disponibilidade.some(
    (d: any) =>
      normalizarDia(d.diaSemana) === normalizarDia(dia) &&
      d.periodo.toLowerCase() === periodo.toLowerCase()
  );
};

// Formata a data de uma certificação
const formatarData = (data: string | null) => {
  if (!data) return "—";
  return new Date(data).toLocaleDateString("pt-BR");
};

// Gera iniciais do nome para o avatar
const getIniciais = (nome: string) => {
  if (!nome) return "?";
  const partes = nome.trim().split(/\s+/);
  const primeiro = partes[0];
  const ultimo = partes[partes.length - 1];
  if (primeiro && ultimo && partes.length >= 2) {
    const pChar = primeiro[0];
    const uChar = ultimo[0];
    if (pChar && uChar) {
      return (pChar + uChar).toUpperCase();
    }
  }
  const char = nome.trim()[0];
  return char ? char.toUpperCase() : "?";
};
</script>

<template>
  <section class="px-4 md:px-10 lg:px-20 xl:px-40 pb-10">
    <!-- Título da Página -->
    <div class="mt-8 mb-6">
      <div class="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div class="bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
          <v-icon icon="mdi-account-eye" size="28"></v-icon>
        </div>
        <div>
          <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Perfil dos Professores</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Visualize e consulte as informações detalhadas e competências de cada docente.
          </p>
        </div>
      </div>
    </div>

    <!-- Erro ao carregar professores -->
    <v-fade-transition>
      <v-alert
        v-if="erro"
        type="warning"
        variant="tonal"
        closable
        icon="mdi-alert-circle-outline"
        class="mx-auto max-w-4xl mb-8 rounded-xl border-s-4"
        density="comfortable"
        @click:close="erro = ''"
      >
        <div class="d-flex align-center flex-wrap justify-between gap-3">
          <div>
            <span class="font-bold block text-sm">Ops! Ocorreu um contratempo</span>
            <span class="text-xs">{{ erro }}</span>
          </div>
          <v-btn
            size="small"
            color="warning"
            variant="elevated"
            class="rounded-lg font-bold text-xs"
            prepend-icon="mdi-refresh"
            @click="carregarProfessores"
          >
            Tentar novamente
          </v-btn>
        </div>
      </v-alert>
    </v-fade-transition>

    <!-- Filtros -->
    <v-card class="mx-auto max-w-4xl mb-8 border-t-4 border-t-red-500" elevation="2">
      <v-card-text>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <v-text-field
            v-model="searchQuery"
            label="Buscar por nome"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          />
          <v-select
            v-model="filtroArea"
            :items="areasDisponiveis"
            label="Filtrar por área"
            prepend-inner-icon="mdi-filter-outline"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <v-progress-circular indeterminate color="red" size="64"></v-progress-circular>
    </div>

    <!-- Lista vazia -->
    <v-card v-else-if="professoresFiltrados.length === 0" class="mx-auto max-w-md text-center pa-8 pb-2" elevation="1">
      <v-icon icon="mdi-account-search" size="64" class="text-grey-lighten-1 mb-4"></v-icon>
      <p class="text-h6 text-grey">Nenhum professor encontrado</p>
      <p class="text-body-2 text-grey-lighten-1">Tente ajustar os filtros de busca</p>
    </v-card>

    <!-- Grid de Cards dos Professores -->
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      <v-card
        v-for="prof in professoresFiltrados"
        :key="prof.idProfessor"
        class="professor-card cursor-pointer overflow-hidden"
        elevation="2"
        hover
        @click="abrirPerfil(prof)"
      >
        <!-- Avatar com iniciais -->
        <div class="bg-red-600 pt-6 pb-8 flex flex-col items-center relative">
          <v-avatar size="72" class="border-3 border-white shadow-lg" color="red-darken-2">
            <span class="text-h5 font-weight-bold text-black dark:text-white">{{ getIniciais(prof.nome) }}</span>
          </v-avatar>
          <h3 class="text-white font-weight-bold text-body-1 mt-3 text-center px-2">
            {{ prof.nome }}
          </h3>
        </div>

        <!-- Info do card -->
        <v-card-text class="pt-4 pb-3">
          <!-- Áreas -->
          <div class="flex flex-wrap gap-1 mb-3 justify-center">
            <v-chip
              v-for="area in prof.areas"
              :key="area.idArea"
              size="small"
              color="red"
              variant="tonal"
              class="font-weight-medium"
            >
              {{ area.nome }}
            </v-chip>
            <v-chip v-if="!prof.areas?.length" size="small" color="grey" variant="tonal">
              Sem área
            </v-chip>
          </div>

          <!-- Ocupação -->
          <div class="px-2">
            <div class="flex justify-between items-center mb-1">
              <span class="text-caption text-grey font-weight-medium">Ocupação</span>
              <span
                class="text-caption font-weight-bold"
                :style="{ color: corOcupacao(prof.ocupacao) }"
              >
                {{ prof.ocupacao }}%
              </span>
            </div>
            <v-progress-linear
              :model-value="prof.ocupacao"
              :color="corOcupacao(prof.ocupacao)"
              height="6"
              rounded
            ></v-progress-linear>
          </div>
        </v-card-text>

        <!-- Botão -->
        <v-card-actions class="px-4 pb-4 pt-0">
          <v-btn
            block
            variant="tonal"
            color="red"
            class="font-weight-bold"
            prepend-icon="mdi-eye-outline"
            @click.stop="abrirPerfil(prof)"
          >
            Ver Perfil
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>

    <!-- ====================== MODAL DO PERFIL ====================== -->
    <v-dialog 
      v-model="showProfileDialog" 
      max-width="950" 
      scrollable
      transition="dialog-bottom-transition"
      class="profile-modal"
      persistent
    >
      <v-card class="rounded-xl overflow-hidden elevation-24">
        <!-- Loading do perfil -->
        <div v-if="loadingProfile" class="pa-16 text-center">
          <v-progress-circular indeterminate color="red" size="48"></v-progress-circular>
          <p class="mt-4 text-grey">Carregando perfil...</p>
        </div>

        <!-- Conteúdo do perfil -->
        <template v-else-if="perfilSelecionado">
          <!-- Header do Modal com Gradiente e Padrão -->
          <div class="modal-header relative p-6 sm:p-8 lg:p-10 overflow-hidden">
            <!-- Background Decoration -->
            <div class="header-overlay"></div>
            <div class="header-pattern"></div>
            
            <v-btn
              icon="mdi-close"
              variant="tonal"
              color="white"
              class="absolute top-4 right-4 z-10 close-btn"
              density="comfortable"
              @click="fecharPerfil"
            ></v-btn>
            
            <div class="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
              <div class="avatar-container ml-2 mt-2">
                <v-avatar size="90" class="profile-avatar elevation-10" style="background-color: rgba(0, 0, 0, 0.2) !important; border: 2px solid rgba(255,255,255,0.5);">
                  <span class="text-h4 font-weight-bold text-white">
                    {{ getIniciais(perfilSelecionado.nome) }}
                  </span>
                </v-avatar>
                <div class="avatar-glow"></div>
              </div>

              <div class="text-center md:text-left flex-grow">
                <div class="flex flex-col md:flex-row md:items-center gap-3 mb-2 mt-2">
                  <h2 class="text-h5 md:text-h4 font-weight-bold text-white tracking-tight">
                    {{ perfilSelecionado.nome }}
                  </h2>
                  <div class="flex flex-wrap gap-2">
                    <v-chip 
                      size="x-small" 
                      variant="flat" 
                      color="rgba(255, 255, 255, 0.2)" 
                      class="font-weight-black text-white uppercase px-2 backdrop-blur-sm border border-white/20"
                    >
                      Professor
                    </v-chip>
                  </div>
                </div>
                
                <p class="text-white text-opacity-90 text-body-1 flex items-center justify-center md:justify-start gap-2 mb-4">
                  <v-icon icon="mdi-email-outline" size="18"></v-icon>
                  {{ perfilSelecionado.email }}
                </p>

                <div class="flex flex-wrap gap-2 justify-center md:justify-start">
                  <v-chip
                    v-for="area in perfilSelecionado.areas"
                    :key="area.idArea"
                    size="small"
                    color="rgba(255, 255, 255, 0.2)"
                    class="font-weight-medium text-white backdrop-blur-md border border-white/30"
                  >
                    <v-icon icon="mdi-tag-outline" start size="14"></v-icon>
                    {{ area.nome }}
                  </v-chip>
                </div>
                
                <!-- Ocupação movida para baixo de forma mais integrada -->
                <div class="mt-4 flex flex-col md:flex-row md:items-center gap-2 max-w-sm mx-auto md:mx-0 bg-black/10 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                   <div class="flex justify-between items-center w-full">
                     <span class="text-xs text-white/90 font-medium">Ocupação Atual</span>
                     <span class="text-sm text-white font-bold">{{ perfilSelecionado.ocupacao }}%</span>
                   </div>
                   <v-progress-linear
                    :model-value="perfilSelecionado.ocupacao"
                    color="white"
                    bg-color="rgba(255,255,255,0.2)"
                    height="6"
                    rounded
                    class="w-full mt-1"
                   ></v-progress-linear>
                </div>
              </div>
            </div>
          </div>

          <!-- Abas Customizadas -->
          <v-tabs 
            v-model="tabAtiva" 
            color="red-darken-2" 
            grow
            class="custom-tabs"
            slider-color="red-darken-2"
          >
            <v-tab value="resumo" class="text-none">
              <v-icon start icon="mdi-calendar-clock"></v-icon>
              <span class="hidden sm:inline">Calendário</span>
            </v-tab>
            <v-tab value="competencias" class="text-none">
              <v-icon start icon="mdi-book-open-variant"></v-icon>
              <span class="hidden sm:inline">UCs</span>
            </v-tab>
            <v-tab value="certificacoes" class="text-none">
              <v-icon start icon="mdi-certificate"></v-icon>
              <span class="hidden sm:inline">Certificações</span>
            </v-tab>
            <v-tab value="disponibilidade" class="text-none">
              <v-icon start icon="mdi-clock-check-outline"></v-icon>
              <span class="hidden sm:inline">Disponibilidade</span>
            </v-tab>
          </v-tabs>

          <!-- Conteúdo das abas -->
          <v-card-text class="pa-6 custom-scrollbar" style="height: 65vh; overflow-y: auto; overflow-x: hidden;">
            <v-tabs-window v-model="tabAtiva" :transition="false" :reverse-transition="false">
              <!-- ===== ABA CALENDÁRIO ===== -->
              <v-tabs-window-item value="resumo">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-h6 font-weight-bold text-grey-darken-3 flex items-center gap-2">
                    <v-icon icon="mdi-calendar-month" color="red-darken-2"></v-icon>
                    Horários da Semana
                  </h3>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-red-100 border border-red-200"></div>
                    <span class="text-caption text-grey">Ocupado</span>
                  </div>
                </div>

                <div v-if="perfilSelecionado.turmas?.length" class="calendar-wrapper rounded-2xl border bg-grey-lighten-5 dark:bg-grey-darken-4 p-1">
                  <div class="overflow-x-auto">
                    <table class="modern-calendar w-full">
                      <thead>
                        <tr>
                          <th class="period-col text-grey-darken-3 dark:text-grey-lighten-1">Período</th>
                          <th v-for="dia in diasSemana" :key="dia" class="day-col text-grey-darken-3 dark:text-grey-lighten-1">
                            {{ diasSemanaLabel[dia] }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="periodo in periodos" :key="periodo">
                          <td class="period-name dark:bg-grey-darken-3 dark:text-white">
                            <v-icon :icon="periodo === 'manha' ? 'mdi-weather-sunny' : periodo === 'tarde' ? 'mdi-weather-partly-cloudy' : 'mdi-weather-night'" size="14" class="mr-1"></v-icon>
                            {{ periodosLabel[periodo] }}
                          </td>
                          <td v-for="dia in diasSemana" :key="dia">
                            <div v-if="getTurmaCalendario(dia, periodo)" class="calendar-slot active group dark:bg-red-900/20 dark:border-red-800">
                              <div class="slot-content">
                                <span class="turma-tag dark:text-red-lighten-3">{{ getTurmaCalendario(dia, periodo)?.nomeTurma }}</span>
                                <span class="uc-tag dark:text-grey-lighten-1">{{ getTurmaCalendario(dia, periodo)?.nomeUC }}</span>
                              </div>
                              <!-- Tooltip/Hover Effect Detail -->
                              <div class="slot-overlay"></div>
                            </div>
                            <div v-else class="calendar-slot empty dark:bg-white/5 dark:border-white/10"></div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div v-else class="empty-state">
                  <v-icon icon="mdi-calendar-blank" size="64" color="grey-lighten-2"></v-icon>
                  <p>Nenhuma turma vinculada a este professor</p>
                </div>

                <!-- Cards de Turmas Vinculadas -->
                <div v-if="perfilSelecionado.turmas?.length" class="mt-8">
                  <h4 class="text-subtitle-1 font-weight-bold mb-4 text-grey-darken-2 dark:text-grey-lighten-1">Turmas Ativas</h4>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div 
                      v-for="turma in perfilSelecionado.turmas" 
                      :key="turma.idTurma"
                      class="turma-mini-card p-3 rounded-xl border flex items-center gap-3 bg-white dark:bg-grey-darken-3 dark:border-grey-darken-2 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                    >
                      <v-avatar color="red-lighten-5" class="rounded-lg dark:bg-red-900/30" size="40">
                        <v-icon icon="mdi-school" color="red-darken-2" class="dark:text-red-lighten-2" size="20"></v-icon>
                      </v-avatar>
                      <div class="flex flex-col items-start gap-0.5">
                        <p class="font-extrabold text-sm tracking-tight text-gray-800 dark:text-white mb-0">{{ turma.nome }}</p>
                        <span 
                          class="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border"
                          :class="{
                            'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30': turma.tipoCurso?.toLowerCase() === 'tec' || turma.tipoCurso?.toLowerCase() === 'tecnico',
                            'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30': turma.tipoCurso?.toLowerCase() === 'cai',
                            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30': turma.tipoCurso?.toLowerCase() === 'fic',
                          }"
                        >
                          {{ turma.tipoCurso?.toLowerCase() === 'tec' ? 'Técnico' : turma.tipoCurso?.toLowerCase() === 'cai' ? 'CAI' : turma.tipoCurso?.toLowerCase() === 'fic' ? 'FIC' : turma.tipoCurso }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </v-tabs-window-item>

              <!-- ===== ABA COMPETÊNCIAS (UCs) ===== -->
              <v-tabs-window-item value="competencias">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-h6 font-weight-bold text-grey-darken-3 dark:text-grey-lighten-1 flex items-center gap-2">
                    <v-icon icon="mdi-book-open-variant" color="red-darken-2"></v-icon>
                    Unidades Curriculares
                  </h3>
                  <v-chip size="small" variant="tonal" color="grey" class="dark:text-grey-lighten-2">
                    {{ perfilSelecionado.ucs?.length || 0 }} UCs vinculadas
                  </v-chip>
                </div>

                <div v-if="perfilSelecionado.ucs?.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    v-for="uc in perfilSelecionado.ucs"
                    :key="uc.idProfessorUC"
                    class="uc-modern-card group dark:bg-grey-darken-3 dark:border-grey-darken-2"
                  >
                    <div class="card-body">
                      <div class="flex items-start justify-between mb-4">
                        <div class="flex-grow">
                          <h4 class="font-weight-black text-body-1 text-grey-darken-4 dark:text-white group-hover:text-red-darken-2 transition-colors">
                            {{ uc.nome }}
                          </h4>
                          <span class="area-tag dark:text-grey-lighten-1">
                            <v-icon icon="mdi-folder-outline" size="12"></v-icon>
                            {{ uc.area }}
                          </span>
                        </div>
                        <div class="level-indicator dark:bg-white/5 dark:border-white/10">
                          <span :class="['level-value', uc.nivelCompetencia >= 70 ? 'text-green' : uc.nivelCompetencia >= 40 ? 'text-orange' : 'text-red']">
                            {{ uc.nivelCompetencia }}%
                          </span>
                        </div>
                      </div>

                      <div class="progress-container">
                        <v-progress-linear
                          :model-value="uc.nivelCompetencia"
                          :color="uc.nivelCompetencia >= 70 ? 'green' : uc.nivelCompetencia >= 40 ? 'orange' : 'red'"
                          height="8"
                          rounded
                          class="uc-progress-bar dark:bg-white/10"
                        ></v-progress-linear>
                      </div>

                      <p v-if="uc.descricao" class="text-caption text-grey dark:text-grey-lighten-2 mt-3 line-clamp-2 italic">
                        "{{ uc.descricao }}"
                      </p>
                    </div>
                  </div>
                </div>

                <div v-else class="empty-state">
                  <v-icon icon="mdi-book-off-outline" size="64" color="grey-lighten-2"></v-icon>
                  <p>Nenhuma Unidade Curricular vinculada</p>
                </div>
              </v-tabs-window-item>

              <!-- ===== ABA CERTIFICAÇÕES ===== -->
              <v-tabs-window-item value="certificacoes">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-h6 font-weight-bold text-grey-darken-3 dark:text-grey-lighten-1 flex items-center gap-2">
                    <v-icon icon="mdi-certificate" color="red-darken-2"></v-icon>
                    Conquistas e Certificações
                  </h3>
                </div>

                <div v-if="perfilSelecionado.certificacoes?.length" class="space-y-3">
                  <div 
                    v-for="cert in perfilSelecionado.certificacoes" 
                    :key="cert.idCertificacao"
                    class="cert-item-card p-4 rounded-xl border bg-white dark:bg-grey-darken-3 dark:border-grey-darken-2 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow"
                  >
                    <v-avatar color="amber-lighten-5" class="rounded-xl dark:bg-amber-900/20" size="56">
                      <v-icon icon="mdi-medal" color="amber-darken-3" class="dark:text-amber-lighten-3" size="32"></v-icon>
                    </v-avatar>
                    
                    <div class="flex-grow">
                      <h4 class="font-weight-bold text-body-1 mb-1 dark:text-white">{{ cert.nome }}</h4>
                      <div class="flex flex-wrap gap-x-4 gap-y-1">
                        <span class="text-caption text-grey dark:text-grey-lighten-1 flex items-center gap-1">
                          <v-icon icon="mdi-office-building-outline" size="14"></v-icon>
                          {{ cert.instituicao || 'Instituição não informada' }}
                        </span>
                        <span class="text-caption text-grey dark:text-grey-lighten-1 flex items-center gap-1">
                          <v-icon icon="mdi-clock-outline" size="14"></v-icon>
                          {{ cert.cargaHoraria ? cert.cargaHoraria + 'h' : '—' }}
                        </span>
                      </div>
                    </div>

                    <div class="text-right hidden sm:block">
                      <div class="text-caption text-grey-darken-1 dark:text-grey-lighten-2 font-weight-bold">Obtido em</div>
                      <div class="text-body-2 font-weight-medium dark:text-white">{{ formatarData(cert.dataObtencao) }}</div>
                    </div>
                  </div>
                </div>

                <div v-else class="empty-state">
                  <v-icon icon="mdi-certificate-outline" size="64" color="grey-lighten-2"></v-icon>
                  <p>Nenhuma certificação registrada no perfil</p>
                </div>
              </v-tabs-window-item>

              <!-- ===== ABA DISPONIBILIDADE ===== -->
              <v-tabs-window-item value="disponibilidade">
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-h6 font-weight-bold text-grey-darken-3 dark:text-grey-lighten-1 flex items-center gap-2">
                    <v-icon icon="mdi-clock-check-outline" color="red-darken-2"></v-icon>
                    Disponibilidade para Novas Turmas
                  </h3>
                </div>

                <div v-if="perfilSelecionado.disponibilidade?.length">
                  <div class="calendar-wrapper rounded-2xl border bg-grey-lighten-5 dark:bg-grey-darken-4 p-1 mb-6">
                    <div class="overflow-x-auto">
                      <table class="modern-calendar w-full">
                        <thead>
                          <tr>
                            <th class="period-col text-grey-darken-3 dark:text-grey-lighten-1">Período</th>
                            <th v-for="dia in diasSemana" :key="dia" class="day-col text-grey-darken-3 dark:text-grey-lighten-1">
                              {{ diasSemanaLabel[dia] }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="periodo in periodos" :key="periodo">
                            <td class="period-name dark:bg-grey-darken-3 dark:text-white">
                              {{ periodosLabel[periodo] }}
                            </td>
                            <td v-for="dia in diasSemana" :key="dia">
                              <div 
                                :class="['availability-slot', temDisponibilidade(dia, periodo) ? 'available' : 'unavailable', 'dark:border-white/10']"
                              >
                                <v-icon 
                                  :icon="temDisponibilidade(dia, periodo) ? 'mdi-check-circle' : 'mdi-minus-circle-outline'" 
                                  :size="18"
                                  :color="temDisponibilidade(dia, periodo) ? 'green' : 'grey-lighten-1'"
                                ></v-icon>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                <div v-else class="empty-state">
                  <v-icon icon="mdi-clock-alert-outline" size="64" color="grey-lighten-2"></v-icon>
                  <p>Nenhuma disponibilidade cadastrada para este professor</p>
                </div>
              </v-tabs-window-item>
            </v-tabs-window>
          </v-card-text>
        </template>
      </v-card>
    </v-dialog>
  </section>

</template>

<style scoped>
.professor-card {
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  border-bottom: 4px solid #e30613;
}

.professor-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 35px rgba(227, 6, 19, 0.2) !important;
}

/* Modal Premium Styles */
.profile-modal :deep(.v-overlay__content) {
  backdrop-filter: blur(8px);
}

.modal-header {
  background: linear-gradient(135deg, #b71c1c 0%, #d32f2f 50%, #e53935 100%);
}

.header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
}

.header-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.profile-avatar {
  border: 4px solid rgba(255, 255, 255, 0.3);
  background: linear-gradient(135deg, #d32f2f, #b71c1c);
}

.avatar-container {
  position: relative;
}

.avatar-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 120%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  z-index: 0;
}

.close-btn {
  transition: transform 0.3s ease;
}

.close-btn:hover {
  transform: rotate(90deg);
  background-color: rgba(255, 255, 255, 0.1);
}

/* Custom Tabs */
.custom-tabs {
  background-color: transparent !important;
}

.custom-tabs :deep(.v-tab) {
  font-weight: 700;
  letter-spacing: 0.5px;
  opacity: 0.7;
}

.custom-tabs :deep(.v-tab--selected) {
  opacity: 1;
}

/* Calendar Styles */
.modern-calendar {
  border-collapse: separate;
  border-spacing: 6px;
}

.modern-calendar th {
  padding: 12px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.period-name {
  font-weight: 700;
  font-size: 0.8rem;
  padding: 10px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.calendar-slot {
  min-height: 60px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.calendar-slot.active {
  background: #fff5f5;
  border: 1px solid #fee2e2;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 8px;
}

.calendar-slot.empty {
  background: rgba(0,0,0,0.02);
  border: 1px dashed rgba(0,0,0,0.05);
}

.turma-tag {
  display: block;
  font-weight: 800;
  font-size: 0.65rem;
  color: #b71c1c;
  line-height: 1.2;
  margin-bottom: 2px;
}

.uc-tag {
  display: block;
  font-size: 0.6rem;
  color: #777;
  line-height: 1.1;
}

.slot-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom, transparent, rgba(227, 6, 19, 0.05));
  opacity: 0;
  transition: opacity 0.3s;
}

.calendar-slot.active:hover .slot-overlay {
  opacity: 1;
}

/* UC Cards */
.uc-modern-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.uc-modern-card:hover {
  border-color: #fee2e2;
  box-shadow: 0 10px 20px rgba(0,0,0,0.03);
  transform: translateY(-2px);
}

.uc-modern-card .card-body {
  padding: 20px;
}

.area-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #999;
  margin-top: 4px;
}

.level-indicator {
  background: #f9fafb;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid #eee;
}

.level-value {
  font-size: 0.85rem;
  font-weight: 900;
}

/* Availability */
.availability-slot {
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.availability-slot.available {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #dcfce7;
}

.availability-slot.unavailable {
  background: #f9fafb;
  color: #d1d5db;
  border: 1px solid #f3f4f6;
}

.calendar-wrapper,
.turma-mini-card,
.cert-item-card {
  border: 1px solid #eef2f6 !important;
}

/* Modo Escuro - Ajustes Finos */
:deep(.v-theme--dark) .period-name {
  background: #2a2a2a;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

:deep(.v-theme--dark) .calendar-wrapper,
:deep(.v-theme--dark) .uc-modern-card,
:deep(.v-theme--dark) .cert-item-card,
:deep(.v-theme--dark) .turma-mini-card {
  background: #2a2a2a;
  border-color: #3a3a3a !important;
}

:deep(.v-theme--dark) .calendar-slot.active {
  background: rgba(183, 28, 28, 0.2);
  border-color: rgba(183, 28, 28, 0.4);
}

:deep(.v-theme--dark) .availability-slot.available {
  background: rgba(22, 163, 74, 0.15);
  color: #4ade80;
  border-color: rgba(22, 163, 74, 0.3);
}

:deep(.v-theme--dark) .availability-slot.unavailable {
  background: rgba(255, 255, 255, 0.05);
  color: #4b5563;
  border-color: rgba(255, 255, 255, 0.1);
}

:deep(.v-theme--dark) .level-indicator {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

:deep(.v-theme--dark) .custom-tabs {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Custom Scrollbar for Modal Content */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(227, 6, 19, 0.3);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(227, 6, 19, 0.6);
}

:deep(.v-theme--dark) .custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

:deep(.v-theme--dark) .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

:deep(.v-theme--dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.empty-state p {
  margin-top: 10px;
  font-size: 0.9rem;
}

/* Occupation Widget */
.occupation-widget {
  transition: all 0.3s ease;
}

.occupation-widget:hover {
  background-color: rgba(255, 255, 255, 0.15);
  transform: scale(1.02);
}

.occupation-bar :deep(.v-progress-linear__determinate) {
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.cert-item-card {
  transition: all 0.3s ease;
}

.cert-item-card:hover {
  border-color: #fbbf24;
  background-color: #fffbeb;
}
</style>
