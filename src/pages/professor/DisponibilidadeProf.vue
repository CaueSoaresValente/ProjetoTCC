<script setup>
// ============================================================
// DisponibilidadeProf.vue
// ============================================================
// Esta página permite que o professor marque os dias e
// períodos em que está disponível para dar aula.
//
// COMO FUNCIONA:
// 1. Ao abrir, buscamos no banco os períodos já salvos
// 2. O professor clica nos períodos para marcar/desmarcar
//    (pode marcar VÁRIOS períodos no mesmo dia!)
// 3. Ao clicar "Salvar", enviamos tudo para o backend
//    de uma vez via PUT /api/professor/:id/disponibilidade
// ============================================================

import { ref, computed, onMounted } from "vue";
import { useTheme } from "vuetify";
import { getUsuarioLogado } from "@/services/api";

const theme = useTheme();
const isDark = computed(() => theme.global.current.value.dark);

// ID do professor (buscamos via API ao montar)
const idProfessor = ref(null);

// Estado de carregamento e salvamento
const carregando = ref(true);
const salvando = ref(false);

// Snackbar para feedback bonito
const snackbar = ref({ show: false, text: "", color: "success" });
const mostrarNotificacao = (text, color = "success") => {
  snackbar.value = { show: true, text, color };
};

// =============================================
// CONFIGURAÇÃO DOS DIAS E PERÍODOS
// =============================================
const diasDaSemana = [
  { label: "Segunda", value: "segunda" },
  { label: "Terça",   value: "terca"   },
  { label: "Quarta",  value: "quarta"  },
  { label: "Quinta",  value: "quinta"  },
  { label: "Sexta",   value: "sexta"   },
  { label: "Sábado",  value: "sabado"  },
];

const periodos = [
  { label: "Manhã", value: "manha", icon: "mdi-weather-sunny",  color: "#F59E0B" },
  { label: "Tarde", value: "tarde", icon: "mdi-weather-sunset", color: "#3B82F6" },
  { label: "Noite", value: "noite", icon: "mdi-weather-night",  color: "#6366F1" },
];

// =============================================
// ESTADO REATIVO
// =============================================
// selectedPeriodos é um objeto onde cada chave é um dia
// e o valor é um ARRAY de períodos selecionados.
//
// Exemplo:
//   {
//     segunda: ["manha", "tarde"],  ← Professor tem Manhã E Tarde na Segunda
//     sexta:   ["noite"],
//     terca:   [],                  ← Sem disponibilidade na Terça
//   }
const selectedPeriodos = ref({
  segunda: [],
  terca:   [],
  quarta:  [],
  quinta:  [],
  sexta:   [],
  sabado:  [],
});

// =============================================
// FUNÇÕES DE CONTROLE DE SELEÇÃO
// =============================================

// Verifica se um período está marcado em um dia
const isPeriodoSelecionado = (dia, periodo) => {
  return selectedPeriodos.value[dia]?.includes(periodo) ?? false;
};

// Marca ou desmarca um período (toggle)
// Se já estava marcado → remove. Se não estava → adiciona.
const togglePeriodo = (dia, periodo) => {
  const lista = selectedPeriodos.value[dia];
  const index = lista.indexOf(periodo);

  if (index === -1) {
    // Não existia → adiciona
    lista.push(periodo);
  } else {
    // Já existia → remove
    lista.splice(index, 1);
  }
};

// Conta quantos períodos estão marcados em um dia
const contarPeriodos = (dia) => {
  return selectedPeriodos.value[dia]?.length ?? 0;
};

// =============================================
// INTEGRAÇÃO COM A API
// =============================================

// Busca as disponibilidades salvas no banco e preenche o estado local
const carregarDisponibilidades = async (professorId) => {
  try {
    const response = await fetch(`http://localhost:3001/api/professor/${professorId}/disponibilidade`);
    if (!response.ok) return;

    const dados = await response.json();

    // Limpa o estado atual antes de preencher
    for (const dia of diasDaSemana) {
      selectedPeriodos.value[dia.value] = [];
    }

    // Preenche com o que veio do banco
    // Cada item tem { diaSemana: "segunda", periodo: "manha", ... }
    for (const item of dados) {
      if (selectedPeriodos.value[item.diaSemana] !== undefined) {
        selectedPeriodos.value[item.diaSemana].push(item.periodo);
      }
    }
  } catch (e) {
    console.error("Erro ao carregar disponibilidades:", e);
  }
};

// Salva toda a semana de uma vez no banco
// Envia um objeto { disponibilidades: { segunda: ["manha"], ... } }
const salvarDisponibilidades = async () => {
  if (!idProfessor.value) {
    mostrarNotificacao("Erro: professor não identificado.", "error");
    return;
  }

  salvando.value = true;
  try {
    const response = await fetch(
      `http://localhost:3001/api/professor/${idProfessor.value}/disponibilidade`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disponibilidades: selectedPeriodos.value }),
      }
    );

    if (!response.ok) {
      const erro = await response.json();
      throw new Error(erro.message || "Erro ao salvar");
    }

    mostrarNotificacao("Disponibilidade salva com sucesso! ✓");
  } catch (e) {
    mostrarNotificacao(e.message, "error");
  } finally {
    salvando.value = false;
  }
};

