// ==================== NAVEGAÇÃO INTELIGENTE ====================
let paginaAnterior = null;
let origemNavegacao = 'menu';
let estadoLista = {
    filtros: {},
    pagina: 1
};

function definirOrigem(origem) {
    origemNavegacao = origem;
    console.log('📍 Origem definida:', origem);
}

function voltarInteligente() {
    console.log('🔙 Voltando para:', origemNavegacao);

    switch (origemNavegacao) {
        case 'lista':
            mostrarListaComFiltros();
            break;
        case 'cadastros':
            window.location.href = '/cadastros';
            break;
        case 'relatorios':
            window.location.href = '/relatorios';
            break;
        default:
            window.location.href = '/';
    }
}

function mostrarListaComFiltros() {
    const viewForm = document.getElementById('view-form');
    const listView = document.getElementById('view-list');

    if (viewForm) viewForm.classList.add('hidden');
    if (listView) {
        listView.classList.remove('hidden');
        carregarLista(estadoLista.pagina);
    }

    const btnToggle = document.getElementById('btn-toggle-view');
    if (btnToggle) btnToggle.textContent = '📋 Ver Lista';
}

function salvarEstadoLista() {
    estadoLista = {
        filtros: {
            campo1: document.getElementById('filtro_campo1')?.value || '',
            valor1: document.getElementById('filtro_valor1')?.value || '',
            data1Inicio: document.getElementById('filtro_data1_inicio')?.value || '',
            data1Fim: document.getElementById('filtro_data1_fim')?.value || '',
            campo2: document.getElementById('filtro_campo2')?.value || '',
            valor2: document.getElementById('filtro_valor2')?.value || '',
            data2Inicio: document.getElementById('filtro_data2_inicio')?.value || '',
            data2Fim: document.getElementById('filtro_data2_fim')?.value || ''
        },
        pagina: listaAtual.pagina || 1
    };
    console.log('💾 Estado da lista salvo:', estadoLista);
}

// ==================== RESTANTE DO CÓDIGO EXISTENTE... ====================









// ==================== CARREGAR VALORES ÚNICOS ====================
async function carregarValoresUnicos(campo, selectId) {
    try {
        const select = document.getElementById(selectId);
        if (!select) return;

        // Limpar select
        select.innerHTML = '<option value="">Carregando...</option>';

        // Buscar valores únicos da API
        const response = await fetch(`/api/valores-unicos/${campo}`);
        const result = await response.json();

        if (result.success && result.valores.length > 0) {
            select.innerHTML = '<option value="">Selecione...</option>' +
                result.valores.map(valor => `<option value="${valor}">${valor}</option>`).join('');
        } else {
            select.innerHTML = '<option value="">Nenhum valor encontrado</option>';
        }
    } catch (e) {
        console.error('Erro ao carregar valores:', e);
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }
}

// ==================== SISTEMA DE ABAS ====================
function mostrarAba(numero) {
    abaAtiva = numero;
    for (let i = 1; i <= 3; i++) {
        const btn = document.getElementById(`aba-btn-${i}`);
        if (i === numero) {
            btn.classList.add('ativa');
            btn.classList.remove('bg-white', 'hover:bg-gray-50');
        } else {
            btn.classList.remove('ativa');
            btn.classList.add('bg-white', 'hover:bg-gray-50');
        }
    }
    const campos = document.querySelectorAll('#form-os .field-wrapper');
    campos.forEach(campo => {
        const abaCampo = parseInt(campo.getAttribute('data-aba'));
        campo.style.display = (abaCampo === numero) ? 'block' : 'none';
    });
}

