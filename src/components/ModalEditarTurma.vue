<script setup>
import { ref, watch, onMounted, computed, nextTick } from "vue";
import { getUsuarioLogado, listarAreas, listarOpps, listarCompetencias, listarUCsPorArea } from "@/services/api";

const props = defineProps({
  modelValue: Boolean,
  turma: Object,
  loading: Boolean,
});

const emit = defineEmits(["update:modelValue", "save"]);

const usuarioLogado = getUsuarioLogado();
const isOpp = computed(() => usuarioLogado?.funcao === 'opp');

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

const form = ref({
  label: "",
  idArea: null,
  modalidade: "tec",
  idOPP: null,
  dataInicio: "",
  dataFim: "",
  aulasSemana: 0,
  totalAulas: 0,
  descricao: "",
});

const todosOpps = ref([]);
const oppsList = ref([]);
const areasDisponiveis = ref([]);
const filteredAreas = computed(() => {
  if (!isOpp.value) return areasDisponiveis.value;
  const oppLogado = todosOpps.value.find(o => o.idCadastro === usuarioLogado?.idUsuario);
  if (!oppLogado || !oppLogado.oppAreas) return [];
  const idsPermitidos = oppLogado.oppAreas.map(oa => oa.idArea);
  return areasDisponiveis.value.filter(area => idsPermitidos.includes(area.value));
});
const unidadesCurriculares = ref([]);
const todasUnidadesCurriculares = ref([]);
const areaFiltroModal = ref(null);

const filteredCompetencias = computed(() => {
  let list = todasUnidadesCurriculares.value;
  if (areaFiltroModal.value) {
    list = list.filter(uc => uc.idArea === areaFiltroModal.value);
  }
  if (buscaUC.value) {
    list = list.filter(uc => uc.nome.toLowerCase().includes(buscaUC.value.toLowerCase()));
  }
  return list;
});

async function carregarAreas() {
  try {
    const data = await listarAreas();
    areasDisponiveis.value = data.map(area => ({
      title: area.nome,
      value: area.idArea
    }));
  } catch (error) {
    console.error("Erro ao carregar áreas:", error);
  }
}

async function carregarOpps() {
  try {
    const data = await listarOpps();
    todosOpps.value = data;
    filtrarOpps();
  } catch (error) {
    console.error("Erro ao carregar OPPs:", error);
  }
}

function filtrarOpps() {
  const areaId = form.value.idArea;
  if (!areaId) {
    oppsList.value = [];
    return;
  }
  const oppsFiltrados = todosOpps.value.filter(opp => {
    return opp.oppAreas && opp.oppAreas.some(oa => oa.idArea === areaId);
  });
  oppsList.value = oppsFiltrados.map(opp => ({
    label: opp.cadastro.nome,
    value: opp.idOPP
  }));
}

async function carregarUCs() {
  const areaId = form.value.idArea;
  if (!areaId) {
    unidadesCurriculares.value = [];
    return;
  }
  try {
    const data = await listarUCsPorArea(areaId);
    unidadesCurriculares.value = data.map(uc => {
      let carga = "";
      if (uc.descricao) {
        const match = uc.descricao.match(/(\d+h)/i);
        if (match) {
          carga = match[1];
        }
      }
      return {
        nome: uc.nome,
        carga: carga || undefined
      };
    });
  } catch (error) {
    console.error("Erro ao carregar UCs por área:", error);
    unidadesCurriculares.value = [];
  }
}

// Flag para evitar que o watch limpe idOPP durante a inicialização
const dadosCarregados = ref(false);

// Observa mudanças na área para filtrar OPPs e UCs
watch(() => form.value.idArea, (novaAreaId, antigaAreaId) => {
  filtrarOpps();
  // Limpa a seleção de OPP e UCs apenas se for uma troca intencional do usuário (após dados carregados)
  if (dadosCarregados.value && antigaAreaId !== undefined && antigaAreaId !== null && novaAreaId !== antigaAreaId) {
    form.value.idOPP = null;
    Object.keys(ucsSalvas.value).forEach(dia => {
      ucsSalvas.value[dia] = [];
    });
  }
});

onMounted(async () => {
  await carregarAreas();
  await carregarOpps();
  await carregarTodasUCs();

  // Após todos os dados carregarem, re-popular o formulário para garantir que
  // os v-selects de Área e OPP encontrem os itens correspondentes na lista
  if (props.turma) {
    form.value.idArea = props.turma.idArea || null;
    filtrarOpps();
    form.value.idOPP = props.turma.idOPP || null;
  }

  // Liberar o watch para funcionar normalmente nas interações do usuário
  nextTick(() => {
    dadosCarregados.value = true;
  });
});

async function carregarTodasUCs() {
  try {
    const data = await listarCompetencias();
    todasUnidadesCurriculares.value = data.map(uc => {
      let carga = "";
      if (uc.descricao) {
        const match = uc.descricao.match(/(\d+h)/i);
        if (match) carga = match[1];
      }
      return {
        idUC: uc.idUC,
        nome: uc.nome,
        idArea: uc.idArea,
        carga: carga || undefined
      };
    });
  } catch (error) {
    console.error("Erro ao carregar todas as UCs:", error);
  }
}

const selectedPeriodo = ref({
  segunda: null,
  terca: null,
  quarta: null,
  quinta: null,
  sexta: null,
  sabado: null,
});

