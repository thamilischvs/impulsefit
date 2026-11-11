/**
 * Módulo de Configuração do Supabase, Controle de Rotas (Auth Guard) e Utilitários Globais
 *
 * REGRAS DE SEGURANÇA:
 * - Utiliza EXCLUSIVAMENTE a chave pública anônima (anon / public key).
 * - NUNCA exponha a chave administrativa (service_role) no Front-end.
 * - Nenhuma persistência de dados é feita via LocalStorage (100% API Supabase).
 */

const SUPABASE_URL = 'https://ttkaljnzvkbscamasvpo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BX_nv04lZgCcwDF3Pb243g_udcxDuJE';

// Inicializa o cliente Supabase v2 via CDN
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado global compartilhado em memória entre os módulos JS (sem LocalStorage)
window.appState = {
  alunos: [],
  planos: [],
  treinos: [],
  matriculas: []
};

/**
 * Verifica se as credenciais do Supabase foram substituídas pelos valores reais do projeto
 */
function isSupabaseConfigured() {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('SEU-PROJETO-ID') &&
    !SUPABASE_ANON_KEY.includes('SUA_SUPABASE_ANON_PUBLIC_KEY')
  );
}

/**
 * Controle de Rotas no Front-end (Auth Guard):
 * - Em páginas protegidas (requireAuth = true): redireciona para index.html (Login) se não houver sessão ativa.
 * - Na página de login (requireAuth = false): redireciona para dashboard.html se já houver sessão ativa.
 *
 * @param {boolean} requireAuth
 * @returns {Promise<object|null>} Sessão ativa ou null
 */
async function checkAuthGuard(requireAuth = true) {
  if (!isSupabaseConfigured()) {
    if (requireAuth) {
      window.location.replace('index.html');
    }
    return null;
  }

  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    if (requireAuth && !session) {
      window.location.replace('index.html');
      return null;
    }

    if (!requireAuth && session) {
      window.location.replace('dashboard.html');
      return session;
    }

    return session;
  } catch (err) {
    console.error('Erro na verificação de sessão:', err.message);
    if (requireAuth) {
      window.location.replace('index.html');
    }
    return null;
  }
}

/**
 * Utilitários de UI (Modais, Formatação e Sanitização HTML)
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  refreshIcons();
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function escapeHtml(str = '') {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatarDataBR(isoDate) {
  if (!isoDate) return '-';
  const partes = String(isoDate).split('T')[0].split('-');
  if (partes.length !== 3) return isoDate;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarMoedaBRL(valor) {
  const numero = Number(valor || 0);
  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatarCPF(valor = '') {
  const digitos = String(valor).replace(/\D/g, '').slice(0, 11);
  return digitos
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatarTelefone(valor = '') {
  const digitos = String(valor).replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 10) {
    return digitos
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digitos
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function obterIniciais(nome = '') {
  const partes = String(nome).trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return 'IF';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

// Expõe funções e cliente no escopo global para os demais módulos Vanilla JS
window.supabaseClient = supabaseClient;
window.isSupabaseConfigured = isSupabaseConfigured;
window.checkAuthGuard = checkAuthGuard;
window.openModal = openModal;
window.closeModal = closeModal;
window.refreshIcons = refreshIcons;
window.escapeHtml = escapeHtml;
window.formatarDataBR = formatarDataBR;
window.formatarMoedaBRL = formatarMoedaBRL;
window.formatarCPF = formatarCPF;
window.formatarTelefone = formatarTelefone;
window.obterIniciais = obterIniciais;
