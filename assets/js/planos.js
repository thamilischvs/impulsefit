/**
 * Módulo de Gestão de Planos — CRUD 2 (assets/js/planos.js)
 * Tabela no Supabase: public.planos
 * Colunas: id, nome, preco, duracao_meses, descricao
 * Layout: Grid responsivo de 3 Cards sobre seção com Background Fixo (bg-fixed)
 */

/**
 * Inicializa o formulário de Planos
 */
function initPlanosModule() {
  const formPlano = document.getElementById('formPlano');
  if (formPlano) {
    formPlano.addEventListener('submit', salvarPlano);
  }
}

/**
 * READ: Busca todos os planos no Supabase ordenados por preço
 */
async function carregarPlanos() {
  try {
    const { data, error } = await window.supabaseClient
      .from('planos')
      .select('id, nome, preco, duracao_meses, descricao')
      .order('preco', { ascending: true });

    if (error) {
      throw error;
    }

    window.appState.planos = data || [];
    renderizarCardsPlanos();

    // Atualiza o <select> de planos no módulo de Matrículas
    if (typeof window.popularSelectsMatricula === 'function') {
      window.popularSelectsMatricula();
    }
  } catch (err) {
    console.error('Erro ao carregar planos:', err.message);
    await Swal.fire({
      icon: 'error',
      title: 'Erro ao carregar planos',
      text: err.message || 'Não foi possível buscar os planos cadastrados no Supabase.',
      confirmButtonColor: '#10b981'
    });
  }
}

/**
 * Renderiza os planos em um Grid responsivo de 3 Cards (Tailwind)
 */
