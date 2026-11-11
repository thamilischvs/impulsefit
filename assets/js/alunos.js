/**
 * Módulo de Gestão de Alunos — CRUD 1 (assets/js/alunos.js)
 * Tabela no Supabase: public.alunos
 * Colunas: id, nome, cpf, telefone, data_nascimento, status (ativo/inativo)
 */

let filtroStatusAluno = 'TODOS';
let termoBuscaAluno = '';

/**
 * Inicializa eventos de formulário, máscaras e filtros do módulo de Alunos
 */
function initAlunosModule() {
  const formAluno = document.getElementById('formAluno');
  if (formAluno) {
    formAluno.addEventListener('submit', salvarAluno);
  }

  // Máscaras de CPF e Telefone em tempo real
  const inputCpf = document.getElementById('alunoCpf');
  if (inputCpf) {
    inputCpf.addEventListener('input', (e) => {
      e.target.value = window.formatarCPF(e.target.value);
    });
  }

  const inputTelefone = document.getElementById('alunoTelefone');
  if (inputTelefone) {
    inputTelefone.addEventListener('input', (e) => {
      e.target.value = window.formatarTelefone(e.target.value);
    });
  }

  // Busca por nome ou CPF
  const inputBusca = document.getElementById('buscaAlunosInput');
  if (inputBusca) {
    inputBusca.addEventListener('input', (e) => {
      termoBuscaAluno = e.target.value.trim().toLowerCase();
      renderizarTabelaAlunos();
    });
  }

  // Botões de filtro rápido por status (Todos / Ativo / Inativo)
  const botoesFiltro = document.querySelectorAll('.status-filter-btn');
  botoesFiltro.forEach((btn) => {
    btn.addEventListener('click', () => {
      filtroStatusAluno = btn.getAttribute('data-status-filter');
      botoesFiltro.forEach((b) => {
        b.className =
          'status-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition';
      });
      btn.className =
        'status-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white transition';
      renderizarTabelaAlunos();
    });
  });
}

/**
 * READ: Busca todos os alunos cadastrados no Supabase
 */
async function carregarAlunos() {
  try {
    const { data, error } = await window.supabaseClient
      .from('alunos')
      .select('id, nome, cpf, telefone, data_nascimento, status')
      .order('nome', { ascending: true });

    if (error) {
      throw error;
    }

    window.appState.alunos = data || [];
    renderizarTabelaAlunos();

    // Atualiza os <select> dependentes nos módulos de Matrículas e Treinos
    if (typeof window.popularSelectsMatricula === 'function') {
      window.popularSelectsMatricula();
    }
    if (typeof window.popularSelectAlunosTreino === 'function') {
      window.popularSelectAlunosTreino();
    }
  } catch (err) {
    console.error('Erro ao carregar alunos:', err.message);
    await Swal.fire({
      icon: 'error',
      title: 'Erro ao carregar alunos',
      text: err.message || 'Não foi possível buscar a lista de alunos no Supabase.',
      confirmButtonColor: '#10b981'
    });
  }
}

/**
 * Constrói dinamicamente a tabela HTML de alunos via manipulação de DOM
 */