const ucsSalvas = ref({
  segunda: [],
  terca: [],
  quarta: [],
  quinta: [],
  sexta: [],
  sabado: [],
});

// Áreas carregadas dinamicamente
const periodos = [
  { label: "Manhã", value: "manha", color: "#F59E0B" },
  { label: "Tarde", value: "tarde", color: "#3B82F6" },
  { label: "Noite", value: "noite", color: "#6366F1" },
  { label: "Integral", value: "INT", color: "#10B981" },
];

// Controla quais dias estão mostrando o sub-menu de Integral
const integralSubMenu = ref({
  segunda: false,
  terca: false,
  quarta: false,
  quinta: false,
  sexta: false,
  sabado: false,
});

// Labels bonitos para exibir no badge do card
const integralLabels = {
  'INT_MT': 'Manhã + Tarde',
  'INT_MN': 'Manhã + Noite',
  'INT_TN': 'Tarde + Noite',
};

// Helper: verifica se um período é do tipo integral
function isIntegral(periodo) {
  return periodo && periodo.startsWith('INT_');
}

const diasDaSemana = [
  { label: "Segunda-feira", value: "segunda" },
  { label: "Terça-feira", value: "terca" },
  { label: "Quarta-feira", value: "quarta" },
  { label: "Quinta-feira", value: "quinta" },
  { label: "Sexta-feira", value: "sexta" },
  { label: "Sábado", value: "sabado" },
];

// Unidades Curriculares carregadas dinamicamente

const modalUC = ref(false);
const diaDoModal = ref(null);

// Observa mudanças na turma para preencher o formulário
watch(() => props.turma, (newTurma) => {
  if (newTurma) {
    form.value = {
      label: newTurma.label,
      idArea: newTurma.idArea || null,
      modalidade: newTurma.modalidade,
      idOPP: null,
      dataInicio: newTurma.dataInicioISO || newTurma.dataInicio || "",
      dataFim: newTurma.dataTerminoISO || newTurma.dataFim || "",
      aulasSemana: newTurma.aulasSemana || 4,
      totalAulas: newTurma.totalAulas || 16,
      descricao: newTurma.descricao || "",
    };

    // Mapear a grade existente para o formato do addTurmas
    resetPeriodos();
    if (newTurma.grade) {
      newTurma.grade.forEach(slot => {
        const p = slot.periodo;
        const pLower = p.toLowerCase();
        const diaMap = { 'Seg': 'segunda', 'Ter': 'terca', 'Qua': 'quarta', 'Qui': 'quinta', 'Sex': 'sexta', 'Sáb': 'sabado' };

        Object.keys(slot.aulas || {}).forEach(dia => {
          const diaKey = diaMap[dia];
          if (diaKey) {
            // Mapeia os sub-tipos de integral corretamente
            if (p === 'INT_MT' || p === 'INT_MN' || p === 'INT_TN') {
              selectedPeriodo.value[diaKey] = p;
            } else if (pLower.includes('integral') || p === 'INT') {
              selectedPeriodo.value[diaKey] = 'INT_MT'; // Integral padrão = Manhã+Tarde
            } else if (pLower.startsWith('m')) selectedPeriodo.value[diaKey] = 'manha';
            else if (pLower.startsWith('t')) selectedPeriodo.value[diaKey] = 'tarde';
            else if (pLower.startsWith('n')) selectedPeriodo.value[diaKey] = 'noite';

            if (!ucsSalvas.value[diaKey].some(item => item.idUC === slot.aulas[dia].idUC && item.periodo === slot.periodo)) {
              ucsSalvas.value[diaKey].push({ 
                uc: slot.aulas[dia].disciplina, 
                idUC: slot.aulas[dia].idUC, 
                periodo: slot.periodo,
                professor: slot.aulas[dia].professor
              });
            }
          }
        });
      });
    }
  }
}, { immediate: true });

function resetPeriodos() {
  Object.keys(selectedPeriodo.value).forEach(k => selectedPeriodo.value[k] = null);
  Object.keys(ucsSalvas.value).forEach(k => ucsSalvas.value[k] = []);
}

function togglePeriodo(diaValue, periodoValue) {
  // Se clicou em "Integral", abre o sub-menu ao invés de selecionar direto
  if (periodoValue === 'INT') {
    integralSubMenu.value[diaValue] = !integralSubMenu.value[diaValue];
    return;
  }

  integralSubMenu.value[diaValue] = false;

  if (selectedPeriodo.value[diaValue] === periodoValue) {
    selectedPeriodo.value[diaValue] = null;
  } else {
    selectedPeriodo.value[diaValue] = periodoValue;
  }
  // Limpa as UCs salvas daquele dia se o usuário mudar o turno
  ucsSalvas.value[diaValue] = [];
}

// Quando o usuário escolhe uma das 3 combinações de Integral
function selecionarIntegral(diaValue, tipo) {
  integralSubMenu.value[diaValue] = false;
  selectedPeriodo.value[diaValue] = tipo; // 'INT_MT', 'INT_MN' ou 'INT_TN'
  ucsSalvas.value[diaValue] = [];
}

function removerPeriodo(diaValue) {
  selectedPeriodo.value[diaValue] = null;
  integralSubMenu.value[diaValue] = false;
  ucsSalvas.value[diaValue] = [];
}