// ==================== CONSTRUÇÃO DO FORMULÁRIO ====================
function buildField(c) {
    const lbl = `<label for="in_${c.id}" class="block text-[10px] font-bold text-gray-500 uppercase mb-0.5 label-centralizado">${c.label}</label>`;
    const baseClasses = 'w-full border p-1.5 text-sm rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 input-centralizado';
    const base = `id="in_${c.id}" class="${baseClasses}"`;
    const rdonly = `id="in_${c.id}" class="w-full border p-1.5 text-sm rounded bg-gray-100 cursor-not-allowed input-centralizado"`;
    const calcCls = `id="in_${c.id}" class="w-full border p-1.5 text-sm rounded bg-gray-50 input-centralizado"`;
    let inner = '';
    switch (c.type) {
        case 'readonly_id':
            inner = `<input type="text" id="in_${c.id}" class="border p-1.5 text-sm rounded bg-gray-100 cursor-not-allowed w-20 input-centralizado" readonly placeholder="Auto">`;
            break;
        case 'readonly':
            inner = `<input type="text" ${rdonly} readonly>`;
            break;
        case 'select': {
            const dis = c.dependsOn ? ' disabled' : '';
            const ph = c.dependsOn ? 'Selecione a Instituição...' : 'Selecione...';
            const opts = (c.options || []).map(o => `<option value="${o}">${o}</option>`).join('');
            inner = `<select ${base}${dis}><option value="">${ph}</option>${opts}</select>`;
            break;
        }
        case 'date': case 'date_pagto':
            inner = `<input type="date" ${base}>`;
            break;
        case 'time':
            inner = `<input type="time" ${base}>`;
            break;
        case 'currency': case 'currency_br':
            inner = `<div class="relative flex items-center"><span class="absolute left-2 text-gray-500 text-xs pointer-events-none">R$</span><input type="text" id="in_${c.id}" class="${baseClasses} pl-8" placeholder="0,00" inputmode="decimal"></div>`;
            break;
        case 'decimal':
            inner = `<input type="text" ${base} placeholder="0" inputmode="decimal">`;
            break;
        case 'number':
            inner = `<input type="number" ${base} placeholder="0" min="0">`;
            break;
        case 'plate':
            inner = `<input type="text" ${base} placeholder="ABC-1D23" maxlength="8" style="text-transform:uppercase">`;
            break;
        case 'calc':
            inner = `<input type="text" ${calcCls} readonly placeholder="0,00">`;
            break;
        case 'calc_total':
            inner = `<input type="text" id="in_${c.id}" class="w-full border-2 border-green-400 p-1.5 text-sm rounded bg-green-50 font-bold input-centralizado" readonly placeholder="0,00">`;
            break;
        default:
            inner = `<input type="text" ${base}>`;
    }
    return `<div class="field-wrapper" data-col="${c.id}" data-aba="${c.aba || 1}">${lbl}${inner}</div>`;
}

function buildForm() {
    document.getElementById('form-os').innerHTML = CAMPOS.map(buildField).join('');
    mostrarAba(1);
}

// ==================== CARREGAR PARÂMETROS DAS NOVAS ABAS ====================
async function loadParams() {
    try {
        console.log('🔄 Carregando parâmetros das NOVAS abas...');

        // Buscar das NOVAS abas
        const [rClientes, rSituacoes] = await Promise.all([
            fetch('/api/parametros/cadClientes').then(r => r.json()),
            fetch('/api/parametros/Relacionamento_Ordenado').then(r => r.json()),
        ]);

        // Popular Instituição (select B) - da aba cadClientes
        if (rClientes.success) {
            const dadosClientes = rClientes.data.slice(1); // Pular cabeçalho

            // Extrair instituições únicas da coluna B (índice 1)
            const instituicoes = [...new Set(
                dadosClientes
                    .filter(row => row && row[1])
                    .map(row => row[1].trim())
            )].sort();

            fillSelect('in_B', instituicoes);
            console.log('✅ Instituições carregadas:', instituicoes.length);

            // Armazenar dados completos para filtragem
            window.cadClientesData = dadosClientes;
        }

        // Popular Situações (será filtrado dinamicamente)
        if (rSituacoes.success) {
            const dadosRel = rSituacoes.data.slice(1); // Pular cabeçalho

            // Extrair situações únicas da coluna D (índice 3)
            const todasSituacoes = [...new Set(
                dadosRel
                    .filter(row => row && row[3])
                    .map(row => row[3].trim())
            )].sort();

            // Armazenar para filtragem dinâmica
            window.relacionamentoData = dadosRel;
            window.todasSituacoes = todasSituacoes;

            console.log('✅ Relacionamentos carregados:', dadosRel.length);
            console.log('✅ Situações disponíveis:', todasSituacoes.length);
        }

        // Carregar outros parâmetros das abas antigas (se ainda necessário)
        try {
            const rP = await fetch('/api/parametros/Parametros').then(r => r.json());
            if (rP.success) {
                paramRows = rP.data.slice(1);
                fillSelect('in_D', uniqueCol(paramRows, 16));
                fillSelect('in_H', uniqueCol(paramRows, 8));
                fillSelect('in_M', uniqueCol(paramRows, 3));
                const motoristas = uniqueCol(paramRows, 0);
                fillSelect('in_N', motoristas);
                fillSelect('in_O', motoristas);
                fillSelect('in_R', uniqueCol(paramRows, 24));
                console.log('✅ Outros parâmetros carregados');
            }
        } catch (e) {
            console.warn('⚠️ Parametros não carregados (pode ser normal):', e);
        }

    } catch (err) {
        console.error('❌ Erro ao carregar parâmetros:', err);
    }
}

