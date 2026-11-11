/**
 * Módulo Relacional de Matrículas (assets/js/matriculas.js)
 * Tabela no Supabase: public.matriculas
 * Colunas: id, aluno_id, plano_id, data_inicio, data_fim
 */

/**
 * Inicializa o formulário relacional de Matrícula e o cálculo automático de vigência
 */
function initMatriculasModule() {
  const formMatricula = document.getElementById('formMatricula');
  if (formMatricula) {
    formMatricula.addEventListener('submit', salvarMatricula);
  }

  const selectPlano = document.getElementById('matriculaPlanoSelect');
  const inputDataInicio = document.getElementById('matriculaDataInicio');

  // Define a data de início padrão como hoje
  if (inputDataInicio && !inputDataInicio.value) {
    inputDataInicio.value = obterDataHojeISO();
  }

  if (selectPlano) {
    selectPlano.addEventListener('change', atualizarDataFimSugerida);
  }
  if (inputDataInicio) {
    inputDataInicio.addEventListener('change', atualizarDataFimSugerida);
  }
}

function obterDataHojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Calcula automaticamente a data_fim somando a duracao_meses do plano selecionado à data_inicio
 */
function atualizarDataFimSugerida() {
  const selectPlano = document.getElementById('matriculaPlanoSelect');
  const inputDataInicio = document.getElementById('matriculaDataInicio');
  const inputDataFim = document.getElementById('matriculaDataFim');

  if (!selectPlano || !inputDataInicio || !inputDataFim) return;

  const planoId = selectPlano.value;
  const dataInicioStr = inputDataInicio.value;

  if (!planoId || !dataInicioStr) return;

  const plano = window.appState.planos.find((p) => String(p.id) === String(planoId));
  if (!plano) return;

  const meses = Number(plano.duracao_meses || 1);
  const [ano, mes, dia] = dataInicioStr.split('-').map(Number);
  const dataCalculada = new Date(ano, mes - 1 + meses, dia);

  const anoFim = dataCalculada.getFullYear();
  const mesFim = String(dataCalculada.getMonth() + 1).padStart(2, '0');
  const diaFim = String(dataCalculada.getDate()).padStart(2, '0');

  inputDataFim.value = `${anoFim}-${mesFim}-${diaFim}`;
}

/**
 * Popula os elementos <select> de Alunos e Planos no formulário de Matrícula
 */
function popularSelectsMatricula() {
  const selectAluno = document.getElementById('matriculaAlunoSelect');
  const selectPlano = document.getElementById('matriculaPlanoSelect');

  if (selectAluno) {
    const valorAtualAluno = selectAluno.value;
    const opcoesAlunos = window.appState.alunos
      .map(
        (aluno) =>
          `<option value="${aluno.id}">${window.escapeHtml(aluno.nome)} (CPF: ${window.escapeHtml(aluno.cpf)})</option>`
      )
      .join('');
    selectAluno.innerHTML = `<option value="">Selecione um aluno cadastrado...</option>${opcoesAlunos}`;
    if (valorAtualAluno) selectAluno.value = valorAtualAluno;
  }

  if (selectPlano) {
    const valorAtualPlano = selectPlano.value;
    const opcoesPlanos = window.appState.planos
      .map(
        (plano) =>
          `<option value="${plano.id}">${window.escapeHtml(plano.nome)} — ${window.formatarMoedaBRL(plano.preco)} (${plano.duracao_meses} ${Number(plano.duracao_meses) === 1 ? 'mês' : 'meses'})</option>`
      )
      .join('');
    selectPlano.innerHTML = `<option value="">Selecione um plano disponível...</option>${opcoesPlanos}`;
    if (valorAtualPlano) selectPlano.value = valorAtualPlano;
  }
}

/**
 * READ: Busca todas as matrículas registradas na tabela relacional `matriculas`
 */