const ucsSelecionadasTemp = ref([]); // Array de objetos { uc, periodo }

function abrirModalUC(diaValue) {
  diaDoModal.value = diaValue;
  buscaUC.value = "";
  // Clone da lista atual para edição temporária
  ucsSelecionadasTemp.value = ucsSalvas.value[diaValue].map(item => ({ ...item }));
  modalUC.value = true;
}

// Campo de busca dentro do modal
const buscaUC = ref("");

// Períodos disponíveis calculados dinamicamente com base no período do dia selecionado
const periodosDisponiveisParaOModal = computed(() => {
  const periodoDoDiaSelecionado = selectedPeriodo.value[diaDoModal.value];

  if (periodoDoDiaSelecionado === 'manha') {
    return ['M01', 'M02', 'Manhã'];
  } else if (periodoDoDiaSelecionado === 'tarde') {
    return ['T01', 'T02', 'Tarde'];
  } else if (periodoDoDiaSelecionado === 'noite') {
    return ['N01', 'N02', 'Noite'];
  } else if (periodoDoDiaSelecionado === 'INT_MT') {
    // INTEGRAL Manhã+Tarde: opção integral primeiro, depois sub-slots
    return ['Manhã + Tarde', 'M01', 'M02', 'Manhã', 'T01', 'T02', 'Tarde'];
  } else if (periodoDoDiaSelecionado === 'INT_MN') {
    // INTEGRAL Manhã+Noite
    return ['Manhã + Noite', 'M01', 'M02', 'Manhã', 'N01', 'N02', 'Noite'];
  } else if (periodoDoDiaSelecionado === 'INT_TN') {
    // INTEGRAL Tarde+Noite
    return ['Tarde + Noite', 'T01', 'T02', 'Tarde', 'N01', 'N02', 'Noite'];
  }

  return [];
});

// Calcula quais períodos estão disponíveis para uma UC específica,
// bloqueando opções conflitantes já usadas por outras UCs
function periodosDisponiveisPara(ucId) {
  const basePeriodos = periodosDisponiveisParaOModal.value;
  const outrasUcs = ucsSelecionadasTemp.value.filter(item => item.idUC !== ucId && item.periodo);

  // Tabela de conflitos BIDIRECIONAL:
  // Se alguém escolheu "Manhã", bloqueia M01, M02 E as combinações integrais.
  // Se alguém escolheu "Manhã + Tarde", bloqueia TODOS os slots individuais.
  const conflitosGlobais = {
    'Manhã': ['M01', 'M02', 'Manhã + Tarde', 'Manhã + Noite'],
    'M01': ['Manhã', 'Manhã + Tarde', 'Manhã + Noite'],
    'M02': ['Manhã', 'Manhã + Tarde', 'Manhã + Noite'],
    'Tarde': ['T01', 'T02', 'Manhã + Tarde', 'Tarde + Noite'],
    'T01': ['Tarde', 'Manhã + Tarde', 'Tarde + Noite'],
    'T02': ['Tarde', 'Manhã + Tarde', 'Tarde + Noite'],
    'Noite': ['N01', 'N02', 'Manhã + Noite', 'Tarde + Noite'],
    'N01': ['Noite', 'Manhã + Noite', 'Tarde + Noite'],
    'N02': ['Noite', 'Manhã + Noite', 'Tarde + Noite'],
    'Manhã + Tarde': ['M01', 'M02', 'Manhã', 'T01', 'T02', 'Tarde'],
    'Manhã + Noite': ['M01', 'M02', 'Manhã', 'N01', 'N02', 'Noite'],
    'Tarde + Noite': ['T01', 'T02', 'Tarde', 'N01', 'N02', 'Noite'],
  };

  const periodosBloqueados = new Set();

  outrasUcs.forEach(item => {
    // Bloqueia o exato mesmo período (ninguém pode repetir)
    periodosBloqueados.add(item.periodo);
    // Bloqueia os períodos conflitantes (genérico vs granular)
    const conflitosDesseItem = conflitosGlobais[item.periodo] || [];
    conflitosDesseItem.forEach(c => periodosBloqueados.add(c));
  });

  return basePeriodos.filter(p => !periodosBloqueados.has(p));
}

function toggleUCSelection(uc) {
  const index = ucsSelecionadasTemp.value.findIndex(item => item.idUC === uc.idUC);
  if (index > -1) {
    ucsSelecionadasTemp.value.splice(index, 1);
  } else {
    ucsSelecionadasTemp.value.push({ uc: uc.nome, idUC: uc.idUC, periodo: "" });
  }
}

function isUCSelected(ucId) {
  return ucsSelecionadasTemp.value.some(item => item.idUC === ucId);
}

function getSelectedUCPeriod(ucId) {
  const item = ucsSelecionadasTemp.value.find(item => item.idUC === ucId);
  return item ? item.periodo : "";
}

function updateUCPeriod(ucId, periodo) {
  // Validação: Impede seleção de período bloqueado por conflito
  if (periodo !== "") {
    const disponiveis = periodosDisponiveisPara(ucId);
    if (!disponiveis.includes(periodo)) {
      showAlert(`Erro: O período '${periodo}' não pode ser selecionado devido a um conflito de horário com outra matéria já marcada.`, "warning", "mdi-clock-alert");
      return;
    }
  }

  const item = ucsSelecionadasTemp.value.find(item => item.idUC === ucId);
  if (item) {
    item.periodo = periodo;
    // Recria o array para forçar o Vue a re-renderizar
    ucsSelecionadasTemp.value = [...ucsSelecionadasTemp.value];
  }
}

