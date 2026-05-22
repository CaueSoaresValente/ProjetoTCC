<template>
  <div class="fixed top-0 left-0 right-0 z-[100] flex shadow-md bg-white dark:bg-[#121212]">
    <!-- Logo SENAI -->
    <div
      class="bg-red-600 text-white px-9 py-5 [clip-path:polygon(0%_0%,_100%_0%,_70%_100%,_0%_100%)] text-center text-5xl font-black italic tracking-tighter tracking-wide"
      style="font-family: &quot;Archivo Black&quot;, sans-serif"
    >
      <h1 class="ms-4 relative -left-10">SENAI</h1>
    </div>
    <div
      class="w-full divmain bg-white dark:bg-[#121212] flex flex-col justify-center"
    >
      <div class="bg-red-600 w-full absolute top-0 left-0">
        <div class="p-1 bg-red-600 w-full"></div>
      </div>

      <!-- Container Centralizado na Altura e Largura -->
      <div
        class="max-w-[1600px] w-full mx-auto px-6 flex items-center justify-between h-full"
      >
        <!-- Barra de navegação baseada no perfil -->
        <nav class="hidden xl:flex items-center gap-1 overflow-x-auto py-1 mt-2">
          <router-link
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            class="nav-link flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200"
            :class="[
              $route.path === item.to
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-red-400',
            ]"
          >
            <v-icon :icon="item.icon" size="18"></v-icon>
            <span>{{ item.label }}</span>
          </router-link>
        </nav>

        <!-- Slot para conteúdo extra (se necessário) -->
        <div v-if="usuario" class="flex-shrink-0 flex items-center gap-6 ml-auto mt-3">
          <!-- Menu Dropdown do Perfil Completo (Texto e Avatar Integrados) -->
          <v-menu transition="slide-y-transition">
            <template v-slot:activator="{ props }">
              <div
                v-bind="props"
                class="flex items-center gap-3 cursor-pointer group select-none"
              >
                <!-- Info do Usuário (Clickable) -->
                <div class="text-right hidden sm:block">
                  <p
                    class="text-[10px] font-black text-gray-400 dark:text-gray-500 leading-none uppercase tracking-wider"
                  >
                    Bem-vindo,
                  </p>
                  <p class="text-sm font-extrabold text-gray-800 dark:text-gray-200 capitalize mt-0.5 leading-tight group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200">
                    {{ usuario?.nome }}
                  </p>
                </div>

                <!-- Avatar e Chevron -->
                <div class="flex items-center gap-1.5">
                  <v-avatar
                    size="40"
                    class="shadow-sm group-hover:scale-105 transition-all duration-200 border border-gray-200 dark:border-gray-700"
                  >
                    <v-img v-if="usuario?.fotoPerfil" :src="usuario.fotoPerfil" alt="Foto de perfil" cover></v-img>
                    <div v-else class="w-full h-full flex items-center justify-center font-black text-white bg-gradient-to-br text-sm uppercase"
                         :class="funcaoColor">
                      {{ inicialNome }}
                    </div>
                  </v-avatar>
                  <v-icon
                    icon="mdi-chevron-down"
                    size="small"
                    class="text-gray-400 group-hover:text-red-600 transition-all duration-300 group-hover:rotate-180"
                  ></v-icon>
                </div>
              </div>
            </template>

            <v-list
              class="mt-2 rounded-xl border-0 shadow-2xl dark:bg-gray-800 min-w-[180px] pa-2"
            >
              <!-- Itens de Navegação (Apenas Mobile/Tablet até XL) -->
              <div class="xl:hidden">
                <v-list-item
                  v-for="item in menuItems"
                  :key="item.to"
                  :to="item.to"
                  class="rounded-lg mb-1 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <template v-slot:prepend>
                    <v-icon :icon="item.icon" size="18" class="text-gray-400"></v-icon>
                  </template>
                  <v-list-item-title class="font-bold text-sm dark:text-gray-200">
                    {{ item.label }}
                  </v-list-item-title>
                </v-list-item>
                <v-divider class="my-1"></v-divider>
              </div>

              <v-list-item
                class="rounded-lg mb-1 hover:bg-gray-50 dark:hover:bg-gray-700"
                to="/perfil"
              >
                <template v-slot:prepend>
                  <v-icon
                    icon="mdi-account-outline"
                    size="18"
                    class="text-gray-400"
                  ></v-icon>
                </template>
                <v-list-item-title class="font-bold text-sm dark:text-gray-200"
                  >Meu Perfil</v-list-item-title
                >
              </v-list-item>



              <v-divider class="my-1"></v-divider>

              <v-list-item
                class="rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                @click="handleLogout"
              >
                <template v-slot:prepend>
                  <v-icon
                    icon="mdi-logout"
                    size="18"
                    class="text-red-500"
                  ></v-icon>
                </template>
                <v-list-item-title class="font-bold text-sm text-red-500"
                  >Sair</v-list-item-title
                >
              </v-list-item>
            </v-list>
          </v-menu>

          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { getUsuarioLogado, logout } from "@/services/api";

