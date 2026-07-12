// ==================== CRUD - OPERAÇÕES ====================
async function salvar() {
    const btn = document.getElementById('btn-salvar');
    btn.disabled = true; btn.textContent = modoEdicao ? 'Atualizando...' : 'Salvando...';
    btn.classList.add('loading');
    const payload = {};
    CAMPOS.forEach(c => {
        if (NAO_GRAVAR.has(c.id) && !c.enviar) return;
        if (['readonly', 'readonly_id', 'calc', 'calc_total'].includes(c.type) && !c.enviar) return;
        const el = document.getElementById('in_' + c.id); if (!el) return;
        let v = el.value;
        if (c.type === 'date' || c.type === 'date_pagto') v = convertDateForSheet(v);
        payload[c.id] = v;
    });
    try {
        const url = modoEdicao ? `/api/registros/${idEdicao}` : '/api/salvar';
        const method = modoEdicao ? 'PUT' : 'POST';
        const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const result = await r.json();
        if (result.success) {
            alert(modoEdicao ? 'Registro atualizado com sucesso!' : 'Dados salvos com sucesso!');
            if (!modoEdicao) limparFormulario();
            if (viewAtual === 'list') carregarLista();
        } else { alert('Erro: ' + (result.error || 'Erro desconhecido')); }
    } catch (e) { alert('Erro de conexão: ' + e.message); }
    finally { btn.disabled = false; btn.textContent = modoEdicao ? '💾 Atualizar OS' : '💾 Salvar OS'; btn.classList.remove('loading'); }
}

async function carregarRegistro(id) {
    try {
        const r = await fetch(`/api/registros/${id}`);
        const result = await r.json();
        if (!result.success || !result.data) { alert('Registro não encontrado'); return; }
        const linha = result.data;
        CAMPOS.forEach(c => {
            const el = document.getElementById('in_' + c.id);
            if (!el) return;
            const idx = colToIndex(c.id);
            const valor = linha[idx] || '';
            if (el.tagName === 'SELECT') {
                if (c.source && !document.querySelector(`#in_${c.id} option[value="${valor}"]`)) {
                    const opt = document.createElement('option'); opt.value = valor; opt.textContent = valor; opt.selected = true;
                    el.appendChild(opt);
                } else { el.value = valor; }
            } else if (c.type === 'date' || c.type === 'date_pagto') {
                el.value = convertDateForInput(valor);
            } else if (c.type === 'currency' || c.type === 'currency_br') {
                let numVal = 0;
                if (typeof valor === 'number') { numVal = valor; }
                else if (typeof valor === 'string') {
                    const cleanVal = valor.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
                    numVal = parseFloat(cleanVal) || 0;
                }
                el.value = numVal > 0 ? fmtCurrency(numVal) : '';
            } else { el.value = valor; }
        });
        const campoB = document.getElementById('in_B');
        if (campoB && campoB.value) { campoB.dispatchEvent(new Event('change')); }
        modoEdicao = true; idEdicao = id;
        document.getElementById('edit-indicator').classList.remove('hidden');
        document.getElementById('edit-id-display').textContent = id;
        document.getElementById('btn-cancel-edit').classList.remove('hidden');
        document.getElementById('btn-salvar').textContent = '💾 Atualizar OS';
        document.getElementById('view-form').classList.add('edit-mode');
        recalcular(); calcGuincho(); calcDataPagamento();
        document.getElementById('view-form').scrollIntoView({ behavior: 'smooth' });
    } catch (e) { alert('Erro ao carregar registro: ' + e.message); }
}

function cancelarEdicao() {
    modoEdicao = false; idEdicao = null;
    document.getElementById('edit-indicator').classList.add('hidden');
    document.getElementById('btn-cancel-edit').classList.add('hidden');
    document.getElementById('btn-salvar').textContent = '💾 Salvar OS';
    document.getElementById('view-form').classList.remove('edit-mode');
    limparFormulario();
}