function salvarUCs() {
  const ucsSemPeriodo = ucsSelecionadasTemp.value.filter(item => !item.periodo);
  if (ucsSemPeriodo.length > 0) {
    showAlert("Por favor, selecione o período para todas as unidades curriculares marcadas.", "warning");
    return;
  }
  ucsSalvas.value[diaDoModal.value] = [...ucsSelecionadasTemp.value];
  modalUC.value = false;
}

// Extrair professores únicos da turma
const listaDeProfessores = computed(() => {
  const profs = new Set();
  Object.values(ucsSalvas.value).forEach(ucsNoDia => {
    ucsNoDia.forEach(item => {
      if (item.professor) profs.add(item.professor);
    });
  });
  return Array.from(profs);
});

function removerProfessor(nome) {
  Object.keys(ucsSalvas.value).forEach(dia => {
    ucsSalvas.value[dia] = ucsSalvas.value[dia].filter(item => item.professor !== nome);
  });
}

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

// Valida que todos os turnos de um dia integral estão cobertos pelas UCs
const diasLabels = {
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sabado: 'Sábado',
};

function validarCoberturaGrade() {
  const erros = [];

  for (const [dia, periodo] of Object.entries(selectedPeriodo.value)) {
    if (!periodo) continue;

    const ucsNoDia = ucsSalvas.value[dia] || [];
    const periodosUsados = ucsNoDia.map(uc => uc.periodo);

    const temManhaCompleta = periodosUsados.includes('Manhã') ||
                             periodosUsados.includes('Manhã + Tarde') ||
                             periodosUsados.includes('Manhã + Noite') ||
                             (periodosUsados.includes('M01') && periodosUsados.includes('M02'));

    const temTardeCompleta = periodosUsados.includes('Tarde') ||
                             periodosUsados.includes('Manhã + Tarde') ||
                             periodosUsados.includes('Tarde + Noite') ||
                             (periodosUsados.includes('T01') && periodosUsados.includes('T02'));

    const temNoiteCompleta = periodosUsados.includes('Noite') ||
                             periodosUsados.includes('Manhã + Noite') ||
                             periodosUsados.includes('Tarde + Noite') ||
                             (periodosUsados.includes('N01') && periodosUsados.includes('N02'));

    if (periodo === 'manha') {
      if (!temManhaCompleta) {
        erros.push(`• ${diasLabels[dia]}: O período da Manhã deve ser totalmente preenchido. Selecione uma UC com o período "Manhã" inteiro ou duas UCs cobrindo "M01" e "M02".`);
      }
    } else if (periodo === 'tarde') {
      if (!temTardeCompleta) {
        erros.push(`• ${diasLabels[dia]}: O período da Tarde deve ser totalmente preenchido. Selecione uma UC com o período "Tarde" inteiro ou duas UCs cobrindo "T01" e "T02".`);
      }
    } else if (periodo === 'noite') {
      if (!temNoiteCompleta) {
        erros.push(`• ${diasLabels[dia]}: O período da Noite deve ser totalmente preenchido. Selecione uma UC com o período "Noite" inteiro ou duas UCs cobrindo "N01" e "N02".`);
      }
    } else if (periodo === 'INT_MT') {
      if (periodosUsados.includes('Manhã + Tarde')) continue;
      const faltando = [];
      if (!temManhaCompleta) faltando.push('Manhã (exige "Manhã" inteiro ou ambos "M01" e "M02")');
      if (!temTardeCompleta) faltando.push('Tarde (exige "Tarde" inteiro ou ambos "T01" e "T02")');
      if (faltando.length > 0) {
        erros.push(`• ${diasLabels[dia]} (Integral Manhã + Tarde): Os turnos devem ser totalmente preenchidos. Faltam: ${faltando.join(' e ')}.`);
      }
    } else if (periodo === 'INT_MN') {
      if (periodosUsados.includes('Manhã + Noite')) continue;
      const faltando = [];
      if (!temManhaCompleta) faltando.push('Manhã (exige "Manhã" inteiro ou ambos "M01" e "M02")');
      if (!temNoiteCompleta) faltando.push('Noite (exige "Noite" inteiro ou ambos "N01" e "N02")');
      if (faltando.length > 0) {
        erros.push(`• ${diasLabels[dia]} (Integral Manhã + Noite): Os turnos devem ser totalmente preenchidos. Faltam: ${faltando.join(' e ')}.`);
      }
    } else if (periodo === 'INT_TN') {
      if (periodosUsados.includes('Tarde + Noite')) continue;
      const faltando = [];
      if (!temTardeCompleta) faltando.push('Tarde (exige "Tarde" inteiro ou ambos "T01" e "T02")');
      if (!temNoiteCompleta) faltando.push('Noite (exige "Noite" inteiro ou ambos "N01" e "N02")');
      if (faltando.length > 0) {
        erros.push(`• ${diasLabels[dia]} (Integral Tarde + Noite): Os turnos devem ser totalmente preenchidos. Faltam: ${faltando.join(' e ')}.`);
      }
    }
  }

  return erros;
}

