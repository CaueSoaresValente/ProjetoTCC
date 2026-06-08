import { estaLogado } from './api';

let socket: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let onSessionExpiredCallback: (() => void) | null = null;

export function connectWebSocket(onSessionExpired: () => void) {
  onSessionExpiredCallback = onSessionExpired;
  
  if (!estaLogado()) return;
  if (socket) return; // Já está conectado ou conectando

  const token = localStorage.getItem('token');
  if (!token) return;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/api/ws?token=${token}`;

  console.log(`🔌 Conectando ao WebSocket: ${wsUrl}`);
  socket = new WebSocket(wsUrl);

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'SESSION_EXPIRED') {
        console.warn('⚠️ Sessão expirada via WebSocket (perfil excluído)');
        if (onSessionExpiredCallback) {
          onSessionExpiredCallback();
        }
      }
    } catch (err) {
      console.error('Erro ao processar mensagem do WebSocket:', err);
    }
  };

  socket.onclose = (event) => {
    console.log(`🔌 Conexão WebSocket fechada (código: ${event.code})`);
    socket = null;

    // Se o código for 4001, indica que o perfil foi excluído, logo não reconectamos.
    // E só reconectamos se o usuário ainda constar como logado localmente (evita loops no logout).
    if (event.code !== 4001 && estaLogado()) {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(() => {
        console.log('🔌 Tentando reconectar ao WebSocket...');
        connectWebSocket(onSessionExpired);
      }, 5000);
    }
  };

  socket.onerror = (err) => {
    console.error('❌ Erro na conexão WebSocket:', err);
  };
}

export function disconnectWebSocket() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (socket) {
    console.log('🔌 Fechando conexão WebSocket voluntariamente (logout)');
    socket.close(1000, 'Logout voluntário');
    socket = null;
  }
}
