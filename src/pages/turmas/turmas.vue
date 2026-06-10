<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import ModalEditarTurma from "@/components/ModalEditarTurma.vue";
import { listarTurmas, excluirTurma, editarTurma, atualizarDescricaoTurma, listarAreas, getUsuarioLogado } from "@/services/api";

const usuarioLogado = getUsuarioLogado();

const carregando = ref(true);
const erro = ref("");

const selectedArea = ref("Todas");
const search = ref("");
const areasDisponiveis = ref([]);

const modalidadeLabels = {
    tec: "Técnico",
    cai: "Aprendizagem Industrial (CAI)",
    fic: "Formação Inicial e Continuada (FIC)"
};

function formatarLabel(label) {
    if (!label) return { nome: "", sufixo: "" };
    const parts = label.split("-");
    if (parts.length > 1) {
        return {
            nome: parts.slice(0, -1).join("-").trim(),
            sufixo: parts[parts.length - 1].trim()
        };
    }
    return { nome: label, sufixo: "" };
}

const diasSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Dialog para visão panorâmica do cronograma
const dialogGrade = ref(false);
const turmaSelecionada = ref(null);

function abrirGrade(turma) {
    turmaSelecionada.value = turma;
    dialogGrade.value = true;
}

const editModal = ref(false);
const salvando = ref(false);
const turmaParaEditar = ref(null);

function abrirEdicao(turma) {
    turmaParaEditar.value = JSON.parse(JSON.stringify(turma)); // Deep clone simple object
    editModal.value = true;
}

// ====================== SNACKBAR STATE ======================
const snackbar = ref({
  show: false,
  text: "",
  color: "success",
  icon: "mdi-check-circle",
  timeout: 4000
});

function showAlert(text, color = "success", icon = "mdi-check-circle") {
  snackbar.value = {
    show: true,
    text,
    color,
    icon,
    timeout: 4000
  };
}

// ====================== DIALOG STATE ======================
const confirmDialog = ref({
  show: false,
  item: "",
  onConfirm: () => {}
});

function abrirConfirmacaoExclusao(turma) {
  confirmDialog.value = {
    show: true,
    item: `a turma "${turma.label}"`,
    onConfirm: () => executarExclusaoTurma(turma.idTurma)
  };
}

async function executarExclusaoTurma(idTurma) {
    try {
        await excluirTurma(idTurma);
        showAlert("Turma excluída com sucesso!", "success");
        await carregarTurmas();
    } catch (e) {
        showAlert(formatarErro(e.message) || "Erro ao excluir turma", "error", "mdi-alert-circle");
    }
}

async function salvarTurma(form) {
    if (!turmaParaEditar.value?.idTurma) {
        editModal.value = false;
        return;
    }
    salvando.value = true;
    try {
        const result = await editarTurma(turmaParaEditar.value.idTurma, {
            nome: form.label,
            tipoCurso: form.modalidade,
            dataInicio: form.dataInicio,
            dataTermino: form.dataFim,
            horarios: form.horarios,
            idOPP: form.idOPP,
            idArea: form.idArea,
        });
        
        // Atualiza a turma localmente na lista sem precisar fazer um fetch pesado de todas as turmas
        const index = turmas.value.findIndex(t => t.idTurma === result.idTurma);
        if (index !== -1) {
            turmas.value[index] = result;
        } else {
            await carregarTurmas();
        }

        editModal.value = false;
        showAlert("Turma salva com sucesso!");
    } catch (e) {
        showAlert(formatarErro(e.message) || "Erro ao salvar turma", "error", "mdi-alert-circle");
    } finally {
        salvando.value = false;
    }
}

const turmas = ref([]);

async function carregarTurmas() {
    carregando.value = true;
    erro.value = "";
    try {
        turmas.value = await listarTurmas();
    } catch (e) {
        erro.value = e.message || "Erro ao carregar turmas";
        turmas.value = [];
    } finally {
        carregando.value = false;
    }
}