function renderizarTabelaAlunos() {
  const tbody = document.getElementById('tabelaAlunosBody');
  if (!tbody) return;

  const badgeSidebar = document.getElementById('badgeCountAlunos');
  if (badgeSidebar) {
    badgeSidebar.textContent = window.appState.alunos.length;
  }

  const alunosFiltrados = window.appState.alunos.filter((aluno) => {
    const statusNormalizado = String(aluno.status || 'ativo').toLowerCase();
    const passaStatus =
      filtroStatusAluno === 'TODOS' || statusNormalizado === filtroStatusAluno.toLowerCase();

    const passaBusca =
      !termoBuscaAluno ||
      String(aluno.nome || '').toLowerCase().includes(termoBuscaAluno) ||
      String(aluno.cpf || '').toLowerCase().includes(termoBuscaAluno) ||
      String(aluno.telefone || '').toLowerCase().includes(termoBuscaAluno);

    return passaStatus && passaBusca;
  });

  if (alunosFiltrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 text-center text-slate-500">
          Nenhum aluno encontrado. Clique em <strong>"Novo Aluno"</strong> para cadastrar.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = alunosFiltrados
    .map((aluno) => {
      const iniciais = window.obterIniciais(aluno.nome);
      const isAtivo = String(aluno.status || '').toLowerCase() === 'ativo';

      const badgeClass = isAtivo
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
        : 'bg-rose-500/10 text-rose-400 border-rose-500/25';

      const dotClass = isAtivo ? 'bg-emerald-400' : 'bg-rose-400';
      const labelStatus = isAtivo ? 'Ativo' : 'Inativo';

      return `
      <tr class="hover:bg-white/[0.02] transition">
        <td class="py-4 px-5">
          <div class="flex items-center gap-3.5">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/25 to-teal-500/25 border border-emerald-500/30 text-emerald-300 font-display font-bold text-xs flex items-center justify-center shrink-0">
              ${window.escapeHtml(iniciais)}
            </div>
            <div>
              <div class="font-semibold text-white">${window.escapeHtml(aluno.nome)}</div>
              <div class="text-[11px] text-slate-500">ID: ${window.escapeHtml(String(aluno.id).slice(0, 8))}</div>
            </div>
          </div>
        </td>
        <td class="py-4 px-4">
          <span class="font-mono-num text-xs text-slate-200 bg-white/[0.04] border border-white/[0.07] px-2.5 py-1 rounded-lg">
            ${window.escapeHtml(aluno.cpf)}
          </span>
        </td>
        <td class="py-4 px-4 font-mono-num text-xs text-slate-300">
          ${window.escapeHtml(aluno.telefone)}
        </td>
        <td class="py-4 px-4 font-mono-num text-xs text-slate-300">
          ${window.formatarDataBR(aluno.data_nascimento)}
        </td>
        <td class="py-4 px-4">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}">
            <span class="w-1.5 h-1.5 rounded-full ${dotClass}"></span>
            ${labelStatus}
          </span>
        </td>
        <td class="py-4 px-5 text-right whitespace-nowrap">
          <button
            type="button"
            onclick="editarAluno('${aluno.id}')"
            class="p-2 rounded-xl text-sky-400 hover:bg-sky-500/15 transition mr-1"
            title="Editar Aluno"
          >
            <i data-lucide="pencil" class="w-4 h-4"></i>
          </button>
          <button
            type="button"
            onclick="deletarAluno('${aluno.id}')"
            class="p-2 rounded-xl text-rose-400 hover:bg-rose-500/15 transition"
            title="Excluir Aluno"
          >
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>`;
    })
    .join('');

  window.refreshIcons();
}

/**
 * Abre o Modal de Aluno para Criação (aluno = null) ou Edição (aluno preenchido)
 */
function openAlunoModal(aluno = null) {
  const form = document.getElementById('formAluno');
  if (form) form.reset();

  document.getElementById('alunoId').value = aluno ? aluno.id : '';
  document.getElementById('modalAlunoTitle').textContent = aluno
    ? 'Editar Cadastro do Aluno'
    : 'Novo Aluno';

  if (aluno) {
    document.getElementById('alunoNome').value = aluno.nome || '';
    document.getElementById('alunoCpf').value = aluno.cpf || '';
    document.getElementById('alunoTelefone').value = aluno.telefone || '';
    document.getElementById('alunoDataNascimento').value = aluno.data_nascimento
      ? String(aluno.data_nascimento).split('T')[0]
      : '';
    document.getElementById('alunoStatus').value =
      String(aluno.status || 'ativo').toLowerCase() === 'inativo' ? 'inativo' : 'ativo';
  } else {
    document.getElementById('alunoStatus').value = 'ativo';
  }

  window.openModal('modalAluno');
}

/**
 * Preenche o modal com os dados do aluno selecionado para alteração (UPDATE)
 */
function editarAluno(id) {
  const aluno = window.appState.alunos.find((a) => String(a.id) === String(id));
  if (!aluno) return;
  openAlunoModal(aluno);
}

/**
 * CREATE / UPDATE: Salva um novo aluno ou atualiza um registro existente no Supabase
 */
async function salvarAluno(event) {
  event.preventDefault();

  const id = document.getElementById('alunoId').value.trim();
  const nome = document.getElementById('alunoNome').value.trim();
  const cpf = document.getElementById('alunoCpf').value.trim();
  const telefone = document.getElementById('alunoTelefone').value.trim();
  const data_nascimento = document.getElementById('alunoDataNascimento').value;
  const status = document.getElementById('alunoStatus').value.toLowerCase();

  if (!nome || !cpf || !telefone || !data_nascimento || !status) {
    await Swal.fire({
      icon: 'warning',
      title: 'Campos Obrigatórios',
      text: 'Preencha Nome, CPF, Telefone, Data de Nascimento e Status do aluno.',
      confirmButtonColor: '#10b981'
    });
    return;
  }

  const payload = {
    nome,
    cpf,
    telefone,
    data_nascimento,
    status
  };

  try {
    if (id) {
      const { error } = await window.supabaseClient
        .from('alunos')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
    } else {
      const { error } = await window.supabaseClient
        .from('alunos')
        .insert([payload]);

      if (error) throw error;
    }

    window.closeModal('modalAluno');

    if (typeof window.recarregarSistema === 'function') {
      await window.recarregarSistema();
    } else {
      await carregarAlunos();
    }

    await Swal.fire({
      icon: 'success',
      title: id ? 'Aluno Atualizado!' : 'Aluno Cadastrado!',
      text: id
        ? 'Os dados do aluno foram alterados com sucesso no Supabase.'
        : 'O novo aluno foi registrado com sucesso no banco de dados.',
      timer: 1600,
      showConfirmButton: false
    });
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: 'Erro ao Salvar Aluno',
      text: err.message || 'Ocorreu um erro ao gravar os dados do aluno no Supabase.',
      confirmButtonColor: '#10b981'
    });
  }
}

