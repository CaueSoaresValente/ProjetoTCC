<script setup>
import { reactive, ref } from "vue";
import useVuelidate from "@vuelidate/core";
import { required, email } from "@vuelidate/validators";


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

async function handleRecovery() {
  if (!recoveryEmail.value) {
    alert("Por favor, insira seu e-mail.");
    return;
  }

  recoveryLoading.value = true;
  try {
    const response = await fetch("http://localhost:3000/api/auth/recuperar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: recoveryEmail.value }),
    });

    const data = await response.json();
    if (data.success) {
      alert("Link de recuperação enviado com sucesso!");
      recoveryDialog.value = false;
      recoveryEmail.value = "";
    } else {
      alert("E-mail não encontrado ou erro ao enviar.");
    }
  } catch (error) {
    console.error("Erro na recuperação:", error);
    alert("Erro ao conectar com o servidor.");
  } finally {
    recoveryLoading.value = false;
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

    <v-dialog v-model="recoveryDialog" max-width="350">
      <v-card class="bg-gray-100 dark:bg-[#121212] p-2 rounded-lg">
        <v-card-title class="text-h6">Recuperar Senha</v-card-title>
        <v-card-text>
          Informe seu e-mail para receber as instruções.
          <v-text-field v-model="recoveryEmail" label="E-mail" type="email" class="mt-2"
            required></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="gray" variant="elevated" @click="recoveryDialog = false">Cancelar</v-btn>
          <v-btn color="red" variant="elevated" @click="handleRecovery" :loading="recoveryLoading" class="bg-red-600 text-white">
            Enviar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
@media (max-width: 368px) {
  .main {
    margin-left: 25px;
  }
}
</style>