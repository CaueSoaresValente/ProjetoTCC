<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import { listarCadastros, excluirCadastro, editarCadastro, criarCadastro, listarAreas, getUsuarioLogado } from "@/services/api";

// ====================== ESTADO DA TELA ======================
const tags = ["Professor", "Gestor", "OPP"];
const selecionado = ref("Professor");
const loading = ref(false);
const busca = ref("");

// Lista completa de usuários vinda do banco
const todosUsuarios = ref([]);

// Filtra os usuários com base na aba selecionada e na busca
const usuariosFiltrados = computed(() => {
  return todosUsuarios.value.filter((user) => {
    const matchesFuncao = user.funcao.toLowerCase() === selecionado.value.toLowerCase();
    const matchesBusca = user.nome.toLowerCase().includes(busca.value.toLowerCase()) || 
                         user.email.toLowerCase().includes(busca.value.toLowerCase());
    return matchesFuncao && matchesBusca;
  });
});

// ====================== MODAIS ======================
const dialogAdd = ref(false);
const dialogEdit = ref(false);
const dialogDelete = ref(false);

// Campos formulário
const usuarioForm = ref({
  idUsuario: null,
  nome: "",
  email: "",
  senha: "",
  funcao: ""
});

const usuarioDeletando = ref(null);

// ====================== NOTIFICAÇÕES (SNACKBAR) ======================
const snackbar = ref({
  show: false,
  text: "",
  color: "success"
});

function mostrarMensagem(texto, cor = "success") {
  snackbar.value.text = texto;
  snackbar.value.color = cor;
  snackbar.value.show = true;
}

// ====================== CARREGAR DADOS ======================

// Lista de áreas disponíveis (para OPP)
const areasDisponiveis = ref([]);
const areasSelecionadas = ref([]);

async function carregarAreas() {
  try {
    const data = await listarAreas();
    areasDisponiveis.value = data;
  } catch (error) {
    console.error("Erro ao carregar áreas:", error);
  }
}

function formatarAreas(user) {
  if (!user.areas || user.areas.length === 0) return "—";
  return user.areas.join(", ");
}

async function carregarUsuarios() {
  try {
    loading.value = true;
    const data = await listarCadastros();
    todosUsuarios.value = data;
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
  } finally {
    loading.value = false;
  }
}

// ====================== AÇÕES ======================

function abrirAdd() {
  usuarioForm.value = {
    nome: "",
    email: "",
    senha: "Senha001",
    funcao: selecionado.value.toLowerCase()
  };
  areasSelecionadas.value = [];
  if (selecionado.value === "OPP") {
    carregarAreas();
  }
  dialogAdd.value = true;
}

async function salvarNovo() {
  if (!usuarioForm.value.nome || !usuarioForm.value.email || !usuarioForm.value.senha) {
      mostrarMensagem("Preencha todos os campos obrigatórios.", "error");
      return;
  }
  if (!usuarioForm.value.email.toLowerCase().endsWith("@gmail.com")) {
      mostrarMensagem("Erro: Somente emails @gmail.com são permitidos.", "error");
      return;
  }
  if (usuarioForm.value.funcao === 'opp' && (!areasSelecionadas.value || areasSelecionadas.value.length === 0)) {
      mostrarMensagem("Erro: O OPP deve ter pelo menos uma área vinculada.", "error");
      return;
  }
  try {
    const payload = { ...usuarioForm.value, areas: areasSelecionadas.value };
    await criarCadastro(payload);
    dialogAdd.value = false;
    await carregarUsuarios();
    mostrarMensagem("Cadastro criado com sucesso!");
  } catch (error) {
    let msg = error.message;
    if (msg.includes("Duplicate entry")) {
      if (msg.toLowerCase().includes("email")) msg = "Este e-mail já está cadastrado.";
      else if (msg.toLowerCase().includes("nome")) msg = "Este nome já está cadastrado.";
      else msg = "Este nome ou e-mail já está cadastrado.";
    }
    mostrarMensagem("Erro ao criar: " + msg, "error");
  }
}

function abrirEditar(user) {
  // CORREÇÃO: Preencher visualmente a senha com "Senha001" (senha padrão vinculada).
  // Se o gestor não alterar, a senha atual é mantida intacta no banco.
  usuarioForm.value = { ...user, senha: "Senha001" };
  
  if (selecionado.value === "OPP") {
    carregarAreas();
    if (user.areaIds && user.areaIds.length > 0) {
      areasSelecionadas.value = [...user.areaIds];
    } else if (user.opp && user.opp.oppAreas) {
      areasSelecionadas.value = user.opp.oppAreas.map(oa => oa.idArea);
    } else {
      areasSelecionadas.value = [];
    }
  }
  
  dialogEdit.value = true;
}

