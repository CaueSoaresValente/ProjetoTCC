<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import {
  listarTurmas,
  buscarProfessoresElegiveis,
  alocarProfessor,
  desalocarProfessor,
} from "@/services/api";

// ====================== ESTADO ======================
const turmas = ref<any[]>([]);
const turmaSelecionada = ref<any>(null);
const carregando = ref(false);
const erro = ref("");

// Slot selecionado na grade
const slotSelecionado = ref<{
  diaSemana: string;
  diaLabel: string;
  periodo: string;
  disciplina: string;
  idUC: number | null;
  professor: string;
  idProfessor: number | null;
} | null>(null);

// Professores elegíveis
const professoresElegiveis = ref<any[]>([]);
const carregandoProfessores = ref(false);
const erroProfessores = ref("");

// Dialogs
const showConfirmDialog = ref(false);
const showSuccessDialog = ref(false);
const showRemoveDialog = ref(false);
const professorSelecionado = ref<any>(null);
const professorParaRemover = ref<any>(null);
const operacaoEmAndamento = ref(false);

const diasSemana = [
  { label: "Seg", value: "segunda", full: "Segunda-feira" },
  { label: "Ter", value: "terca", full: "Terça-feira" },
  { label: "Qua", value: "quarta", full: "Quarta-feira" },
  { label: "Qui", value: "quinta", full: "Quinta-feira" },
  { label: "Sex", value: "sexta", full: "Sexta-feira" },
  { label: "Sáb", value: "sabado", full: "Sábado" },
];

const MAPA_DIA_CURTO_REVERSO: Record<string, string> = {
  Seg: "segunda",
  Ter: "terca",
  Qua: "quarta",
  Qui: "quinta",
  Sex: "sexta",
  Sáb: "sabado",
};

// Helper para traduzir erros em inglês/rede para português
function obterMensagemErro(e: any): string {
  if (!e) return "Erro desconhecido.";
  const msg = e.message || String(e);
  if (msg.includes("Failed to fetch") || msg.includes("fetch")) {
    return "Não foi possível conectar ao servidor. Verifique se o backend está rodando.";
  }
  return msg;
}

// ====================== CARREGAR TURMAS ======================
async function carregarTurmas() {
  carregando.value = true;
  erro.value = "";
  try {
    turmas.value = await listarTurmas();
  } catch (e: any) {
    erro.value = obterMensagemErro(e);
    turmas.value = [];
  } finally {
    carregando.value = false;
  }
}

const turmasSelectItems = computed(() =>
  turmas.value.map((t) => ({
    title: `${t.label} — ${t.areas?.join(", ") || "Sem área"}`,
    value: t.idTurma,
  }))
);

const idTurmaSelecionada = ref<number | null>(null);

watch(idTurmaSelecionada, (id) => {
  turmaSelecionada.value = turmas.value.find((t) => t.idTurma === id) || null;
  slotSelecionado.value = null;
  professoresElegiveis.value = [];
});

// ====================== CLICK NO SLOT DA GRADE ======================
function selecionarSlot(
  diaCurto: string,
  periodo: string,
  aula: any
) {
  const diaValue = MAPA_DIA_CURTO_REVERSO[diaCurto];
  const diaObj = diasSemana.find((d) => d.value === diaValue);

  slotSelecionado.value = {
    diaSemana: diaValue || diaCurto,
    diaLabel: diaObj?.full || diaCurto,
    periodo,
    disciplina: aula.disciplina,
    idUC: aula.idUC || null,
    professor: aula.professor || "A definir",
    idProfessor: aula.idProfessor || null,
  };

  buscarProfessores();
}

