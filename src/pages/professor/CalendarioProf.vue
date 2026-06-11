<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useTheme } from "vuetify";
import { buscarMeuCalendario } from "@/services/api";

const theme = useTheme();

// Detecta se o tema atual é dark
const isDark = computed(() => theme.global.current.value.dark);

// Itens do menu dropdown do avatar (Padronizado)
const items = ref([
  { title: "Meu Perfil", icon: "mdi-account-outline" },
  { title: "Sair", icon: "mdi-logout" },
]);

// --- ANIMAÇÃO DE OCUPAÇÃO ---
const ocupacaoAlvo = ref(0);
const ocupacaoExibida = ref(0);
const carregando = ref(true);

const iniciarAnimacaoOcupacao = (alvo) => {
  ocupacaoExibida.value = 0;
  if (alvo === 0) return;
  const duracao = 1500; // Tempo total da animação em milissegundos
  const intervalo = duracao / alvo;
  
  const timer = setInterval(() => {
    if (ocupacaoExibida.value < alvo) {
      ocupacaoExibida.value++;
    } else {
      clearInterval(timer);
    }
  }, intervalo);
};

const carregarCalendario = async () => {
  try {
    const dados = await buscarMeuCalendario();
    todasAsAulas.value = dados.aulas || [];
    ocupacaoAlvo.value = dados.ocupacao || 0;
    iniciarAnimacaoOcupacao(ocupacaoAlvo.value);
  } catch (error) {
    console.error("Erro ao carregar dados do calendário:", error);
  } finally {
    carregando.value = false;
  }
};

let wsListener;

onMounted(async () => {
  await carregarCalendario();

  wsListener = (event) => {
    const detail = event.detail;
    if (detail.entity === 'turmas' || detail.entity === 'professores') {
      console.log("🔄 Recarregando calendário do professor em tempo real...");
      carregarCalendario();
    }
  };
  window.addEventListener('websocket-data-updated', wsListener);
});

onBeforeUnmount(() => {
  if (wsListener) {
    window.removeEventListener('websocket-data-updated', wsListener);
  }
});

// --- LÓGICA DO CALENDÁRIO REAL ---

const dataFoco = ref(new Date()); // Data que controla o que vemos (mês/ano)

// Nomes dos dias e meses
const diasDaSemana = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

// Computed para formatar apenas o Mês (ex: Março)
const tituloMesSolo = computed(() => {
  const nomeMes = dataFoco.value.toLocaleDateString('pt-BR', { month: 'long' });
  return nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
});

// --- DADOS DAS AULAS ---
const todasAsAulas = ref([]);

// Função principal que gera a grade de 42 dias
const gradeDias = computed(() => {
  const ano = dataFoco.value.getFullYear();
  const mes = dataFoco.value.getMonth();
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
  const totalDiasMesAnterior = new Date(ano, mes, 0).getDate();
  
  const dias = [];
  for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
    dias.push({ 
      num: totalDiasMesAnterior - i, 
      outroMes: true,
      dataCompleta: new Date(ano, mes - 1, totalDiasMesAnterior - i)
    });
  }
  for (let i = 1; i <= totalDiasMes; i++) {
    const hoje = new Date();
    const isHoje = i === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();
    
    // Procura se tem aula nesse dia
    const infoAula = todasAsAulas.value.find(a => a.dia === i && a.mes === mes && a.ano === ano);
    
    dias.push({ 
      num: i, 
      outroMes: false, 
      isHoje,
      temAula: !!infoAula,
      infoAula: infoAula || null,
      dataCompleta: new Date(ano, mes, i)
    });
  }
  const slotsRestantes = 42 - dias.length;
  for (let i = 1; i <= slotsRestantes; i++) {
    dias.push({ 
      num: i, 
      outroMes: true,
      dataCompleta: new Date(ano, mes + 1, i)
    });
  }
  return dias;
});

// Computed para filtrar apenas as aulas futuras (Próximas Aulas)
const proximasAulas = computed(() => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  return todasAsAulas.value
    .map(a => ({ ...a, dataCompleta: new Date(a.ano, a.mes, a.dia) }))
    .filter(a => a.dataCompleta >= hoje)
});

// Funções de Navegação
const navegarMes = (direcao) => {
  const novoMes = dataFoco.value.getMonth() + direcao;
  dataFoco.value = new Date(dataFoco.value.getFullYear(), novoMes, 1);
};

// Lista de anos para o dropdown
const listaAnos = computed(() => {
  const anoAtual = new Date().getFullYear();
  const anos = [];
  for (let i = anoAtual - 5; i <= anoAtual + 10; i++) {
    anos.push(i);
  }
  return anos;
});

