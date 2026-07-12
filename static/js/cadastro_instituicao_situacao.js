// Variáveis globais
let linhaExclusao = null;
let linhaEdicao = null;
let todosRelacionamentos = [];
let relacionamentosFiltrados = [];

// ==================== CARREGAR INSTITUIÇÕES ====================
async function carregarInstituicoes() {
    try {
        const response = await fetch('/api/instituicoes-lista');
        const result = await response.json();

        if (result.success) {
            const select = document.getElementById('inst_id');
            select.innerHTML = '<option value="">Selecione...</option>' +
                result.instituicoes.map(inst =>
                    `<option value="${inst.id}" data-nome="${inst.nome.replace(/"/g, '&quot;')}">${inst.nome}</option>`
                ).join('');

            const filtroSelect = document.getElementById('filtro_inst');
            filtroSelect.innerHTML = '<option value="">Todas</option>' +
                result.instituicoes.map(inst =>
                    `<option value="${inst.id}">${inst.nome}</option>`
                ).join('');

            console.log('✅ Instituições carregadas:', result.instituicoes.length);
        }
    } catch (e) {
        console.error('❌ Erro ao carregar instituições:', e);
    }
}

// ==================== CARREGAR SITUAÇÕES ====================
async function carregarSituacoes() {
    try {
        const response = await fetch('/api/situacoes-lista');
        const result = await response.json();

        if (result.success) {
            const select = document.getElementById('sit_id');
            select.innerHTML = '<option value="">Selecione...</option>' +
                result.situacoes.map(sit =>
                    `<option value="${sit.id}" data-nome="${sit.nome.replace(/"/g, '&quot;')}">${sit.nome}</option>`
                ).join('');

            const filtroSelect = document.getElementById('filtro_sit');
            filtroSelect.innerHTML = '<option value="">Todas</option>' +
                result.situacoes.map(sit =>
                    `<option value="${sit.id}">${sit.nome}</option>`
                ).join('');

            console.log('✅ Situações carregadas:', result.situacoes.length);
        }
    } catch (e) {
        console.error('❌ Erro ao carregar situações:', e);
    }
}

// ==================== CARREGAR RELACIONAMENTOS ====================
async function carregarRelacionamentos() {
    try {
        const response = await fetch('/api/instituicao-situacao-lista');
        const result = await response.json();

        if (result.success) {
            // Adicionar número da linha da planilha em cada registro
            todosRelacionamentos = result.dados.map((item, index) => ({
                ...item,
                linha_planilha: index + 2  // +2 porque começa na linha 2
            }));
            console.log('✅ Relacionamentos carregados:', todosRelacionamentos.length);
            aplicarFiltros();
        }
    } catch (e) {
        console.error('❌ Erro ao carregar relacionamentos:', e);
    }
}

// ==================== APLICAR FILTROS ====================
function aplicarFiltros() {
    const filtroInst = document.getElementById('filtro_inst').value;
    const filtroSit = document.getElementById('filtro_sit').value;

    relacionamentosFiltrados = todosRelacionamentos.filter(linha => {
        const matchInst = !filtroInst || String(linha.inst_id) === String(filtroInst);
        const matchSit = !filtroSit || String(linha.sit_id) === String(filtroSit);
        return matchInst && matchSit;
    });

    renderizarTabela(relacionamentosFiltrados);
}

// ==================== LIMPAR FILTROS ====================
function limparFiltros() {
    document.getElementById('filtro_inst').value = '';
    document.getElementById('filtro_sit').value = '';
    aplicarFiltros();
}

