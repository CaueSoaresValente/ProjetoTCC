<script setup>
// ============================================================
// GerAreasComp.vue — Gerenciamento de Áreas e Competências
// ============================================================
// ANTES: Os dados eram "hardcoded" (escritos direto no código).
// AGORA: Os dados vêm do banco de dados via API.
//
// FLUXO:
// 1. Quando a tela abre, chamamos listarAreas() e listarCompetencias()
// 2. Os dados são carregados do banco e aparecem na tabela
// 3. Quando o usuário clica "Adicionar", chamamos criarArea() ou criarCompetencia()
// 4. Quando edita, chamamos editarArea() ou editarCompetencia()
// 5. Quando exclui, chamamos excluirArea() ou excluirCompetencia()
// ============================================================

import { ref, computed, onMounted, watch } from "vue";

// Importa as funções que falam com o backend
import {
  listarAreas,
  criarArea,
  editarArea,
  excluirArea,
  listarCompetencias,
  criarCompetencia,
  editarCompetencia,
  excluirCompetencia,
  getUsuarioLogado,
  listarOpps,
} from "@/services/api";

// ====================== DADOS DO USUÁRIO LOGADO ======================
const usuarioLogado = getUsuarioLogado();
const isOpp = computed(() => usuarioLogado?.funcao === 'opp');
const todosOpps = ref([]);

// Áreas que o OPP pode usar nos selects de UC
const areasPermitidas = computed(() => {
  if (!isOpp.value) return dadosAreas.value;
  const oppLogado = todosOpps.value.find(o => o.idCadastro === usuarioLogado?.idUsuario);
  if (!oppLogado || !oppLogado.oppAreas) return [];
  const idsPermitidos = oppLogado.oppAreas.map(oa => oa.idArea);
  return dadosAreas.value.filter(a => idsPermitidos.includes(a.idArea));
});

// Filtro de busca por texto (áreas e UCs)
const pesquisa = ref("");
const filtroArea = ref("Todas as Áreas");

const areasExibidasSelect = computed(() => {
  if (!isOpp.value) return dadosAreas.value;
  const oppLogado = todosOpps.value.find(o => o.idCadastro === usuarioLogado?.idUsuario);
  if (!oppLogado || !oppLogado.oppAreas) return [];
  const idsPermitidos = oppLogado.oppAreas.map(oa => oa.idArea);
  return dadosAreas.value.filter(a => idsPermitidos.includes(a.idArea));
});

const areasExibidas = computed(() => {
  let filtradas = [];
  if (!isOpp.value) {
    filtradas = dadosAreas.value;
  } else {
    const oppLogado = todosOpps.value.find(o => o.idCadastro === usuarioLogado?.idUsuario);
    if (!oppLogado || !oppLogado.oppAreas) filtradas = [];
    else {
      const idsPermitidos = oppLogado.oppAreas.map(oa => oa.idArea);
      filtradas = dadosAreas.value.filter(a => idsPermitidos.includes(a.idArea));
    }
  }

  if (pesquisa.value.trim()) {
    const termo = pesquisa.value.toLowerCase().trim();
    filtradas = filtradas.filter(a => a.nome.toLowerCase().includes(termo));
  }
  return filtradas;
});

const competenciasExibidas = computed(() => {
  let filtradas = [];
  if (!isOpp.value) {
    filtradas = dadosCompetencias.value;
  } else {
    const oppLogado = todosOpps.value.find(o => o.idCadastro === usuarioLogado?.idUsuario);
    if (!oppLogado || !oppLogado.oppAreas) filtradas = [];
    else {
      const idsPermitidos = oppLogado.oppAreas.map(oa => oa.idArea);
      filtradas = dadosCompetencias.value.filter(c => idsPermitidos.includes(c.idArea));
    }
  }

  // Filtro de Área
  if (filtroArea.value && filtroArea.value !== "Todas as Áreas") {
    filtradas = filtradas.filter(c => c.area?.nome === filtroArea.value || c.nomeArea === filtroArea.value);
  }

  if (pesquisa.value.trim()) {
    const termo = pesquisa.value.toLowerCase().trim();
    filtradas = filtradas.filter(c => 
      c.nome.toLowerCase().includes(termo) || 
      (c.area?.nome && c.area.nome.toLowerCase().includes(termo))
    );
  }
  return filtradas;
});