function formatarErro(mensagem) {
    if (!mensagem) return "";
    const msgLower = mensagem.toLowerCase();
    
    if (msgLower.includes("failed to fetch") || msgLower.includes("network error") || msgLower.includes("connect")) {
        return "Não foi possível conectar ao servidor. Verifique se o backend está ativo e tente novamente.";
    }
    if (msgLower.includes("siglas is not defined") || msgLower.includes("is not defined") || msgLower.includes("referenceerror")) {
        return "Erro interno no servidor: dados de sigla ou período não foram processados corretamente.";
    }
    if (msgLower.includes("token") || msgLower.includes("não autorizado") || msgLower.includes("unauthorized") || msgLower.includes("acesso negado")) {
        return "Sua sessão expirou ou você não tem permissão para acessar esta página. Por favor, faça login novamente.";
    }
    
    return mensagem;
}

let wsListener = null;
onMounted(async () => {
    carregarTurmas();
    try {
        areasDisponiveis.value = await listarAreas();
    } catch (e) {
        console.error('Erro ao carregar áreas:', e);
    }

    wsListener = (event) => {
        const detail = event.detail;
        if (detail.entity === 'turmas' || detail.entity === 'areas') {
            console.log("🔄 Recarregando turmas em tempo real...");
            carregarTurmas();
        }
    };
    window.addEventListener('websocket-data-updated', wsListener);
});

onBeforeUnmount(() => {
    if (wsListener) {
        window.removeEventListener('websocket-data-updated', wsListener);
    }
});

const periodoDescricoes = {
    'M01': 'Manhã - Antes do intervalo',
    'M02': 'Manhã - Depois do intervalo',
    'T01': 'Tarde - Antes do intervalo',
    'T02': 'Tarde - Depois do intervalo',
    'N01': 'Noite - Antes do intervalo',
    'N02': 'Noite - Depois do intervalo',
    'Manhã': 'Período da Manhã',
    'Tarde': 'Período da Tarde',
    'Noite': 'Período da Noite',
    'INT': 'Período Integral',
    'Integral': 'Período Integral'
};

const filteredTurmas = computed(() => {
    return turmas.value.filter(turma => {
        // Filtro por área selecionada
        let matchesArea = false;
        if (selectedArea.value === "Todas") {
            if (usuarioLogado?.funcao === 'opp') {
                // Para OPP, exibe as turmas que possuem alguma das suas áreas associadas
                matchesArea = turma.areas.some(a => areasDisponiveis.value.some(ad => ad.nome === a));
            } else {
                matchesArea = true;
            }
        } else {
            matchesArea = turma.areas.some(a => a === selectedArea.value);
        }

        // Filtro por texto de busca
        const term = search.value.trim().toLowerCase();
        if (term === "") return matchesArea;

        const matchesLabel = turma.label.toLowerCase().includes(term);
        const matchesSigla = turma.siglas.toLowerCase().includes(term);
        
        const modLabel = modalidadeLabels[turma.modalidade] || "";
        const matchesModalidade = turma.modalidade.toLowerCase().includes(term) || 
                                 modLabel.toLowerCase().includes(term);

        const matchesAreasSearch = turma.areas.some(area => area.toLowerCase().includes(term));

        return matchesArea && (matchesLabel || matchesSigla || matchesModalidade || matchesAreasSearch);
    });
});





// ====================== AUTO-SAVE DESCRIÇÃO ======================
const descricaoTimers = ref({});

function salvarDescricao(turma) {
  // Limpa o timer anterior para esta turma (debounce)
  if (descricaoTimers.value[turma.idTurma]) {
    clearTimeout(descricaoTimers.value[turma.idTurma]);
  }
  // Salva automaticamente após 800ms de inatividade
  descricaoTimers.value[turma.idTurma] = setTimeout(async () => {
    try {
      await atualizarDescricaoTurma(turma.idTurma, turma.descricao || '');
      showAlert("Descrição atualizada com sucesso!", "success", "mdi-check-circle");
    } catch (e) {
      console.error('Erro ao salvar descrição:', e);
      showAlert("Erro ao salvar descrição: " + (formatarErro(e.message) || "Erro desconhecido"), "error", "mdi-alert-circle");
    }
  }, 800);
}

