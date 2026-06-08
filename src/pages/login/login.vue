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

import { reactive, ref, onMounted } from "vue";
import useVuelidate from "@vuelidate/core";
import { required, email, helpers } from "@vuelidate/validators";
import { useRouter } from "vue-router";
import Menu from "@/components/Menu.vue";
import { login as apiLogin, loginWithGoogle as apiLoginGoogle, recuperarSenha, resetarSenha as apiResetarSenha } from "@/services/api";

const router = useRouter();

const initialState = {
  password: "",
  email: "",
};

const state = reactive({
  ...initialState,
});

const rules = {
  password: { required: helpers.withMessage("A senha é obrigatória.", required) },
  email: { 
    required: helpers.withMessage("O e-mail é obrigatório.", required), 
    email: helpers.withMessage("Digite um e-mail em formato válido.", email) 
  },
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
const googleLoading = ref(false);

function clear() {
  v$.value.$reset();
  loginError.value = "";
  Object.assign(state, initialState);
}

// ============================================================
// Redireciona baseado na função do usuário
// ============================================================
function redirectByRole(funcao) {
  if (funcao === "gestor" || funcao === "opp") {
    router.push("/turmas");
  } else if (funcao === "professor") {
    router.push("/calendarioprof");
  } else {
    router.push("/turmas");
  }
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
    redirectByRole(data.usuario.funcao);
  } catch (error) {
    console.error("❌ Erro no login:", error);
    loginError.value = "E-mail ou senha incorretos.";
  } finally {
    loginLoading.value = false;
  }
}

// ============================================================
// LOGIN COM GOOGLE — Google Identity Services
// ============================================================
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

async function handleGoogleCredential(response) {
  googleLoading.value = true;
  loginError.value = "";

  try {
    const data = await apiLoginGoogle(response.credential);
    console.log("✅ Login Google bem-sucedido:", data.usuario.nome);
    redirectByRole(data.usuario.funcao);
  } catch (error) {
    console.error("❌ Erro no login Google:", error);
    loginError.value = error.message || "Erro ao fazer login com Google.";
  } finally {
    googleLoading.value = false;
  }
}

onMounted(() => {
  // Aguarda o script do Google carregar
  const initGoogle = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
      });

      // Renderiza o botão oficial do Google
      const btnContainer = document.getElementById("google-signin-btn");
      if (btnContainer) {
        window.google.accounts.id.renderButton(btnContainer, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
        });
      }
    } else {
      // Tenta novamente em 200ms se o script ainda não carregou
      setTimeout(initGoogle, 200);
    }
  };

  initGoogle();
});

// ============================================================
// RECUPERAÇÃO DE SENHA
// ============================================================
const recoveryDialog = ref(false);
const recoveryEmail = ref("");
const recoveryLoading = ref(false);
const recoveryStep = ref(1);
const newPassword = ref("");
const confirmPassword = ref("");
const showRecoveryPassword1 = ref(false);
const showRecoveryPassword2 = ref(false);

function fecharRecovery() {
  recoveryDialog.value = false;
  recoveryStep.value = 1;
  recoveryEmail.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  showRecoveryPassword1.value = false;
  showRecoveryPassword2.value = false;
}

async function handleRecovery() {
  if (recoveryStep.value === 1) {
    if (!recoveryEmail.value) {
      showAlert("Por favor, insira seu e-mail.", "warning");
      return;
    }

    recoveryLoading.value = true;
    try {
      const data = await recuperarSenha(recoveryEmail.value);
      if (data.success) {
        showAlert("E-mail validado! Defina sua nova senha.", "success", "mdi-check-circle");
        recoveryStep.value = 2;
      } else {
        showAlert("E-mail não cadastrado.", "error", "mdi-alert-octagon");
      }
    } catch (error) {
      console.error("Erro na validação do e-mail:", error);
      showAlert("Erro ao conectar com o servidor.", "error", "mdi-api-off");
    } finally {
      recoveryLoading.value = false;
    }
  } else if (recoveryStep.value === 2) {
    if (!newPassword.value || !confirmPassword.value) {
      showAlert("Preencha os campos de senha.", "warning");
      return;
    }
    if (newPassword.value !== confirmPassword.value) {
      showAlert("As senhas não coincidem.", "error", "mdi-alert-circle");
      return;
    }

    recoveryLoading.value = true;
    try {
      const result = await apiResetarSenha(recoveryEmail.value, newPassword.value);
      if (result.success) {
        showAlert("Senha redefinida com sucesso!", "success", "mdi-check-circle");
        fecharRecovery();
      } else {
        showAlert(result.message || "Erro ao redefinir senha.", "error", "mdi-alert-octagon");
      }
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      showAlert(error.message || "Erro ao conectar com o servidor.", "error", "mdi-api-off");
    } finally {
      recoveryLoading.value = false;
    }
  }
}
</script>