// ====================== ESTADO DA TELA ======================

// Controla qual aba está selecionada: "Áreas" ou "Competências"
const tags = ["Áreas", "Unidades Curriculares"];
const selecionado = ref("Áreas");

// Arrays que guardam os dados vindos do banco
const dadosAreas = ref([]);
const dadosCompetencias = ref([]);

// Controla o loading (carregando...)
const loading = ref(false);

// ====================== DIALOGS (MODAIS) ======================

// Modais de Área
const dialogAddArea = ref(false);
const dialogEdit = ref(false);
const dialogDelete = ref(false);

// Modais de Competência
const dialogAdd = ref(false);
const dialogEditCompetencia = ref(false);
const dialogDeleteCompetencia = ref(false);

// ====================== CAMPOS DOS FORMULÁRIOS ======================

// Campos para criar/editar Área
const novaAreaNome = ref("");
const areaEditando = ref(null); // Guarda a área que está sendo editada
const areaEditNome = ref("");
const areaDeletando = ref(null); // Guarda a área que será excluída

// Campos para criar/editar Competência
const areaSelecionada = ref(null);
const novaCompetenciaNome = ref("");
const novaCompetenciaDescricao = ref("");
const competenciaEditando = ref(null);
const competenciaEditNome = ref("");
const competenciaEditDescricao = ref("");
const competenciaEditArea = ref(null);
const competenciaDeletando = ref(null);

// ====================== CARREGAR DADOS DO BANCO ======================
const erro = ref("");

function obterMensagemErro(e) {
  if (!e) return "Erro desconhecido.";
  const msg = e.message || String(e);
  if (msg.includes("Failed to fetch") || msg.includes("fetch")) {
    return "Não foi possível conectar ao servidor. Verifique se o backend está rodando.";
  }
  return msg;
}

// Função que busca todas as áreas do banco
async function carregarAreas() {
  try {
    loading.value = true;
    const areas = await listarAreas();
    // Para cada área, calcula a quantidade de competências
    dadosAreas.value = areas.map((area) => ({
      ...area,
      quantidade: area.unidadesCurriculares ? area.unidadesCurriculares.length : 0,
    }));
  } catch (error) {
    console.error("Erro ao carregar áreas:", error);
    erro.value = obterMensagemErro(error);
  } finally {
    loading.value = false;
  }
}

// Função que busca todas as competências do banco
async function carregarCompetencias() {
  try {
    loading.value = true;
    const competencias = await listarCompetencias();
    dadosCompetencias.value = competencias;
  } catch (error) {
    console.error("Erro ao carregar competências:", error);
    erro.value = obterMensagemErro(error);
  } finally {
    loading.value = false;
  }
}

async function carregarOpps() {
  try {
    const data = await listarOpps();
    todosOpps.value = data;
  } catch (error) {
    console.error("Erro ao carregar OPPs:", error);
  }
}

async function carregarDados() {
  erro.value = "";
  await Promise.all([carregarAreas(), carregarCompetencias(), carregarOpps()]);
}

// ====================== NOTIFICAÇÕES (SNACKBAR) ======================
const snackbar = ref({
  show: false,
  text: "",
  color: "red",
  icon: "mdi-alert-circle",
  timeout: 5000
});

function showAlert(text, color = "red", icon = "mdi-alert-circle") {
  snackbar.value.text = text;
  snackbar.value.color = color;
  snackbar.value.icon = icon;
  snackbar.value.show = true;
}

// ====================== AÇÕES DE ÁREA ======================

