<template>
  <footer class="bg-red-600 text-white mt-6 py-6 w-full flex-shrink-0">
    <div class="max-w-[1600px] w-full mx-auto px-6">
      <v-row dense class="align-center">
        <!-- Coluna 1: Branding (Esquerda) -->
        <v-col cols="12" md="4" class="text-center text-md-left">
          <div
            class="text-3xl font-black italic tracking-tighter mb-2 inline-block"
            style="font-family: 'Archivo Black', sans-serif"
          >
            SENAI
          </div>
          <p class="text-xs opacity-90 max-w-xs mx-auto mx-md-0 leading-relaxed">
            Pelo futuro do trabalho. O Serviço Nacional de Aprendizagem Industrial (SENAI) é um dos cinco maiores complexos de educação profissional do mundo.
          </p>
        </v-col>

        <!-- Coluna 2: Redes Sociais (Centro) -->
        <v-col cols="12" md="4" class="text-center mt-4 mt-md-0">
          <h3 class="text-sm font-bold uppercase tracking-wider mb-2">Siga-nos</h3>
          <div class="flex justify-center gap-2">
            <v-btn icon="mdi-facebook" variant="text" color="white" density="comfortable"></v-btn>
            <v-btn icon="mdi-instagram" variant="text" color="white" density="comfortable"></v-btn>
            <v-btn icon="mdi-linkedin" variant="text" color="white" density="comfortable"></v-btn>
          </div>
        </v-col>

        <!-- Coluna 3: Suporte Técnico (Direita) -->
        <v-col cols="12" md="4" class="text-center text-md-right mt-4 mt-md-0">
          <h3 class="text-sm font-bold uppercase tracking-wider mb-2">Suporte Técnico</h3>
          <p class="text-xs font-bold mt-2 flex items-center justify-center justify-md-end gap-1">
            <v-icon icon="mdi-email-outline" size="x-small"></v-icon>
            suporte.interno@sp.senai.br
          </p>
          <p class="text-xs opacity-90 mt-1 flex items-center justify-center justify-md-end gap-1">
            <v-icon icon="mdi-phone-outline" size="x-small"></v-icon>
            Suporte TI - Ramal: 4500
          </p>
        </v-col>
      </v-row>

      <v-divider class="my-4 border-white opacity-20"></v-divider>

      <div class="flex flex-col md:flex-row justify-between items-center gap-2 text-[10px] opacity-70 pb-2">
        <p>&copy; {{ new Date().getFullYear() }} SENAI - Todos os direitos reservados.</p>
        <div class="flex gap-4">
          <a href="#" class="text-white">Privacidade</a>
          <a href="#" class="text-white">Termos de Uso</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { getUsuarioLogado } from '@/services/api';

const route = useRoute();

const usuario = ref(getUsuarioLogado());
const funcao = computed(() => usuario.value?.funcao || "");

const atualizarUsuario = () => {
  usuario.value = getUsuarioLogado();
};

onMounted(() => {
  window.addEventListener('usuario-atualizado', atualizarUsuario);
});

onUnmounted(() => {
  window.removeEventListener('usuario-atualizado', atualizarUsuario);
});

const showLinks = computed(() => {
  const loginRoutes = ['telainput', 'login', 'cadastro'];
  return !loginRoutes.includes(route.name as string);
});

const dynamicLinks = computed(() => {
  switch (funcao.value) {
    case 'gestor':
      return [
        { label: 'Gestão de Turmas', to: '/turmas' },
        { label: 'Gestão de Professores', to: '/findprofessor' },
        { label: 'Gestão de Cadastros', to: '/gerenciarcadastros' },
        { label: 'Início', to: '/turmas' }
      ];
    case 'opp':
      return [
        { label: 'Gestão de Turmas', to: '/turmas' },
        { label: 'Gestão de Professores', to: '/findprofessor' },
        { label: 'Gestão de UCs e Áreas', to: '/GerAreasComp' },
        { label: 'Início', to: '/turmas' }
      ];
    case 'professor':
      return [
        { label: 'Calendário', to: '/calendarioprof' },
        { label: 'Gestão de UCs', to: '/perfilprofessor' },
        { label: 'Gestão de Disponibilidade', to: '/disponibilidadeprof' },
        { label: 'Início', to: '/calendarioprof' }
      ];
    default:
      return [];
  }
});
</script>

<style scoped>
a {
  text-decoration: none;
}
</style>
