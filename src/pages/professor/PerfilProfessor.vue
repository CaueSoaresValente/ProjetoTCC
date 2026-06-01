<script setup>
import { ref, watch, computed, onMounted } from "vue";
import {
  getUsuarioLogado,
  buscarProfessorPorCadastro,
  criarProfessor,
  listarAreas,
  listarAreasProfessor, adicionarAreaProfessor, editarAreaProfessor, excluirAreaProfessor,
  listarUCsProfessor, listarUCsPorArea, adicionarUCProfessor, editarUCProfessor, excluirUCProfessor,
  listarCertificacoes, adicionarCertificacao, editarCertificacao, excluirCertificacao,
} from "@/services/api";

// ID do professor (vem do banco após o login)
const idProfessor = ref(null);

// Abas
const tags = ["Área de Atuação", "Unidades Curriculares", "Certificações"];
const selecionado = ref("Área de Atuação");
const searchQuery = ref("");

// =============================================
// DADOS REAIS DO BANCO DE DADOS
// =============================================
const dadosAreas = ref([]);       // áreas que o professor já escolheu
const areasDisponiveis = ref([]); // todas as áreas do sistema (cadastradas pelo gestor)
const dadosUnidades = ref([]);    // UCs que o professor já vinculou
const unidadesFiltradas = ref([]); // UCs filtradas por área (para o dropdown)
const dadosCertificacoes = ref([]);// certificações do professor

// =============================================
// FILTROS DE PESQUISA
// =============================================
const filteredAreas = computed(() =>
  dadosAreas.value.filter((item) =>
    (item.area?.nome || '').toLowerCase().includes(searchQuery.value.toLowerCase())
  )
);

const filteredUnidades = computed(() =>
  dadosUnidades.value.filter((item) =>
    (item.unidadeCurricular?.nome || '').toLowerCase().includes(searchQuery.value.toLowerCase())
  )
);

const filteredCertificacoes = computed(() =>
  dadosCertificacoes.value.filter(
    (item) =>
      item.nome.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (item.instituicao || '').toLowerCase().includes(searchQuery.value.toLowerCase())
  )
);

// =============================================
// CONTROLE DOS MODAIS
// =============================================
const dialogAddArea = ref(false);
const dialogEditArea = ref(false);
const dialogDeleteArea = ref(false);

const dialogAddUnidade = ref(false);
const dialogEditUnidade = ref(false);
const dialogDeleteUnidade = ref(false);

const dialogAddCertificacao = ref(false);
const dialogEditCertificacao = ref(false);
const dialogDeleteCertificacao = ref(false);

// =============================================
// ITEM SELECIONADO PARA EDIÇÃO/DELEÇÃO
// =============================================
const areaSelecionada = ref(null);
const unidadeSelecionada = ref(null);
const certificacaoSelecionada = ref(null);
const areaSelecionadaFiltro = ref(null); // Pra guardar a área no modal de add unidade

// =============================================
// CAMPOS DOS FORMULÁRIOS — ÁREA DE ATUAÇÃO
// =============================================
const novaAreaId = ref(null);     // ID da área selecionada no dropdown
const novoNivelArea = ref(0);

// =============================================
// CAMPOS DOS FORMULÁRIOS — UNIDADE
// =============================================
const novaUnidadeId = ref(null);  // ID da UC selecionada no dropdown
const novoNivelConhecimento = ref(0);
const novaUnidade = ref({ cargaHorariaTotal: 0 });
const numModulos = ref(0);


const calcularCargaHoraria = () => {
  novaUnidade.value.cargaHorariaTotal = numModulos.value * 40;
};

// =============================================
// CAMPOS DOS FORMULÁRIOS — CERTIFICAÇÃO
// =============================================
const novaCertificacaoNome = ref("");
const novaCertificacaoInstituicao = ref("");
const novaCertificacaoData = ref("");
const novaCertificacaoCarga = ref("");

// =============================================
// FUNÇÕES DE CARREGAR DADOS DO BANCO
// =============================================
const carregarAreas = async () => {
  if (!idProfessor.value) return;
  try {
    dadosAreas.value = await listarAreasProfessor(idProfessor.value);
  } catch (e) { console.error('Erro ao carregar áreas:', e); }
};