async function salvarEdicao() {
  if (usuarioForm.value.email && !usuarioForm.value.email.toLowerCase().endsWith("@gmail.com")) {
      mostrarMensagem("Erro: Somente emails @gmail.com são permitidos.", "error");
      return;
  }
  if (usuarioForm.value.funcao === 'opp' && (!areasSelecionadas.value || areasSelecionadas.value.length === 0)) {
      mostrarMensagem("Erro: O OPP deve ter pelo menos uma área vinculada.", "error");
      return;
  }
  try {
    const { idUsuario, ...dados } = usuarioForm.value;
    const payload = { ...dados, areas: areasSelecionadas.value };
    // Se a senha for a padrão "Senha001" ou estiver vazia, removemos para manter a senha atual do banco
    if (!payload.senha || payload.senha === "Senha001") delete payload.senha;
    
    await editarCadastro(idUsuario, payload);
    dialogEdit.value = false;
    await carregarUsuarios();
    mostrarMensagem("Cadastro atualizado com sucesso!");
  } catch (error) {
    let msg = error.message;
    if (msg.includes("Duplicate entry")) {
      if (msg.toLowerCase().includes("email")) msg = "Este e-mail já está cadastrado.";
      else if (msg.toLowerCase().includes("nome")) msg = "Este nome já está cadastrado.";
      else msg = "Este nome ou e-mail já está cadastrado.";
    }
    mostrarMensagem("Erro ao editar: " + msg, "error");
  }
}

function abrirDeletar(user) {
  const usuarioLogado = getUsuarioLogado();
  if (usuarioLogado && usuarioLogado.idUsuario === user.idUsuario) {
    mostrarMensagem("Você não pode excluir seu próprio perfil que está em uso no momento.", "error");
    return;
  }
  usuarioDeletando.value = user;
  dialogDelete.value = true;
}

async function confirmarDelete() {
  try {
    await excluirCadastro(usuarioDeletando.value.idUsuario);
    dialogDelete.value = false;
    await carregarUsuarios();
    mostrarMensagem("Cadastro excluído com sucesso!");
  } catch (error) {
    mostrarMensagem("Erro ao excluir: " + (error.message || "Ocorreu um problema ao remover o usuário."), "error");
  }
}

let wsListener = null;
onMounted(() => {
  carregarUsuarios();
  carregarAreas();

  wsListener = (event) => {
    const detail = event.detail;
    if (detail.entity === 'cadastros') {
      console.log("🔄 Recarregando cadastros em tempo real...");
      carregarUsuarios();
    } else if (detail.entity === 'areas') {
      carregarAreas();
    }
  };
  window.addEventListener('websocket-data-updated', wsListener);
});

onBeforeUnmount(() => {
  if (wsListener) {
    window.removeEventListener('websocket-data-updated', wsListener);
  }
});
</script>