</script>

<template>
  <div>
    <div class="px-4 md:px-10 lg:px-20 xl:px-40 pb-10">
        <!-- Título e Cabeçalho da Página (Fora da Grid para alinhar margens e proporção perfeitamente) -->
        <div class="mt-8 mb-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div class="flex items-center gap-3">
                    <div class="bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
                        <v-icon icon="mdi-school" size="28"></v-icon>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Turmas</h1>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Visualize e gerencie todas as turmas cadastradas no sistema.</p>
                    </div>
                </div>
                <v-text-field label="Buscar" v-model="search" variant="outlined" density="compact" hide-details
                    class="max-w-[200px] w-full self-end md:self-center"></v-text-field>
            </div>

            <!-- Filtro por Área (Dropdown para escalar com muitas áreas) -->
            <div class="flex items-center mt-4 mb-2">
              <v-select
                v-model="selectedArea"
                :items="[{ nome: 'Todas', idArea: null }, ...areasDisponiveis]"
                item-title="nome"
                item-value="nome"
                label="Filtrar por Área"
                variant="outlined"
                density="compact"
                hide-details
                prepend-inner-icon="mdi-shape-outline"
                class="max-w-[300px]"
              ></v-select>
            </div>
            
            <v-fade-transition>
                <v-alert
                    v-if="erro"
                    type="warning"
                    variant="tonal"
                    closable
                    icon="mdi-alert-circle-outline"
                    class="mt-4 rounded-xl border-s-4"
                    density="comfortable"
                    @click:close="erro = ''"
                >
                    <div class="d-flex align-center flex-wrap justify-between gap-3">
                        <div>
                            <span class="font-bold block text-sm">Ops! Ocorreu um contratempo</span>
                            <span class="text-xs">{{ formatarErro(erro) }}</span>
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

            <div v-if="carregando" class="flex items-center gap-2 text-gray-500 text-sm mt-4 animate-pulse">
                <v-progress-circular indeterminate size="18" width="2" color="red"></v-progress-circular>
                <span>Carregando turmas...</span>
            </div>
        </div>

        <!-- Grade de cards ou Estado Vazio -->
        <div v-if="filteredTurmas.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-5">
            <v-card v-for="turma in filteredTurmas" :key="turma.value" class="border-t-6 h-full flex flex-col justify-between"
                :class="{ 'border-green-300': turma.modalidade === 'cai', 'border-blue-300': turma.modalidade === 'fic', 'border-orange-300': turma.modalidade === 'tec' }">
                <div class="flex-grow">
                    <!-- Cabeçalho do Card com fundo sutil da modalidade -->
                    <div class="px-4 pt-2 pb-2">
                        <div class="flex justify-between items-center mb-2">
                            <div class="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                                <span class="text-xl font-black text-gray-800 dark:text-gray-100 tracking-tight leading-none truncate">
                                    {{ formatarLabel(turma.label).nome }}
                                </span>
                            </div>
                            <div class="flex gap-0.5">
                                <v-btn icon="mdi-pencil" variant="text"
                                    @click="abrirEdicao(turma)"
                                    width="35px"
                                    height="35px"
                                    :class="{ 'text-green-700': turma.modalidade === 'cai', 'text-blue-700': turma.modalidade === 'fic', 'text-orange-700': turma.modalidade === 'tec' }"></v-btn>
                                <v-btn icon="mdi-delete" variant="text"
                                    @click="abrirConfirmacaoExclusao(turma)"
                                    width="35px"
                                    height="35px"
                                    :class="{ 'text-green-700': turma.modalidade === 'cai', 'text-blue-700': turma.modalidade === 'fic', 'text-orange-700': turma.modalidade === 'tec' }"></v-btn>
                            </div>
                        </div>
                        <div v-if="turma.areas?.length" class="flex flex-wrap gap-1.5">
                            <div v-for="area in turma.areas" :key="area"
                                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                                :class="{
                                    'bg-green-50 text-green-700 border border-green-200': turma.modalidade === 'cai',
                                    'bg-blue-50 text-blue-700 border border-blue-200': turma.modalidade === 'fic',
                                    'bg-orange-50 text-orange-700 border border-orange-200': turma.modalidade === 'tec'
                                }"
                            >
                                <v-icon icon="mdi-shape-outline" size="14"></v-icon>
                                {{ area }}
                            </div>
                        </div>
                        <p v-else class="text-xs text-gray-400 italic">Sem área vinculada</p>
                    </div>
                    <v-divider :thickness="4" class="my-1 mx-3"></v-divider>
                    <div class="hidden md:flex justify-around gap-2 p-3">

                        <div class="flex items-center gap-2">
                            <v-icon size="32" icon="mdi-book-open-variant"
                                :class="{ 'text-green-600': turma.modalidade === 'cai', 'text-blue-600': turma.modalidade === 'fic', 'text-orange-600': turma.modalidade === 'tec' }"></v-icon>
                            <div class="flex flex-col leading-tight">
                                <span class="text-xs text-gray-500!">Aulas/Semana</span>
                                <span class="text-lg font-bold">{{ turma.aulasSemana ?? 0 }}</span>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <v-icon size="32" icon="mdi-calendar-range"
                                :class="{ 'text-green-600': turma.modalidade === 'cai', 'text-blue-600': turma.modalidade === 'fic', 'text-orange-600': turma.modalidade === 'tec' }"></v-icon>
                            <div class="flex flex-col leading-tight">
                                <span class="text-xs text-gray-500!">Total de aulas</span>
                                <span class="text-lg font-bold">{{ turma.totalAulas ?? 0 }}</span>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <v-icon size="32" icon="mdi-clock-outline"
                                :class="{ 'text-green-600': turma.modalidade === 'cai', 'text-blue-600': turma.modalidade === 'fic', 'text-orange-600': turma.modalidade === 'tec' }"></v-icon>
                            <div class="flex flex-col leading-tight">
                                <span class="text-xs text-gray-500!">Duração</span>
                                <span class="text-lg font-bold">{{ turma.duracaoDias ?? 0 }} dias</span>
                            </div>
                        </div>
                    </div>
                    <v-divider :thickness="4" class="hidden my-1 mx-3  md:flex "></v-divider>
                    <p class="ms-3 text-sm my-2 font-bold ">Professores</p>
                    <div v-if="turma.professores?.length" class="flex flex-wrap gap-3 mx-3 mb-3">
                        <div v-for="(prof, idx) in turma.professores" :key="idx" class="flex items-center gap-2">
                            <v-avatar size="36" class="shadow-sm border border-gray-200 dark:border-gray-700">
                                <v-img v-if="prof.foto && prof.foto !== 'https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png'" :src="prof.foto" alt="Foto de perfil" cover></v-img>
                                <div v-else class="w-full h-full flex items-center justify-center font-black text-white bg-gradient-to-br from-green-600 to-green-500 text-sm uppercase">
                                    {{ prof.nome ? prof.nome.charAt(0).toUpperCase() : "?" }}
                                </div>
                            </v-avatar>
                            <p class="font-bold text-sm">{{ prof.nome }}</p>
                        </div>
                    </div>
                    <p v-else class="mx-3 mb-3 text-sm text-gray-500">Nenhum professor designado</p>
                    <v-divider :thickness="4" class="my-1 mx-3"></v-divider>
                    <p class="ms-3 text-sm my-2 font-bold">Descrição <span class="text-gray-500 font-normal">(Opcional)</span></p>
                    <v-textarea
                      v-model="turma.descricao"
                      variant="solo"
                      density="comfortable"
                      rows="2"
                      auto-grow
                      placeholder="Digite uma descrição para esta turma..."
                      color="primary"
                      hide-details
                      class="mx-3 mt-2 text-xs mb-3 rounded-lg"
                      @update:model-value="salvarDescricao(turma)"
                    ></v-textarea>
                    <v-divider :thickness="4" class="my-1 mx-3"></v-divider>

                    <!-- Grade de Horário Acoplada no Card -->
                    <div v-if="turma.grade" class="mx-3 my-3 cursor-pointer" @click="abrirGrade(turma)">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <v-icon size="16" icon="mdi-calendar-clock"
                                    :class="{ 'text-green-600': turma.modalidade === 'cai', 'text-blue-600': turma.modalidade === 'fic', 'text-orange-600': turma.modalidade === 'tec' }"></v-icon>
                                <p class="text-xs font-bold text-gray-600">Cronograma Semanal</p>
                            </div>
                            <v-icon size="14" icon="mdi-arrow-expand" color="grey"></v-icon>
                        </div>

                        <div class="overflow-x-auto rounded-lg border"
                             :class="{
                                 'border-green-200': turma.modalidade === 'cai',
                                 'border-blue-200': turma.modalidade === 'fic',
                                 'border-orange-200': turma.modalidade === 'tec'
                             }">
                            <table class="w-full border-collapse">
                                <thead>
                                    <tr
                                        :class="{
                                            'bg-green-50': turma.modalidade === 'cai',
                                            'bg-blue-50': turma.modalidade === 'fic',
                                            'bg-orange-50': turma.modalidade === 'tec'
                                        }">
                                        <th class="p-1.5 border-r border-b w-12 text-center"
                                            :class="{
                                                'border-green-200': turma.modalidade === 'cai',
                                                'border-blue-200': turma.modalidade === 'fic',
                                                'border-orange-200': turma.modalidade === 'tec'
                                            }"></th>
                                        <th v-for="dia in diasSemana" :key="dia"
                                            class="p-1.5 border-b text-center text-[10px] font-bold uppercase"
                                            :class="{
                                                'border-green-200 text-green-700': turma.modalidade === 'cai',
                                                'border-blue-200 text-blue-700': turma.modalidade === 'fic',
                                                'border-orange-200 text-orange-700': turma.modalidade === 'tec'
                                            }">
                                            {{ dia }}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(slot, idx) in turma.grade" :key="slot.periodo"
                                        :class="{ 'border-b': idx < turma.grade.length - 1,
                                            'border-green-100': turma.modalidade === 'cai',
                                            'border-blue-100': turma.modalidade === 'fic',
                                            'border-orange-100': turma.modalidade === 'tec'
                                        }">
                                        <td class="p-1.5 border-r text-[8px] font-bold text-gray-400 text-center leading-tight"
                                            :class="{
                                                'border-green-200 bg-green-50/50': turma.modalidade === 'cai',
                                                'border-blue-200 bg-blue-50/50': turma.modalidade === 'fic',
                                                'border-orange-200 bg-orange-50/50': turma.modalidade === 'tec'
                                            }">
                                            {{ slot.periodo }}
                                        </td>
                                        <td v-for="dia in diasSemana" :key="dia" class="p-1">
                                            <div v-if="slot.aulas?.[dia]"
                                                 class="p-1.5 rounded-md text-center"
                                                 :class="{
                                                     'bg-green-100 text-green-800': turma.modalidade === 'cai',
                                                     'bg-blue-100 text-blue-800': turma.modalidade === 'fic',
                                                     'bg-orange-100 text-orange-800': turma.modalidade === 'tec'
                                                 }">
                                                <p class="text-[9px] font-bold leading-tight">{{ slot.aulas[dia].disciplina }}</p>
                                                <p class="text-[7px] opacity-60 mt-0.5">{{ slot.aulas[dia].professor }}</p>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <v-divider :thickness="4" class="my-1 mx-3"></v-divider>
                </div>
                <div class="flex items-center justify-between m-3 p-2 rounded-lg"
                    :class="{ 'bg-green-100': turma.modalidade === 'cai', 'bg-blue-100': turma.modalidade === 'fic', 'bg-orange-100': turma.modalidade === 'tec' }">
                    <div class="flex items-center gap-1">
                        <v-icon icon="mdi-calendar"
                            :class="{ 'text-green-700': turma.modalidade === 'cai', 'text-blue-700': turma.modalidade === 'fic', 'text-orange-700': turma.modalidade === 'tec' }"></v-icon>
                        <p class="p-1 font-bold text-sm"
                            :class="{ 'text-green-700': turma.modalidade === 'cai', 'text-blue-700': turma.modalidade === 'fic', 'text-orange-700': turma.modalidade === 'tec' }">
                            {{ turma.dataInicio }} - {{ turma.dataTermino }}</p>
                    </div>
                    <p class="font-bold p-1 rounded text-sm uppercase px-2"
                        :class="{ 'bg-green-300 text-green-900': turma.modalidade === 'cai', 'bg-blue-300 text-blue-900': turma.modalidade === 'fic', 'bg-orange-300 text-orange-900': turma.modalidade === 'tec' }">
                        {{ turma.modalidade === 'tec' ? 'Téc' : turma.modalidade }}
                    </p>
                </div>
            </v-card>
        </div>

        <!-- Estado Vazio -->
        <div v-else-if="!carregando" class="flex flex-col items-center justify-center text-center py-20 bg-gray-50/50 dark:bg-gray-900/10 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 mt-6">
            <v-avatar color="red-50" size="80" class="mb-4 text-red-600">
                <v-icon size="40">mdi-school-outline</v-icon>
            </v-avatar>
            <h2 class="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                Nenhuma Turma Encontrada
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 max-w-[380px]">
                Não há turmas cadastradas ou nenhuma corresponde ao filtro selecionado.
            </p>
        </div>
    </div>

    <!-- Modal de Edição de Turma -->
    <ModalEditarTurma 
        v-if="editModal"
        v-model="editModal" 
        :turma="turmaParaEditar" 
        :loading="salvando"
        @save="salvarTurma"
    />

    <!-- Dialog de Visão Panorâmica -->
    <v-dialog v-if="dialogGrade" v-model="dialogGrade" max-width="1000" scrollable>
        <v-card v-if="turmaSelecionada" class="rounded-xl">
            <v-card-title class="flex items-center justify-between pa-5"
                :class="{
                    'bg-green-50': turmaSelecionada.modalidade === 'cai',
                    'bg-blue-50': turmaSelecionada.modalidade === 'fic',
                    'bg-orange-50': turmaSelecionada.modalidade === 'tec'
                }">
                <div class="flex items-center gap-3">
                    <v-icon size="28" icon="mdi-calendar-clock"
                        :class="{
                            'text-green-600': turmaSelecionada.modalidade === 'cai',
                            'text-blue-600': turmaSelecionada.modalidade === 'fic',
                            'text-orange-600': turmaSelecionada.modalidade === 'tec'
                        }"></v-icon>
                    <div>
                        <h2 class="text-xl font-bold">{{ turmaSelecionada.label }}</h2>
                        <div class="flex gap-2 items-center">
                            <p class="text-xs text-gray-500">Cronograma Semanal</p>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <v-menu open-on-hover location="bottom end" :offset="5" transition="slide-y-transition">
                        <template v-slot:activator="{ props }">
                            <button v-bind="props" class="flex items-center gap-2 px-4 py-1.5 bg-white border-2 border-t-4 rounded-lg text-gray-800 font-bold text-sm shadow-sm hover:shadow transition-colors"
                                :class="{
                                    'border-green-200 border-t-green-600 hover:bg-green-50': turmaSelecionada.modalidade === 'cai',
                                    'border-blue-200 border-t-blue-600 hover:bg-blue-50': turmaSelecionada.modalidade === 'fic',
                                    'border-orange-200 border-t-orange-600 hover:bg-orange-50': turmaSelecionada.modalidade === 'tec'
                                }">
                                <v-icon icon="mdi-clipboard-list-outline" size="18"></v-icon>
                                Legenda
                            </button>
                        </template>
                        <v-card class="p-4 shadow-2xl rounded-xl border-t-4 bg-white" width="280"
                            :class="{
                                'border-green-600': turmaSelecionada.modalidade === 'cai',
                                'border-blue-600': turmaSelecionada.modalidade === 'fic',
                                'border-orange-600': turmaSelecionada.modalidade === 'tec'
                            }">
                            <div class="flex items-center gap-2 mb-4">
                                <v-icon size="20" icon="mdi-book-open-variant" color="grey-darken-4"></v-icon>
                                <h2 class="text-lg font-black text-grey-darken-4 uppercase tracking-tight">Legenda</h2>
                            </div>

                            <div class="space-y-3">
                                <div>
                                    <p class="font-black text-xs text-gray-400 uppercase mb-1">Manhã</p>
                                    <ul class="list-none space-y-1 ml-1">
                                        <li class="flex items-center gap-2 text-[11px] font-bold text-gray-600">
                                            <span class="text-red-500">•</span> <b>M01</b> &rarr; Antes do intervalo
                                        </li>
                                        <li class="flex items-center gap-2 text-[11px] font-bold text-gray-600">
                                            <span class="text-red-500">•</span> <b>M02</b> &rarr; Depois do intervalo
                                        </li>
                                    </ul>
                                </div>
                                <v-divider></v-divider>
                                <div>
                                    <p class="font-black text-xs text-gray-400 uppercase mb-1">Tarde</p>
                                    <ul class="list-none space-y-1 ml-1">
                                        <li class="flex items-center gap-2 text-[11px] font-bold text-gray-600">
                                            <span class="text-red-500">•</span> <b>T01</b> &rarr; Antes do intervalo
                                        </li>
                                        <li class="flex items-center gap-2 text-[11px] font-bold text-gray-600">
                                            <span class="text-red-500">•</span> <b>T02</b> &rarr; Depois do intervalo
                                        </li>
                                    </ul>
                                </div>
                                <v-divider></v-divider>
                                <div>
                                    <p class="font-black text-xs text-gray-400 uppercase mb-1">Noite</p>
                                    <ul class="list-none space-y-1 ml-1">
                                        <li class="flex items-center gap-2 text-[11px] font-bold text-gray-600">
                                            <span class="text-red-500">•</span> <b>N01</b> &rarr; Antes do intervalo
                                        </li>
                                        <li class="flex items-center gap-2 text-[11px] font-bold text-gray-600">
                                            <span class="text-red-500">•</span> <b>N02</b> &rarr; Depois do intervalo
                                        </li>
                                    </ul>
                                </div>
                                <v-divider></v-divider>
                                <div>
                                    <p class="font-black text-xs text-gray-400 uppercase mb-1">Integral</p>
                                    <ul class="list-none space-y-1 ml-1">
                                        <li class="flex items-center gap-2 text-[11px] font-bold text-gray-600">
                                            <span class="text-red-500">•</span> <b>INT</b> &rarr; Integral
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </v-card>
                    </v-menu>
                    <v-btn icon="mdi-close" variant="text" size="small" @click="dialogGrade = false"></v-btn>
                </div>
            </v-card-title>

            <v-divider></v-divider>

            <v-card-text class="pa-6">
                <!-- Tabela de Cronograma -->
                <div class="overflow-x-auto border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <table class="w-full border-collapse">
                        <thead>
                            <tr
                                :class="{
                                    'bg-green-50': turmaSelecionada.modalidade === 'cai',
                                    'bg-blue-50': turmaSelecionada.modalidade === 'fic',
                                    'bg-orange-50': turmaSelecionada.modalidade === 'tec'
                                }">
                                <th class="p-3 border-b-2 border-r w-20 text-center text-sm font-bold text-gray-500"
                                :class="{
                                    'border-green-200': turmaSelecionada.modalidade === 'cai',
                                    'border-blue-200': turmaSelecionada.modalidade === 'fic',
                                    'border-orange-200': turmaSelecionada.modalidade === 'tec'
                                }">Horário</th>
                            <th v-for="dia in diasSemana" :key="dia"
                                class="p-3 border-b-2 text-center text-sm font-bold uppercase"
                                :class="{
                                    'border-green-200 text-green-700': turmaSelecionada.modalidade === 'cai',
                                    'border-blue-200 text-blue-700': turmaSelecionada.modalidade === 'fic',
                                    'border-orange-200 text-orange-700': turmaSelecionada.modalidade === 'tec'
                                }">
                                {{ dia }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(slot, idx) in turmaSelecionada.grade" :key="slot.periodo"
                            :class="{ 'border-b': idx < turmaSelecionada.grade.length - 1,
                                'border-green-100': turmaSelecionada.modalidade === 'cai',
                                'border-blue-100': turmaSelecionada.modalidade === 'fic',
                                'border-orange-100': turmaSelecionada.modalidade === 'tec'
                            }">
                            <td class="p-3 border-r text-xs font-bold text-gray-400 text-center"
                                :class="{
                                    'border-green-200 bg-green-50/50': turmaSelecionada.modalidade === 'cai',
                                    'border-blue-200 bg-blue-50/50': turmaSelecionada.modalidade === 'fic',
                                    'border-orange-200 bg-orange-50/50': turmaSelecionada.modalidade === 'tec'
                                }">
                                {{ slot.periodo }}
                            </td>
                            <td v-for="dia in diasSemana" :key="dia" class="p-2">
                                <div v-if="slot.aulas?.[dia]"
                                     class="p-3 rounded-lg text-center"
                                     :class="{
                                         'bg-green-100 text-green-900': turmaSelecionada.modalidade === 'cai',
                                         'bg-blue-100 text-blue-900': turmaSelecionada.modalidade === 'fic',
                                         'bg-orange-100 text-orange-900': turmaSelecionada.modalidade === 'tec'
                                     }">
                                    <p class="text-sm font-bold leading-tight">{{ slot.aulas[dia].disciplina }}</p>
                                    <p class="text-xs opacity-60 mt-1">{{ slot.aulas[dia].professor }}</p>
                                </div>
                                <div v-else class="h-16 rounded-lg border-2 border-dashed border-gray-100"></div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>

    <!-- Snackbar de Alertas Premium -->
    <v-snackbar 
      v-model="snackbar.show" 
      :color="snackbar.color" 
      :timeout="snackbar.timeout" 
      location="top right" 
      class="mt-4 mr-4"
      elevation="24"
      rounded="xl"
    >
      <div class="flex items-start gap-4 p-1">
        <v-avatar :color="snackbar.color" size="40" class="elevation-3 flex-shrink-0">
          <v-icon :icon="snackbar.icon" color="white" size="24"></v-icon>
        </v-avatar>
        <div class="flex-grow text-white">
          <p class="text-xs font-black uppercase tracking-widest opacity-70 mb-0.5">Notificação</p>
          <p class="text-[13px] font-bold leading-tight">{{ snackbar.text }}</p>
        </div>
        <v-btn icon="mdi-close" variant="text" color="white" @click="snackbar.show = false" size="small" class="opacity-50 hover:opacity-100 transition-opacity"></v-btn>
      </div>
      
      <template v-slot:text>
        <v-progress-linear
          indeterminate
          absolute
          bottom
          height="3"
          color="white"
          class="rounded-b-xl opacity-30"
        ></v-progress-linear>
      </template>
    </v-snackbar>

    <!-- Dialog de Confirmação Customizado -->
    <v-dialog v-model="confirmDialog.show" max-width="450">
        <v-card class="rounded-xl overflow-hidden shadow-2xl">
            <v-card-title class="bg-red-600 text-white font-bold px-6 py-4 text-xl">
                Confirmar Exclusão
            </v-card-title>
            <v-card-text class="pa-8 text-center text-lg font-medium leading-relaxed text-gray-700">
                Tem certeza de que deseja excluir <b>{{ confirmDialog.item }}</b>? Esta ação não pode ser desfeita.
            </v-card-text>
            <v-card-actions class="pa-6 pt-0 flex justify-end gap-3">
                <v-btn variant="elevated" color="grey-lighten-2" class="font-bold px-6 uppercase tracking-wide text-gray-800" @click="confirmDialog.show = false">Cancelar</v-btn>
                <v-btn variant="elevated" color="red" class="bg-red-600 text-white font-bold px-8 shadow-sm uppercase tracking-wide" 
                    @click="confirmDialog.onConfirm(); confirmDialog.show = false">Excluir</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
  </div>
</template>


<style scoped>
.chip {
    cursor: default;

}
</style>