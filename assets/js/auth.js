/**
 * Módulo de Autenticação (assets/js/auth.js)
 * Responsabilidades:
 * - Login de usuários administrativos via Supabase Auth (usuários gerenciados diretamente no Supabase)
 * - Validação rigorosa de campos vazios e formato de e-mail
 * - Encerramento de sessão (Logout) com redirecionamento para a tela de login
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

document.addEventListener('DOMContentLoaded', async () => {
  window.refreshIcons();

  const loginForm = document.getElementById('loginForm');

  // Se estivermos na página de autenticação (index.html), verifica se já há sessão ativa
  if (loginForm) {
    await window.checkAuthGuard(false);
    setupLoginForm();
  }
});

/**
 * Valida formato de e-mail utilizando expressão regular
 * @param {string} email
 * @returns {boolean}
 */
function validarFormatoEmail(email) {
  return EMAIL_REGEX.test(String(email).trim());
}

/**
 * Alterna visibilidade da senha nos campos de input
 */
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  btn.innerHTML = `<i data-lucide="${isPassword ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>`;
  window.refreshIcons();
}

/**
 * Configuração e submissão do formulário de Login (E-mail e Senha)
 */
function setupLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // 1. Validação de campos vazios
    if (!email || !password) {
      await Swal.fire({
        icon: 'warning',
        title: 'Campos Obrigatórios',
        text: 'Por favor, preencha o e-mail e a senha para continuar.',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    // 2. Validação de formato de e-mail
    if (!validarFormatoEmail(email)) {
      await Swal.fire({
        icon: 'error',
        title: 'E-mail Inválido',
        text: 'Informe um endereço de e-mail válido (exemplo: recepcao@academia.com).',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    // 3. Verificação das chaves do Supabase
    if (!window.isSupabaseConfigured()) {
      await Swal.fire({
        icon: 'warning',
        title: 'Configuração Pendente',
        text: 'Configure SUPABASE_URL e SUPABASE_ANON_KEY no arquivo assets/js/supabaseConfig.js para autenticar no Supabase.',
        confirmButtonColor: '#10b981'
      });
      return;
    }

    const submitBtn = document.getElementById('btnLoginSubmit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Autenticando...</span>';

    try {
      const { error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      await Swal.fire({
        icon: 'success',
        title: 'Login Realizado!',
        text: 'Acesso autorizado. Redirecionando para o Dashboard...',
        timer: 1400,
        showConfirmButton: false
      });

      window.location.replace('dashboard.html');
    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Falha na Autenticação',
        text: traduzirErroSupabase(err.message),
        confirmButtonColor: '#10b981'
      });
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML =
        '<i data-lucide="log-in" class="w-4 h-4 stroke-[2.5]"></i><span>Entrar no Sistema</span>';
      window.refreshIcons();
    }
  });
}

/**
 * Encerra a sessão ativa no Supabase Auth e redireciona para o Login (index.html)
 */
async function handleLogout() {
  const confirmacao = await Swal.fire({
    icon: 'question',
    title: 'Encerrar Sessão?',
    text: 'Deseja realmente sair do painel administrativo da academia?',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    cancelButtonColor: '#334155',
    confirmButtonText: 'Sim, sair',
    cancelButtonText: 'Cancelar'
  });

  if (!confirmacao.isConfirmed) return;

  try {
    const { error } = await window.supabaseClient.auth.signOut();
    if (error) {
      throw error;
    }

    await Swal.fire({
      icon: 'success',
      title: 'Sessão Encerrada',
      text: 'Você foi desconectado com segurança.',
      timer: 1200,
      showConfirmButton: false
    });

    window.location.replace('index.html');
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: 'Erro ao encerrar sessão',
      text: traduzirErroSupabase(err.message),
      confirmButtonColor: '#10b981'
    });
  }
}

/**
 * Traduz mensagens de erro comuns do Supabase Auth para Português
 */
function traduzirErroSupabase(msg = '') {
  const lower = String(msg).toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'E-mail ou senha inválidos. Verifique suas credenciais e tente novamente.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.';
  }
  return msg || 'Ocorreu um erro na comunicação com o Supabase.';
}

window.togglePasswordVisibility = togglePasswordVisibility;
window.handleLogout = handleLogout;
