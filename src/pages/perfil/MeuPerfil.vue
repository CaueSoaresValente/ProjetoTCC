<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getUsuarioLogado, buscarMeuPerfil, atualizarMeuPerfil, alterarMinhaSenha } from '@/services/api'

const router = useRouter()

// ============================================================
// ESTADO
// ============================================================
const usuario = computed(() => getUsuarioLogado())
const loading = ref(false)
const saving = ref(false)
const savingPassword = ref(false)

// Dados do perfil
const nome = ref('')
const email = ref('')
const funcao = ref('')
const fotoPerfil = ref(null)
const fotoPreview = ref(null)

// Dados de senha
const senhaAtual = ref('')
const novaSenha = ref('')
const confirmarSenha = ref('')
const mostrarSenhaAtual = ref(false)
const mostrarNovaSenha = ref(false)
const mostrarConfirmarSenha = ref(false)

// Feedback
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

// ============================================================
// COMPUTED
// ============================================================
const inicialNome = computed(() => {
  return nome.value ? nome.value.charAt(0).toUpperCase() : '?'
})

const funcaoLabel = computed(() => {
  const labels = {
    gestor: 'Gestor',
    opp: 'OPP',
    professor: 'Professor'
  }
  return labels[funcao.value] || funcao.value
})

const funcaoColor = computed(() => {
  const colors = {
    gestor: 'from-red-600 to-red-500',
    opp: 'from-blue-600 to-blue-500',
    professor: 'from-green-600 to-green-500'
  }
  return colors[funcao.value] || 'from-gray-600 to-gray-500'
})

const funcaoBadgeColor = computed(() => {
  const colors = {
    gestor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    opp: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    professor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  }
  return colors[funcao.value] || ''
})

const senhasValidas = computed(() => {
  if (!novaSenha.value || !confirmarSenha.value) return false
  return novaSenha.value === confirmarSenha.value
})



// ============================================================
// MÉTODOS
// ============================================================
async function carregarPerfil() {
  loading.value = true
  try {
    const data = await buscarMeuPerfil()
    nome.value = data.nome || ''
    email.value = data.email || ''
    funcao.value = data.funcao || ''
    fotoPreview.value = data.fotoPerfil || null
  } catch (e) {
    // Fallback: usa os dados do localStorage
    const u = usuario.value
    if (u) {
      nome.value = u.nome || ''
      email.value = u.email || ''
      funcao.value = u.funcao || ''
      fotoPreview.value = u.fotoPerfil || null
    }
  } finally {
    loading.value = false
  }
}

function onFileChange(event) {
  const file = event.target.files[0]
  if (!file) return

  // Validação de tamanho (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    mostrarFeedback('A imagem deve ter no máximo 2MB', 'error')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    fotoPreview.value = e.target.result
    fotoPerfil.value = e.target.result
  }
  reader.readAsDataURL(file)
}

function removerFoto() {
  fotoPreview.value = null
  fotoPerfil.value = ''
}

async function salvarTudo() {
  if (!nome.value.trim()) {
    mostrarFeedback('O nome não pode estar vazio', 'error')
    return
  }
  
  if (!email.value.trim() || !email.value.includes('@')) {
    mostrarFeedback('E-mail inválido', 'error')
    return
  }

  if (novaSenha.value && novaSenha.value !== confirmarSenha.value) {
    mostrarFeedback('As senhas não coincidem', 'error')
    return
  }

  saving.value = true
  try {
    const dados = { nome: nome.value.trim(), email: email.value.trim() }
    if (fotoPerfil.value !== null) {
      dados.fotoPerfil = fotoPerfil.value
    }
    
    await atualizarMeuPerfil(dados)
    
    if (novaSenha.value) {
      await alterarMinhaSenha('', novaSenha.value)
      novaSenha.value = ''
      confirmarSenha.value = ''
    }
    
    mostrarFeedback('Perfil atualizado com sucesso!', 'success')
  } catch (e) {
    mostrarFeedback(e.message || 'Erro ao salvar perfil', 'error')
  } finally {
    saving.value = false
  }
}