// =============================================
// INICIALIZAÇÃO
// =============================================
onMounted(async () => {
  try {
    const usuario = getUsuarioLogado();
    if (!usuario) return;

    // Busca o professor pelo idCadastro do login
    const response = await fetch(
      `http://localhost:3001/api/professor/cadastro/${usuario.idUsuario}`
    );

    if (response.ok) {
      const professor = await response.json();
      idProfessor.value = professor.idProfessor;
      await carregarDisponibilidades(professor.idProfessor);
    }
  } catch (e) {
    console.error("Erro ao inicializar:", e);
  } finally {
    carregando.value = false;
  }
});
</script>

<template>
  <div>
  <div class="px-4 md:px-10 lg:px-20 xl:px-40 mt-8 pb-24">

    <!-- Header da Página -->
    <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <div class="flex items-center gap-3">
        <div class="bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
          <v-icon icon="mdi-clock-check" size="28"></v-icon>
        </div>
        <div>
          <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
            Disponibilidade Semanal
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Selecione os períodos em que você estará disponível para lecionar. Você pode marcar
            <span class="text-gray-800 dark:text-gray-200 font-semibold">vários períodos</span> no mesmo dia.
          </p>
        </div>
      </div>

      <!-- Botão Salvar -->
      <v-btn
        color="red-darken-2"
        variant="elevated"
        size="large"
        :loading="salvando"
        :disabled="carregando"
        prepend-icon="mdi-content-save-outline"
        class="font-bold rounded-xl px-8 shrink-0 self-end md:self-center"
        @click="salvarDisponibilidades"
      >
        Salvar Disponibilidade
      </v-btn>
    </div>

    <!-- Skeleton de carregamento -->
    <div v-if="carregando" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <v-skeleton-loader
        v-for="i in 6"
        :key="i"
        type="card"
        class="rounded-2xl"
        height="240"
      />
    </div>

    <!-- Grid de Dias da Semana -->
    <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <div
        v-for="dia in diasDaSemana"
        :key="dia.value"
        class="group"
      >
        <!-- Label do dia + badge de contagem -->
        <div class="flex items-center justify-between mb-3 px-1">
          <span class="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest group-hover:text-red-500 transition-colors">
            {{ dia.label }}
          </span>
          <!-- Badge mostrando quantos períodos estão selecionados -->
          <span
            v-if="contarPeriodos(dia.value) > 0"
            class="text-xs font-black bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center"
          >
            {{ contarPeriodos(dia.value) }}
          </span>
        </div>

        <!-- Card do Dia -->
        <v-card
          variant="flat"
          class="rounded-2xl border-2 transition-all duration-300 overflow-hidden"
          :class="contarPeriodos(dia.value) > 0
            ? 'border-gray-900 dark:border-white shadow-md bg-white dark:bg-[#1E1E1E]'
            : 'border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30'"
        >
          <div class="p-4 flex flex-col gap-2">

            <!-- Ícone quando não tem nada selecionado -->
            <div
              v-if="contarPeriodos(dia.value) === 0"
              class="flex flex-col items-center justify-center py-4 opacity-30 group-hover:opacity-50 transition-opacity"
            >
              <v-icon icon="mdi-calendar-blank-outline" size="32" color="grey" />
              <p class="text-[10px] font-black text-center mt-2 uppercase tracking-tight text-gray-400">
                Nenhum período
              </p>
            </div>

            <!-- Botões de cada período -->
            <button
              v-for="p in periodos"
              :key="p.value"
              @click="togglePeriodo(dia.value, p.value)"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all duration-200 cursor-pointer"
              :class="isPeriodoSelecionado(dia.value, p.value)
                ? 'border-transparent text-white font-bold shadow-md scale-[1.02]'
                : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 hover:scale-[1.01]'"
              :style="isPeriodoSelecionado(dia.value, p.value)
                ? { backgroundColor: p.color }
                : {}"
            >
              <!-- Ícone do período -->
              <v-icon
                :icon="p.icon"
                size="16"
                :color="isPeriodoSelecionado(dia.value, p.value) ? 'white' : p.color"
              />
              <!-- Label do período -->
              <span
                class="text-[11px] font-bold uppercase tracking-tight"
                :class="isPeriodoSelecionado(dia.value, p.value)
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-300'"
              >
                {{ p.label }}
              </span>
              <!-- Check quando selecionado -->
              <v-icon
                v-if="isPeriodoSelecionado(dia.value, p.value)"
                icon="mdi-check"
                size="14"
                color="white"
                class="ml-auto"
              />
            </button>

          </div>
        </v-card>
      </div>
    </div>

    <!-- Legenda explicativa -->
    <div class="mt-10 flex flex-wrap gap-4 justify-center text-xs text-gray-400 font-medium">
      <span class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded-full" style="background-color:#F59E0B"></span> Manhã (6h–12h)
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded-full" style="background-color:#3B82F6"></span> Tarde (12h–18h)
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded-full" style="background-color:#6366F1"></span> Noite (18h–22h)
      </span>
    </div>
  </div>

  <!-- SNACKBAR DE NOTIFICAÇÃO -->
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
      />
      <span class="font-medium text-white">{{ snackbar.text }}</span>
    </div>
    <template v-slot:actions>
      <v-btn color="white" variant="text" icon="mdi-close" @click="snackbar.show = false" />
    </template>
  </v-snackbar>
  </div>
</template>

<style scoped>
/* Animação suave ao marcar/desmarcar */
button {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>