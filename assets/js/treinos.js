/**
 * Módulo de Gestão de Treinos — CRUD 3 (assets/js/treinos.js)
 * Tabela no Supabase: public.treinos
 * Colunas: id, nome_treino, descricao, nivel (+ aluno_id para associar treino a aluno específico)
 */

/**
 * Inicializa os formulários de Cadastro/Edição de Treino e de Associação de Treino a Aluno
 */
function initTreinosModule() {
  const formTreino = document.getElementById('formTreino');
  if (formTreino) {
    formTreino.addEventListener('submit', salvarTreino);
  }

  const formAssociar = document.getElementById('formAssociarTreino');
  if (formAssociar) {
    formAssociar.addEventListener('submit', salvarAssociacaoTreino);
  }
}

/**
 * Popula os <select> de Alunos utilizados no modal de Treino e no modal de Associação
 */
function popularSelectAlunosTreino() {
  const selectModalTreino = document.getElementById('treinoAlunoId');
  const selectModalAssociar = document.getElementById('associarAlunoSelect');

  const opcoesHtml = window.appState.alunos
    .map(
      (aluno) =>
        `<option value="${aluno.id}">${window.escapeHtml(aluno.nome)} — CPF: ${window.escapeHtml(aluno.cpf)}</option>`
    )
    .join('');

  if (selectModalTreino) {
    selectModalTreino.innerHTML = `<option value="">Sem aluno específico (Treino Geral)</option>${opcoesHtml}`;
  }

  if (selectModalAssociar) {
    selectModalAssociar.innerHTML = `<option value="">Selecione um aluno para associar...</option>${opcoesHtml}`;
  }
}

/**
 * READ: Busca todos os treinos cadastrados no Supabase
 */
async function carregarTreinos() {
  try {
    const { data, error } = await window.supabaseClient
      .from('treinos')
      .select('*')
      .order('nome_treino', { ascending: true });

    if (error) {
      throw error;
    }

    window.appState.treinos = data || [];
    renderizarTabelaTreinos();
  } catch (err) {
    console.error('Erro ao carregar treinos:', err.message);
    await Swal.fire({
      icon: 'error',
      title: 'Erro ao carregar treinos',
      text: err.message || 'Não foi possível buscar a lista de treinos no Supabase.',
      confirmButtonColor: '#10b981'
    });
  }
}

/**
 * Renderiza a listagem de treinos via manipulação nativa de DOM
 */