function salvar() {
  if (!form.value.dataInicio || !form.value.dataFim) {
    showAlert("Por favor, preencha as datas de início e término!", "warning");
    return;
  }

  const startDate = new Date(form.value.dataInicio + "T00:00:00");
  const endDate = new Date(form.value.dataFim + "T00:00:00");

  if (startDate > endDate) {
    showAlert("A data de início não pode ser maior que a data de término!", "warning");
    return;
  }

  // Validação: impedir seleção de dias da semana que não ocorrem no período da turma
  const mapaDiasJs = {
    segunda: 1,
    terca: 2,
    quarta: 3,
    quinta: 4,
    sexta: 5,
    sabado: 6
  };

  const diasSemOcorrencia = [];
  for (const [dia, periodo] of Object.entries(selectedPeriodo.value)) {
    if (periodo !== null) {
      const diaSemanaJs = mapaDiasJs[dia];
      let ocorrencias = 0;
      const current = new Date(startDate);
      while (current <= endDate) {
        if (current.getDay() === diaSemanaJs) {
          ocorrencias++;
        }
        current.setDate(current.getDate() + 1);
      }
      if (ocorrencias === 0) {
        diasSemOcorrencia.push(diasLabels[dia] || dia);
      }
    }
  }

  if (diasSemOcorrencia.length > 0) {
    const dataInicioBR = form.value.dataInicio.split("-").reverse().join("/");
    const dataFimBR = form.value.dataFim.split("-").reverse().join("/");
    showAlert(`O intervalo de datas selecionado (de ${dataInicioBR} a ${dataFimBR}) não contém o seguinte dia da semana: ${diasSemOcorrencia.join(", ")}. Remova esse dia da grade ou ajuste as datas da turma.`, "warning");
    return;
  }

  // Validação: impedir dias com período selecionado mas sem UC
  const diasSemUC = [];
  for (const [dia, periodo] of Object.entries(selectedPeriodo.value)) {
    if (periodo !== null) {
      const ucsDesteDia = ucsSalvas.value[dia] || [];
      if (ucsDesteDia.length === 0) {
        diasSemUC.push(diasLabels[dia] || dia);
      }
    }
  }
  if (diasSemUC.length > 0) {
    showAlert("Por favor, adicione pelo menos uma Unidade Curricular para os dias com período selecionado: " + diasSemUC.join(", "), "warning");
    return;
  }

  // Validação de cobertura da grade semanal: garante que todos os turnos selecionados estejam totalmente preenchidos
  const errosGrade = validarCoberturaGrade();
  if (errosGrade.length > 0) {
    showAlert("Erro na grade semanal:\n\n" + errosGrade.join("\n"), "error", "mdi-alert-octagon");
    return;
  }

  const horarios = [];
  for (const [diaSemana, listaUcs] of Object.entries(ucsSalvas.value)) {
    for (const ucItem of listaUcs) {
      if (!ucItem.periodo) continue;
      horarios.push({
        diaSemana,
        periodo: ucItem.periodo,
        idUC: ucItem.idUC,
        nomeUC: ucItem.uc,
      });
    }
  }

  emit("save", {
    ...form.value,
    horarios,
  });
}

</script>