/**
 * DELETE: Exibe modal de confirmação SweetAlert2 e deleta o aluno no Supabase
 */
async function deletarAluno(id) {
  const aluno = window.appState.alunos.find((a) => String(a.id) === String(id));
  const nomeAluno = aluno ? aluno.nome : 'este aluno';

  const confirmacao = await Swal.fire({
    icon: 'warning',
    title: 'Confirmar Exclusão?',
    text: `Tem certeza que deseja excluir o cadastro de "${nomeAluno}"? Esta ação não poderá ser desfeita.`,
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    cancelButtonColor: '#334155',
    confirmButtonText: 'Sim, excluir aluno',
    cancelButtonText: 'Cancelar'
  });

  if (!confirmacao.isConfirmed) return;

  try {
    const { error } = await window.supabaseClient
      .from('alunos')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    if (typeof window.recarregarSistema === 'function') {
      await window.recarregarSistema();
    } else {
      await carregarAlunos();
    }

    await Swal.fire({
      icon: 'success',
      title: 'Aluno Excluído!',
      text: 'O registro foi removido permanentemente do Supabase.',
      timer: 1500,
      showConfirmButton: false
    });
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: 'Erro ao Excluir Aluno',
      text: err.message || 'Não foi possível excluir o aluno. Verifique se há vínculos ativos.',
      confirmButtonColor: '#10b981'
    });
  }
}

window.initAlunosModule = initAlunosModule;
window.carregarAlunos = carregarAlunos;
window.renderizarTabelaAlunos = renderizarTabelaAlunos;
window.openAlunoModal = openAlunoModal;
window.editarAluno = editarAluno;
window.deletarAluno = deletarAluno;