async function carregarMatriculas() {
  try {
    const { data, error } = await window.supabaseClient
      .from('matriculas')
      .select('id, aluno_id, plano_id, data_inicio, data_fim')
      .order('data_inicio', { ascending: false });

    if (error) {
      throw error;
    }

    window.appState.matriculas = data || [];
    renderizarTabelaMatriculas();
  } catch (err) {
    console.error('Erro ao carregar matrículas:', err.message);
    await Swal.fire({
      icon: 'error',
      title: 'Erro ao carregar matrículas',
      text: err.message || 'Não foi possível buscar as matrículas no Supabase.',
      confirmButtonColor: '#10b981'
    });
  }
}

/**
 * Verifica se uma matrícula está ativa considerando a vigência e o status do aluno
 */
function isMatriculaAtiva(matricula) {
  const aluno = window.appState.alunos.find((a) => String(a.id) === String(matricula.aluno_id));
  if (aluno && String(aluno.status || '').toLowerCase() === 'inativo') {
    return false;
  }

  if (!matricula.data_fim) return true;
  const hojeISO = obterDataHojeISO();
  const dataFimISO = String(matricula.data_fim).split('T')[0];
  return dataFimISO >= hojeISO;
}

/**
 * Renderiza a tabela de matrículas na aba Matrículas e o resumo no Dashboard
 */
function renderizarTabelaMatriculas() {
  const tbody = document.getElementById('tabelaMatriculasBody');
  const tbodyDashboard = document.getElementById('tabelaDashboardMatriculasBody');

  const badgeSidebar = document.getElementById('badgeCountMatriculas');
  if (badgeSidebar) {
    badgeSidebar.textContent = window.appState.matriculas.length;
  }

  if (window.appState.matriculas.length === 0) {
    const emptyRow = `
      <tr>
        <td colspan="6" class="py-10 text-center text-slate-500">
          Nenhuma matrícula registrada até o momento.
        </td>
      </tr>`;
    if (tbody) tbody.innerHTML = emptyRow;
    if (tbodyDashboard) tbodyDashboard.innerHTML = emptyRow;
    return;
  }

  const gerarLinhasHtml = (lista) =>
    lista
      .map((mat) => {
        const aluno = window.appState.alunos.find((a) => String(a.id) === String(mat.aluno_id));
        const plano = window.appState.planos.find((p) => String(p.id) === String(mat.plano_id));

        const nomeAluno = aluno ? aluno.nome : 'Aluno não encontrado';
        const nomePlano = plano ? plano.nome : 'Plano removido';
        const valorPlano = plano ? window.formatarMoedaBRL(plano.preco) : 'R$ 0,00';
        const ativa = isMatriculaAtiva(mat);

        const badgeVigencia = ativa
          ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
               <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
               Vigente
             </span>`
          : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/25">
               <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
               Encerrada / Inativa
             </span>`;

        return `
        <tr class="hover:bg-white/[0.02] transition">
          <td class="py-4 px-5 font-semibold text-white">
            ${window.escapeHtml(nomeAluno)}
          </td>
          <td class="py-4 px-4">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium">
              <i data-lucide="credit-card" class="w-3.5 h-3.5"></i>
              ${window.escapeHtml(nomePlano)}
            </span>
          </td>
          <td class="py-4 px-4 font-mono-num text-xs font-bold text-emerald-400">
            ${valorPlano}
          </td>
          <td class="py-4 px-4 font-mono-num text-xs text-slate-300">
            ${window.formatarDataBR(mat.data_inicio)} até ${window.formatarDataBR(mat.data_fim)}
          </td>
          <td class="py-4 px-4">
            ${badgeVigencia}
          </td>
          <td class="py-4 px-5 text-right whitespace-nowrap">
            <button
              type="button"
              onclick="deletarMatricula('${mat.id}')"
              class="p-2 rounded-xl text-rose-400 hover:bg-rose-500/15 transition"
              title="Cancelar / Excluir Matrícula"
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>`;
      })
      .join('');

  if (tbody) {
    tbody.innerHTML = gerarLinhasHtml(window.appState.matriculas);
  }
  if (tbodyDashboard) {
    tbodyDashboard.innerHTML = gerarLinhasHtml(window.appState.matriculas.slice(0, 6));
  }

  window.refreshIcons();
}