const carregarAreasDisponiveis = async () => {
  try {
    areasDisponiveis.value = await listarAreas();
  } catch (e) { console.error('Erro ao carregar áreas disponíveis:', e); }
};

const carregarUnidades = async () => {
  if (!idProfessor.value) return;
  try {
    dadosUnidades.value = await listarUCsProfessor(idProfessor.value);
  } catch (e) { console.error('Erro ao carregar UCs:', e); }
};

const carregarCertificacoes = async () => {
  if (!idProfessor.value) return;
  try {
    dadosCertificacoes.value = await listarCertificacoes(idProfessor.value);
  } catch (e) { console.error('Erro ao carregar certificações:', e); }
};

// =============================================
// SISTEMA DE NOTIFICAÇÃO (SNACKBAR)
// =============================================
const snackbar = ref({
  show: false,
  text: "",
  color: "success",
});

const mostrarNotificacao = (text, color = "success") => {
  snackbar.value.text = text;
  snackbar.value.color = color;
  snackbar.value.show = true;
};

// =============================================
// FUNÇÕES DE SALVAR (chamam o backend)
// =============================================
const salvarArea = async () => {
  try {
    await adicionarAreaProfessor(idProfessor.value, novaAreaId.value);
    await carregarAreas();
    mostrarNotificacao("Área adicionada com sucesso!");
    dialogAddArea.value = false;
  } catch (e) { 
    mostrarNotificacao(e.message, "error");
  }
};

const salvarUnidade = async () => {
  try {
    await adicionarUCProfessor(idProfessor.value, novaUnidadeId.value, novoNivelConhecimento.value);
    await carregarUnidades();
    mostrarNotificacao("Unidade Curricular adicionada com sucesso!");
    dialogAddUnidade.value = false;
  } catch (e) { 
    mostrarNotificacao(e.message, "error");
  }
};

const salvarCertificacao = async () => {
  if (!novaCertificacaoNome.value.trim() || 
      !novaCertificacaoInstituicao.value.trim() || 
      !novaCertificacaoCarga.value.trim() || 
      !novaCertificacaoData.value) {
    mostrarNotificacao("Por favor, preencha todos os campos da certificação!", "error");
    return;
  }
  try {
    await adicionarCertificacao(idProfessor.value, {
      nome: novaCertificacaoNome.value.trim(),
      instituicao: novaCertificacaoInstituicao.value.trim(),
      cargaHoraria: novaCertificacaoCarga.value.trim(),
      dataObtencao: novaCertificacaoData.value,
    });
    await carregarCertificacoes();
    mostrarNotificacao("Certificação adicionada com sucesso!");
    dialogAddCertificacao.value = false;
  } catch (e) { 
    mostrarNotificacao(e.message, "error");
  }
};

// =============================================
// FUNÇÕES DE EDITAR
// =============================================
const abrirEditArea = (item) => {
  areaSelecionada.value = { ...item };
  dialogEditArea.value = true;
};

const salvarEdicaoArea = async () => {
  if (!areaSelecionada.value) return;
  try {
    await editarAreaProfessor(areaSelecionada.value.idProfessorArea, areaSelecionada.value.idArea);
    await carregarAreas();
    mostrarNotificacao("Área atualizada com sucesso!");
    dialogEditArea.value = false;
  } catch (e) { 
    mostrarNotificacao(e.message, "error");
  }
};

const abrirEditUnidade = (item) => {
  unidadeSelecionada.value = { ...item };
  dialogEditUnidade.value = true;
};

const salvarEdicaoUnidade = async () => {
  if (!unidadeSelecionada.value) return;
  try {
    await editarUCProfessor(unidadeSelecionada.value.idProfessorUC, unidadeSelecionada.value.nivelCompetencia);
    await carregarUnidades();
    mostrarNotificacao("Unidade Curricular atualizada com sucesso!");
    dialogEditUnidade.value = false;
  } catch (e) { 
    mostrarNotificacao(e.message, "error");
  }
};

