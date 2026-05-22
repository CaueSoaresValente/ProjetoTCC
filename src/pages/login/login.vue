<script setup>
// ============================================================
// login.vue — Página de Login
// ============================================================
// INTEGRAÇÃO COM O BACKEND:
// 1. O usuário digita email e senha
// 2. Ao clicar "Entrar", chamamos a função login() do api.ts
// 3. O api.ts faz um POST para /api/auth/login
// 4. O Vite redireciona para o backend na porta 3001
// 5. O backend verifica no banco de dados (MySQL)
// 6. Se correto, retorna um token JWT
// 7. O api.ts salva o token no localStorage
// 8. Redirecionamos o usuário para a página principal
// ============================================================

import { reactive, ref } from "vue";
import useVuelidate from "@vuelidate/core";
import { required, email } from "@vuelidate/validators";
import { useRouter } from "vue-router";
import Menu from "@/components/Menu.vue";
import { login as apiLogin, recuperarSenha } from "@/services/api";

const router = useRouter();

const initialState = {
  password: "",
  email: "",
};

const state = reactive({
  ...initialState,
});

const rules = {
  password: { required },
  email: { required, email },
};

const v$ = useVuelidate(rules, state);

// Estado para mensagens de erro/sucesso
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

const loginError = ref("");
const loginLoading = ref(false);

function clear() {
  v$.value.$reset();
  loginError.value = "";
  Object.assign(state, initialState);
}

// ============================================================
// SUBMIT — Envia email e senha para o backend
// ============================================================
async function submit() {
  const isValid = await v$.value.$validate();

  if (!isValid) {
    return;
  }

  loginLoading.value = true;
  loginError.value = "";

  try {
    // Chama o backend via api.ts
    const data = await apiLogin(state.email, state.password);
    console.log("✅ Login bem-sucedido:", data.usuario.nome);

    // Redireciona para a página principal baseado no perfil
    const funcao = data.usuario.funcao;
    if (funcao === "gestor" || funcao === "opp") {
      router.push("/turmas");
    } else if (funcao === "professor") {
      router.push("/calendarioprof");
    } else {
      router.push("/turmas");
    }
  } catch (error) {
    console.error("❌ Erro no login:", error);
    loginError.value = "E-mail ou senha incorretos.";
  } finally {
    loginLoading.value = false;
  }
}

// ============================================================
// RECUPERAÇÃO DE SENHA
// ============================================================
const recoveryDialog = ref(false);
const recoveryEmail = ref("");
const recoveryLoading = ref(false);

async function handleRecovery() {
  if (!recoveryEmail.value) {
    showAlert("Por favor, insira seu e-mail.", "warning");
    return;
  }

  recoveryLoading.value = true;
  try {
    // Chama o backend via api.ts (não mais via URL hardcoded!)
    const data = await recuperarSenha(recoveryEmail.value);
    if (data.success) {
      showAlert("Link de recuperação enviado com sucesso!", "success", "mdi-check-circle");
      recoveryDialog.value = false;
      recoveryEmail.value = "";
    } else {
      showAlert("E-mail não encontrado ou erro ao enviar.", "error", "mdi-alert-octagon");
    }
  } catch (error) {
    console.error("Erro na recuperação:", error);
    showAlert("Erro ao conectar com o servidor.", "error", "mdi-api-off");
  } finally {
    recoveryLoading.value = false;
  }
}
</script>

<template>
  <div>
    <Menu />

    <div class="flex items-center justify-center">
      <div
        class="flex flex-col space-y-3 bg-gray-100 p-8 dark:bg-[#121212] w-150 rounded-lg shadow-lg h-auto m-5"
      >
        <h2 class="text-center font-bold text-2xl">Bem-vindo</h2>

        <!-- Mensagem de erro do login -->
        <v-alert
          v-if="loginError"
          type="error"
          variant="tonal"
          closable
          @click:close="loginError = ''"
        >
          {{ loginError }}
        </v-alert>

        <form @submit.prevent="submit">
          <v-text-field
            v-model="state.email"
            :error-messages="v$.email.$errors.map((e) => e.$message)"
            label="E-mail"
            required
            @blur="v$.email.$touch()"
            @input="v$.email.$touch()"
          />

          <v-text-field
            v-model="state.password"
            :error-messages="v$.password.$errors.map((e) => e.$message)"
            label="Senha"
            type="password"
            required
            @blur="v$.password.$touch()"
            @input="v$.password.$touch()"
          />

          <v-btn
            type="submit"
            class="mt-4 me-4 bg-red-500 text-white"
            :loading="loginLoading"
          >
            Entrar
          </v-btn>

          <v-btn @click="clear" class="mt-4"> Limpar </v-btn>

          <div class="mt-4 text-right">
            <a
              href="#"
              class="text-sm text-red-600 hover:underline"
              @click.prevent="recoveryDialog = true"
            >
              Esqueceu a senha?
            </a>
          </div>
        </form>

        <p class="text-center">
          Não tem conta?
          <router-link
            to="/cadastro"
            class="text-red-600 font-semibold hover:underline"
          >
            Cadastre-se
          </router-link>
        </p>
      </div>

      <v-dialog v-model="recoveryDialog" max-width="400">
        <v-card class="bg-gray-100 dark:bg-[#121212] p-2 rounded-lg">
          <v-card-title class="text-h5">Recuperar Senha</v-card-title>
          <v-card-text>
            Insira seu e-mail para receber um link de recuperação.
            <v-text-field
              v-model="recoveryEmail"
              label="E-mail"
              type="email"
              class="mt-4"
              required
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="gray" variant="elevated" @click="recoveryDialog = false"
              >Cancelar</v-btn
            >
            <v-btn
              color="red-darken-1"
              variant="elevated"
              @click="handleRecovery"
              :loading="recoveryLoading"
              class="bg-red-600 text-white"
            >
              Enviar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </div>

  <!-- Snackbar de Alertas Premium -->
  <v-snackbar 
    v-model="snackbar.show" 
    :color="snackbar.color" 
    :timeout="snackbar.timeout" 
    location="top right" 
    class="mt-4 mr-4"
    elevation="24"
    rounded="xl"
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
</template>
