/**
 * Módulo Principal de Orquestração e Dashboard (assets/js/dashboard.js)
 * Responsabilidades:
 * - Controle de rota autenticada (redireciona para index.html se não houver sessão ativa)
 * - Navegação entre os menus: Dashboard, Alunos, Planos, Treinos e Matrículas
 * - Cálculo e renderização dos 3 Cards de Resumo (KPIs):
 *   1. Total de alunos cadastrados
 *   2. Receita estimada (soma do valor dos planos das matrículas ativas)
 *   3. Total de alunos inativos
 */

document.addEventListener('DOMContentLoaded', async () => {
  window.refreshIcons();

  // 1. Controle de Rota: verifica sessão ativa no Supabase Auth
  const session = await window.checkAuthGuard(true);
  if (!session) {
    return;
  }

  // Exibe dados do usuário administrativo logado (Recepção)
  const emailDisplay = document.getElementById('userEmailDisplay');
  const roleDisplay = document.getElementById('userRoleDisplay');
  if (emailDisplay && session.user) {
    emailDisplay.textContent = session.user.user_metadata?.full_name || session.user.email;
  }
  if (roleDisplay && session.user) {
    roleDisplay.textContent = session.user.email;
  }

  // 2. Inicializa navegação lateral e eventos de todos os módulos
  setupSidebarNavigation();
  window.initAlunosModule();
  window.initPlanosModule();
  window.initTreinosModule();
  window.initMatriculasModule();

  // 3. Carrega todos os dados do Supabase e atualiza os 3 Cards de Resumo
  await recarregarSistema();
});

/**
 * Configura a navegação entre as seções (Dashboard, Alunos, Planos, Treinos e Matrículas)
 */
function setupSidebarNavigation() {
  const buttons = document.querySelectorAll('.nav-tab-btn');
  const views = document.querySelectorAll('.tab-view');
  const btnMobileMenu = document.getElementById('btnMobileMenu');
  const sidebarMenu = document.getElementById('sidebarMenu');

  if (btnMobileMenu && sidebarMenu) {
    btnMobileMenu.addEventListener('click', () => {
      sidebarMenu.classList.toggle('hidden');
    });
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      navegarParaAba(targetTab);

      if (window.innerWidth < 1024 && sidebarMenu) {
        sidebarMenu.classList.add('hidden');
      }
    });
  });
}

/**
 * Alterna a visualização ativa entre os menus do sistema
 * @param {string} tabId - 'dashboard' | 'alunos' | 'planos' | 'treinos' | 'matriculas'
 */
function navegarParaAba(tabId) {
  const buttons = document.querySelectorAll('.nav-tab-btn');
  const views = document.querySelectorAll('.tab-view');

  const activeClass =
    'nav-tab-btn w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50 transition-all';
  const inactiveClass =
    'nav-tab-btn w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all';

  buttons.forEach((btn) => {
    const isTarget = btn.getAttribute('data-tab') === tabId;
    btn.className = isTarget ? activeClass : inactiveClass;
  });

  views.forEach((view) => {
    view.classList.add('hidden');
  });

  const activeView = document.getElementById(`view-${tabId}`);
  if (activeView) {
    activeView.classList.remove('hidden');
  }

  window.refreshIcons();
}

/**
 * Carrega em sequência Planos, Alunos, Treinos e Matrículas do Supabase e atualiza os KPIs
 */
async function recarregarSistema() {
  try {
    await Promise.all([
      window.carregarPlanos(),
      window.carregarAlunos()
    ]);

    await Promise.all([
      window.carregarTreinos(),
      window.carregarMatriculas()
    ]);

    atualizarCardsResumoDashboard();
  } catch (err) {
    console.error('Erro ao sincronizar dados do Dashboard:', err.message);
  }
}

/**
 * Calcula e exibe os 3 Cards de Resumo exigidos no Dashboard:
 * 1. Total de alunos cadastrados
 * 2. Receita estimada (soma do valor dos planos das matrículas ativas)
 * 3. Total de alunos inativos
 */
function atualizarCardsResumoDashboard() {
  const alunos = window.appState.alunos || [];
  const planos = window.appState.planos || [];
  const matriculas = window.appState.matriculas || [];

  // Card 1: Total de alunos cadastrados
  const totalAlunos = alunos.length;
  const totalAlunosAtivos = alunos.filter(
    (a) => String(a.status || '').toLowerCase() === 'ativo'
  ).length;

  // Card 3: Total de alunos inativos
  const totalAlunosInativos = alunos.filter(
    (a) => String(a.status || '').toLowerCase() === 'inativo'
  ).length;

  // Card 2: Receita estimada (soma do valor `preco` dos planos das matrículas ativas)
  const matriculasAtivas = matriculas.filter((m) => window.isMatriculaAtiva(m));
  const receitaEstimada = matriculasAtivas.reduce((acc, mat) => {
    const plano = planos.find((p) => String(p.id) === String(mat.plano_id));
    return acc + (plano ? Number(plano.preco || 0) : 0);
  }, 0);

  // Atualiza elementos do DOM
  const elTotalAlunos = document.getElementById('kpiTotalAlunos');
  const elSubTotalAlunos = document.getElementById('kpiSubTotalAlunos');
  const elReceitaEstimada = document.getElementById('kpiReceitaEstimada');
  const elSubReceita = document.getElementById('kpiSubReceita');
  const elAlunosInativos = document.getElementById('kpiAlunosInativos');

  if (elTotalAlunos) elTotalAlunos.textContent = totalAlunos;
  if (elSubTotalAlunos) elSubTotalAlunos.textContent = `${totalAlunosAtivos} aluno(s) ativo(s)`;
  if (elReceitaEstimada) elReceitaEstimada.textContent = window.formatarMoedaBRL(receitaEstimada);
  if (elSubReceita) elSubReceita.textContent = `${matriculasAtivas.length} matrícula(s) ativa(s)`;
  if (elAlunosInativos) elAlunosInativos.textContent = totalAlunosInativos;
}

window.navegarParaAba = navegarParaAba;
window.recarregarSistema = recarregarSistema;
window.atualizarCardsResumoDashboard = atualizarCardsResumoDashboard;
