<template>
  <v-app>
    <Menu v-if="mostrarMenu" />
    <v-main :class="{ 'has-menu': mostrarMenu }">
      <router-view v-slot="{ Component }">
        <v-fade-transition mode="out-in">
          <component :is="Component" />
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
  </v-app>
</template>

<script lang="ts" setup>
  import { useTheme } from 'vuetify'
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import Footer from '@/components/Footer.vue'
  import Menu from '@/components/Menu.vue'

  const theme = useTheme()
  const route = useRoute()

  function toggleTheme () {
    theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  }

  const mostrarMenu = computed(() => {
    const loginRoutes = ['telainput', 'login']
    return !loginRoutes.includes(route.name as string)
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