// Salvar nova área no banco
async function salvarNovaArea() {
  if (!novaAreaNome.value.trim()) return;
  try {
    await criarArea({ nome: novaAreaNome.value.trim() });
    novaAreaNome.value = "";
    dialogAddArea.value = false;
    showAlert("Área criada com sucesso!", "success", "mdi-check-circle");
    // Recarrega a lista para mostrar a nova área
    await carregarAreas();
  } catch (error) {
    console.error("Erro ao criar área:", error);
    showAlert("Erro ao criar área: " + error.message);
  }
}

// Abre o modal de edição com os dados da área
function abrirEditarArea(area) {
  areaEditando.value = area;
  areaEditNome.value = area.nome;
  dialogEdit.value = true;
}

// Salva a edição da área no banco
async function salvarEditArea() {
  if (!areaEditNome.value.trim() || !areaEditando.value) return;
  try {
    await editarArea(areaEditando.value.idArea, { nome: areaEditNome.value.trim() });
    dialogEdit.value = false;
    showAlert("Área atualizada com sucesso!", "success", "mdi-check-circle");
    await carregarAreas();
    await carregarCompetencias();
  } catch (error) {
    console.error("Erro ao editar área:", error);
    showAlert("Erro ao editar área: " + error.message);
  }
}

// Abre o modal de confirmação de exclusão
function abrirDeletarArea(area) {
  areaDeletando.value = area;
  dialogDelete.value = true;
}

// Exclui a área do banco
async function confirmarDeleteArea() {
  if (!areaDeletando.value) return;
  try {
    await excluirArea(areaDeletando.value.idArea);
    dialogDelete.value = false;
    showAlert("Área excluída com sucesso!", "success", "mdi-check-circle");
    await carregarAreas();
    await carregarCompetencias();
  } catch (error) {
    console.error("Erro ao excluir área:", error);
    showAlert("Erro ao excluir área: " + error.message);
  }
}

// ====================== AÇÕES DE COMPETÊNCIA ======================

// Salvar nova competência no banco
async function salvarNovaCompetencia() {
  if (!novaCompetenciaNome.value.trim() || !areaSelecionada.value) return;
  try {
    await criarCompetencia({
      nome: novaCompetenciaNome.value.trim(),
      descricao: novaCompetenciaDescricao.value.trim(),
      idArea: areaSelecionada.value,
    });
    novaCompetenciaNome.value = "";
    novaCompetenciaDescricao.value = "";
    areaSelecionada.value = null;
    dialogAdd.value = false;
    showAlert("Unidade Curricular criada com sucesso!", "success", "mdi-check-circle");
    await carregarCompetencias();
    await carregarAreas(); // Atualiza a contagem de competências por área
  } catch (error) {
    console.error("Erro ao criar competência:", error);
    showAlert("Erro ao criar competência: " + error.message);
  }
}

// Abre o modal de edição de competência
function abrirEditarCompetencia(comp) {
  competenciaEditando.value = comp;
  competenciaEditNome.value = comp.nome;
  competenciaEditDescricao.value = comp.descricao || "";
  competenciaEditArea.value = comp.idArea;
  dialogEditCompetencia.value = true;
}

// Salva a edição da competência
async function salvarEditCompetencia() {
  if (!competenciaEditNome.value.trim() || !competenciaEditando.value) return;
  try {
    await editarCompetencia(competenciaEditando.value.idUC, {
      nome: competenciaEditNome.value.trim(),
      descricao: competenciaEditDescricao.value.trim(),
      idArea: competenciaEditArea.value,
    });
    dialogEditCompetencia.value = false;
    showAlert("Unidade Curricular atualizada com sucesso!", "success", "mdi-check-circle");
    await carregarCompetencias();
  } catch (error) {
    console.error("Erro ao editar competência:", error);
    showAlert("Erro ao editar competência: " + error.message);
  }
}

// Abre o modal de confirmação de exclusão
function abrirDeletarCompetencia(comp) {
  competenciaDeletando.value = comp;
  dialogDeleteCompetencia.value = true;
}