<template>
  <div>
    <Menu />

    <div class="flex items-center justify-center pt-32 pb-16">
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

        <!-- Divisor "ou" -->
        <div class="flex items-center gap-3 my-2">
          <div class="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
          <span class="text-sm text-gray-500 dark:text-gray-400 font-medium">ou</span>
          <div class="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
        </div>

        <!-- Botão Google Sign-In (renderizado pelo Google Identity Services) -->
        <div class="flex justify-center">
          <div id="google-signin-btn" style="min-height: 44px;"></div>
        </div>

        <!-- Loading overlay para login Google -->
        <v-progress-linear
          v-if="googleLoading"
          indeterminate
          color="red"
          class="rounded-lg"
        ></v-progress-linear>

      </div>

      <v-dialog v-model="recoveryDialog" max-width="400" persistent>
        <v-card class="bg-gray-100 dark:bg-[#121212] pa-4 rounded-xl shadow-2xl">
          <v-card-title class="text-h5 font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <v-icon icon="mdi-lock-reset" color="red"></v-icon>
            Recuperar Senha
          </v-card-title>
          
          <v-card-text class="mt-2 pa-0">
            <!-- Passo 1: Digitar E-mail -->
            <v-window v-model="recoveryStep">
              <v-window-item :value="1">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Insira o seu e-mail cadastrado para validar sua identidade.
                </p>
                <v-text-field
                  v-model="recoveryEmail"
                  label="E-mail"
                  type="email"
                  variant="outlined"
                  density="comfortable"
                  class="mt-4 rounded-lg"
                  prepend-inner-icon="mdi-email-outline"
                  color="red"
                  hide-details
                ></v-text-field>
              </v-window-item>

              <!-- Passo 2: Digitar Nova Senha -->
              <v-window-item :value="2">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  E-mail validado! Digite sua nova senha forte.
                </p>
                <v-text-field
                  v-model="newPassword"
                  label="Nova Senha"
                  :type="showRecoveryPassword1 ? 'text' : 'password'"
                  variant="outlined"
                  density="comfortable"
                  class="mt-4 rounded-lg"
                  prepend-inner-icon="mdi-lock-outline"
                  :append-inner-icon="showRecoveryPassword1 ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showRecoveryPassword1 = !showRecoveryPassword1"
                  color="red"
                  hide-details
                ></v-text-field>
                <v-text-field
                  v-model="confirmPassword"
                  label="Confirmar Nova Senha"
                  :type="showRecoveryPassword2 ? 'text' : 'password'"
                  variant="outlined"
                  density="comfortable"
                  class="mt-3 rounded-lg"
                  prepend-inner-icon="mdi-lock-check-outline"
                  :append-inner-icon="showRecoveryPassword2 ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showRecoveryPassword2 = !showRecoveryPassword2"
                  color="red"
                  hide-details
                ></v-text-field>
              </v-window-item>
            </v-window>
          </v-card-text>

          <v-card-actions class="mt-6 pa-0">
            <v-btn color="grey-darken-1" variant="text" class="rounded-lg font-bold" @click="fecharRecovery">
              Cancelar
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              color="red"
              variant="flat"
              @click="handleRecovery"
              :loading="recoveryLoading"
              class="bg-red-600 text-white rounded-lg px-6 font-bold"
            >
              {{ recoveryStep === 1 ? 'Continuar' : 'Salvar Nova Senha' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
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
  </div>
</template>

