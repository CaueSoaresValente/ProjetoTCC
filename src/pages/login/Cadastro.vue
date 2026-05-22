<script setup>
// ============================================================
// Cadastro.vue — Página de Cadastro
// ============================================================
// INTEGRAÇÃO COM O BACKEND:
// 1. O usuário preenche: nome, cargo, email, senha
// 2. Ao clicar "Cadastrar", chamamos criarCadastro() do api.ts
// 3. O api.ts faz um POST para /api/cadastro
// 4. O backend hash a senha com bcrypt e salva no MySQL
// 5. Se der certo, redirecionamos para a página de login
// ============================================================

import { reactive, ref, watch } from "vue";
import { useVuelidate } from "@vuelidate/core";
import { email, required, minLength, helpers } from "@vuelidate/validators";
import { useRouter } from "vue-router";
import Menu from "@/components/Menu.vue";
import { criarCadastro } from "@/services/api";

const router = useRouter();

const show1 = ref(false);
const show2 = ref(false);

// Estado do formulário
const state = reactive({
  name: "",
  email: "",
  funcao: "",
  senha: "",
  confirmarSenha: "",
});

// Regras de validação
const rules = {
  name: { required: helpers.withMessage("O nome é obrigatório", required) },
  email: { 
    required: helpers.withMessage("O e-mail é obrigatório", required), 
    email: helpers.withMessage("E-mail inválido", email) 
  },
  funcao: { required: helpers.withMessage("Selecione um cargo", required) },
  senha: { 
    required: helpers.withMessage("A senha é obrigatória", required), 
    minLength: helpers.withMessage("Mínimo de 8 caracteres", minLength(8)) 
  },
  confirmarSenha: { 
    required: helpers.withMessage("Confirme sua senha", required),
    sameAs: helpers.withMessage("As senhas não conferem", (value) => value === state.senha)
  },
};

const v$ = useVuelidate(rules, state);

// Watcher para forçar a validação da confirmação quando a senha principal mudar
watch(() => state.senha, () => {
  if (state.confirmarSenha) {
    v$.value.confirmarSenha.$validate();
  }
});

// Estado para feedback
const cadastroLoading = ref(false);
const cadastroError = ref("");
const cadastroSucesso = ref(false);

function clear() {
  v$.value.$reset();
  cadastroError.value = "";
  state.name = "";
  state.email = "";
  state.funcao = "";
  state.senha = "";
  state.confirmarSenha = "";
}

// ============================================================
// SUBMIT — Envia os dados para o backend
// ============================================================
async function submit() {
  const isValid = await v$.value.$validate();

  if (!isValid) {
    return;
  }

  cadastroLoading.value = true;
  cadastroError.value = "";

  try {
    // Chama o backend via api.ts
    await criarCadastro({
      nome: state.name,
      email: state.email,
      senha: state.senha,
      funcao: state.funcao.toLowerCase(), // 'gestor', 'opp' ou 'professor'
    });

    console.log("✅ Cadastro realizado com sucesso!");
    cadastroSucesso.value = true;

    // Após 2 segundos, redireciona para o login
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  } catch (error) {
    console.error("❌ Erro no cadastro:", error);
    cadastroError.value = error instanceof Error ? error.message : "Erro ao cadastrar. Tente novamente.";
  } finally {
    cadastroLoading.value = false;
  }
}
</script>

<template>
  <div>
    <Menu/>

    <div class="flex h-200 items-center justify-center p-4">
      <div
        class="flex flex-col space-y-3 bg-gray-100 dark:bg-[#121212] p-12 rounded-lg round-lg shadow-lg w-150"
      >
        <h2 class="text-center font-bold text-2xl">Criar Conta</h2>

        <!-- Mensagem de sucesso -->
        <v-alert v-if="cadastroSucesso" type="success" variant="tonal">
          Cadastro realizado com sucesso! Redirecionando para o login...
        </v-alert>

        <!-- Mensagem de erro -->
        <v-alert v-if="cadastroError" type="error" variant="tonal" closable @click:close="cadastroError = ''">
          {{ cadastroError }}
        </v-alert>

        <form class="dark:bg-[#121212]" @submit.prevent="submit">
          <v-text-field
            v-model="state.name"
            :error-messages="v$.name.$errors.map((e) => e.$message)"
            label="Nome Completo"
            required
            @blur="v$.name.$touch"
            @input="v$.name.$touch"
          ></v-text-field>

          <v-select
            v-model="state.funcao"
            label="Cargo"
            :items="['Gestor', 'OPP', 'Professor']"
            :error-messages="v$.funcao.$errors.map((e) => e.$message)"
            required
            @blur="v$.funcao.$touch"
          ></v-select>

          <v-text-field
            v-model="state.email"
            :error-messages="v$.email.$errors.map((e) => e.$message)"
            label="E-mail"
            required
            @blur="v$.email.$touch"
            @input="v$.email.$touch"
          ></v-text-field>

          <v-container fluid>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="state.senha"
                  :append-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
                  :type="show1 ? 'text' : 'password'"
                  :error-messages="v$.senha.$errors.map((e) => e.$message)"
                  hint="Mínimo de 8 caracteres"
                  label="Senha"
                  @click:append="show1 = !show1"
                  @blur="v$.senha.$touch"
                  @input="v$.senha.$touch"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="state.confirmarSenha"
                  :append-icon="show2 ? 'mdi-eye' : 'mdi-eye-off'"
                  :type="show2 ? 'text' : 'password'"
                  :error-messages="v$.confirmarSenha.$errors.map((e) => e.$message)"
                  hint="Repita a mesma senha"
                  label="Confirmar Senha"
                  @click:append="show2 = !show2"
                  @blur="v$.confirmarSenha.$touch"
                  @input="v$.confirmarSenha.$touch"
                ></v-text-field>
              </v-col>

            </v-row>
          </v-container>

          <v-btn class="mt-4 me-4 bg-red-500 text-white" type="submit" :loading="cadastroLoading">
            Cadastrar
          </v-btn>
          <v-btn @click="clear" class="mt-4"> Limpar </v-btn>
        </form>

        <p class="text-center">
          Já possui uma conta?
          <router-link to="/login" class="text-red-600 font-semibold hover:underline decoration-2 underline-offset-4 mx-1 transition-all">
            Login
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