function renderizarTabelaTreinos() {
  const tbody = document.getElementById('tabelaTreinosBody');
  if (!tbody) return;

  const badgeSidebar = document.getElementById('badgeCountTreinos');
  if (badgeSidebar) {
    badgeSidebar.textContent = window.appState.treinos.length;
  }

  if (window.appState.treinos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-12 text-center text-slate-500">
          Nenhum treino cadastrado. Clique em <strong>"Novo Treino"</strong> para prescrever um treino.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = window.appState.treinos
    .map((treino) => {
      const nivelLower = String(treino.nivel || '').toLowerCase();
      const badgeNivelClass = nivelLower.includes('avan')
        ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
        : nivelLower.includes('inter')
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';

      // Identifica o aluno associado (caso exista aluno_id vinculado)
      const alunoAssociado = treino.aluno_id
        ? window.appState.alunos.find((a) => String(a.id) === String(treino.aluno_id))
        : null;

      const htmlAlunoAssociado = alunoAssociado
        ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium">
             <i data-lucide="user-check" class="w-3.5 h-3.5"></i>
             ${window.escapeHtml(alunoAssociado.nome)}
           </span>`
        : `<span class="text-xs text-slate-500 italic">Não associado</span>`;

      return `
      <tr class="hover:bg-white/[0.02] transition">
        <td class="py-4 px-5">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0">
              <i data-lucide="dumbbell" class="w-4 h-4"></i>
            </div>
            <div>
              <div class="font-semibold text-white">${window.escapeHtml(treino.nome_treino)}</div>
              <div class="text-[11px] text-slate-500">Protocolo Técnico</div>
            </div>
          </div>
        </td>
        <td class="py-4 px-4 max-w-md">
          <p class="text-xs text-slate-300 leading-relaxed">${window.escapeHtml(treino.descricao)}</p>
        </td>
        <td class="py-4 px-4">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeNivelClass}">
            <i data-lucide="flame" class="w-3 h-3"></i>
            ${window.escapeHtml(treino.nivel)}
          </span>
        </td>
        <td class="py-4 px-4">
          ${htmlAlunoAssociado}
        </td>
        <td class="py-4 px-5 text-right whitespace-nowrap">
          <button
            type="button"
            onclick="openAssociarTreinoModal('${treino.id}')"
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition mr-1.5"
            title="Associar Treino a um Aluno"
          >
            <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
            <span>Associar Aluno</span>
          </button>
          <button
            type="button"
            onclick="editarTreino('${treino.id}')"
            class="p-2 rounded-xl text-sky-400 hover:bg-sky-500/15 transition mr-1"
            title="Editar Treino"
          >
            <i data-lucide="pencil" class="w-4 h-4"></i>
          </button>
          <button
            type="button"
            onclick="deletarTreino('${treino.id}')"
            class="p-2 rounded-xl text-rose-400 hover:bg-rose-500/15 transition"
            title="Excluir Treino"
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
 * Abre o modal de Cadastro / Edição de Treino
 */
function openTreinoModal(treino = null) {
  popularSelectAlunosTreino();

  const form = document.getElementById('formTreino');
  if (form) form.reset();

  document.getElementById('treinoId').value = treino ? treino.id : '';
  document.getElementById('modalTreinoTitle').textContent = treino
    ? 'Editar Treino'
    : 'Cadastrar Novo Treino';

  if (treino) {
    document.getElementById('treinoNome').value = treino.nome_treino || '';
    document.getElementById('treinoDescricao').value = treino.descricao || '';
    document.getElementById('treinoNivel').value = treino.nivel || 'Intermediário';
    const selectAluno = document.getElementById('treinoAlunoId');
    if (selectAluno) {
      selectAluno.value = treino.aluno_id || '';
    }
  }

  window.openModal('modalTreino');
}

/**
 * UPDATE: Preenche o modal de treino com os dados existentes
 */
function editarTreino(id) {
  const treino = window.appState.treinos.find((t) => String(t.id) === String(id));
  if (!treino) return;
  openTreinoModal(treino);
}

/**
 * CREATE / UPDATE: Grava ou altera um treino no Supabase
 */
async function salvarTreino(event) {
  event.preventDefault();

  const id = document.getElementById('treinoId').value.trim();
  const nome_treino = document.getElementById('treinoNome').value.trim();
  const descricao = document.getElementById('treinoDescricao').value.trim();
  const nivel = document.getElementById('treinoNivel').value.trim();
  const alunoIdInput = document.getElementById('treinoAlunoId');
  const aluno_id = alunoIdInput && alunoIdInput.value ? alunoIdInput.value : null;

  if (!nome_treino || !descricao || !nivel) {
    await Swal.fire({
      icon: 'warning',
      title: 'Campos Obrigatórios',
      text: 'Preencha Nome do Treino, Descrição dos exercícios e Nível.',
      confirmButtonColor: '#10b981'
    });
    return;
  }

  const payload = {
    nome_treino,
    descricao,
    nivel,
    aluno_id
  };

  try {
    if (id) {
      const { error } = await window.supabaseClient
        .from('treinos')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
    } else {
      const { error } = await window.supabaseClient
        .from('treinos')
        .insert([payload]);

      if (error) throw error;
    }

    window.closeModal('modalTreino');

    if (typeof window.recarregarSistema === 'function') {
      await window.recarregarSistema();
    } else {
      await carregarTreinos();
    }

    await Swal.fire({
      icon: 'success',
      title: id ? 'Treino Atualizado!' : 'Treino Cadastrado!',
      text: 'O treino foi salvo com sucesso no Supabase.',
      timer: 1600,
      showConfirmButton: false
    });
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: 'Erro ao Salvar Treino',
      text: err.message || 'Ocorreu um erro ao salvar o treino no Supabase.',
      confirmButtonColor: '#10b981'
    });
  }
}

/**
 * Abre o modal exclusivo para associar um treino a um aluno específico
 */
function openAssociarTreinoModal(treinoId) {
  if (window.appState.alunos.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'Nenhum Aluno Cadastrado',
      text: 'Cadastre pelo menos um aluno no menu "Alunos" antes de associar um treino.',
      confirmButtonColor: '#10b981'
    });
    return;
  }

  const treino = window.appState.treinos.find((t) => String(t.id) === String(treinoId));
  if (!treino) return;

  popularSelectAlunosTreino();

  document.getElementById('associarTreinoId').value = treino.id;
  document.getElementById('associarTreinoNomeDisplay').textContent = `${treino.nome_treino} (${treino.nivel})`;
  document.getElementById('associarAlunoSelect').value = treino.aluno_id || '';

  window.openModal('modalAssociarTreino');
}