async function buscarProfessores() {
  if (!turmaSelecionada.value || !slotSelecionado.value) return;

  carregandoProfessores.value = true;
  erroProfessores.value = "";

  try {
    // Se não tiver idUC no slotSelecionado, resolve pelo nome (fallback)
    if (!slotSelecionado.value.idUC) {
      const areaId = turmaSelecionada.value.idArea;
      if (areaId) {
        const response = await fetch(
          `http://localhost:3001/api/competencias/area/${areaId}`
        );
        const ucs = await response.json();
        const ucEncontrada = ucs.find(
          (uc: any) => uc.nome === slotSelecionado.value?.disciplina
        );
        if (ucEncontrada) {
          slotSelecionado.value.idUC = ucEncontrada.idUC;
        }
      }
    }

    if (!slotSelecionado.value.idUC) {
      erroProfessores.value =
        "Não foi possível identificar a Unidade Curricular";
      professoresElegiveis.value = [];
      return;
    }

    professoresElegiveis.value = await buscarProfessoresElegiveis(
      turmaSelecionada.value.idTurma,
      slotSelecionado.value.idUC,
      slotSelecionado.value.diaSemana,
      slotSelecionado.value.periodo
    );
  } catch (e: any) {
    erroProfessores.value = obterMensagemErro(e);
    professoresElegiveis.value = [];
  } finally {
    carregandoProfessores.value = false;
  }
}

// ====================== DESIGNAR PROFESSOR ======================
function confirmarDesignacao(professor: any) {
  professorSelecionado.value = professor;
  showConfirmDialog.value = true;
}

async function executarDesignacao() {
  if (!turmaSelecionada.value || !professorSelecionado.value || !slotSelecionado.value || !slotSelecionado.value.idUC) return;

  operacaoEmAndamento.value = true;
  try {
    await alocarProfessor(
      turmaSelecionada.value.idTurma,
      professorSelecionado.value.idProfessor,
      slotSelecionado.value.idUC,
      slotSelecionado.value.diaSemana,
      slotSelecionado.value.periodo
    );
    showConfirmDialog.value = false;
    showSuccessDialog.value = true;

    // Recarregar dados
    await carregarTurmas();
    turmaSelecionada.value =
      turmas.value.find(
        (t) => t.idTurma === turmaSelecionada.value?.idTurma
      ) || null;

    // Atualizar slotSelecionado com as novas informações após alocar
    const perObj = turmaSelecionada.value?.grade?.find((g: any) => g.periodo === slotSelecionado.value?.periodo);
    const diaCurto = diasSemana.find(d => d.value === slotSelecionado.value?.diaSemana)?.label || '';
    const aula = perObj?.aulas?.[diaCurto];
    if (aula) {
      slotSelecionado.value.professor = aula.professor;
      slotSelecionado.value.idProfessor = aula.idProfessor;
    }

    await buscarProfessores();
  } catch (e: any) {
    alert(obterMensagemErro(e));
  } finally {
    operacaoEmAndamento.value = false;
  }
}

// ====================== REMOVER PROFESSOR (TOTAL E SLOT) ======================
function confirmarRemocao(professor: any) {
  professorParaRemover.value = professor;
  showRemoveDialog.value = true;
}

async function executarRemocao() {
  if (!turmaSelecionada.value || !professorParaRemover.value) return;

  operacaoEmAndamento.value = true;
  try {
    // Remove do professor de toda a turma
    await desalocarProfessor(
      turmaSelecionada.value.idTurma,
      professorParaRemover.value.idProfessor || 0
    );
    showRemoveDialog.value = false;

    await carregarTurmas();
    turmaSelecionada.value =
      turmas.value.find(
        (t) => t.idTurma === turmaSelecionada.value?.idTurma
      ) || null;

    slotSelecionado.value = null;
    professoresElegiveis.value = [];
  } catch (e: any) {
    alert(obterMensagemErro(e));
  } finally {
    operacaoEmAndamento.value = false;
  }
}

