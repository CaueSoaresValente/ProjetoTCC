<script setup>
import LoginMobile from "./loginMobile.vue";
import Menu from "@/components/Menu.vue";
</script>

<template>
  <div>
    <header class="flex shadow-md mb-12 bg-white dark:bg-[#121212]">
      <Menu class="!shadow-none !mb-0" />

      <div class="w-full">
        <div class="flex bg-red-600">
          <div class="p-1 bg-red-600 relative -left-3 w-full"></div>
        </div>
        <nav class="bg-white flex justify-end me-25 dark:bg-[#121212]">
          <ul class="flex gap-10 items-center h-17">
            <li
              class="hidden md:flex font-bold relative -bottom-2"
              @click="$router.push('/login')"
            >
              Login
            </li>
          </ul>
        </nav>
      </div>
    </header>

    <section class="py-6">
      <div class="container mx-auto px-6 md:flex justify-center items-center gap-12">
        <img 
          src="../../assets/education_dashboard.png" 
          class="hidden md:flex max-h-[500px] w-auto object-contain rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 transition-all duration-500 hover:scale-[1.02]" 
          alt="Painel de Gestão"
        />
        <div class="h-auto flex flex-col justify-center gap-4 max-w-xl">
          <LoginMobile />

          <span class="font-black hidden md:flex text-6xl text-gray-800 dark:text-gray-100 tracking-tight leading-none">
            Bem-vindo,
          </span>
          <p class="hidden md:flex text-4xl font-light text-gray-600 dark:text-gray-300 leading-tight">
            ao Sistema de Gestão de Professores
          </p>
          <p
            class="text-center md:text-left text-gray-500 dark:text-gray-400 text-base md:text-lg leading-relaxed hidden md:block"
          >
            Faça
            <router-link
              to="/login"
              class="text-red-600 font-semibold hover:underline decoration-2 underline-offset-4 mx-1 transition-all"
            >
              login
            </router-link>
            para obter acesso à página.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap");

li {
  transition: 400ms ease-in-out;
}

html,
body {
  overflow-x: hidden !important;
}

li:hover {
  background: red;
  border-radius: 15px;
  padding: 10px;
  color: white;
  cursor: pointer;
}

a {
  cursor: pointer;
}
</style>