<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="1200"
    scrollable>
    <v-card class="rounded-xl overflow-hidden">
      <v-toolbar color="red-darken-2" dark>
        <v-toolbar-title class="font-bold">Editar Turma: {{ turma?.label }}</v-toolbar-title>
        <v-spacer></v-spacer>

        <v-menu open-on-hover location="bottom" offset="10">
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props" class="mr-2">
              <v-icon>mdi-help-circle-outline</v-icon>
            </v-btn>
          </template>

          <v-card class="p-5 shadow-2xl rounded-xl dark:bg-gray-800 border-t-4 border-red-600" width="280">
            <div class="flex items-center gap-3 mb-4">
              <v-icon size="24" icon="mdi-book-open-outline" color="red"></v-icon>
              <h2 class="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tighter">Legenda</h2>
            </div>

            <div class="space-y-4">
              <div>
                <p class="font-black text-xs text-gray-400 uppercase mb-2">Manhã</p>
                <ul class="list-none space-y-1 ml-1">
                  <li class="flex items-center gap-2 text-[11px] font-bold text-gray-600 dark:text-gray-300">
                    <span class="text-red-500">•</span> <b>M01</b> &rarr; Antes do intervalo
                  </li>
                  <li class="flex items-center gap-2 text-[11px] font-bold text-gray-600 dark:text-gray-300">
                    <span class="text-red-500">•</span> <b>M02</b> &rarr; Depois do intervalo
                  </li>
                </ul>
              </div>

              <v-divider></v-divider>

              <div>
                <p class="font-black text-xs text-gray-400 uppercase mb-2">Tarde</p>
                <ul class="list-none space-y-1 ml-1">
                  <li class="flex items-center gap-2 text-[11px] font-bold text-gray-600 dark:text-gray-300">
                    <span class="text-red-500">•</span> <b>T01</b> &rarr; Antes do intervalo
                  </li>
                  <li class="flex items-center gap-2 text-[11px] font-bold text-gray-600 dark:text-gray-300">
                    <span class="text-red-500">•</span> <b>T02</b> &rarr; Depois do intervalo
                  </li>
                </ul>
              </div>

              <v-divider></v-divider>

              <div>
                <p class="font-black text-xs text-gray-400 uppercase mb-2">Noite</p>
                <ul class="list-none space-y-1 ml-1">
                  <li class="flex items-center gap-2 text-[11px] font-bold text-gray-600 dark:text-gray-300">
                    <span class="text-red-500">•</span> <b>N01</b> &rarr; Antes do intervalo
                  </li>
                  <li class="flex items-center gap-2 text-[11px] font-bold text-gray-600 dark:text-gray-300">
                    <span class="text-red-500">•</span> <b>N02</b> &rarr; Depois do intervalo
                  </li>
                </ul>
              </div>

              <v-divider></v-divider>

              <div>
                <p class="font-black text-xs text-gray-400 uppercase mb-2">Integral</p>
                <ul class="list-none space-y-1 ml-1">
                  <li class="flex items-center gap-2 text-[11px] font-bold text-gray-600 dark:text-gray-300">
                    <span class="text-red-500">•</span> <b>INT</b> &rarr; Integral
                  </li>
                </ul>
              </div>
            </div>
          </v-card>
        </v-menu>

        <v-btn icon @click="emit('update:modelValue', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-6 bg-gray-50 dark:bg-gray-900">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <!-- Coluna Esquerda: Info Básica -->
          <div
            class="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 class="text-lg font-bold border-b pb-2 mb-4 flex items-center gap-2">
              <v-icon color="red">mdi-information-outline</v-icon> Informações Gerais
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p class="mb-1 font-bold text-xs text-gray-500 uppercase">Nome da Turma</p>
                <v-text-field v-model="form.label" variant="filled" density="compact" hide-details></v-text-field>
              </div>
              <div>
                <p class="mb-1 font-bold text-xs text-gray-500 uppercase">Áreas</p>
                <v-select v-model="form.idArea" :items="filteredAreas" item-title="title" item-value="value" variant="filled"
                  density="compact" hide-details placeholder="Selecione..." :disabled="isOpp" persistent-placeholder></v-select>
              </div>
              <div>
                <p class="mb-1 font-bold text-xs text-gray-500 uppercase">Opp Responsável</p>
                <v-select v-model="form.idOPP" :items="oppsList" item-title="label" item-value="value"
                  variant="filled" density="compact" hide-details :disabled="isOpp || !form.idArea"
                  placeholder="Selecione uma Área primeiro..." persistent-placeholder></v-select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p class="mb-1 font-bold text-xs text-gray-500 uppercase">Tipo de Curso</p>
                <v-radio-group v-model="form.modalidade" inline hide-details density="compact">
                  <v-radio label="TÉC" value="tec" color="red" class="me-3"></v-radio>
                  <v-radio label="CAI" value="cai" color="red" class="me-3"></v-radio>
                  <v-radio label="FIC" value="fic" color="red" class="me-3"></v-radio>
                </v-radio-group>
              </div>

            </div>
          </div>

          <!-- Coluna Direita: Professores e Datas -->
          <div
            class="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 class="text-lg font-bold border-b pb-2 mb-4 flex items-center gap-2">
              <v-icon color="red">mdi-account-group-outline</v-icon> Professores e Datas
            </h3>

            <div class="mb-4">
              <p class="mb-2 font-bold text-xs text-gray-500 uppercase">Professores Adicionados</p>
              <div class="flex flex-wrap gap-2">
                <v-chip v-for="prof in listaDeProfessores" :key="prof" size="small" color="red" variant="tonal"
                  class="font-bold" closable @click:close="removerProfessor(prof)">
                  <v-avatar start icon="mdi-account" color="red-lighten-4"></v-avatar>
                  {{ prof }}
                </v-chip>
                <v-chip v-if="listaDeProfessores.length === 0" size="small" variant="text">Nenhum professor
                  vinculado</v-chip>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p class="mb-1 font-bold text-xs text-gray-500 uppercase">Data Início</p>
                <v-text-field v-model="form.dataInicio" type="date" variant="filled" density="compact"
                  hide-details></v-text-field>
              </div>
              <div>
                <p class="mb-1 font-bold text-xs text-gray-500 uppercase">Data Fim</p>
                <v-text-field v-model="form.dataFim" type="date" variant="filled" density="compact"
                  hide-details></v-text-field>
              </div>
              <div>
                <p class="mb-1 font-bold text-xs text-gray-500 uppercase">Aulas/Semana</p>
                <v-text-field v-model="form.aulasSemana" type="number" variant="filled" density="compact"
                  hide-details readonly></v-text-field>
              </div>
              <div>
                <p class="mb-1 font-bold text-xs text-gray-500 uppercase">Total de Aulas</p>
                <v-text-field v-model="form.totalAulas" type="number" variant="filled" density="compact"
                  hide-details readonly></v-text-field>
              </div>
            </div>

            <!-- Descrição -->
            <div class="mt-4">
              <p class="mb-1 font-bold text-xs text-gray-500 uppercase">Descrição (Opcional)</p>
              <v-textarea v-model="form.descricao" label="..." rows="3" variant="filled" density="compact"
                hide-details></v-textarea>
            </div>
          </div>
        </div>

        <!-- Grade Semanal (Estilo addTurmas) -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 class="text-lg font-bold border-b pb-2 mb-6 flex items-center gap-2">
            <v-icon color="red">mdi-calendar-clock</v-icon> Planejamento de Dias e Horários
          </h3>

          <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div v-for="dia in diasDaSemana" :key="dia.value">
              <p class="mb-2 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase text-center">
                {{ dia.label }}
              </p>
              <v-card variant="outlined"
                class="rounded-lg pa-3 h-[280px] flex flex-col border-gray-200 dark:border-gray-700">
                <div class="flex-1">
                  <!-- Período Selecionado -->
                  <div v-if="selectedPeriodo[dia.value]" class="w-full mb-3">
                    <!-- Se for Manhã -->
                    <div v-if="selectedPeriodo[dia.value] === 'manha'"
                      class="rounded-lg py-1.5 px-3 flex items-center justify-between border bg-amber-50 border-amber-200 text-amber-700">
                      <div class="flex items-center gap-1">
                        <v-icon icon="mdi-circle" size="8" color="#F59E0B"></v-icon>
                        <span class="text-xs font-bold">Manhã</span>
                      </div>
                      <v-icon icon="mdi-close" size="14" class="cursor-pointer"
                        @click="removerPeriodo(dia.value)"></v-icon>
                    </div>
                    <!-- Se for Tarde -->
                    <div v-else-if="selectedPeriodo[dia.value] === 'tarde'"
                      class="rounded-lg py-1.5 px-3 flex items-center justify-between border bg-blue-50 border-blue-200 text-blue-700">
                      <div class="flex items-center gap-1">
                        <v-icon icon="mdi-circle" size="8" color="#3B82F6"></v-icon>
                        <span class="text-xs font-bold">Tarde</span>
                      </div>
                      <v-icon icon="mdi-close" size="14" class="cursor-pointer"
                        @click="removerPeriodo(dia.value)"></v-icon>
                    </div>
                    <!-- Se for Noite -->
                    <div v-else-if="selectedPeriodo[dia.value] === 'noite'"
                      class="rounded-lg py-1.5 px-3 flex items-center justify-between border bg-indigo-50 border-indigo-200 text-indigo-700">
                      <div class="flex items-center gap-1">
                        <v-icon icon="mdi-circle" size="8" color="#6366F1"></v-icon>
                        <span class="text-xs font-bold">Noite</span>
                      </div>
                      <v-icon icon="mdi-close" size="14" class="cursor-pointer"
                        @click="removerPeriodo(dia.value)"></v-icon>
                    </div>
                    <!-- Se for Integral (qualquer combinação) -->
                    <div v-else-if="isIntegral(selectedPeriodo[dia.value])"
                      class="rounded-lg py-1.5 px-3 flex items-center justify-between border bg-emerald-50 border-emerald-200 text-emerald-700">
                      <div class="flex items-center gap-1">
                        <v-icon icon="mdi-circle" size="8" color="#10B981"></v-icon>
                        <span class="text-[11px] font-bold">{{ integralLabels[selectedPeriodo[dia.value]] }}</span>
                      </div>
                      <v-icon icon="mdi-close" size="14" class="cursor-pointer"
                        @click="removerPeriodo(dia.value)"></v-icon>
                    </div>

                    <div class="px-2">
                      <v-btn block variant="tonal" size="small" class="mt-3" @click="abrirModalUC(dia.value)">
                        <v-icon start size="small">mdi-plus</v-icon> UC
                      </v-btn>
                    </div>

                    <div class="mt-3 space-y-1 scroll-custom max-h-[184px] overflow-y-auto px-2">
                      <div v-for="(item, i) in ucsSalvas[dia.value]" :key="i"
                        class="text-[11px] bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 flex justify-between items-center group">
                        <div class="flex-1 flex justify-between items-center pr-1">
                          <span class="dark:text-white font-bold leading-tight">{{ item.uc }}</span>
                          <span class="font-bold text-red-600 ml-2 whitespace-nowrap">{{ item.periodo }}</span>
                        </div>
                        <v-icon icon="mdi-close" size="12" class="cursor-pointer opacity-0 group-hover:opacity-100" @click="ucsSalvas[dia.value].splice(i, 1)"></v-icon>
                      </div>
                    </div>
                  </div>

                  <!-- Seletor de Período -->
                  <div v-else class="flex flex-col items-center justify-center text-center h-full">
                    <v-avatar color="#F3F3F1" class="dark:bg-gray-700 mb-2" size="40">
                      <v-icon icon="mdi-clock-outline" size="24" class="text-gray-300 dark:text-gray-400"></v-icon>
                    </v-avatar>
                    <p class="text-[13px] font-bold text-gray-500 dark:text-gray-400 leading-tight mb-4">
                      Toque para Selecionar o Periodo
                    </p>
                    <div class="w-full px-4 mb-2">
                      <!-- Menu principal: Manhã, Tarde, Noite, Integral -->
                      <template v-if="!integralSubMenu[dia.value]">
                        <div class="flex flex-col gap-2 pt-1">
                          <button
                            v-for="p in periodos"
                            :key="p.value"
                            class="w-full py-2 px-3 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2 hover:border-red-500 hover:text-red-600 dark:hover:border-red-500 dark:hover:text-red-400 transition-all duration-200 shadow-sm active:scale-98 cursor-pointer"
                            @click="togglePeriodo(dia.value, p.value)"
                          >
                            <span
                              class="w-2 h-2 rounded-full"
                              :style="{
                                backgroundColor:
                                  p.value === 'manha' ? '#F59E0B' :
                                  p.value === 'tarde' ? '#3B82F6' :
                                  p.value === 'noite' ? '#6366F1' : '#10B981'
                              }"
                            ></span>
                            {{ p.label }}
                          </button>
                        </div>
                      </template>
                      <!-- Sub-menu do Integral: 3 combinações -->
                      <template v-else>
                        <div class="flex flex-col gap-2">
                          <p class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1 text-center">Qual Integral?</p>
                          <button
                            class="w-full py-2 px-3 text-xs font-bold rounded-lg border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-400 transition-all duration-200 active:scale-98 cursor-pointer"
                            @click="selecionarIntegral(dia.value, 'INT_MT')"
                          >
                            Manhã + Tarde
                          </button>
                          <button
                            class="w-full py-2 px-3 text-xs font-bold rounded-lg border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-400 transition-all duration-200 active:scale-98 cursor-pointer"
                            @click="selecionarIntegral(dia.value, 'INT_MN')"
                          >
                            Manhã + Noite
                          </button>
                          <button
                            class="w-full py-2 px-3 text-xs font-bold rounded-lg border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-400 transition-all duration-200 active:scale-98 cursor-pointer"
                            @click="selecionarIntegral(dia.value, 'INT_TN')"
                          >
                            Tarde + Noite
                          </button>
                          <button
                            class="w-full py-1 text-[11px] font-bold text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-1 mt-1 cursor-pointer"
                            @click="integralSubMenu[dia.value] = false"
                          >
                            <v-icon icon="mdi-arrow-left" size="12"></v-icon> Voltar
                          </button>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </v-card>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4 bg-gray-50 dark:bg-gray-800">
        <v-spacer></v-spacer>
        <v-btn variant="text" color="grey-darken-1" @click="emit('update:modelValue', false)">Cancelar</v-btn>
        <v-btn color="red-darken-1" class="bg-red-600 text-white px-6" :loading="loading" :disabled="loading" @click="salvar">Salvar</v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="modalUC" max-width="550" persistent>
      <v-card class="rounded-lg border-t-4 border-red-600 shadow-xl dark:bg-[#121212]">
        <!-- Título com o padrão do sistema -->
        <v-card-title class="px-6 pt-6 pb-2">
          <h2 class="text-xl font-bold text-gray-800 dark:text-white">Selecionar Unidades Curriculares</h2>
          <p class="text-[12px] text-gray-500 font-medium">Escolha as matérias que compõem este dia da turma</p>
        </v-card-title>

        <v-divider class="mx-6 mb-4"></v-divider>

        <!-- Área de Filtros - Seguindo o padrão de inputs do formulário -->
        <div class="px-6 space-y-3 mb-4">
          <div>
            <p class="mb-1 font-bold text-[12px] text-gray-500 uppercase tracking-wide">Filtrar por Área</p>
            <v-select v-model="areaFiltroModal" :items="areasDisponiveis" item-title="title" item-value="value"
              placeholder="Selecione a área..." variant="filled" density="compact" hide-details clearable></v-select>
          </div>

          <div>
            <p class="mb-1 font-bold text-[12px] text-gray-500 uppercase tracking-wide">Buscar Unidade</p>
            <v-text-field v-model="buscaUC" placeholder="Digite o nome da UC..." variant="filled" hide-details
              prepend-inner-icon="mdi-magnify" density="compact"></v-text-field>
          </div>
        </div>

        <!-- Lista de UCs com checkboxes + período -->
        <div style="max-height: 350px; overflow-y: auto" class="px-6 pt-2">
          <div v-for="(uc, index) in filteredCompetencias" :key="uc.idUC" class="flex items-center gap-2 mb-4">
            <v-checkbox :model-value="isUCSelected(uc.idUC)" @update:model-value="toggleUCSelection(uc)"
              :label="uc.carga ? uc.nome + ' (' + uc.carga + ')' : uc.nome" color="red" hide-details density="compact"
              :disabled="!isUCSelected(uc.idUC) && periodosDisponiveisPara(uc.idUC).length === 0"
              class="flex-1"></v-checkbox>
            <v-select v-if="isUCSelected(uc.idUC)" :model-value="getSelectedUCPeriod(uc.idUC)"
              @update:model-value="updateUCPeriod(uc.idUC, $event)" :items="periodosDisponiveisPara(uc.idUC)" label="Período"
              variant="outlined" density="compact" hide-details class="max-w-[130px]"></v-select>
          </div>
          <div v-if="filteredCompetencias.length === 0" class="text-center py-10 text-gray-400 font-bold uppercase text-xs">
            Nenhuma unidade encontrada
          </div>
        </div>

        <!-- Botões de Ação - Padronizados -->
        <v-card-actions class="px-6 py-6 pt-2">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" color="red" class="px-6 text-none font-bold" @click="modalUC = false">
            Cancelar
          </v-btn>
          <v-btn color="red" class="bg-red-600 text-white px-8 text-none font-bold shadow-md" @click="salvarUCs">
            Salvar Seleção
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar de Alertas Premium -->
    <v-snackbar 
      v-model="snackbar.show" 
      :color="snackbar.color" 
      :timeout="snackbar.timeout" 
      location="top center" 
      class="mt-1"
      elevation="24"
      rounded="xl"
      style="z-index: 10000;"
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
  </v-dialog>
</template>