function renderizarCardsPlanos() {
  const gridContainer = document.getElementById('gridPlanosCards');
  if (!gridContainer) return;

  const badgeSidebar = document.getElementById('badgeCountPlanos');
  if (badgeSidebar) {
    badgeSidebar.textContent = window.appState.planos.length;
  }

  if (window.appState.planos.length === 0) {
    gridContainer.innerHTML = `
      <div class="col-span-1 md:col-span-2 lg:col-span-3 glass-panel rounded-2xl p-10 text-center">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3">
          <i data-lucide="credit-card" class="w-6 h-6"></i>
        </div>
        <h3 class="font-display text-base font-bold text-white">Nenhum Plano Cadastrado</h3>
        <p class="text-xs text-slate-400 mt-1">Clique em <strong>"Cadastrar Novo Plano"</strong> para adicionar o primeiro plano da academia.</p>
      </div>`;
    window.refreshIcons();
    return;
  }

  gridContainer.innerHTML = window.appState.planos
    .map((plano, index) => {
      const destaque = index === 1 || Number(plano.duracao_meses) === 12;
      const borderStyle = destaque
        ? 'border-emerald-500/50 shadow-emerald-950/60'
        : 'border-white/[0.12]';

      const itensDescricao = String(plano.descricao || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      const listaBeneficiosHtml =
        itensDescricao.length > 0
          ? itensDescricao
              .map(
                (item) => `
              <li class="flex items-start gap-2.5 text-xs text-slate-200">
                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"></i>
                <span>${window.escapeHtml(item)}</span>
              </li>`
              )
              .join('')
          : `<li class="text-xs text-slate-300">${window.escapeHtml(plano.descricao)}</li>`;

      const labelDuracao =
        Number(plano.duracao_meses) === 1
          ? '1 Mês (Mensal)'
          : Number(plano.duracao_meses) === 3
          ? '3 Meses (Trimestral)'
          : Number(plano.duracao_meses) === 6
          ? '6 Meses (Semestral)'
          : Number(plano.duracao_meses) === 12
          ? '12 Meses (Anual)'
          : `${plano.duracao_meses} Meses`;

      return `
      <article class="glass-panel rounded-2xl p-6 flex flex-col justify-between border ${borderStyle} hover:-translate-y-1 transition-all duration-200 relative overflow-hidden">
        ${
          destaque
            ? `<div class="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                 Destaque
               </div>`
            : ''
        }

        <div>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <i data-lucide="award" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="font-display text-lg font-bold text-white leading-tight">${window.escapeHtml(plano.nome)}</h3>
              <span class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300">
                <i data-lucide="calendar-clock" class="w-3 h-3"></i>
                Vigência: ${window.escapeHtml(labelDuracao)}
              </span>
            </div>
          </div>

          <div class="my-5 p-4 rounded-xl bg-slate-950/75 border border-white/[0.07]">
            <span class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Investimento</span>
            <div class="flex items-baseline gap-1 mt-1">
              <span class="font-mono-num text-3xl font-extrabold text-white">
                ${window.formatarMoedaBRL(plano.preco)}
              </span>
              <span class="text-xs text-slate-400">/ ciclo</span>
            </div>
          </div>

          <div class="mb-6">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">Descrição & Benefícios</p>
            <ul class="space-y-2">
              ${listaBeneficiosHtml}
            </ul>
          </div>
        </div>

        <div class="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-2">
          <button
            type="button"
            onclick="editarPlano('${plano.id}')"
            class="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-semibold transition"
          >
            <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
            <span>Editar</span>
          </button>
          <button
            type="button"
            onclick="deletarPlano('${plano.id}')"
            class="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition"
          >
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            <span>Excluir</span>
          </button>
        </div>
      </article>`;
    })
    .join('');

  window.refreshIcons();
}

/**
 * Abre o modal de Plano para cadastro ou edição
 */
function openPlanoModal(plano = null) {
  const form = document.getElementById('formPlano');
  if (form) form.reset();

  document.getElementById('planoId').value = plano ? plano.id : '';
  document.getElementById('modalPlanoTitle').textContent = plano
    ? 'Editar Plano'
    : 'Cadastrar Novo Plano';

  if (plano) {
    document.getElementById('planoNome').value = plano.nome || '';
    document.getElementById('planoPreco').value = plano.preco ?? '';
    document.getElementById('planoDuracao').value = plano.duracao_meses ?? '';
    document.getElementById('planoDescricao').value = plano.descricao || '';
  }

  window.openModal('modalPlano');
}

/**
 * UPDATE: Preenche o modal com os dados do plano para alteração
 */
function editarPlano(id) {
  const plano = window.appState.planos.find((p) => String(p.id) === String(id));
  if (!plano) return;
  openPlanoModal(plano);
}

/**
 * CREATE / UPDATE: Grava ou atualiza um plano na tabela `planos` do Supabase
 */
async function salvarPlano(event) {
  event.preventDefault();

  const id = document.getElementById('planoId').value.trim();
  const nome = document.getElementById('planoNome').value.trim();
  const preco = parseFloat(document.getElementById('planoPreco').value);
  const duracao_meses = parseInt(document.getElementById('planoDuracao').value, 10);
  const descricao = document.getElementById('planoDescricao').value.trim();

  if (!nome || isNaN(preco) || preco < 0 || isNaN(duracao_meses) || duracao_meses < 1 || !descricao) {
    await Swal.fire({
      icon: 'warning',
      title: 'Campos Obrigatórios',
      text: 'Preencha corretamente Nome, Preço, Duração em meses e Descrição do plano.',
      confirmButtonColor: '#10b981'
    });
    return;
  }

  const payload = {
    nome,
    preco,
    duracao_meses,
    descricao
  };

  try {
    if (id) {
      const { error } = await window.supabaseClient
        .from('planos')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
    } else {
      const { error } = await window.supabaseClient
        .from('planos')
        .insert([payload]);

      if (error) throw error;
    }

    window.closeModal('modalPlano');

    if (typeof window.recarregarSistema === 'function') {
      await window.recarregarSistema();
    } else {
      await carregarPlanos();
    }

    await Swal.fire({
      icon: 'success',
      title: id ? 'Plano Atualizado!' : 'Plano Cadastrado!',
      text: 'Os dados do plano foram salvos com sucesso no Supabase.',
      timer: 1600,
      showConfirmButton: false
    });
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: 'Erro ao Salvar Plano',
      text: err.message || 'Ocorreu um erro ao gravar o plano no Supabase.',
      confirmButtonColor: '#10b981'
    });
  }
}

/**
 * DELETE: Confirma via SweetAlert2 e exclui o plano no Supabase
 */
async function deletarPlano(id) {
  const plano = window.appState.planos.find((p) => String(p.id) === String(id));
  const nomePlano = plano ? plano.nome : 'este plano';

  const confirmacao = await Swal.fire({
    icon: 'warning',
    title: 'Excluir Plano?',
    text: `Deseja realmente excluir o plano "${nomePlano}"?`,
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    cancelButtonColor: '#334155',
    confirmButtonText: 'Sim, excluir plano',
    cancelButtonText: 'Cancelar'
  });

  if (!confirmacao.isConfirmed) return;

  try {
    const { error } = await window.supabaseClient
      .from('planos')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    if (typeof window.recarregarSistema === 'function') {
      await window.recarregarSistema();
    } else {
      await carregarPlanos();
    }

    await Swal.fire({
      icon: 'success',
      title: 'Plano Excluído!',
      text: 'O plano foi removido do banco de dados.',
      timer: 1500,
      showConfirmButton: false
    });
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: 'Erro ao Excluir Plano',
      text: err.message || 'Não foi possível excluir o plano (verifique se existem matrículas vinculadas).',
      confirmButtonColor: '#10b981'
    });
  }
}

window.initPlanosModule = initPlanosModule;
window.carregarPlanos = carregarPlanos;
window.renderizarCardsPlanos = renderizarCardsPlanos;
window.openPlanoModal = openPlanoModal;
window.editarPlano = editarPlano;
window.deletarPlano = deletarPlano;
