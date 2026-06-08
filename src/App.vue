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
  import { estaLogado, logout } from '@/services/api'
  import { connectWebSocket, disconnectWebSocket } from '@/services/websocket'

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

  // ====================== WEBSOCKET — TEMPO REAL ======================
  // Quando o gestor exclui um perfil, o backend envia um evento
  // via WebSocket instantaneamente para o usuário logado nesse perfil.
  // =====================================================================

  const mostrarModalExcluido = ref(false)
  let autoLogoutTimeout: ReturnType<typeof setTimeout> | null = null

  function onSessionExpired() {
    // Callback chamado pelo serviço de WebSocket quando recebe SESSION_EXPIRED
    mostrarModalExcluido.value = true

    // Auto-logout após 5 segundos se o usuário não clicar em "OK"
    autoLogoutTimeout = setTimeout(() => {
      executarLogout()
    }, 5000)
  }

  function executarLogout() {
    if (autoLogoutTimeout) {
      clearTimeout(autoLogoutTimeout)
      autoLogoutTimeout = null
    }
    mostrarModalExcluido.value = false
    disconnectWebSocket()
    logout()
    window.dispatchEvent(new Event('usuario-atualizado'))
    router.push('/login')
  }

  // Conecta/desconecta o WebSocket com base na rota atual
  watch(
    () => route.name,
    (novaRota) => {
      const loginRoutes = ['telainput', 'login']
      if (loginRoutes.includes(novaRota as string) || !estaLogado()) {
        disconnectWebSocket()
      } else {
        connectWebSocket(onSessionExpired)
      }
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    disconnectWebSocket()
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