function limparFormulario() {
    CAMPOS.forEach(c => {
        const el = document.getElementById('in_' + c.id); if (!el) return;
        if (el.tagName === 'SELECT') { el.value = ''; if (c.dependsOn) el.disabled = true; }
        else el.value = '';
    });
    auOverridden = false;
    modoEdicao = false;
    idEdicao = null;
    document.getElementById('edit-indicator').classList.add('hidden');
    document.getElementById('btn-cancel-edit').classList.add('hidden');
    document.getElementById('btn-salvar').textContent = '💾 Salvar OS';
    document.getElementById('view-form').classList.remove('edit-mode');
}

function limpar() {
    if (!confirm('Deseja limpar todos os campos do formulário?')) return;
    limparFormulario();
}

/* function editarRegistro(id) {
    const formView = document.getElementById('view-form');
    const listView = document.getElementById('view-list');
    const btnToggle = document.getElementById('btn-toggle-view');

    // Se o formulário não existe na página, precisa carregar primeiro
    if (!formView) {
        if (listView) listView.classList.add('hidden');

        // Chama o carregamento do formulário
        carregarFormulario('cadastro');

        // POLLING: Fica verificando a cada 100ms se o formulário apareceu
        let tentativas = 0;
        const intervalo = setInterval(() => {
            const formCarregado = document.getElementById('view-form');
            // Verifica se o formulário existe E se tem o botão de salvar (sinal que carregou tudo)
            if (formCarregado && document.getElementById('btn-salvar')) {
                clearInterval(intervalo);
                // Dá um pequeno tempo extra para os selects popularem
                setTimeout(() => {
                    carregarRegistro(id);
                }, 200);
            }

            tentativas++;
            if (tentativas > 50) { // Timeout de 5 segundos
                clearInterval(intervalo);
                alert('Erro: O formulário demorou muito para carregar. Recarregue a página.');
            }
        }, 100);

        return;
    }

    // Se o formulário já existe, apenas mostra e carrega
    if (listView && !listView.classList.contains('hidden')) {
        formView.classList.remove('hidden');
        listView.classList.add('hidden');
        if (btnToggle) btnToggle.textContent = ' Ver Lista';
    }

    // Carrega os dados
    carregarRegistro(id);
} */


async function editarRegistro(id) {
    // 💾 SALVAR ESTADO DA LISTA ANTES DE EDITAR
    if (typeof salvarEstadoLista === 'function') {
        salvarEstadoLista();
    }

    //  DEFINIR ORIGEM COMO 'lista'
    if (typeof definirOrigem === 'function') {
        definirOrigem('lista');
    }

    const formView = document.getElementById('view-form');
    const listView = document.getElementById('view-list');
    const btnToggle = document.getElementById('btn-toggle-view');

    if (!formView) {
        if (listView) listView.classList.add('hidden');
        carregarFormulario('cadastro');

        let tentativas = 0;
        const intervalo = setInterval(() => {
            const formCarregado = document.getElementById('view-form');
            if (formCarregado && document.getElementById('btn-salvar')) {
                clearInterval(intervalo);
                setTimeout(() => {
                    carregarRegistro(id);
                }, 200);
            }

            tentativas++;
            if (tentativas > 50) {
                clearInterval(intervalo);
                alert('Erro: O formulário demorou muito para carregar. Recarregue a página.');
            }
        }, 100);

        return;
    }

    if (listView && !listView.classList.contains('hidden')) {
        formView.classList.remove('hidden');
        listView.classList.add('hidden');
        if (btnToggle) btnToggle.textContent = '📋 Ver Lista';
    }

    carregarRegistro(id);
}

/* function abrirModalExclusao(id) {
    idParaExcluir = id;
    document.getElementById('delete-id-display').textContent = id;
    document.getElementById('modal-delete').classList.remove('hidden');
    document.getElementById('modal-delete').classList.add('flex');
} */

function abrirModalExclusao(id) {
    idParaExcluir = id;
    document.getElementById('delete-id-display').textContent = id;
    document.getElementById('delete-id-input').value = id;  // ← Adiciona esta linha
    document.getElementById('modal-delete').classList.remove('hidden');
    document.getElementById('modal-delete').classList.add('flex');
}