<template>
  <div>
  <div class="px-4 md:px-10 lg:px-20 xl:px-40 pb-10">
    <div class="flex items-center gap-3 mt-8 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
      <div class="bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
        <v-icon icon="mdi-account-cog" size="28"></v-icon>
      </div>
      <div>
        <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Gestão de Cadastros</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gerenciamento e controle de perfis, permissões e acessos dos usuários.
        </p>
      </div>
    </div>

    <!-- Abas Estilizadas Premium (Professor, Gestor, OPP) -->
    <div class="flex items-center mb-6">
      <div class="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl flex gap-1 border border-gray-200 dark:border-gray-700">
        <button
          v-for="tag in tags"
          :key="tag"
          class="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 cursor-pointer select-none"
          :class="selecionado === tag 
            ? 'bg-red-600 text-white scale-[1.01]' 
            : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/30'"
          @click="selecionado = tag"
        >
          <v-icon 
            :icon="tag === 'Professor' ? 'mdi-school-outline' : tag === 'Gestor' ? 'mdi-shield-crown-outline' : 'mdi-account-tie-outline'" 
            size="18"
            :class="selecionado === tag ? 'text-white' : 'text-gray-400 dark:text-gray-500'"
          ></v-icon>
          {{ tag }}
        </button>
      </div>
    </div>

    <v-card class="border-t-4 border-red-600 px-8 rounded-lg shadow-lg py-8">
      <div class="flex flex-col-reverse sm:flex-row justify-between gap-6">
        <v-text-field
          v-model="busca"
          label="Digite o nome"
          type="text"
          variant="filled"
          hide-details
          class="w-full"
        ></v-text-field>
        <div class="flex gap-2 flex-shrink-0">
            <v-btn class="h-14 bg-red-600! text-white font-bold" @click="abrirAdd">
              Novo Cadastro
            </v-btn>
        </div>
      </div>

      <v-table class="mt-8" fixed-header height="400px">
        <thead>
          <tr>
            <th class="text-left bg-gray-100 dark:bg-[#121212] font-bold">Nome</th>
            <th v-if="selecionado === 'OPP'" class="text-left bg-gray-100 dark:bg-[#121212] font-bold">Áreas</th>
            <th class="text-left bg-gray-100 dark:bg-[#121212] font-bold">Email</th>
            <th class="text-left bg-gray-100 dark:bg-[#121212] font-bold">Senha</th>
            <th class="text-right bg-gray-100 dark:bg-[#121212] font-bold px-10">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="usuariosFiltrados.length === 0">
            <td :colspan="selecionado === 'OPP' ? 5 : 4" class="text-center text-gray-500 py-8">
              Nenhum usuário encontrado nesta categoria.
            </td>
          </tr>
          <tr v-for="user in usuariosFiltrados" :key="user.idUsuario">
            <td>{{ user.nome }}</td>
            <td v-if="selecionado === 'OPP'">{{ formatarAreas(user) }}</td>
            <td>{{ user.email }}</td>
            <td>Senha001</td> <!-- Mostrando fixo como solicitado na imagem -->
            <td class="text-right px-4">
              <div class="flex gap-2 justify-end">
                <v-btn
                  icon="mdi-pencil"
                  color="primary"
                  size="small"
                  @click="abrirEditar(user)"
                  class="dark:bg-[#121212]"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  color="error"
                  size="small"
                  @click="abrirDeletar(user)"
                  class="dark:bg-[#121212]"
                ></v-btn>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>

  <!-- Modal Adicionar -->
  <v-dialog v-model="dialogAdd" max-width="500px">
    <v-card class="rounded-lg">
      <v-card-title class="bg-red-600 text-white pa-4">Adicionar Cadastro</v-card-title>
      <v-card-text class="pa-4">
        <v-text-field v-model="usuarioForm.nome" label="Nome e Sobrenome" variant="outlined" class="mb-4"></v-text-field>
        <v-text-field v-model="usuarioForm.email" label="Email" variant="outlined" class="mb-4"></v-text-field>
        <v-text-field v-model="usuarioForm.senha" label="Senha" variant="outlined" class="mb-4" readonly></v-text-field>
        <v-select
          v-if="selecionado === 'OPP'"
          v-model="areasSelecionadas"
          :items="areasDisponiveis"
          item-title="nome"
          item-value="idArea"
          label="Áreas"
          variant="outlined"
          multiple
          chips
        ></v-select>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn @click="dialogAdd = false" variant="elevated"  >Cancelar</v-btn>
        <v-btn color="red" variant="elevated" class="bg-red-600! text-white!" @click="salvarNovo">Salvar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Modal Editar -->
  <v-dialog v-model="dialogEdit" max-width="500px">
    <v-card class="rounded-lg">
      <v-card-title class="bg-red-600 text-white pa-4">Editar Cadastro</v-card-title>
      <v-card-text class="pa-4">
        <v-text-field v-model="usuarioForm.nome" label="Nome" placeholder="Nome e Sobrenome" persistent-placeholder variant="outlined" class="mb-4"></v-text-field>
        <v-text-field v-model="usuarioForm.email" label="Email" variant="outlined" class="mb-4"></v-text-field>
        <v-text-field v-model="usuarioForm.senha" label="Senha" variant="outlined" class="mb-4"></v-text-field>
        <v-select
          v-if="selecionado === 'OPP'"
          v-model="areasSelecionadas"
          :items="areasDisponiveis"
          item-title="nome"
          item-value="idArea"
          label="Áreas"
          variant="outlined"
          multiple
          chips
        ></v-select>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn @click="dialogEdit = false">Cancelar</v-btn>
        <v-btn color="red" variant="elevated" @click="salvarEdicao">Salvar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Modal Deletar -->
  <v-dialog v-model="dialogDelete" max-width="450px" persistent>
    <v-card class="rounded-xl overflow-hidden shadow-2xl">
      <v-card-title class="bg-red-600 text-white font-bold px-6 py-4 text-xl">
        Confirmar Exclusão
      </v-card-title>
      <v-card-text class="pa-8 text-center text-lg font-medium leading-relaxed text-gray-700">
        Tem certeza de que deseja excluir o usuário <b>{{ usuarioDeletando?.nome }}</b>? Esta ação não pode ser desfeita.
      </v-card-text>
      <v-card-actions class="pa-6 pt-0 flex justify-end gap-3">
        <v-btn variant="elevated" color="grey-lighten-2" class="font-bold px-6 uppercase tracking-wide text-gray-800" @click="dialogDelete = false">Cancelar</v-btn>
        <v-btn variant="elevated" color="red" class="bg-red-600 text-white font-bold px-8 shadow-sm uppercase tracking-wide" @click="confirmarDelete">Excluir</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Snackbar para Notificações Estilizadas -->
  <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="4000" location="top end" elevation="24">
    <div class="font-bold">{{ snackbar.text }}</div>
    <template v-slot:actions>
      <v-btn variant="text" @click="snackbar.show = false">Fechar</v-btn>
    </template>
  </v-snackbar>
  </div>
</template>

<style scoped>
/* Estilos para bater com a imagem */
:deep(.v-chip--selected) {
  opacity: 1 !important;
}

.v-table {
    border-radius: 8px;
    overflow: hidden;
}

thead th {
    font-size: 1.1rem !important;
    color: #333 !important;
}

.dark thead th {
    color: #eee !important;
}
</style>