function applyEvents() {
    document.getElementById('in_B')?.addEventListener('change', onInstituicaoChange);
    document.getElementById('in_R')?.addEventListener('change', calcGuincho);
    ['S', 'T', 'W', 'Z', 'AC', 'AF', 'AI', 'AL', 'AP', 'AR', 'BA', 'BB', 'BI', 'BJ'].forEach(id => {
        const el = document.getElementById('in_' + id); if (!el) return;
        el.addEventListener('input', () => { onCurrencyInput(el); recalcular(); }); el.addEventListener('blur', () => onCurrencyBlur(el));
    });
    const auEl = document.getElementById('in_AU'); if (auEl) {
        auEl.addEventListener('input', () => { onCurrencyInput(auEl); auOverridden = auEl.value.trim() !== ''; });
        auEl.addEventListener('blur', () => { const n = parseCurrency(auEl.value); auEl.value = auEl.value.trim() ? fmtCurrency(n) : ''; auOverridden = auEl.value.trim() !== ''; });
    }
    ['U', 'X', 'AA', 'AD', 'AG', 'AJ', 'AM', 'AO'].forEach(id => { document.getElementById('in_' + id)?.addEventListener('input', function () { onDecimalInput(this); }); });
    document.getElementById('in_BK')?.addEventListener('change', calcDataPagamento);
    document.getElementById('in_BM')?.addEventListener('input', calcDataPagamento);
    document.getElementById('in_BL')?.addEventListener('input', calcDataPagamento);
    const pEl = document.getElementById('in_P'); if (pEl) applyPlateMask(pEl);
}

// ==================== FILTROS AVANÇADOS ====================
function configurarFiltroData(numFiltro) {
    const campo = document.getElementById(`filtro_campo${numFiltro}`).value;
    const camposData = ['K', 'BK', 'BN', 'BR'];

    if (camposData.includes(campo)) {
        // Se for data, mostrar inputs de data
        document.getElementById(`filtro${numFiltro}_texto`).classList.add('hidden');
        document.getElementById(`filtro${numFiltro}_data_inicio`).classList.remove('hidden');
        document.getElementById(`filtro${numFiltro}_data_fim`).classList.remove('hidden');
    } else {
        // Se for outro campo, mostrar select com valores
        document.getElementById(`filtro${numFiltro}_texto`).classList.remove('hidden');
        document.getElementById(`filtro${numFiltro}_data_inicio`).classList.add('hidden');
        document.getElementById(`filtro${numFiltro}_data_fim`).classList.add('hidden');

        // Carregar valores únicos
        if (campo) {
            carregarValoresUnicos(campo, `filtro_valor${numFiltro}`);
        }
    }
}

function limparFiltros() {
    document.getElementById('filtro_campo1').value = '';
    document.getElementById('filtro_valor1').value = '';
    document.getElementById('filtro_data1_inicio').value = '';
    document.getElementById('filtro_data1_fim').value = '';
    document.getElementById('filtro_campo2').value = '';
    document.getElementById('filtro_valor2').value = '';
    document.getElementById('filtro_data2_inicio').value = '';
    document.getElementById('filtro_data2_fim').value = '';
    document.getElementById('filtro1_texto').classList.remove('hidden');
    document.getElementById('filtro1_data_inicio').classList.add('hidden');
    document.getElementById('filtro1_data_fim').classList.add('hidden');
    document.getElementById('filtro2_texto').classList.remove('hidden');
    document.getElementById('filtro2_data_inicio').classList.add('hidden');
    document.getElementById('filtro2_data_fim').classList.add('hidden');
    carregarLista();
}