function fecharModal() {
    idParaExcluir = null;
    document.getElementById('modal-delete').classList.add('hidden');
    document.getElementById('modal-delete').classList.remove('flex');
}



/* async function confirmarExclusao() {
    // Tenta pegar do input hidden primeiro, senão usa a variável global
    const id = document.getElementById('delete-id-input').value || idParaExcluir;

    if (!id) {
        alert('Erro: ID não encontrado');
        return;
    }

    fecharModal();
    try {
        const r = await fetch(`/api/registros/${id}`, { method: 'DELETE' });
        const result = await r.json();
        if (result.success) {
            alert('Registro excluído com sucesso!');
            carregarLista(listaAtual.pagina);
        } else { alert('Erro ao excluir: ' + (result.error || 'Erro desconhecido')); }
    } catch (e) { alert('Erro de conexão: ' + e.message); }
} */


async function confirmarExclusao() {
    // ==================== VALIDAÇÃO DUPLA ====================
    // Pega o ID do input hidden (armazenado quando abriu o modal)
    const idInput = document.getElementById('delete-id-input').value;

    // Pega o ID da variável global (também armazenado quando abriu o modal)
    const idGlobal = idParaExcluir;

    // Verifica se os dois valores são IGUAIS (segurança extra)
    if (idInput !== idGlobal) {
        console.error('⚠️ ALERTA: IDs divergentes!', {
            idDoInput: idInput,
            idDaVariavel: idGlobal
        });
        alert('Erro de validação: IDs inconsistentes. Tente novamente.');
        fecharModal();
        return;  // Para a execução aqui
    }

    // Verifica se o ID existe e é válido
    if (!idInput || idInput === '' || idInput === 'null' || idInput === 'undefined') {
        console.error('❌ Erro: ID não encontrado ou inválido', { idInput });
        alert('Erro: ID do registro não encontrado. Tente novamente.');
        fecharModal();
        return;  // Para a execução aqui
    }

    // ==================== CONFIRMAÇÃO NO CONSOLE (DEBUG) ====================
    console.log('✅ Validação OK! Excluindo registro ID:', idInput);

    // ==================== FECHAR MODAL ====================
    fecharModal();

    // ==================== CHAMAR API PARA EXCLUIR ====================
    try {
        // Faz a requisição DELETE para o backend
        const resposta = await fetch(`/api/registros/${idInput}`, {
            method: 'DELETE'
        });

        // Converte a resposta para JSON
        const resultado = await resposta.json();

        // Verifica se a exclusão foi bem-sucedida
        if (resultado.success) {
            // ✅ SUCESSO!
            alert(`Registro ${idInput} excluído com sucesso!`);

            // Recarrega a lista para atualizar a tela
            // Mantém a mesma página atual
            carregarLista(listaAtual.pagina);
        } else {
            // ❌ ERRO NO BACKEND
            const mensagemErro = resultado.error || 'Erro desconhecido ao excluir registro';
            console.error('Erro ao excluir:', mensagemErro);
            alert(`Erro ao excluir: ${mensagemErro}`);
        }
    } catch (erro) {
        // ❌ ERRO DE CONEXÃO/REDE
        console.error('Erro de conexão:', erro);
        alert(`Erro de conexão: ${erro.message || 'Não foi possível conectar ao servidor'}`);
    }
}

function toggleView(forcarView = null) {
    const formView = document.getElementById('view-form');
    const listView = document.getElementById('view-list');
    const btnToggle = document.getElementById('btn-toggle-view');
    if (forcarView === 'form' || (forcarView === null && viewAtual === 'list')) {
        formView.classList.remove('hidden'); listView.classList.add('hidden');
        btnToggle.textContent = '📋 Ver Lista'; viewAtual = 'form';
    } else {
        formView.classList.add('hidden'); listView.classList.remove('hidden');
        btnToggle.textContent = '✏️ Novo Registro'; viewAtual = 'list';
        carregarLista();
    }
}