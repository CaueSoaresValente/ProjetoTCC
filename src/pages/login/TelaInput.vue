<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import Menu from "@/components/Menu.vue";
import { getUsuarioLogado } from "@/services/api";

const router = useRouter();
const usuario = ref(getUsuarioLogado());

const actionButtonText = computed(() => {
  return usuario.value ? "Acessar Painel" : "Acessar o Sistema";
});

function handleCTA() {
  if (usuario.value) {
    const funcao = usuario.value.funcao;
    if (funcao === "gestor" || funcao === "opp") {
      router.push("/turmas");
    } else if (funcao === "professor") {
      router.push("/calendarioprof");
    } else {
      router.push("/turmas");
    }
  } else {
    router.push("/login");
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col">
    <!-- Menu Fixo no Topo -->
    <Menu />

    <!-- Conteúdo Centralizado Vertical e Horizontalmente -->
    <main class="flex-grow flex items-center justify-center pt-28 pb-12 px-4">
      <div 
        class="w-full max-w-xl bg-white dark:bg-[#121212] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800/60 p-8 md:p-12 text-center transition-all duration-300 hover:shadow-red-500/5 hover:-translate-y-1"
      >
        <!-- Ícone Educacional Redondo Premium -->
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-500 mb-8 shadow-inner">
          <v-icon icon="mdi-school" size="44"></v-icon>
        </div>

        <!-- Título e Subtítulo -->
        <h2 class="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4 leading-tight">
          Gestão de Professores
        </h2>
        
        <p class="text-gray-500 dark:text-gray-400 text-base md:text-lg mb-10 max-w-md mx-auto leading-relaxed font-light font-sans">
          Plataforma para alocação de docentes, controle de disponibilidades, visualização de grades curriculares e turmas do SENAI.
        </p>

        <!-- Ação Principal -->
        <div class="flex flex-col gap-5 items-center">
          <v-btn
            size="x-large"
            block
            flat
            class="!bg-red-600 hover:!bg-red-700 text-white font-extrabold rounded-xl shadow-lg hover:shadow-red-500/20 transition-all duration-300 transform active:scale-95 text-base py-4"
            @click="handleCTA"
          >
            {{ actionButtonText }}
          </v-btn>
          
          <div class="flex items-center gap-1.5 justify-center mt-2">
            <span class="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <p class="text-xs text-gray-400 dark:text-gray-500 font-semibold tracking-wider uppercase">
              Uso Restrito • SENAI 2026
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap");

html,
body {
  overflow-x: hidden !important;
}
</style>

