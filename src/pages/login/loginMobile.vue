<script setup>
import { reactive, ref } from "vue";
import useVuelidate from "@vuelidate/core";
import { required, email, helpers } from "@vuelidate/validators";
import { recuperarSenha, resetarSenha as apiResetarSenha } from "@/services/api";

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

function clear() {
  v$.value.$reset();
  Object.assign(state, initialState);
}

async function submit() {
  const isValid = await v$.value.$validate();
  if (!isValid) {
    console.log("Formulário inválido");
    return;
  }
  console.log("Formulário válido", state);
}

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
    <div class="flex m-3 flex-col md:hidden space-y-3 bg-gray-100 p-8 dark:bg-[#121212] rounded shadow-lg main">
      <h2 class="text-center font-bold text-2xl">Bem-vindo</h2>

      <form @submit.prevent="submit">
        <v-text-field v-model="state.email" :error-messages="v$.email.$errors.map((e) => e.$message)" label="E-mail"
          required @blur="v$.email.$touch()" @input="v$.email.$touch()" />

        <v-text-field v-model="state.password" :error-messages="v$.password.$errors.map((e) => e.$message)" label="Senha"
          type="password" required @blur="v$.password.$touch()" @input="v$.password.$touch()" />

        <v-btn type="submit" class="mt-4 me-4 bg-red-500 text-white">
          submit
        </v-btn>

        <v-btn @click="clear" class="mt-4">
          clear
        </v-btn>

        <div class="mt-4 text-right">
          <a href="#" class="text-sm text-red-600 hover:underline" @click.prevent="recoveryDialog = true">
            Esqueceu a senha?
          </a>
        </div>
      </form>
    </div>

    <!-- Dialog de Recuperação de Senha Mobile (2 passos) -->
    <v-dialog v-model="recoveryDialog" max-width="350" persistent>
      <v-card class="bg-gray-100 dark:bg-[#121212] pa-4 rounded-xl shadow-2xl">
        <v-card-title class="text-h6 font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <v-icon icon="mdi-lock-reset" color="red"></v-icon>
          Recuperar Senha
        </v-card-title>
        
        <v-card-text class="mt-2 pa-0">
          <v-window v-model="recoveryStep">
            <!-- Passo 1: Validar e-mail -->
            <v-window-item :value="1">
              <p class="text-xs text-gray-600 dark:text-gray-400">
                Insira o seu e-mail cadastrado para validar sua identidade.
              </p>
              <v-text-field
                v-model="recoveryEmail"
                label="E-mail"
                type="email"
                variant="outlined"
                density="comfortable"
                class="mt-3 rounded-lg text-xs"
                prepend-inner-icon="mdi-email-outline"
                color="red"
                hide-details
              ></v-text-field>
            </v-window-item>

            <!-- Passo 2: Definir nova senha -->
            <v-window-item :value="2">
              <p class="text-xs text-gray-600 dark:text-gray-400">
                E-mail validado! Digite sua nova senha.
              </p>
              <v-text-field
                v-model="newPassword"
                label="Nova Senha"
                :type="showRecoveryPassword1 ? 'text' : 'password'"
                variant="outlined"
                density="comfortable"
                class="mt-3 rounded-lg text-xs"
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
                class="mt-2 rounded-lg text-xs"
                prepend-inner-icon="mdi-lock-check-outline"
                :append-inner-icon="showRecoveryPassword2 ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showRecoveryPassword2 = !showRecoveryPassword2"
                color="red"
                hide-details
              ></v-text-field>
            </v-window-item>
          </v-window>
        </v-card-text>

        <v-card-actions class="mt-4 pa-0">
          <v-btn color="grey-darken-1" variant="text" class="rounded-lg text-xs font-bold" @click="fecharRecovery">
            Cancelar
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="red"
            variant="flat"
            @click="handleRecovery"
            :loading="recoveryLoading"
            class="bg-red-600 text-white rounded-lg px-4 text-xs font-bold"
          >
            {{ recoveryStep === 1 ? 'Continuar' : 'Salvar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar de Alertas Premium Mobile -->
    <v-snackbar 
      v-model="snackbar.show" 
      :color="snackbar.color" 
      :timeout="snackbar.timeout" 
      location="top" 
      elevation="24"
      rounded="xl"
    >
      <div class="flex items-start gap-4 p-1">
        <v-avatar :color="snackbar.color" size="36" class="elevation-3 flex-shrink-0">
          <v-icon :icon="snackbar.icon" color="white" size="20"></v-icon>
        </v-avatar>
        <div class="flex-grow text-white">
          <p class="text-xs font-bold leading-tight">{{ snackbar.text }}</p>
        </div>
        <v-btn icon="mdi-close" variant="text" color="white" @click="snackbar.show = false" size="small" class="opacity-50 hover:opacity-100 transition-opacity"></v-btn>
      </div>
    </v-snackbar>
  </div>
</template>

<style scoped>
@media (max-width: 368px) {
  .main {
    margin-left: 25px;
  }
}
</style>