const abrirEditCertificacao = (item) => {
  certificacaoSelecionada.value = { ...item };
  dialogEditCertificacao.value = true;
};

const salvarEdicaoCertificacao = async () => {
  if (!certificacaoSelecionada.value) return;
  const { nome, instituicao, cargaHoraria, dataObtencao } = certificacaoSelecionada.value;
  if (!nome?.trim() || 
      !instituicao?.trim() || 
      !String(cargaHoraria || '').trim() || 
      !dataObtencao) {
    mostrarNotificacao("Por favor, preencha todos os campos da certificação!", "error");
    return;
  }
  try {
    await editarCertificacao(certificacaoSelecionada.value.idCertificacao, {
      nome: nome.trim(),
      instituicao: instituicao.trim(),
      cargaHoraria: String(cargaHoraria).trim(),
      dataObtencao: dataObtencao,
    });
    await carregarCertificacoes();
    mostrarNotificacao("Certificação atualizada com sucesso!");
    dialogEditCertificacao.value = false;
  } catch (e) { 
    mostrarNotificacao(e.message, "error");
  }
};

// =============================================
// FUNÇÕES DE DELETAR (chamam o backend)
// =============================================
const abrirDeleteArea = (item) => {
  areaSelecionada.value = item;
  dialogDeleteArea.value = true;
};

const confirmarDeleteArea = async () => {
  try {
    await excluirAreaProfessor(areaSelecionada.value.idProfessorArea);
    await carregarAreas();
    mostrarNotificacao("Área removida com sucesso!");
    dialogDeleteArea.value = false;
  } catch (e) { 
    mostrarNotificacao(e.message, "error");
  }
};

const abrirDeleteUnidade = (item) => {
  unidadeSelecionada.value = item;
  dialogDeleteUnidade.value = true;
};

const confirmarDeleteUnidade = async () => {
  try {
    await excluirUCProfessor(unidadeSelecionada.value.idProfessorUC);
    await carregarUnidades();
    mostrarNotificacao("Unidade Curricular removida com sucesso!");
    dialogDeleteUnidade.value = false;
  } catch (e) { 
    mostrarNotificacao(e.message, "error");
  }
};

const abrirDeleteCertificacao = (item) => {
  certificacaoSelecionada.value = item;
  dialogDeleteCertificacao.value = true;
};

const confirmarDeleteCertificacao = async () => {
  try {
    await excluirCertificacao(certificacaoSelecionada.value.idCertificacao);
    await carregarCertificacoes();
    mostrarNotificacao("Certificação removida com sucesso!");
    dialogDeleteCertificacao.value = false;
  } catch (e) { 
    mostrarNotificacao(e.message, "error");
  }
};

// =============================================
// WATCHERS (limpa campos ao abrir modais de adição)
// =============================================
watch(dialogAddArea, async (val) => {
  if (val) {
    novaAreaId.value = null;
    novoNivelArea.value = 0;
    // Tenta carregar as áreas de novo para garantir que pegou as novas do gestor
    await carregarAreasDisponiveis();
    console.log("Áreas disponíveis carregadas:", areasDisponiveis.value);
  }
});

watch(dialogAddUnidade, (val) => {
  if (val) {
    areaSelecionadaFiltro.value = null;
    novaUnidadeId.value = null;
    novoNivelConhecimento.value = 0;
    unidadesFiltradas.value = [];
  }
});

// Quando o professor muda a área no modal de UC, carrega as UCs daquela área
watch(areaSelecionadaFiltro, async (novaArea) => {
  if (novaArea) {
    try {
      unidadesFiltradas.value = await listarUCsPorArea(novaArea);
    } catch (e) { console.error(e); }
  } else {
    unidadesFiltradas.value = [];
  }
});

watch(dialogAddCertificacao, (val) => {
  if (val) {
    novaCertificacaoNome.value = "";
    novaCertificacaoInstituicao.value = "";
    novaCertificacaoData.value = "";
    novaCertificacaoCarga.value = "";
  }
});