/**
 * CREATE: Salva uma nova matrícula na tabela relacional `matriculas` do Supabase
 */
async function salvarMatricula(event) {
  event.preventDefault();

  const aluno_id = document.getElementById('matriculaAlunoSelect').value;
  const plano_id = document.getElementById('matriculaPlanoSelect').value;
  const data_inicio = document.getElementById('matriculaDataInicio').value;
  const data_fim = document.getElementById('matriculaDataFim').value;

  if (!aluno_id || !plano_id || !data_inicio || !data_fim) {
    await Swal.fire({
      icon: 'warning',
      title: 'Campos Obrigatórios',
      text: 'Selecione o Aluno, o Plano e informe a Data de Início e Data de Fim da matrícula.',
      confirmButtonColor: '#10b981'
    });
    return;
  }

  if (data_fim < data_inicio) {
    await Swal.fire({
      icon: 'error',
      title: 'Datas Inválidas',
      text: 'A Data de Fim não pode ser anterior à Data de Início.',
      confirmButtonColor: '#10b981'
    });
    return;
  }

  try {
    const { error } = await window.supabaseClient
      .from('matriculas')
      .insert([
        {
          aluno_id,
          plano_id,
          data_inicio,
          data_fim
        }
      ]);

    if (error) {
      throw error;
    }

    // Garante que o aluno matriculado esteja com status 'ativo'
    const alunoSelecionado = window.appState.alunos.find((a) => String(a.id) === String(aluno_id));
    if (alunoSelecionado && String(alunoSelecionado.status).toLowerCase() !== 'ativo') {
      await window.supabaseClient
        .from('alunos')
        .update({ status: 'ativo' })
        .eq('id', aluno_id);
    }

    const form = document.getElementById('formMatricula');
    if (form) form.reset();
    document.getElementById('matriculaDataInicio').value = obterDataHojeISO();

    if (typeof window.recarregarSistema === 'function') {
      await window.recarregarSistema();
    } else {
      await carregarMatriculas();
    }

    await Swal.fire({
      icon: 'success',
      title: 'Matrícula Realizada!',
      text: 'O vínculo entre o aluno e o plano foi gravado com sucesso na tabela matriculas.',
      timer: 1700,
      showConfirmButton: false
    });
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: 'Erro ao Salvar Matrícula',
      text: err.message || 'Não foi possível gravar a matrícula no Supabase.',
      confirmButtonColor: '#10b981'
    });
  }
}

/**
 * DELETE: Confirma via SweetAlert2 e exclui o registro na tabela `matriculas`
 */
async function deletarMatricula(id) {
  const confirmacao = await Swal.fire({
    icon: 'warning',
    title: 'Excluir Matrícula?',
    text: 'Tem certeza que deseja excluir este vínculo de matrícula no Supabase?',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    cancelButtonColor: '#334155',
    confirmButtonText: 'Sim, excluir matrícula',
    cancelButtonText: 'Cancelar'
  });

  if (!confirmacao.isConfirmed) return;

  try {
    const { error } = await window.supabaseClient
      .from('matriculas')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    if (typeof window.recarregarSistema === 'function') {
      await window.recarregarSistema();
    } else {
      await carregarMatriculas();
    }

    await Swal.fire({
      icon: 'success',
      title: 'Matrícula Excluída!',
      text: 'O registro da matrícula foi removido do banco de dados.',
      timer: 1500,
      showConfirmButton: false
    });
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: 'Erro ao Excluir Matrícula',
      text: err.message || 'Não foi possível remover a matrícula no Supabase.',
      confirmButtonColor: '#10b981'
    });
  }
}

window.initMatriculasModule = initMatriculasModule;
window.popularSelectsMatricula = popularSelectsMatricula;
window.carregarMatriculas = carregarMatriculas;
window.isMatriculaAtiva = isMatriculaAtiva;
window.deletarMatricula = deletarMatricula;
