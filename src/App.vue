<template>
  <v-app>
    <Menu v-if="mostrarMenu" />
    <v-main :class="{ 'has-menu': mostrarMenu }">
      <router-view v-slot="{ Component }">
        <v-fade-transition mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </v-fade-transition>
      </router-view>
    </v-main>
    <v-btn
      :icon="theme.global.current.value.dark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
      @click="toggleTheme"
      elevation="4"
      class="btn-tema"
      color="primary"
    ></v-btn>
    <Footer />

    <!-- Modal de aviso de exclusão de perfil -->
    <v-dialog v-model="mostrarModalExcluido" max-width="450px" persistent>
      <v-card class="rounded-xl overflow-hidden shadow-2xl">
        <v-card-title class="bg-red-600 text-white font-bold px-6 py-4 text-xl">
          Aviso de Exclusão
        </v-card-title>
        <v-card-text class="pa-8 text-center text-lg font-medium leading-relaxed text-gray-700">
          Seu perfil foi excluído pelo gestor do sistema. Sua sessão foi finalizada.
        </v-card-text>
        <v-card-actions class="pa-6 pt-0 flex justify-center">
          <v-btn variant="elevated" color="red" class="bg-red-600 text-white font-bold px-8 shadow-sm uppercase tracking-wide" @click="executarLogout">
            OK
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script lang="ts" setup>
  import { useTheme } from 'vuetify'
  import { computed, watch, onBeforeUnmount, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import Footer from '@/components/Footer.vue'
  import Menu from '@/components/Menu.vue'
  import { estaLogado, verificarSessao, logout } from '@/services/api'

  const theme = useTheme()
  const route = useRoute()
  const router = useRouter()

  function toggleTheme () {
    theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  }

  const mostrarMenu = computed(() => {
    const loginRoutes = ['telainput', 'login']
    return !loginRoutes.includes(route.name as string)
  })

  // ====================== POLLING DE SESSÃO ======================
  // Verifica a cada 30s se o perfil do usuário ainda está ativo.
  // Se foi excluído pelo gestor, exibe modal e faz logout.
  // ================================================================

  const mostrarModalExcluido = ref(false)
  let sessionCheckInterval: ReturnType<typeof setInterval> | null = null
  let autoLogoutTimeout: ReturnType<typeof setTimeout> | null = null

  async function verificarSessaoAtiva() {
    // Só verifica se o usuário está logado
    if (!estaLogado()) return

    try {
      const resultado = await verificarSessao()
      if (resultado && resultado.ativo === false) {
        // Perfil foi excluído — exibe o modal
        pararPolling()
        mostrarModalExcluido.value = true

        // Auto-logout após 5 segundos se o usuário não clicar
        autoLogoutTimeout = setTimeout(() => {
          executarLogout()
        }, 5000)
      }
    } catch {
      // Se der 401 (token inválido), o token já expirou — faz logout silencioso
      // Outros erros de rede são ignorados (o próximo ciclo tentará de novo)
    }
  }

  function executarLogout() {
    if (autoLogoutTimeout) {
      clearTimeout(autoLogoutTimeout)
      autoLogoutTimeout = null
    }
    mostrarModalExcluido.value = false
    logout()
    window.dispatchEvent(new Event('usuario-atualizado'))
    router.push('/login')
  }

  function iniciarPolling() {
    if (sessionCheckInterval) return
    sessionCheckInterval = setInterval(verificarSessaoAtiva, 30000)
    // Também verifica imediatamente na primeira vez
    verificarSessaoAtiva()
  }

  function pararPolling() {
    if (sessionCheckInterval) {
      clearInterval(sessionCheckInterval)
      sessionCheckInterval = null
    }
  }

  // Inicia/para o polling com base na rota atual
  watch(
    () => route.name,
    (novaRota) => {
      const loginRoutes = ['telainput', 'login']
      if (loginRoutes.includes(novaRota as string) || !estaLogado()) {
        pararPolling()
      } else {
        iniciarPolling()
      }
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    pararPolling()
    if (autoLogoutTimeout) {
      clearTimeout(autoLogoutTimeout)
    }
  })
</script>

<style scoped>
.btn-tema {
  position: fixed;
  bottom: 16px; 
  right: 16px;   
  z-index: 9999 !important; 
}

@media (max-width: 600px) {
  .btn-tema {
    bottom: 12px;
    right: 12px;
    width: 36px !important;
    height: 36px !important;
  }
}
</style>

<style>
html {
  scrollbar-gutter: stable;
}

html, body {
  overflow-x: hidden;
  max-width: 100vw;
}

/* Garante que o footer fique sempre na parte inferior da tela */
.v-application__wrap {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.v-main {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
}

.v-main.has-menu {
  padding-top: 88px !important;
}
</style>