// =============================================
// INICIALIZAÇÃO — Carrega tudo ao montar a página
// =============================================
onMounted(async () => {
  try {
    const usuario = getUsuarioLogado();
    if (usuario) {
      // CORREÇÃO: Removido 'user.value.name' que causava ReferenceError e quebrava a inicialização do onMounted.
      
      let professor;
      try {
        professor = await buscarProfessorPorCadastro(usuario.idUsuario);
      } catch (e) {
        // Professor ainda não existe
      }
      
      if (!professor) {
        try {
          professor = await criarProfessor(usuario.idUsuario);
        } catch (e) {
          console.error("Erro ao criar perfil de professor:", e);
        }
      }

      if (professor && professor.idProfessor) {
        idProfessor.value = professor.idProfessor;
        await carregarAreasDisponiveis();
        await carregarAreas();
        await carregarUnidades();
        await carregarCertificacoes();
      }
    }
  } catch (e) { 
    console.error('Erro ao inicializar:', e);
  }
});
</script>

<template>
  <div>
  <!-- Conteúdo principal -->
  <div class="px-4 md:px-10 lg:px-20 xl:px-40">
    <div class="flex items-center gap-3 mt-8 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
      <div class="bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
        <v-icon icon="mdi-certificate" size="28"></v-icon>
      </div>
      <div>
        <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight break-words">Meu Perfil</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gerencie suas UCs, áreas tecnológicas de atuação e certificações profissionais.
        </p>
      </div>
    </div>

    <!-- Abas Estilizadas Premium (Área de Atuação, Unidades Curriculares, Certificações) -->
    <div class="flex items-center mb-6">
      <div class="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl flex flex-wrap gap-1 border border-gray-200 dark:border-gray-700">
        <button
          v-for="tag in tags"
          :key="tag"
          class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 cursor-pointer select-none"
          :class="selecionado === tag 
            ? 'bg-red-600 text-white scale-[1.01]' 
            : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/30'"
          @click="selecionado = tag"
        >
          <v-icon 
            :icon="tag === 'Área de Atuação' ? 'mdi-tag-outline' : tag === 'Unidades Curriculares' ? 'mdi-school-outline' : 'mdi-certificate-outline'" 
            size="18"
            :class="selecionado === tag ? 'text-white' : 'text-gray-400 dark:text-gray-500'"
          ></v-icon>
          {{ tag }}
        </button>
      </div>
    </div>

    <!-- Card principal -->
    <v-card class="border-t-4 border-red-600 px-8 rounded-lg shadow-lg py-8">
      <!-- Barra de pesquisa e botão -->
      <div class="flex flex-col-reverse sm:flex-row justify-between gap-4">
        <v-text-field
          v-model="searchQuery"
          label="Pesquisar..."
          type="text"
          variant="filled"
          hide-details
        ></v-text-field>
        <v-btn
          class="h-14 bg-red-500! text-white"
          @click="
            selecionado === 'Área de Atuação'
              ? (dialogAddArea = true)
              : selecionado === 'Unidades Curriculares'
              ? (dialogAddUnidade = true)
              : (dialogAddCertificacao = true)
          "
        >
          Adicionar
          {{
            selecionado === "Área de Atuação"
              ? "Área"
              : selecionado === "Unidades Curriculares"
              ? "Unidade"
              : "Certificação"
          }}
        </v-btn>
      </div>

      <!-- TABELA DE ÁREA DE ATUAÇÃO -->
      <v-table
        class="mt-8"
        v-if="selecionado === 'Área de Atuação'"
        fixed-header
        height="400px"
      >
        <thead>
          <tr>
            <th class="text-center bg-gray-200 dark:bg-[#121212] font-bold">Área de Atuação</th>
            <th class="text-center bg-gray-200 dark:bg-[#121212] font-bold">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredAreas" :key="item.idProfessorArea">
            <td class="text-center font-bold dark:text-white">{{ item.area?.nome }}</td>

            <td>
              <div class="flex gap-2 justify-center">
                <v-btn
                  icon="mdi-pencil"
                  color="primary"
                  size="small"
                  @click="abrirEditArea(item)"
                  class="dark:bg-[#121212]"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  color="error"
                  size="small"
                  @click="abrirDeleteArea(item)"
                  class="dark:bg-[#121212]"
                ></v-btn>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- TABELA DE UNIDADES CURRICULARES -->
      <v-table
        class="mt-8"
        v-else-if="selecionado === 'Unidades Curriculares'"
        fixed-header
        height="400px"
      >
        <thead>
          <tr>
            <th class="text-center bg-gray-200 dark:bg-[#121212] font-bold">Nome da Unidade</th>
            <th class="text-center bg-gray-200 dark:bg-[#121212] font-bold">Progresso</th>
            <th class="text-center bg-gray-200 dark:bg-[#121212] font-bold">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredUnidades" :key="item.idProfessorUC">
            <td class="text-center font-bold dark:text-white">{{ item.unidadeCurricular?.nome }}</td>
            <td class="text-center dark:text-white">
              <div class="flex items-center gap-2 justify-center">
                <v-progress-linear
                  :model-value="item.nivelCompetencia"
                  color="#4CAF50"
                  track-color="#E8F5E9"
                  height="10"
                  rounded
                  class="max-w-[150px]"
                ></v-progress-linear>
                <span class="text-sm font-bold text-gray-500">{{ item.nivelCompetencia }}%</span>
              </div>
            </td>
            <td>
              <div class="flex gap-2 justify-center">
                <v-btn
                  icon="mdi-pencil"
                  color="primary"
                  size="small"
                  @click="abrirEditUnidade(item)"
                  class="dark:bg-[#121212]"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  color="error"
                  size="small"
                  @click="abrirDeleteUnidade(item)"
                  class="dark:bg-[#121212]"
                ></v-btn>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- TABELA DE CERTIFICAÇÕES -->
      <v-table v-else class="mt-8" fixed-header height="400px">
        <thead>
          <tr>
            <th class="text-center bg-gray-200 dark:bg-[#121212] font-bold">Certificação</th>
            <th class="text-center bg-gray-200 dark:bg-[#121212] font-bold">Instituição</th>
            <th class="text-center bg-gray-200 dark:bg-[#121212] font-bold">Carga Horária</th>
            <th class="text-center bg-gray-200 dark:bg-[#121212] font-bold">Data</th>
            <th class="text-center bg-gray-200 dark:bg-[#121212] font-bold">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredCertificacoes" :key="item.idCertificacao">
            <td class="text-center font-bold dark:text-white">{{ item.nome }}</td>
            <td class="text-center font-bold">
              <p class="p-2 bg-gray-200 dark:bg-[#121212] rounded-lg">{{ item.instituicao || '—' }}</p>
            </td>
            <td class="text-center font-bold dark:text-white">{{ item.cargaHoraria || '—' }}</td>
            <td class="text-center font-bold dark:text-white">{{ item.dataObtencao || '—' }}</td>
            <td>
              <div class="flex gap-2 justify-center">
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  @click="abrirEditCertificacao(item)"
                  class="dark:bg-[#121212]"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  color="red"
                  size="small"
                  @click="abrirDeleteCertificacao(item)"
                  class="dark:bg-[#121212]"
                ></v-btn>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>

  <!-- =============================================
       MODAIS DE ÁREA DE ATUAÇÃO
       ============================================= -->

  <!-- Modal: Adicionar Área -->
  <v-dialog v-model="dialogAddArea" max-width="500px" persistent>
    <v-card class="rounded-lg">
      <v-card-title
        class="text-lg font-bold bg-red-600 text-white pa-4 w-full flex items-center justify-between"
      >
        Adicionar Área de Atuação
        <v-btn
          icon="mdi-close"
          color="white"
          variant="text"
          @click="dialogAddArea = false"
          size="small"
        ></v-btn>
      </v-card-title>
      <v-card-text class="px-5 flex flex-col gap-4 mt-4">
        <v-select
          v-model="novaAreaId"
          :items="areasDisponiveis"
          item-title="nome"
          item-value="idArea"
          label="Selecione a Área"
          variant="outlined"
          hide-details
        ></v-select>
      </v-card-text>
      <v-card-actions class="px-5 justify-between mb-2">
        <v-btn color="grey" variant="elevated" @click="dialogAddArea = false">Cancelar</v-btn>
        <v-btn color="red" variant="elevated" @click.stop.prevent="salvarArea" class="bg-red-600 text-white">
          Salvar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Modal: Editar Área -->
  <v-dialog v-model="dialogEditArea" max-width="600px" persistent>
    <v-card class="rounded-lg">
      <v-card-title
        class="text-lg font-bold bg-red-600 text-white pa-4 w-full flex items-center justify-between"
      >
        Editar Área de Atuação
        <v-btn
          icon="mdi-close"
          color="white"
          variant="text"
          @click="dialogEditArea = false"
          size="small"
        ></v-btn>
      </v-card-title>
      <div class="my-8" v-if="areaSelecionada">
        <v-card-text class="px-5 py-0 flex flex-col gap-4">
          <v-select
            v-model="areaSelecionada.idArea"
            :items="areasDisponiveis"
            item-title="nome"
            item-value="idArea"
            label="Nome da Área"
            variant="outlined"
            hide-details
          ></v-select>
        </v-card-text>
        <v-card-actions class="p-0 px-5 flex justify-between mt-6">
          <v-btn color="grey" variant="elevated" @click="dialogEditArea = false">Cancelar</v-btn>
          <v-btn
            color="red"
            variant="elevated"
            @click="salvarEdicaoArea"
            class="bg-red-600 text-white font-bold"
          >
            Salvar
          </v-btn>
        </v-card-actions>
      </div>
    </v-card>
  </v-dialog>

  <!-- Modal: Deletar Área -->
  <v-dialog v-model="dialogDeleteArea" max-width="400px" persistent>
    <v-card class="rounded-lg">
      <v-card-title class="text-h5 bg-red-600 text-white pa-4">
        Confirmar Exclusão
      </v-card-title>
      <v-card-text class="pa-4 text-center text-lg">
        Tem certeza de que deseja excluir a área
        <strong>{{ areaSelecionada?.area?.nome }}</strong>? Esta ação não pode ser desfeita.
      </v-card-text>
      <v-card-actions class="pa-4 flex justify-end gap-3">
        <v-btn variant="elevated" color="grey-lighten-2" class="font-bold text-gray-800" @click="dialogDeleteArea = false">Cancelar</v-btn>
        <v-btn variant="elevated" color="red" class="bg-red-600 text-white font-bold" @click="confirmarDeleteArea">Excluir</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- =============================================
       MODAIS DE UNIDADES CURRICULARES
       ============================================= -->

  <!-- Modal: Adicionar Unidade Curricular -->
  <v-dialog v-model="dialogAddUnidade" max-width="500px" persistent>
    <v-card class="rounded-lg">
      <v-card-title
        class="text-lg font-bold bg-red-600 text-white pa-4 w-full flex items-center justify-between"
      >
        Adicionar Unidade Curricular
        <v-btn
          icon="mdi-close"
          color="white"
          variant="text"
          @click="dialogAddUnidade = false"
          size="small"
        ></v-btn>
      </v-card-title>
      <v-card-text class="px-5 flex flex-col gap-4 mt-4">
        <!-- Primeiro o prof escolhe uma das suas áreas -->
        <v-select
          v-model="areaSelecionadaFiltro"
          :items="dadosAreas"
          :item-title="item => item.area?.nome"
          item-value="idArea"
          label="Selecione a Área de Atuação"
          variant="outlined"
          hide-details
        ></v-select>

        <!-- Depois escolhe a UC daquela área -->
        <v-select
          v-model="novaUnidadeId"
          :items="unidadesFiltradas"
          item-title="nome"
          item-value="idUC"
          label="Selecione a Unidade Curricular"
          variant="outlined"
          hide-details
          :disabled="!areaSelecionadaFiltro"
          class="mt-1"
        ></v-select>

        <div class="">
          <div class="flex justify-between items-center mb-1">
            <label class="text-sm font-bold text-gray-600 dark:text-white">Nível de Conhecimento</label>
            <span class="text-sm font-bold text-red-600">{{ novoNivelConhecimento }}%</span>
          </div>
          <v-slider
            v-model="novoNivelConhecimento"
            color="red"
            track-color="red-lighten-4"
            min="0"
            max="100" 
            step="1"
            thumb-label
            hide-details
          ></v-slider>
        </div>

      </v-card-text>
      <v-card-actions class="px-5 justify-between mb-2">
        <v-btn color="grey" variant="elevated" @click="dialogAddUnidade = false">Cancelar</v-btn>
        <v-btn color="red" variant="elevated" @click="salvarUnidade" class="bg-red-600 text-white">
          Salvar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Modal: Editar Unidade Curricular — SEM v-if -->
  <v-dialog v-model="dialogEditUnidade" max-width="600px" persistent>
    <v-card class="rounded-lg">
      <v-card-title
        class="text-lg font-bold bg-red-600 text-white pa-4 w-full flex items-center justify-between"
      >
        Editar Unidade Curricular
        <v-btn
          icon="mdi-close"
          color="white"
          variant="text"
          @click="dialogEditUnidade = false"
          size="small"
        ></v-btn>
      </v-card-title>
      <div class="my-8" v-if="unidadeSelecionada">
        <v-card-text class="px-5 py-0 flex flex-col gap-4">
          <v-text-field
            v-model="unidadeSelecionada.unidadeCurricular.nome"
            label="Nome da Unidade Curricular"
            variant="outlined"
            hide-details
            readonly
          ></v-text-field>
          <div class="mt-2">
            <div class="flex justify-between items-center mb-1">
              <label class="text-sm font-bold text-gray-600">Nível de Conhecimento (%)</label>
              <span class="text-sm font-bold text-red-600">{{ unidadeSelecionada.nivelCompetencia }}%</span>
            </div>
            <v-slider
              v-model="unidadeSelecionada.nivelCompetencia"
              color="red"
              track-color="red-lighten-4"
              min="0"
              max="100"
              step="1"
              thumb-label
              hide-details
            ></v-slider>
          </div>
        </v-card-text>
        <v-card-actions class="p-0 px-5 flex justify-between mt-6">
          <v-btn color="grey" variant="elevated" @click="dialogEditUnidade = false">Cancelar</v-btn>
          <v-btn
            color="red"
            variant="elevated"
            @click="salvarEdicaoUnidade"
            class="bg-red-600 text-white font-bold"
          >
            Salvar
          </v-btn>
        </v-card-actions>
      </div>
    </v-card>
  </v-dialog>

  <!-- Modal: Deletar Unidade Curricular -->
  <v-dialog v-model="dialogDeleteUnidade" max-width="400px" persistent>
    <v-card class="rounded-lg">
      <v-card-title class="text-h5 bg-red-600 text-white pa-4">
        Confirmar Exclusão
      </v-card-title>
      <v-card-text class="pa-4 text-center text-lg">
        Tem certeza de que deseja excluir
        <strong>{{ unidadeSelecionada?.unidadeCurricular?.nome }}</strong>? Esta ação não pode ser desfeita.
      </v-card-text>
      <v-card-actions class="pa-4 flex justify-end gap-3">
        <v-btn variant="elevated" color="grey-lighten-2" class="font-bold text-gray-800" @click="dialogDeleteUnidade = false">Cancelar</v-btn>
        <v-btn variant="elevated" color="red" class="bg-red-600 text-white font-bold" @click="confirmarDeleteUnidade">Excluir</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- =============================================
       MODAIS DE CERTIFICAÇÕES
       ============================================= -->

  <!-- Modal: Adicionar Certificação -->
  <v-dialog v-model="dialogAddCertificacao" max-width="500px" persistent>
    <v-card class="rounded-lg">
      <v-card-title
        class="text-lg font-bold bg-red-600 text-white pa-4 w-full flex items-center justify-between"
      >
        Adicionar Certificação
        <v-btn
          icon="mdi-close"
          color="white"
          variant="text"
          @click="dialogAddCertificacao = false"
          size="small"
        ></v-btn>
      </v-card-title>
      <v-card-text class="px-5 flex flex-col gap-4 mt-4">
        <v-text-field
          v-model="novaCertificacaoNome"
          label="Nome da Certificação"
          variant="outlined"
          hide-details
        ></v-text-field>
        <v-text-field
          v-model="novaCertificacaoInstituicao"
          label="Instituição"
          variant="outlined"
          hide-details
        ></v-text-field>
        <v-text-field
          v-model="novaCertificacaoCarga"
          label="Carga Horária (ex: 40h)"
          variant="outlined"
          hide-details
        ></v-text-field>
        <v-text-field
          v-model="novaCertificacaoData"
          label="Data de Conclusão"
          variant="outlined"
          hide-details
          type="date"
        ></v-text-field>
      </v-card-text>
      <v-card-actions class="px-5 justify-between mb-2">
        <v-btn color="grey" variant="elevated" @click="dialogAddCertificacao = false">Cancelar</v-btn>
        <v-btn
          color="red"
          variant="elevated"
          @click="salvarCertificacao"
          class="bg-red-600 text-white"
        >
          Salvar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Modal: Editar Certificação — SEM v-if -->
  <v-dialog v-model="dialogEditCertificacao" max-width="600px" persistent>
    <v-card class="rounded-lg">
      <v-card-title
        class="text-lg font-bold bg-red-600 text-white pa-4 w-full flex items-center justify-between"
      >
        Editar Certificação
        <v-btn
          icon="mdi-close"
          color="white"
          variant="text"
          @click="dialogEditCertificacao = false"
          size="small"
        ></v-btn>
      </v-card-title>
      <div class="my-8" v-if="certificacaoSelecionada">
        <v-card-text class="px-5 py-0 flex flex-col gap-4">
          <v-text-field
            v-model="certificacaoSelecionada.nome"
            label="Nome da Certificação"
            variant="outlined"
            hide-details
          ></v-text-field>
          <v-text-field
            v-model="certificacaoSelecionada.instituicao"
            label="Instituição"
            variant="outlined"
            hide-details
          ></v-text-field>
          <v-text-field
            v-model="certificacaoSelecionada.cargaHoraria"
            label="Carga Horária"
            variant="outlined"
            hide-details
          ></v-text-field>
          <v-text-field
            v-model="certificacaoSelecionada.dataObtencao"
            label="Data de Conclusão"
            variant="outlined"
            hide-details
            type="date"
          ></v-text-field>
        </v-card-text>
        <v-card-actions class="p-0 px-5 flex justify-between mt-6">
          <v-btn color="grey" variant="elevated" @click="dialogEditCertificacao = false">
            Cancelar
          </v-btn>
          <v-btn
            color="red"
            variant="elevated"
            @click="salvarEdicaoCertificacao"
            class="bg-red-600 text-white font-bold"
          >
            Salvar
          </v-btn>
        </v-card-actions>
      </div>
    </v-card>
  </v-dialog>

  <!-- Modal: Deletar Certificação -->
  <v-dialog v-model="dialogDeleteCertificacao" max-width="400px" persistent>
    <v-card class="rounded-lg">
      <v-card-title class="text-h5 bg-red-600 text-white pa-4">
        Excluir Certificação
      </v-card-title>
      <v-card-text class="pa-4 text-center text-lg">
        Deseja excluir a certificação
        <strong>{{ certificacaoSelecionada?.nome }}</strong>?
      </v-card-text>
      <v-card-actions class="pa-4 flex justify-end gap-3">
        <v-btn variant="elevated" color="grey-lighten-2" class="font-bold text-gray-800" @click="dialogDeleteCertificacao = false">Cancelar</v-btn>
        <v-btn variant="elevated" color="red" class="bg-red-600 text-white font-bold" @click="confirmarDeleteCertificacao">Excluir</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- SISTEMA DE NOTIFICAÇÃO (SNACKBAR) -->
  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="4000"
    location="top right"
    elevation="24"
    class="mt-12"
  >
    <div class="flex items-center gap-3">
      <v-icon
        color="white"
        :icon="snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'"
      ></v-icon>
      <span class="font-medium text-white">{{ snackbar.text }}</span>
    </div>
    
    <template v-slot:actions>
      <v-btn
        color="white"
        variant="text"
        icon="mdi-close"
        @click="snackbar.show = false"
      ></v-btn>
    </template>
  </v-snackbar>
  </div>
</template>