async function desalocarDoSlotAtual() {
  if (!turmaSelecionada.value || !slotSelecionado.value || !slotSelecionado.value.idProfessor) return;

  operacaoEmAndamento.value = true;
  try {
    await desalocarProfessor(
      turmaSelecionada.value.idTurma,
      slotSelecionado.value.idProfessor,
      slotSelecionado.value.idUC || undefined,
      slotSelecionado.value.diaSemana,
      slotSelecionado.value.periodo
    );

    // Recarregar dados
    await carregarTurmas();
    turmaSelecionada.value =
      turmas.value.find(
        (t) => t.idTurma === turmaSelecionada.value?.idTurma
      ) || null;

    // Atualizar slotSelecionado com as novas informações após desalocar
    const perObj = turmaSelecionada.value?.grade?.find((g: any) => g.periodo === slotSelecionado.value?.periodo);
    const diaCurto = diasSemana.find(d => d.value === slotSelecionado.value?.diaSemana)?.label || '';
    const aula = perObj?.aulas?.[diaCurto];
    if (aula) {
      slotSelecionado.value.professor = aula.professor;
      slotSelecionado.value.idProfessor = aula.idProfessor;
    } else {
      slotSelecionado.value = null;
    }

    await buscarProfessores();
  } catch (e: any) {
    alert(obterMensagemErro(e));
  } finally {
    operacaoEmAndamento.value = false;
  }
}


// ====================== HELPERS ======================
function getOcupacaoColor(ocupacao: number) {
  if (ocupacao < 40) return "green";
  if (ocupacao < 60) return "lime";
  if (ocupacao < 80) return "orange";
  return "red";
}

function getCompetenciaStars(nivel: number) {
  const total = 5;
  const stars = Math.round((nivel / 100) * total);
  return { filled: stars, empty: total - stars };
}

const periodoDescricoes: Record<string, string> = {
  M01: "Manhã - Antes do intervalo",
  M02: "Manhã - Depois do intervalo",
  T01: "Tarde - Antes do intervalo",
  T02: "Tarde - Depois do intervalo",
  N01: "Noite - Antes do intervalo",
  N02: "Noite - Depois do intervalo",
  Manhã: "Período da Manhã",
  Tarde: "Período da Tarde",
  Noite: "Período da Noite",
  INT: "Período Integral",
};

onMounted(() => {
  carregarTurmas();
});
</script>