// Computed para o ano no dropdown
const anoSelecionado = computed({
  get: () => dataFoco.value.getFullYear(),
  set: (novoAno) => {
    dataFoco.value = new Date(novoAno, dataFoco.value.getMonth(), 1);
  }
});

</script>

<template>
  <div class="px-4 md:px-10 lg:px-20 xl:px-40 mt-8 pb-10">
    <div class="flex items-center gap-3 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
      <div class="bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
        <v-icon icon="mdi-calendar-month" size="28"></v-icon>
      </div>
      <div>
        <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Meu calendário</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Consulte suas aulas agendadas, horários e compromissos.
        </p>
      </div>
    </div>
    <v-card class="rounded-xl p-6 shadow-lg" variant="flat">
      <v-row>
        <!-- Lado Esquerdo: O Calendário -->
        <v-col cols="12" md="8">
          <div class="flex items-center justify-between mb-6 px-4 gap-2">
            <div class="flex items-center gap-1">
              <v-btn icon="mdi-chevron-left" variant="tonal" size="small" rounded="lg" @click="navegarMes(-1)"></v-btn>
              <v-btn icon="mdi-chevron-right" variant="tonal" size="small" rounded="lg" @click="navegarMes(1)"></v-btn>
            </div>
            <div class="flex flex-col items-center">
              <span class="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">VISUALIZAÇÃO MENSAL</span>
              <h2 class="text-2xl font-black text-gray-800 dark:text-white">{{ tituloMesSolo }}</h2>
            </div>
            <div class="w-28">
              <v-select v-model="anoSelecionado" :items="listaAnos" variant="outlined" density="compact" hide-details
                rounded="lg" label="Ano" class="bg-white dark:bg-gray-800"></v-select>
            </div>
          </div>

          <!-- Grade do Calendário -->
          <div class="rounded-2xl overflow-hidden bg-white dark:bg-[#121212] border border-gray-200/60 dark:border-gray-700/50 shadow-md">
            <div class="grid grid-cols-7 bg-gray-50 dark:bg-gray-800 border-b">
              <div v-for="diaS in diasDaSemana" :key="diaS"
                class="py-3 text-center text-[10px] font-black text-gray-400 tracking-tighter">
                {{ diaS }}
              </div>
            </div>
            <div class="grid grid-cols-7">
              <div v-for="(dia, idx) in gradeDias" :key="idx"
                class="h-20 flex items-start justify-end p-2 relative group transition-all" 
                :class="[
                  (idx + 1) % 7 !== 0 ? 'border-r' : '',
                  idx < 35 ? 'border-b' : '',
                  dia.outroMes ? 'bg-gray-50/50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-800',
                  dia.temAula ? 'bg-green-50 dark:bg-green-900/20' : '',
                  dia.isHoje ? 'ring-2 ring-inset ring-red-500' : ''
                ]">
                <span class="text-sm font-black z-10" :class="[
                  dia.outroMes ? 'text-gray-300 dark:text-gray-600' : 'text-gray-800 dark:text-gray-200',
                  dia.isHoje ? 'text-red-600 dark:text-red-400' : ''
                ]">
                  {{ dia.num.toString().padStart(2, '0') }}
                </span>
                <v-menu v-if="dia.temAula" open-on-hover location="bottom center" transition="scale-transition">
                  <template v-slot:activator="{ props }">
                    <div v-bind="props" class="absolute inset-0 cursor-pointer flex items-center justify-center">
                      <div class="w-full h-full bg-green-500/10 hover:bg-green-500/20 transition-colors"></div>
                    </div>
                  </template>
                  <v-card class="p-4 rounded-xl shadow-xl border-2 border-green-500" width="280">
                    <div class="space-y-1">
                      <p class="text-[10px] font-bold text-green-600 uppercase">{{
                        dia.dataCompleta.toLocaleDateString('pt-BR', {
                          weekday: 'long', day: 'numeric', month: 'short'
                        })
                        }}</p>
                      <p class="text-sm font-black text-gray-800">{{ dia.infoAula.materia }}</p>
                      <p class="text-xs font-bold text-gray-600">Turma: <span class="text-black">{{ dia.infoAula.turma }}</span></p>
                      <p class="text-xs font-bold text-gray-600">Periodo: <span class="text-black">{{ dia.infoAula.periodo }}</span></p>
                      <hr class="my-2 border-gray-100">
                      <p class="text-xs font-bold text-gray-800">{{ dia.infoAula.professor }}</p>
                      <p class="text-[10px] text-gray-400">{{ dia.infoAula.cargo }}</p>
                    </div>
                  </v-card>
                </v-menu>
              </div>
            </div>
          </div>
        </v-col>

        <!-- Lado Direito: Info Lateral -->
        <v-col cols="12" md="4" class="pl-md-8">
          <div class="flex flex-col h-full border-l-2 border-gray-100 dark:border-gray-800 pl-6">
            <div class="mb-4">
              <p class="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">OCUPAÇÃO SEMANAL</p>
              <h3 class="text-6xl font-black text-green-500">{{ ocupacaoExibida }}%</h3>
            </div>
            <div class="flex-grow">
              <p class="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">PRÓXIMAS AULAS</p>
              
              <div v-if="proximasAulas.length > 0" class="space-y-3 overflow-y-auto pr-2 max-h-[380px] custom-scrollbar">
                <v-card v-for="(aula, i) in proximasAulas" :key="i" variant="flat" 
                  class="bg-green-100 dark:bg-green-900/30 rounded-xl p-4 border-l-4 border-green-500">
                  <div class="space-y-1">
                    <p class="text-xs font-bold text-gray-600 dark:text-gray-300">
                      {{ aula.dataCompleta.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' }) }}
                    </p>
                    <p class="text-lg font-black text-gray-900 dark:text-white">{{ aula.materia }}</p>
                    <p class="text-sm font-bold text-gray-700 dark:text-gray-200">Turma: {{ aula.turma }}</p>
                    <p class="text-sm font-bold text-gray-700 dark:text-gray-200">Periodo: {{ aula.periodo }}</p>
                  </div>
                </v-card>
              </div>

              <v-alert v-else type="info" variant="tonal" class="rounded-xl">
                Nenhuma aula programada.
              </v-alert>
            </div>
            <div class="mt-10 self-end">
              <v-menu open-on-hover location="top" offset="10">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" variant="outlined"
                    class="rounded-lg border-2 font-black text-gray-800 dark:text-white px-8"
                    style="border-top-color: red !important; border-top-width: 4px !important;">
                    <template v-slot:prepend>
                      <v-icon icon="mdi-clipboard-list-outline" size="small"></v-icon>
                    </template>
                    Legenda
                  </v-btn>
                </template>

                <v-card class="border-t-6 border-red-600 p-5 shadow-2xl rounded-xl dark:bg-gray-800" width="280">
                  <div class="flex items-center gap-3 mb-4">
                    <v-icon size="24" icon="mdi-book-open-outline" color="red"></v-icon>
                    <h2 class="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tighter">Legenda</h2>
                  </div>

                  <div class="space-y-4">
                    <div>
                      <p class="font-black text-sm text-gray-400 uppercase mb-2">Manhã</p>
                      <ul class="list-none space-y-1 ml-1">
                        <li class="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                          <span class="text-red-500">•</span> <b>M01</b> &rarr; Antes do intervalo
                        </li>
                        <li class="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                          <span class="text-red-500">•</span> <b>M02</b> &rarr; Depois do intervalo
                        </li>
                      </ul>
                    </div>

                    <v-divider></v-divider>

                    <div>
                      <p class="font-black text-sm text-gray-400 uppercase mb-2">Tarde</p>
                      <ul class="list-none space-y-1 ml-1">
                        <li class="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                          <span class="text-red-500">•</span> <b>T01</b> &rarr; Antes do intervalo
                        </li>
                        <li class="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                          <span class="text-red-500">•</span> <b>T02</b> &rarr; Depois do intervalo
                        </li>
                      </ul>
                    </div>

                    <v-divider></v-divider>

                    <div>
                      <p class="font-black text-sm text-gray-400 uppercase mb-2">Noite</p>
                      <ul class="list-none space-y-1 ml-1">
                        <li class="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                          <span class="text-red-500">•</span> <b>N01</b> &rarr; Antes do intervalo
                        </li>
                        <li class="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                          <span class="text-red-500">•</span> <b>N02</b> &rarr; Depois do intervalo
                        </li>
                      </ul>
                    </div>

                    <v-divider></v-divider>

                    <div>
                      <p class="font-black text-sm text-gray-400 uppercase mb-2">Integral</p>
                      <ul class="list-none space-y-1 ml-1">
                        <li class="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                          <span class="text-red-500">•</span> <b>INT</b> &rarr; Integral
                        </li>
                      </ul>
                    </div>
                  </div>
                </v-card>
              </v-menu>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<style scoped>
.grid-cols-7>div:nth-child(7n) { border-right: none; }
.grid-cols-7>div:nth-last-child(-n+7) { border-bottom: none; }
.group:hover .text-sm { transform: scale(1.1); transition: transform 0.2s; }
.v-card { transition: all 0.3s ease; }

/* Custom scrollbar for a cleaner premium look */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #475569;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
</style>