// ==================== RENDERIZAR TABELA ====================
function renderizarTabela(dados) {
    const tbody = document.getElementById('table-body-relacionamentos');
    const totalInfo = document.getElementById('total-info');

    if (!dados || dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-3 py-8 text-center text-gray-500">Nenhum relacionamento encontrado</td></tr>`;
        if (totalInfo) totalInfo.textContent = 'Total: 0 registro(s)';
        return;
    }

    // Ordenar por instituição e situação
    const dadosOrdenados = [...dados].sort((a, b) => {
        const instA = (a.instituicao || '').toUpperCase();
        const instB = (b.instituicao || '').toUpperCase();
        if (instA < instB) return -1;
        if (instA > instB) return 1;

        const sitA = (a.situacao || '').toUpperCase();
        const sitB = (b.situacao || '').toUpperCase();
        if (sitA < sitB) return -1;
        if (sitA > sitB) return 1;

        return 0;
    });

    tbody.innerHTML = dadosOrdenados.map((linha) => {
        const numLinha = linha.linha_planilha;

        // Escapar aspas simples e duplas
        const instNome = (linha.instituicao || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
        const sitNome = (linha.situacao || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
        const instId = linha.inst_id;
        const sitId = linha.sit_id;

        return `<tr class="hover:bg-gray-50">
            <td class="px-3 py-2 text-center text-sm">${linha.inst_id}</td>
            <td class="px-3 py-2 text-sm">${linha.instituicao}</td>
            <td class="px-3 py-2 text-center text-sm">${linha.sit_id}</td>
            <td class="px-3 py-2 text-sm">${linha.situacao}</td>
            <td class="px-3 py-2 text-center">
                <div class="flex gap-1 justify-center">
                    <button onclick="prepararEdicao(${numLinha}, ${instId}, ${sitId}, '${instNome}', '${sitNome}')" 
                        class="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs font-medium">
                        ✏️ Editar
                    </button>
                    <button onclick="prepararExclusao(${numLinha})" 
                        class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium">
                        🗑️ Excluir
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');

    if (totalInfo) totalInfo.textContent = `Total: ${dadosOrdenados.length} registro(s)`;
}

// ==================== SALVAR RELACIONAMENTO ====================
async function salvarRelacionamento() {
    const instSelect = document.getElementById('inst_id');
    const sitSelect = document.getElementById('sit_id');

    const inst_id = instSelect.value;
    const sit_id = sitSelect.value;
    const instituicao = instSelect.options[instSelect.selectedIndex]?.dataset.nome || '';
    const situacao = sitSelect.options[sitSelect.selectedIndex]?.dataset.nome || '';

    if (!inst_id || !sit_id) {
        alert('Por favor, selecione a Instituição e a Situação!');
        return;
    }

    try {
        let url, method;

        if (linhaEdicao) {
            url = `/api/instituicao-situacao/${linhaEdicao}`;
            method = 'PUT';
        } else {
            url = '/api/instituicao-situacao';
            method = 'POST';
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inst_id: inst_id,
                sit_id: sit_id,
                instituicao: instituicao,
                situacao: situacao
            })
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            limparFormulario();
            cancelarEdicao();
            carregarRelacionamentos();
        } else {
            alert('Erro: ' + result.error);
        }
    } catch (e) {
        console.error('Erro ao salvar:', e);
        alert('Erro ao salvar relacionamento. Tente novamente.');
    }
}

// ==================== LIMPAR FORMULÁRIO ====================
function limparFormulario() {
    document.getElementById('inst_id').value = '';
    document.getElementById('sit_id').value = '';
}

// ==================== PREPARAR EDIÇÃO ====================
function prepararEdicao(linha, instId, sitId, instNome, sitNome) {
    console.log('🔍 Preparando edição:');
    console.log('  Linha:', linha);
    console.log('  Inst ID:', instId);
    console.log('  Sit ID:', sitId);
    console.log('  Inst Nome:', instNome);
    console.log('  Sit Nome:', sitNome);

    linhaEdicao = linha;

    const instSelect = document.getElementById('inst_id');
    const sitSelect = document.getElementById('sit_id');

    // REMOVER atributo disabled se existir
    instSelect.removeAttribute('disabled');
    sitSelect.removeAttribute('disabled');

    // Garantir que estão habilitados
    instSelect.disabled = false;
    sitSelect.disabled = false;

    // Selecionar pelo VALUE (ID)
    instSelect.value = String(instId);
    sitSelect.value = String(sitId);

    console.log('  Inst Select Value:', instSelect.value);
    console.log('  Sit Select Value:', sitSelect.value);
    console.log('  Inst Select Disabled:', instSelect.disabled);
    console.log('  Sit Select Disabled:', sitSelect.disabled);

    // Verificar se foi selecionado corretamente
    if (instSelect.value !== String(instId)) {
        console.warn('⚠️ Não conseguiu selecionar instituição. Tentando pelo texto...');
        for (let i = 0; i < instSelect.options.length; i++) {
            if (instSelect.options[i].text.trim() === instNome.trim()) {
                instSelect.selectedIndex = i;
                console.log('✅ Selecionado pelo texto:', instSelect.value);
                break;
            }
        }
    }

    if (sitSelect.value !== String(sitId)) {
        console.warn('️ Não conseguiu selecionar situação. Tentando pelo texto...');
        for (let i = 0; i < sitSelect.options.length; i++) {
            if (sitSelect.options[i].text.trim() === sitNome.trim()) {
                sitSelect.selectedIndex = i;
                console.log('✅ Selecionado pelo texto:', sitSelect.value);
                break;
            }
        }
    }

    // Mostrar modo de edição
    const modoEdicao = document.getElementById('modo-edicao');
    if (modoEdicao) modoEdicao.classList.remove('hidden');

    const tituloForm = document.getElementById('titulo-formulario');
    if (tituloForm) tituloForm.textContent = '✏️ Editando Relacionamento';

    const btnSalvar = document.getElementById('btn-salvar');
    if (btnSalvar) btnSalvar.textContent = '💾 Atualizar';

    // Scroll suave
    const view = document.getElementById('view-cadastro-inst-sit');
    if (view) view.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // DAR FOCO no primeiro campo após um breve delay
    setTimeout(() => {
        instSelect.focus();
        instSelect.click(); // Forçar abertura do dropdown
        console.log('✅ Foco dado no campo Instituição');
    }, 300);

    console.log('✅ Modo de edição ativado');
}

// ==================== CANCELAR EDIÇÃO ====================
function cancelarEdicao() {
    linhaEdicao = null;
    const modoEdicao = document.getElementById('modo-edicao');
    if (modoEdicao) modoEdicao.classList.add('hidden');

    const tituloForm = document.getElementById('titulo-formulario');
    if (tituloForm) tituloForm.textContent = ' Novo Cadastro';

    const btnSalvar = document.getElementById('btn-salvar');
    if (btnSalvar) btnSalvar.textContent = '💾 Salvar';

    limparFormulario();
}

// ==================== PREPARAR EXCLUSÃO ====================
function prepararExclusao(linha) {
    linhaExclusao = linha;
    const modal = document.getElementById('modal-exclusao-inst-sit');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

// ==================== FECHAR MODAL ====================
function fecharModalExclusao() {
    const modal = document.getElementById('modal-exclusao-inst-sit');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    linhaExclusao = null;
}

// ==================== CONFIRMAR EXCLUSÃO ====================
async function confirmarExclusao() {
    if (!linhaExclusao) return;

    try {
        const response = await fetch(`/api/instituicao-situacao/${linhaExclusao}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            fecharModalExclusao();
            carregarRelacionamentos();
        } else {
            alert('Erro: ' + result.error);
        }
    } catch (e) {
        console.error('Erro ao excluir:', e);
        alert('Erro ao excluir relacionamento. Tente novamente.');
    }
}