const router = useRouter();

// ============================================================
// MENU DINÂMICO POR PERFIL
// ============================================================
// O menu muda conforme a "funcao" do usuário logado:
//   - gestor:    vê tudo (turmas, criar turma, UCs/áreas, professores)
//   - opp:       mesmas opções do gestor MAS só vê dados das suas áreas
//   - professor: vê calendário, suas UCs/áreas/certificações, disponibilidade
// ============================================================

const usuario = ref(getUsuarioLogado());
const funcao = computed(() => usuario.value?.funcao || "");

const inicialNome = computed(() => {
  return usuario.value?.nome ? usuario.value.nome.charAt(0).toUpperCase() : "?";
});

const funcaoColor = computed(() => {
  const colors = {
    gestor: "from-red-600 to-red-500",
    opp: "from-blue-600 to-blue-500",
    professor: "from-green-600 to-green-500",
  };
  return colors[funcao.value] || "from-gray-600 to-gray-500";
});

const atualizarUsuario = () => {
  usuario.value = getUsuarioLogado();
};

onMounted(() => {
  window.addEventListener('usuario-atualizado', atualizarUsuario);
});

onUnmounted(() => {
  window.removeEventListener('usuario-atualizado', atualizarUsuario);
});

// Itens do menu para cada perfil
const menuGestor = [
  { label: "Turmas", to: "/turmas", icon: "mdi-school-outline" },
  { label: "Criar Turma", to: "/addturmas", icon: "mdi-plus-circle-outline" },
  {
    label: "Gestão de UCs e Áreas",
    to: "/GerAreasComp",
    icon: "mdi-book-cog-outline",
  },
  {
    label: "Gestão de Professores",
    to: "/findprofessor",
    icon: "mdi-account-group-outline",
  },
  {
    label: "Perfil dos Professores",
    to: "/visualizarprofessores",
    icon: "mdi-account-eye-outline",
  },
  {
    label: "Gestão de Cadastros",
    to: "/gerenciarcadastros",
    icon: "mdi-account-cog-outline",
  },
];

// OPP: mesmas opções do gestor, mas na prática o backend filtra
// para mostrar apenas dados das áreas daquele OPP (regra R12 da proposta)
const menuOPP = [
  { label: "Turmas", to: "/turmas", icon: "mdi-school-outline" },
  { label: "Criar Turma", to: "/addturmas", icon: "mdi-plus-circle-outline" },
  {
    label: "Gestão de UCs e Áreas",
    to: "/GerAreasComp",
    icon: "mdi-book-cog-outline",
  },
  {
    label: "Gestão de Professores",
    to: "/findprofessor",
    icon: "mdi-account-group-outline",
  },
  {
    label: "Perfil dos Professores",
    to: "/visualizarprofessores",
    icon: "mdi-account-eye-outline",
  },
];

const menuProfessor = [
  {
    label: "Calendário",
    to: "/calendarioprof",
    icon: "mdi-calendar-month-outline",
  },
  {
    label: "Gestão de UCs, Áreas e Certificações",
    to: "/perfilprofessor",
    icon: "mdi-certificate-outline",
  },
  {
    label: "Gestão de Disponibilidade",
    to: "/disponibilidadeprof",
    icon: "mdi-clock-check-outline",
  },
];

// Seleciona os itens do menu com base no perfil
const menuItems = computed(() => {
  switch (funcao.value) {
    case "gestor":
      return menuGestor;
    case "opp":
      return menuOPP;
    case "professor":
      return menuProfessor;
    default:
      // Se não estiver logado, não mostra nada
      return [];
  }
});

// Função para deslogar
const handleLogout = () => {
  logout();
  router.push("/login");
};
</script>

<style scoped>
.nav-link {
  text-decoration: none;
}
</style>