<template>
  <div>
    <div class="px-4 md:px-10 lg:px-20 xl:px-40 pb-10">
    <!-- Título e seleção de turma -->
    <div class="mt-8 mb-6">
      <div class="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
        <div class="bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
          <v-icon icon="mdi-account-group" size="28"></v-icon>
        </div>
        <div>
          <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Gestão de Professores</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Selecione uma turma e clique em um slot da grade para buscar e designar professores.
          </p>
        </div>
      </div>

      <v-select
        v-model="idTurmaSelecionada"
        :items="turmasSelectItems"
        placeholder="Selecione uma turma..."
        persistent-placeholder
        variant="outlined"
        density="comfortable"
        hide-details
        class="max-w-[500px]"
        :loading="carregando"
      ></v-select>
    </div>

    <!-- Erro ao carregar turmas -->
    <v-fade-transition>
      <v-alert
        v-if="erro"
        type="warning"
        variant="tonal"
        closable
        icon="mdi-alert-circle-outline"
        class="mb-6 rounded-xl border-s-4"
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
            @click="carregarTurmas"
          >
            Tentar novamente
          </v-btn>
        </div>
      </v-alert>
    </v-fade-transition>

    <!-- Conteúdo quando turma selecionada -->
    <div v-if="turmaSelecionada" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- COLUNA ESQUERDA: Grade + Info da turma -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Info da turma -->
        <v-card
          class="rounded-xl border-t-4"
          :class="{
            'border-green-500': turmaSelecionada.modalidade === 'cai',
            'border-blue-500': turmaSelecionada.modalidade === 'fic',
            'border-orange-500': turmaSelecionada.modalidade === 'tec',
          }"
        >
          <v-card-text class="pa-5">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-xl font-bold">{{ turmaSelecionada.label }}</h2>
                <p class="text-sm text-gray-500">
                  {{ turmaSelecionada.areas?.join(", ") }} •
                  {{ turmaSelecionada.dataInicio }} -
                  {{ turmaSelecionada.dataTermino }}
                </p>
              </div>
              <v-chip
                :color="
                  turmaSelecionada.modalidade === 'tec'
                    ? 'orange'
                    : turmaSelecionada.modalidade === 'cai'
                    ? 'green'
                    : 'blue'
                "
                variant="tonal"
                class="font-bold uppercase"
              >
                {{ turmaSelecionada.modalidade }}
              </v-chip>
            </div>

            <!-- Professores vinculados -->
            <div>
              <p class="text-xs font-bold text-gray-400 uppercase mb-2">
                Professores Vinculados
              </p>
              <div
                v-if="turmaSelecionada.professores?.length"
                class="flex flex-wrap gap-2"
              >
                <v-chip
                  v-for="(prof, idx) in turmaSelecionada.professores"
                  :key="idx"
                  size="small"
                  color="red"
                  variant="tonal"
                  closable
                  @click:close="
                    confirmarRemocao({
                      nome: prof.nome,
                      idProfessor: prof.idProfessor,
                    })
                  "
                >
                  <v-avatar start :image="prof.foto" size="24"></v-avatar>
                  {{ prof.nome }}
                </v-chip>
              </div>
              <p v-else class="text-sm text-gray-400 italic">
                Nenhum professor vinculado
              </p>
            </div>
          </v-card-text>
        </v-card>

        <!-- Grade Semanal Interativa -->
        <v-card class="rounded-xl">
          <v-card-text class="pa-5">
            <div class="flex items-center gap-2 mb-4">
              <v-icon color="red" size="20">mdi-calendar-clock</v-icon>
              <h3 class="text-lg font-bold">Grade Semanal</h3>
              <v-spacer></v-spacer>
              <p class="text-xs text-gray-400">
                Clique em um slot para buscar professores
              </p>
            </div>

            <div
              class="overflow-x-auto border rounded-xl"
              :class="{
                'border-green-200': turmaSelecionada.modalidade === 'cai',
                'border-blue-200': turmaSelecionada.modalidade === 'fic',
                'border-orange-200': turmaSelecionada.modalidade === 'tec',
              }"
            >
              <table class="w-full border-collapse">
                <thead>
                  <tr
                    :class="{
                      'bg-green-50': turmaSelecionada.modalidade === 'cai',
                      'bg-blue-50': turmaSelecionada.modalidade === 'fic',
                      'bg-orange-50': turmaSelecionada.modalidade === 'tec',
                    }"
                  >
                    <th
                      class="p-3 border-r border-b w-20 text-center text-xs font-bold text-gray-500"
                    >
                      Horário
                    </th>
                    <th
                      v-for="dia in ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']"
                      :key="dia"
                      class="p-3 border-b text-center text-xs font-bold uppercase"
                      :class="{
                        'text-green-700':
                          turmaSelecionada.modalidade === 'cai',
                        'text-blue-700': turmaSelecionada.modalidade === 'fic',
                        'text-orange-700':
                          turmaSelecionada.modalidade === 'tec',
                      }"
                    >
                      {{ dia }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(slot, idx) in turmaSelecionada.grade"
                    :key="slot.periodo"
                    :class="{
                      'border-b': Number(idx) < turmaSelecionada.grade.length - 1,
                    }"
                  >
                    <td
                      class="p-2 border-r text-xs font-bold text-gray-400 text-center"
                    >
                      <v-tooltip :text="periodoDescricoes[slot.periodo] || slot.periodo" location="start">
                        <template v-slot:activator="{ props }">
                          <span v-bind="props" class="cursor-help">{{ slot.periodo }}</span>
                        </template>
                      </v-tooltip>
                    </td>
                    <td
                      v-for="dia in [
                        'Seg',
                        'Ter',
                        'Qua',
                        'Qui',
                        'Sex',
                        'Sáb',
                      ]"
                      :key="dia"
                      class="p-1.5"
                    >
                      <div
                        v-if="slot.aulas?.[dia]"
                        class="p-2.5 rounded-lg text-center cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-md border-2"
                        :class="[
                          slotSelecionado?.diaSemana ===
                            MAPA_DIA_CURTO_REVERSO[dia] &&
                          slotSelecionado?.periodo === slot.periodo
                            ? 'border-red-500 shadow-lg ring-2 ring-red-200'
                            : 'border-transparent',
                          turmaSelecionada.modalidade === 'cai'
                            ? 'bg-green-100 text-green-900 hover:bg-green-200'
                            : turmaSelecionada.modalidade === 'fic'
                            ? 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                            : 'bg-orange-100 text-orange-900 hover:bg-orange-200',
                        ]"
                        @click="
                          selecionarSlot(dia, slot.periodo, slot.aulas[dia])
                        "
                      >
                        <p class="text-[11px] font-bold leading-tight">
                          {{ slot.aulas[dia].disciplina }}
                        </p>
                        <p class="text-[9px] opacity-60 mt-0.5">
                          {{ slot.aulas[dia].professor }}
                        </p>
                      </div>
                      <div
                        v-else
                        class="h-14 rounded-lg border-2 border-dashed border-gray-100"
                      ></div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- COLUNA DIREITA: Professores Elegíveis -->
      <div>
        <v-card class="rounded-xl sticky top-4">
          <v-card-text class="pa-5">
            <!-- Sem slot selecionado -->
            <div
              v-if="!slotSelecionado"
              class="flex flex-col items-center justify-center text-center py-12"
            >
              <v-avatar color="grey-lighten-3" size="64" class="mb-4">
                <v-icon size="32" color="grey">mdi-cursor-default-click</v-icon>
              </v-avatar>
              <h3 class="text-lg font-bold text-gray-600 mb-1">
                Selecione um Slot
              </h3>
              <p class="text-sm text-gray-400 max-w-[250px]">
                Clique em uma célula da grade semanal para visualizar os
                professores disponíveis
              </p>
            </div>

            <!-- Slot selecionado — mostrar candidatos -->
            <div v-else>
              <div class="mb-4">
                <div
                  class="flex items-center gap-2 mb-3 bg-red-50 dark:bg-red-900/20 rounded-lg p-3"
                >
                  <v-icon color="red" size="20">mdi-target</v-icon>
                  <div>
                    <p class="text-xs font-bold text-red-600 uppercase">
                      Buscando para:
                    </p>
                    <p class="text-sm font-bold">
                      {{ slotSelecionado.disciplina }}
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ slotSelecionado.diaLabel }} •
                      {{ slotSelecionado.periodo }}
                    </p>
                  </div>
                </div>

                <!-- Professor atualmente designado para o slot -->
                <div v-if="slotSelecionado.professor && slotSelecionado.professor !== 'A definir'" class="mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-xs font-bold text-gray-400 uppercase">Professor Designado:</p>
                      <p class="text-sm font-bold text-gray-800 dark:text-gray-200">
                        {{ slotSelecionado.professor }}
                      </p>
                    </div>
                    <v-btn
                      color="orange"
                      variant="text"
                      size="small"
                      density="compact"
                      class="font-bold text-xs"
                      :loading="operacaoEmAndamento"
                      @click="desalocarDoSlotAtual"
                    >
                      <v-icon start size="14">mdi-account-minus-outline</v-icon>
                      Desalocar
                    </v-btn>
                  </div>
                </div>
              </div>

              <!-- Loading -->
              <div
                v-if="carregandoProfessores"
                class="flex flex-col items-center py-8"
              >
                <v-progress-circular
                  indeterminate
                  color="red"
                  size="40"
                ></v-progress-circular>
                <p class="text-sm text-gray-500 mt-3">Buscando candidatos...</p>
              </div>

              <!-- Erro -->
              <v-fade-transition v-else-if="erroProfessores">
                <v-alert
                  type="warning"
                  variant="tonal"
                  closable
                  icon="mdi-alert-circle-outline"
                  class="mb-4 rounded-xl border-s-4"
                  density="comfortable"
                  @click:close="erroProfessores = ''"
                >
                  <div class="d-flex flex-col gap-2">
                    <div>
                      <span class="font-bold block text-sm">Ops! Ocorreu um contratempo</span>
                      <span class="text-xs">{{ erroProfessores }}</span>
                    </div>
                    <div>
                      <v-btn
                        size="small"
                        color="warning"
                        variant="elevated"
                        class="rounded-lg font-bold text-xs"
                        prepend-icon="mdi-refresh"
                        @click="buscarProfessores"
                      >
                        Tentar novamente
                      </v-btn>
                    </div>
                  </div>
                </v-alert>
              </v-fade-transition>

              <!-- Lista de professores elegíveis -->
              <div v-else-if="professoresElegiveis.length > 0">
                <p class="text-xs font-bold text-gray-400 uppercase mb-3">
                  {{ professoresElegiveis.length }} professor(es) elegível(is)
                </p>

                <div
                  class="space-y-3 max-h-[500px] overflow-y-auto pr-1 scroll-custom"
                >
                  <v-card
                    v-for="prof in professoresElegiveis"
                    :key="prof.idProfessor"
                    variant="outlined"
                    class="rounded-xl hover:shadow-md transition-all duration-200"
                  >
                    <v-card-text class="pa-4">
                      <div class="flex items-start gap-3">
                        <v-avatar color="red-lighten-4" size="44">
                          <v-icon color="red">mdi-account</v-icon>
                        </v-avatar>
                        <div class="flex-1 min-w-0">
                          <p class="font-bold text-sm truncate">
                            {{ prof.nome }}
                          </p>
                          <p class="text-xs text-gray-500 truncate">
                            {{
                              prof.areas?.map((a: any) => a.nome).join(", ") ||
                              "Sem área"
                            }}
                          </p>

                          <!-- Competência (estrelas) -->
                          <div class="flex items-center gap-1 mt-1.5">
                            <span class="text-[10px] text-gray-400 mr-1"
                              >Competência:</span
                            >
                            <v-icon
                              v-for="i in getCompetenciaStars(
                                prof.nivelCompetencia
                              ).filled"
                              :key="'f' + i"
                              size="14"
                              color="amber"
                              >mdi-star</v-icon
                            >
                            <v-icon
                              v-for="i in getCompetenciaStars(
                                prof.nivelCompetencia
                              ).empty"
                              :key="'e' + i"
                              size="14"
                              color="grey-lighten-2"
                              >mdi-star</v-icon
                            >
                            <span class="text-[10px] font-bold ml-1"
                              >{{ prof.nivelCompetencia }}%</span
                            >
                          </div>

                          <!-- Ocupação (barra) -->
                          <div class="mt-2">
                            <div class="flex justify-between mb-0.5">
                              <span class="text-[10px] text-gray-400"
                                >Ocupação</span
                              >
                              <span class="text-[10px] font-bold"
                                >{{ prof.ocupacao }}%</span
                              >
                            </div>
                            <v-progress-linear
                              :model-value="prof.ocupacao"
                              :color="getOcupacaoColor(prof.ocupacao)"
                              height="6"
                              rounded
                            ></v-progress-linear>
                          </div>
                        </div>
                      </div>

                      <v-btn
                        block
                        color="red"
                        variant="tonal"
                        size="small"
                        class="mt-3 font-bold"
                        @click="confirmarDesignacao(prof)"
                      >
                        <v-icon start size="16">mdi-account-plus</v-icon>
                        Designar
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </div>
              </div>

              <!-- Nenhum professor elegível -->
              <div
                v-else
                class="flex flex-col items-center justify-center py-8 text-center"
              >
                <v-avatar color="orange-lighten-4" size="56" class="mb-3">
                  <v-icon size="28" color="orange">mdi-account-off</v-icon>
                </v-avatar>
                <h4 class="font-bold text-gray-600 mb-1">
                  Nenhum professor elegível
                </h4>
                <p class="text-xs text-gray-400 max-w-[220px]">
                  Não há professores que atendam todos os requisitos para este
                  slot (UC, disponibilidade, ocupação e horário livre)
                </p>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Estado vazio -->
    <div
      v-else-if="!carregando"
      class="flex flex-col items-center justify-center text-center py-20"
    >
      <v-avatar color="grey-lighten-3" size="80" class="mb-4">
        <v-icon size="40" color="grey">mdi-school-outline</v-icon>
      </v-avatar>
      <h2 class="text-xl font-bold text-gray-600 mb-2">
        Selecione uma Turma
      </h2>
      <p class="text-sm text-gray-400 max-w-[350px]">
        Escolha uma turma no seletor acima para visualizar a grade e gerenciar a
        alocação de professores
      </p>
    </div>
  </div>

  <!-- Dialog: Confirmar Designação -->
  <v-dialog v-model="showConfirmDialog" max-width="420">
    <v-card class="rounded-xl pa-2">
      <v-card-text class="text-center pt-6">
        <v-avatar color="red-lighten-4" size="56" class="mb-4">
          <v-icon size="28" color="red">mdi-account-plus</v-icon>
        </v-avatar>
        <h3 class="text-lg font-bold mb-2">Confirmar Designação</h3>
        <p class="text-sm text-gray-600 mb-4">
          Deseja designar
          <strong>{{ professorSelecionado?.nome }}</strong> para a turma
          <strong>{{ turmaSelecionada?.label }}</strong
          >?
        </p>
        <div
          class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm text-left mb-2"
        >
          <p>
            <strong>UC:</strong> {{ slotSelecionado?.disciplina }}
          </p>
          <p>
            <strong>Dia:</strong> {{ slotSelecionado?.diaLabel }}
          </p>
          <p>
            <strong>Período:</strong> {{ slotSelecionado?.periodo }}
          </p>
        </div>
      </v-card-text>
      <v-card-actions class="justify-center pb-4 gap-2">
        <v-btn
          variant="elevated"
          class="rounded-lg px-6"
          @click="showConfirmDialog = false"
          >Cancelar</v-btn
        >
        <v-btn
          color="red"
          variant="elevated"
          class="rounded-lg px-6 text-white bg-red-600"
          :loading="operacaoEmAndamento"
          @click="executarDesignacao"
          >Confirmar</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog: Sucesso -->
  <v-dialog v-model="showSuccessDialog" max-width="400">
    <v-card class="rounded-xl pa-2">
      <v-card-text class="text-center pt-6 pb-4">
        <v-avatar color="green-lighten-4" size="56" class="mb-4">
          <v-icon size="28" color="green">mdi-check-circle</v-icon>
        </v-avatar>
        <h3 class="text-lg font-bold mb-2">Professor Designado!</h3>
        <p class="text-sm text-gray-600">
          <strong>{{ professorSelecionado?.nome }}</strong> foi adicionado à
          turma <strong>{{ turmaSelecionada?.label }}</strong> com sucesso.
        </p>
      </v-card-text>
      <v-card-actions class="justify-center pb-4">
        <v-btn
          color="green"
          variant="tonal"
          class="rounded-lg px-8 font-bold"
          @click="showSuccessDialog = false"
          >Fechar</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog: Remover Professor -->
  <v-dialog v-model="showRemoveDialog" max-width="450">
    <v-card class="rounded-xl overflow-hidden shadow-2xl">
      <v-card-title class="bg-red-600 text-white font-bold px-6 py-4 text-xl">
        Confirmar Remoção
      </v-card-title>
      <v-card-text class="pa-8 text-center text-lg font-medium leading-relaxed text-gray-700">
        Tem certeza de que deseja remover <b>{{ professorParaRemover?.nome }}</b> da turma <b>{{ turmaSelecionada?.label }}</b>?
      </v-card-text>
      <v-card-actions class="pa-6 pt-0 flex justify-end gap-3">
        <v-btn variant="text" color="grey-darken-1" class="font-bold px-6 uppercase tracking-wide" @click="showRemoveDialog = false">Cancelar</v-btn>
        <v-btn variant="elevated" color="white" class="text-gray-800 font-bold px-8 shadow-sm border uppercase tracking-wide" :loading="operacaoEmAndamento" @click="executarRemocao">Excluir</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  </div>
</template>

<style scoped>
.scroll-custom::-webkit-scrollbar {
  width: 4px;
}
.scroll-custom::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 4px;
}
.scroll-custom::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}
</style>