// Exclui a competência do banco
async function confirmarDeleteCompetencia() {
  if (!competenciaDeletando.value) return;
  try {
    await excluirCompetencia(competenciaDeletando.value.idUC);
    dialogDeleteCompetencia.value = false;
    showAlert("Unidade Curricular excluída com sucesso!", "success", "mdi-check-circle");
    await carregarCompetencias();
    await carregarAreas(); // Atualiza a contagem
  } catch (error) {
    console.error("Erro ao excluir competência:", error);
    showAlert("Erro ao excluir competência: " + error.message);
  }
}

// ====================== LIFECYCLE ======================
// onMounted = "quando a tela abrir, faça isso"
onMounted(async () => {
  await carregarDados();
});

// Limpa os campos quando o modal de adicionar competência abre
watch(dialogAdd, (val) => {
  if (val) {
    areaSelecionada.value = null;
    novaCompetenciaNome.value = "";
    novaCompetenciaDescricao.value = "";
  }
});

// Limpa o campo quando o modal de adicionar área abre
watch(dialogAddArea, (val) => {
  if (val) {
    novaAreaNome.value = "";
  }
});
</script>

<template>
  <div>
    <div class="px-4 md:px-10 lg:px-20 xl:px-40 pb-10">
    <div class="flex items-center gap-3 mt-8 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
      <div class="bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
        <v-icon icon="mdi-book-cog" size="28"></v-icon>
      </div>
      <div>
        <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight break-words">
          Gestão de UCs e Áreas
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure as áreas tecnológicas e suas respectivas Unidades Curriculares.
        </p>
      </div>
    </div>

    <!-- Abas Estilizadas Premium (Áreas, Unidades Curriculares) -->
    <div class="flex items-center mb-6">
      <div class="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl flex gap-1 border border-gray-200 dark:border-gray-700">
        <button
          v-for="tag in tags"
          :key="tag"
          class="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 cursor-pointer select-none"
          :class="selecionado === tag 
            ? 'bg-red-600 text-white scale-[1.01]' 
            : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/30'"
          @click="selecionado = tag"
        >
          <v-icon 
            :icon="tag === 'Áreas' ? 'mdi-folder-open-outline' : 'mdi-book-open-page-variant-outline'" 
            size="18"
            :class="selecionado === tag ? 'text-white' : 'text-gray-400 dark:text-gray-500'"
          ></v-icon>
          {{ tag }}
        </button>
      </div>
    </div>
    <v-card class="border-t-4 border-red-600 px-8 rounded-lg shadow-lg py-8">
      <!-- Erro ao carregar dados -->
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
              @click="carregarDados"
            >
              Tentar novamente
            </v-btn>
          </div>
        </v-alert>
      </v-fade-transition>

      <div v-if="!(isOpp && selecionado === 'Áreas')" class="flex flex-col-reverse sm:flex-row justify-between gap-4 items-center">
        <div class="flex flex-col sm:flex-row gap-3 w-full ">
          <v-text-field
            v-model="pesquisa"
            label="Pesquisar áreas ou UCs..."
            type="text"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
            class="rounded-lg w-full"
          ></v-text-field>
          <v-select
            v-if="selecionado === 'Unidades Curriculares'"
            v-model="filtroArea"
            :items="[{ nome: 'Todas as Áreas', idArea: 'Todas' }, ...areasExibidasSelect]"
            item-title="nome"
            item-value="nome"
            label="Filtrar por Área"
            variant="outlined"
            density="comfortable"
            hide-details
            prepend-inner-icon="mdi-shape-outline"
            class="rounded-lg w-full sm:max-w-[240px]"
          ></v-select>
        </div>
        <v-btn v-if="!(isOpp && selecionado === 'Áreas')" class="h-14 bg-red-500! text-white" @click="selecionado == 'Áreas' ? dialogAddArea = true : dialogAdd = true"
          >Adicionar {{ selecionado == 'Áreas' ? 'Área' : 'UC' }}</v-btn
        >
      </div>

      <!-- ====================== TABELA DE ÁREAS ====================== -->
      <v-table
        :class="isOpp && selecionado === 'Áreas' ? 'mt-1' : 'mt-8'"
        v-slot:default
        v-if="selecionado == 'Áreas'"
        fixed-header
        height="400px"
      >
        <thead>
          <tr>
            <th class="text-center bg-gray-200 dark:bg-[#121212] font-bold">
              Nome da Área
            </th>
            <th class="text-center bg-gray-200 dark:bg-[#121212] font-bold">
              Quantidade de UCs
            </th>
            <th v-if="!isOpp" class="text-center bg-gray-200 dark:bg-[#121212] font-bold">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- Se não tem áreas, mostra mensagem -->
          <tr v-if="areasExibidas.length === 0">
            <td :colspan="isOpp ? 2 : 3" class="text-center text-gray-500 py-8">
              Nenhuma área cadastrada. Clique em "Adicionar Área" para começar.
            </td>
          </tr>
          <tr v-for="item in areasExibidas" :key="item.idArea">
            <td class="text-center font-bold dark:text-white">
              {{ item.nome }}
            </td>
            <td class="text-center font-bold dark:text-white">
              {{ item.quantidade }}
            </td>

            <td v-if="!isOpp">
              <div class="flex gap-2 justify-center">
                <v-btn
                  icon="mdi-pencil"
                  color="primary"
                  size="small"
                  @click="abrirEditarArea(item)"
                  class="dark:bg-[#121212]"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  color="error"
                  size="small"
                  @click="abrirDeletarArea(item)"
                  class="dark:bg-[#121212]"
                ></v-btn>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- ====================== TABELA DE UNIDADES CURRICULARES ====================== -->
      <v-table v-else class="mt-8" fixed-header height="400px">
        <thead>
          <tr>
            <th class="text-center bg-gray-200 dark:bg-[#121212] font-bold">
              Unidade Curricular
            </th>
            <th class="text-center bg-gray-200 dark:bg-[#121212] font-bold">
              Áreas
            </th>
            <th class="text-center bg-gray-200 dark:bg-[#121212] font-bold">
              Descrição
            </th>
            <th class="text-center bg-gray-200 dark:bg-[#121212] font-bold">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="competenciasExibidas.length === 0">
            <td colspan="4" class="text-center text-gray-500 py-8">
              Nenhuma UC cadastrada. Clique em "Adicionar UC" para começar.
            </td>
          </tr>
          <tr v-for="item in competenciasExibidas" :key="item.idUC">
            <td class="text-center font-bold dark:text-white">
              {{ item.nome }}
            </td>
            <td class="text-center font-bold">
              <p class="p-2 bg-gray-200 dark:bg-[#121212] rounded-lg">
                {{ item.area ? item.area.nome : '—' }}
              </p>
            </td>
            <td class="text-center font-bold dark:text-white">
              {{ item.descricao }}
            </td>

            <td>
              <div class="flex gap-2 justify-center">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  @click="abrirEditarCompetencia(item)"
                  class="dark:bg-[#121212]"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  color="red"
                  size="small"
                  @click="abrirDeletarCompetencia(item)"
                  class="dark:bg-[#121212]"
                ></v-btn>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>

  <!-- ====================== MODAL: ADICIONAR UNIDADE CURRICULAR ====================== -->
  <v-dialog v-model="dialogAdd" max-width="600px" persistent>
    <v-card class="rounded-lg">
      <div class="flex justify-between items-center w-full">
        <v-card-title
          class="text-lg font-bold bg-red-600 text-white pa-4 w-full flex items-center justify-between"
        >
          Adicionar Unidade Curricular
          <v-btn
            icon="mdi-close"
            color="white"
            variant="text"
            @click="dialogAdd = false"
            size="small"
          ></v-btn>
        </v-card-title>
      </div>
      <v-card-text class="flex flex-col gap-5 mt-1">
        <div class="flex flex-col gap-4">
          <v-select
            v-model="areaSelecionada"
            label="Área"
            :items="areasPermitidas"
            item-title="nome"
            item-value="idArea"
            variant="outlined"
            hide-details
          ></v-select>
        </div>

        <v-text-field
          v-model="novaCompetenciaNome"
          label="Nome da UC"
          variant="outlined"
          hide-details
        ></v-text-field>
        <v-textarea
          v-model="novaCompetenciaDescricao"
          label="Descrição da UC"
          variant="outlined"
          hide-details
        ></v-textarea>
      </v-card-text>
      <v-card-actions class="pa-4 justify-between mb-2">
        <v-btn
          color="grey"
          variant="elevated"
          @click="dialogAdd = false"
          class="dark:bg-[#414141] dark:text-white"
          >Cancelar</v-btn
        >
        <v-btn
          color="red"
          variant="elevated"
          @click="salvarNovaCompetencia"
          class="dark:bg-red-600 dark:text-white bg-red-600 text-white"
          >Salvar</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- ====================== MODAL: EDITAR ÁREA ====================== -->
  <v-dialog v-model="dialogEdit" max-width="600px" persistent v-if="dialogEdit">
    <v-card class="">
      <v-card-title
        class="text-lg font-bold bg-red-600 text-white w-full flex items-center justify-between"
      >
        Editar Área
        <v-btn
          icon="mdi-close"
          color="white"
          variant="text"
          @click="dialogEdit = false"
          size="small"
        ></v-btn>
      </v-card-title>

      <div>
        <v-card-text class="mt-5 px-5 py-0">
          <v-text-field
            v-model="areaEditNome"
            label="Nome"
            variant="outlined"
            class="mb-4"
            hide-details
          ></v-text-field>
          <v-text-field
            :model-value="areaEditando?.quantidade || 0"
            label="Quantidade de UCs"
            variant="outlined"
            class="mb-4"
            hide-details
            type="number"
            disabled
          ></v-text-field>
        </v-card-text>

        <v-card-actions class="mb-3 p-0 px-5 flex justify-between">
          <v-btn
            color="red"
            variant="elevated"
            @click="dialogEdit = false"
            class="dark:bg-red-600 dark:text-white text-black"
            >Cancelar</v-btn
          >
          <v-btn
            color="red"
            variant="elevated"
            @click="salvarEditArea"
            class="dark:bg-red-600 dark:text-white bg-red-600 text-white font-bold"
            >Salvar</v-btn
          >
        </v-card-actions>
      </div>
    </v-card>
  </v-dialog>

  <!-- ====================== MODAL: EDITAR UNIDADE CURRICULAR ====================== -->
  <v-dialog v-model="dialogEditCompetencia" max-width="600px" persistent v-if="dialogEditCompetencia">
    <v-card class="rounded-lg">
      <v-card-title
        class="text-lg font-bold bg-red-600 text-white w-full flex items-center justify-between"
      >
        Editar Unidade Curricular
        <v-btn
          icon="mdi-close"
          color="white"
          variant="text"
          @click="dialogEditCompetencia = false"
          size="small"
        ></v-btn>
      </v-card-title>

      <div class="my-8">
        <v-card-text class="px-5 py-0 flex flex-col gap-4">
          <v-text-field
            v-model="competenciaEditNome"
            label="Nome da UC"
            variant="outlined"
            hide-details
          ></v-text-field>
          
          <v-select
            v-model="competenciaEditArea"
            label="Área"
            :items="areasPermitidas"
            item-title="nome"
            item-value="idArea"
            variant="outlined"
            hide-details
          ></v-select>

          <v-textarea
            v-model="competenciaEditDescricao"
            label="Descrição"
            variant="outlined"
            hide-details
          ></v-textarea>
        </v-card-text>

        <v-card-actions class="p-0 px-5 flex justify-between mt-6">
          <v-btn
            color="red"
            variant="elevated"
            @click="dialogEditCompetencia = false"
            class="dark:bg-red-600 dark:text-white text-black"
            >Cancelar</v-btn
          >
          <v-btn
            color="red"
            variant="elevated"
            @click="salvarEditCompetencia"
            class="dark:bg-red-600 dark:text-white bg-red-600 text-white font-bold"
            >Salvar</v-btn
          >
        </v-card-actions>
      </div>
    </v-card>
  </v-dialog>

  <!-- ====================== MODAL: EXCLUIR ÁREA ====================== -->
  <v-dialog v-model="dialogDelete" max-width="450px" persistent>
    <v-card class="rounded-xl overflow-hidden shadow-2xl">
      <v-card-title class="bg-red-600 text-white font-bold px-6 py-4 text-xl">
        Confirmar Exclusão
      </v-card-title>
      <v-card-text class="pa-8 text-center text-lg font-medium leading-relaxed text-gray-700">
        Tem certeza de que deseja excluir a área <b>{{ areaDeletando?.nome }}</b>? Esta ação não pode ser desfeita.
      </v-card-text>
      <v-card-actions class="pa-6 pt-0 flex justify-end gap-3">
        <v-btn variant="elevated" color="grey-lighten-2" class="font-bold px-6 uppercase tracking-wide text-gray-800" @click="dialogDelete = false">Cancelar</v-btn>
        <v-btn variant="elevated" color="red" class="bg-red-600 text-white font-bold px-8 shadow-sm uppercase tracking-wide" @click="confirmarDeleteArea">Excluir</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- ====================== MODAL: ADICIONAR ÁREA ====================== -->
  <v-dialog v-model="dialogAddArea" max-width="500px" persistent>
    <v-card class="rounded-lg">
      <v-card-title class="text-lg font-bold bg-red-600 text-white pa-4 w-full flex items-center justify-between">
        Adicionar Nova Área
        <v-btn icon="mdi-close" color="white" variant="text" @click="dialogAddArea = false" size="small"></v-btn>
      </v-card-title>
      <v-card-text class="px-5">
        <v-text-field
          v-model="novaAreaNome"
          label="Nome da Área"
          variant="outlined"
          hide-details
          @keyup.enter="salvarNovaArea"
        ></v-text-field>
      </v-card-text>
      <v-card-actions class="px-5 justify-between mb-2">
        <v-btn color="grey" variant="elevated" @click="dialogAddArea = false">Cancelar</v-btn>
        <v-btn color="red" variant="elevated" @click="salvarNovaArea" class="bg-red-600 text-white">Salvar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- ====================== MODAL: EXCLUIR UNIDADE CURRICULAR ====================== -->
  <v-dialog v-model="dialogDeleteCompetencia" max-width="450px" persistent>
    <v-card class="rounded-xl overflow-hidden shadow-2xl">
      <v-card-title class="bg-red-600 text-white font-bold px-6 py-4 text-xl">
        Confirmar Exclusão
      </v-card-title>
      <v-card-text class="pa-8 text-center text-lg font-medium leading-relaxed text-gray-700">
        Tem certeza de que deseja excluir a unidade curricular <b>{{ competenciaDeletando?.nome }}</b>? Esta ação não pode ser desfeita.
      </v-card-text>
      <v-card-actions class="pa-6 pt-0 flex justify-end gap-3">
        <v-btn variant="elevated" color="grey-lighten-2" class="font-bold px-6 uppercase tracking-wide text-gray-800" @click="dialogDeleteCompetencia = false">Cancelar</v-btn>
        <v-btn variant="elevated" color="red" class="bg-red-600 text-white font-bold px-8 shadow-sm uppercase tracking-wide" @click="confirmarDeleteCompetencia">Excluir</v-btn>
      </v-card-actions>
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
  </div>
</template>