/**
 * Salva a associação entre o treino e o aluno selecionado no Supabase
 */
async function salvarAssociacaoTreino(event) {
  event.preventDefault();

  const treinoId = document.getElementById('associarTreinoId').value;
  const alunoId = document.getElementById('associarAlunoSelect').value;

  if (!treinoId || !alunoId) {
    await Swal.fire({
      icon: 'warning',
      title: 'Selecione um Aluno',
      text: 'Escolha o aluno que receberá este treino.',
      confirmButtonColor: '#10b981'
    });
    return;
  }

  try {
    const { error } = await window.supabaseClient
      .from('treinos')
      .update({ aluno_id: alunoId })
      .eq('id', treinoId);

    if (error) {
      throw error;
    }

    window.closeModal('modalAssociarTreino');
    await carregarTreinos();

    const aluno = window.appState.alunos.find((a) => String(a.id) === String(alunoId));
    await Swal.fire({
      icon: 'success',
      title: 'Treino Associado!',
      text: `O treino foi vinculado com sucesso ao aluno ${aluno ? aluno.nome : ''}.`,
      timer: 1600,
      showConfirmButton: false
    });
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: 'Erro ao Associar Treino',
      text: err.message || 'Não foi possível associar o treino ao aluno no Supabase.',
      confirmButtonColor: '#10b981'
    });
  }
}

/**
 * DELETE: Exibe confirmação via SweetAlert2 e remove o treino no Supabase
 */
async function deletarTreino(id) {
  const treino = window.appState.treinos.find((t) => String(t.id) === String(id));
  const nomeTreino = treino ? treino.nome_treino : 'este treino';

  const confirmacao = await Swal.fire({
    icon: 'warning',
    title: 'Excluir Treino?',
    text: `Tem certeza que deseja excluir "${nomeTreino}"?`,
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    cancelButtonColor: '#334155',
    confirmButtonText: 'Sim, excluir treino',
    cancelButtonText: 'Cancelar'
  });

  if (!confirmacao.isConfirmed) return;

  try {
    const { error } = await window.supabaseClient
      .from('treinos')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    if (typeof window.recarregarSistema === 'function') {
      await window.recarregarSistema();
    } else {
      await carregarTreinos();
    }

    await Swal.fire({
      icon: 'success',
      title: 'Treino Excluído!',
      text: 'O treino foi removido com sucesso.',
      timer: 1500,
      showConfirmButton: false
    });
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: 'Erro ao Excluir Treino',
      text: err.message || 'Não foi possível excluir o treino no Supabase.',
      confirmButtonColor: '#10b981'
    });
  }
}

window.initTreinosModule = initTreinosModule;
window.popularSelectAlunosTreino = popularSelectAlunosTreino;
window.carregarTreinos = carregarTreinos;
window.renderizarTabelaTreinos = renderizarTabelaTreinos;
window.openTreinoModal = openTreinoModal;
window.editarTreino = editarTreino;
window.openAssociarTreinoModal = openAssociarTreinoModal;
window.deletarTreino = deletarTreino;