async function carregarLista(pagina = 1) {
    const container = document.getElementById('view-list');
    container.classList.add('loading');
    try {
        const campo1 = document.getElementById('filtro_campo1')?.value || '';
        const valor1 = document.getElementById('filtro_valor1')?.value || '';
        const data1Inicio = document.getElementById('filtro_data1_inicio')?.value || '';
        const data1Fim = document.getElementById('filtro_data1_fim')?.value || '';
        const campo2 = document.getElementById('filtro_campo2')?.value || '';
        const valor2 = document.getElementById('filtro_valor2')?.value || '';
        const data2Inicio = document.getElementById('filtro_data2_inicio')?.value || '';
        const data2Fim = document.getElementById('filtro_data2_fim')?.value || '';

        let url = `/api/registros?pagina=${pagina}&por_pagina=50`;

        if (campo1) {
            url += `&filtro_campo1=${encodeURIComponent(campo1)}`;
            if (valor1) url += `&filtro_valor1=${encodeURIComponent(valor1)}`;
            if (data1Inicio) url += `&filtro_data1_inicio=${data1Inicio}`;
            if (data1Fim) url += `&filtro_data1_fim=${data1Fim}`;
        }
        if (campo2) {
            url += `&filtro_campo2=${encodeURIComponent(campo2)}`;
            if (valor2) url += `&filtro_valor2=${encodeURIComponent(valor2)}`;
            if (data2Inicio) url += `&filtro_data2_inicio=${data2Inicio}`;
            if (data2Fim) url += `&filtro_data2_fim=${data2Fim}`;
        }

        const r = await fetch(url);
        const result = await r.json();

        if (!result.success) throw new Error(result.error || 'Erro ao carregar lista');
        listaAtual = { dados: result.dados, pagina: result.pagina, totalPaginas: result.total_paginas };
        renderizarTabela();
        renderizarPaginacao();
        document.getElementById('total-info').textContent = `Total: ${result.total} registro(s)`;
    } catch (e) {
        console.error('Erro:', e);
        alert('Erro: ' + e.message);
    }
    finally {
        container.classList.remove('loading');
    }
}

function renderizarTabela() {
    const thead = document.getElementById('table-header');
    const tbody = document.getElementById('table-body');
    thead.innerHTML = COLUNAS_TABELA.map(col =>
        `<th class="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider ${col === 'A' ? 'col-id' : ''}">${LABELS_TABELA[col] || col}</th>`
    ).join('') + '<th class="px-3 py-2 text-center text-xs font-semibold text-gray-600">Ações</th>';
    if (listaAtual.dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${COLUNAS_TABELA.length + 1}" class="px-3 py-8 text-center text-gray-500">Nenhum registro encontrado</td></tr>`;
        return;
    }
    tbody.innerHTML = listaAtual.dados.map(linha => {
        const id = linha[0] || '';
        return `<tr class="hover:bg-gray-50">
            ${COLUNAS_TABELA.map(col => {
            const idx = colToIndex(col);
            let val = linha[idx] || '-';
            if (col === 'AQ' && val !== '-') val = fmtCurrency(parseCurrency(val));
            return `<td class="px-3 py-2 whitespace-nowrap text-sm text-gray-700 text-center ${col === 'A' ? 'col-id' : ''}">${val}</td>`;
        }).join('')}
<td class="px-3 py-2 whitespace-nowrap text-sm text-center">
    <button onclick="console.log('Editar ID:', '${id}'); editarRegistro('${id}')" class="text-blue-600 hover:text-blue-800 mr-3 inline-block" title="Editar">✏️</button>
    <button onclick="console.log('Excluir ID:', '${id}'); abrirModalExclusao('${id}')" class="text-red-600 hover:text-red-800 inline-block" title="Excluir">🗑️</button>
</td>
        </tr>`;
    }).join('');
}

function renderizarPaginacao() {
    const container = document.getElementById('pagination');
    const { pagina, totalPaginas } = listaAtual;
    if (totalPaginas <= 1) { container.innerHTML = ''; return; }
    let html = `<div class="text-sm text-gray-600">Página ${pagina} de ${totalPaginas}</div><div class="flex gap-1">`;
    if (pagina > 1) html += `<button onclick="carregarLista(${pagina - 1})" class="px-3 py-1 border rounded hover:bg-gray-100">« Ant</button>`;
    for (let p = Math.max(1, pagina - 2); p <= Math.min(totalPaginas, pagina + 2); p++) {
        html += `<button onclick="carregarLista(${p})" class="px-3 py-1 border rounded ${p === pagina ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}">${p}</button>`;
    }
    if (pagina < totalPaginas) html += `<button onclick="carregarLista(${pagina + 1})" class="px-3 py-1 border rounded hover:bg-gray-100">Próx »</button>`;
    html += '</div>';
    container.innerHTML = html;
}

// ==================== INICIALIZAÇÃO DOS FORMULÁRIOS ====================
function initCadastro() {
    buildForm();
    applyEvents();
    loadParams();
    applyDateMask();
}

function initEdicao() {
    carregarLista();
}

// Atalho de teclado CTRL+F4
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        let proximaAba = abaAtiva + 1;
        if (proximaAba > 3) proximaAba = 1;
        mostrarAba(proximaAba);
    }
    if (e.ctrlKey && e.key === 'F4') {
        e.preventDefault();
        if (modoEdicao) cancelarEdicao();
    }
});