function mostrarFeedback(msg, color) {
  snackbarMsg.value = msg
  snackbarColor.value = color
  snackbar.value = true
}

onMounted(() => {
  carregarPerfil()
})
</script>

<template>
  <div>
  <div class="pb-16">
    <!-- Header com gradiente -->
    <div class="relative overflow-hidden">
      <div class="relative px-4 md:px-10 lg:px-20 xl:px-40 mt-8 mb-6 pb-24">
        <div class="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4 w-full">
          <div class="bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
            <v-icon icon="mdi-account-circle" size="28"></v-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Meu Perfil</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerencie suas informações pessoais e credenciais de acesso.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Card principal flutuante -->
    <div class="px-4 md:px-10 lg:px-20 xl:px-40 -mt-16 relative z-10">
      <div class="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        
        <!-- Seção Avatar + Info básica -->
        <div class="p-6 md:p-10 border-b border-gray-100 dark:border-gray-800">
          <div class="flex flex-col md:flex-row items-center md:items-start gap-8">
            
            <!-- Avatar com upload -->
            <div class="relative group">
              <div class="w-32 h-32 rounded-2xl overflow-hidden shadow-lg border-4 border-white dark:border-gray-700 ring-4 ring-offset-2 dark:ring-offset-[#1a1a1a]"
                   :class="{
                     'ring-red-200': funcao === 'gestor',
                     'ring-blue-200': funcao === 'opp',
                     'ring-green-200': funcao === 'professor'
                   }">
                <img v-if="fotoPreview" :src="fotoPreview" alt="Foto de perfil"
                     class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center text-5xl font-black text-white bg-gradient-to-br"
                     :class="funcaoColor">
                  {{ inicialNome }}
                </div>
              </div>
              
              <!-- Overlay de edição -->
              <div class="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                   @click="$refs.fileInput.click()">
                <v-icon icon="mdi-camera" size="32" class="text-white"></v-icon>
              </div>
              
              <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
              
              <!-- Botão remover foto -->
              <button v-if="fotoPreview" @click="removerFoto"
                      class="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10">
                <v-icon icon="mdi-close" size="16"></v-icon>
              </button>
            </div>

            <!-- Info do usuário -->
            <div class="flex-1 text-center md:text-left">
              <div class="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h2 class="text-2xl font-black text-gray-900 dark:text-white">{{ nome || 'Carregando...' }}</h2>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide w-fit mx-auto md:mx-0"
                      :class="funcaoBadgeColor">
                  <v-icon :icon="funcao === 'gestor' ? 'mdi-shield-crown-outline' : funcao === 'opp' ? 'mdi-account-tie-outline' : 'mdi-school-outline'" size="14"></v-icon>
                  {{ funcaoLabel }}
                </span>
              </div>
              <p class="text-gray-500 dark:text-gray-400 flex items-center gap-2 justify-center md:justify-start">
                <v-icon icon="mdi-email-outline" size="18"></v-icon>
                {{ email }}
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Clique na foto para alterar • Máximo 2MB
              </p>
            </div>
          </div>
        </div>

        <!-- Formulário em duas colunas -->
        <div class="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-gray-800">
          
          <!-- Coluna 1: Dados Pessoais -->
          <div class="p-6 md:p-10">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center"
                   :class="funcaoColor">
                <v-icon icon="mdi-account-edit-outline" size="22" class="text-white"></v-icon>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">Dados Pessoais</h3>
                <p class="text-xs text-gray-400">Altere seu nome de exibição</p>
              </div>
            </div>

            <div class="space-y-5">
              <div>
                <label class="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Nome Completo</label>
                <v-text-field
                  v-model="nome"
                  label="Digite seu nome..."
                  variant="filled"
                  hide-details
                  prepend-inner-icon="mdi-account-outline"
                  class="rounded-lg"
                ></v-text-field>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">E-mail</label>
                <v-text-field
                  v-model="email"
                  label="Digite seu e-mail"
                  variant="filled"
                  hide-details
                  readonly
                  prepend-inner-icon="mdi-email-outline"
                  class="rounded-lg"
                ></v-text-field>
                <p class="text-[11px] text-gray-400 mt-1.5 ml-1">O e-mail é definido pelo administrador</p>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Função</label>
                <v-text-field
                  :model-value="funcaoLabel"
                  label="Função"
                  variant="filled"
                  hide-details
                  readonly
                  prepend-inner-icon="mdi-badge-account-outline"
                  class="rounded-lg"
                ></v-text-field>
                <p v-if="funcao !== 'gestor'" class="text-[11px] text-gray-400 mt-1.5 ml-1">A função é definida pelo administrador</p>
              </div>


            </div>
          </div>

          <!-- Coluna 2: Segurança (Senha) -->
          <div class="p-6 md:p-10">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <v-icon icon="mdi-shield-lock-outline" size="22" class="text-white"></v-icon>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">Segurança</h3>
                <p class="text-xs text-gray-400">Altere sua senha de acesso</p>
              </div>
            </div>

            <div class="space-y-5">
              
              <div>
                <label class="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Nova Senha</label>
                <v-text-field
                  v-model="novaSenha"
                  :type="mostrarNovaSenha ? 'text' : 'password'"
                  label="Digite a nova senha..."
                  variant="filled"
                  hide-details
                  prepend-inner-icon="mdi-lock-plus-outline"
                  :append-inner-icon="mostrarNovaSenha ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="mostrarNovaSenha = !mostrarNovaSenha"
                  class="rounded-lg"
                ></v-text-field>
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Confirmar Nova Senha</label>
                <v-text-field
                  v-model="confirmarSenha"
                  :type="mostrarConfirmarSenha ? 'text' : 'password'"
                  label="Confirme a nova senha..."
                  variant="filled"
                  hide-details
                  prepend-inner-icon="mdi-lock-check-outline"
                  :append-inner-icon="mostrarConfirmarSenha ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="mostrarConfirmarSenha = !mostrarConfirmarSenha"
                  class="rounded-lg"
                  :color="confirmarSenha && (senhasValidas ? 'green' : 'red')"
                ></v-text-field>
                <p v-if="confirmarSenha && !senhasValidas" class="text-[11px] text-red-500 font-bold mt-1.5 ml-1">
                  As senhas não coincidem
                </p>
                <p v-if="confirmarSenha && senhasValidas" class="text-[11px] text-green-500 font-bold mt-1.5 ml-1 flex items-center gap-1">
                  <v-icon icon="mdi-check-circle" size="12"></v-icon>
                  As senhas coincidem
                </p>
              </div>



            </div>
          </div>
        </div>

        <!-- Rodapé com Botão Salvar Tudo -->
        <div class="p-6 md:p-10 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
          <div class="flex justify-end">
            <v-btn
              @click="salvarTudo"
              :loading="saving"
              class="w-full md:w-auto text-none font-bold text-white shadow-lg px-8"
              size="large"
              rounded="lg"
              :class="{
                'bg-red-600 hover:bg-red-700': funcao === 'gestor',
                'bg-blue-600 hover:bg-blue-700': funcao === 'opp',
                'bg-green-600 hover:bg-green-700': funcao === 'professor',
                'bg-gray-800 hover:bg-gray-900': !funcao
              }"
            >
              <v-icon icon="mdi-content-save-all-outline" class="mr-2"></v-icon>
              Salvar Todas as Alterações
            </v-btn>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Snackbar de Feedback -->
  <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="4000" location="top right" rounded="lg">
    <div class="flex items-center gap-2">
      <v-icon :icon="snackbarColor === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'" size="20"></v-icon>
      <span class="font-bold">{{ snackbarMsg }}</span>
    </div>
    <template v-slot:actions>
      <v-btn variant="text" @click="snackbar = false">
        <v-icon icon="mdi-close"></v-icon>
      </v-btn>
    </template>
  </v-snackbar>
  </div>
</template>
