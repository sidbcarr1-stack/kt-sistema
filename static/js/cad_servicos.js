// ==================== VARIÁVEIS GLOBAIS ====================
let modoEdicao = false;

// ==================== CONVERSÃO AUTOMÁTICA PARA MAIÚSCULAS ====================
document.addEventListener('DOMContentLoaded', function () {
    const campoServico = document.getElementById('servico');
    if (campoServico) {
        campoServico.addEventListener('input', function () {
            this.value = this.value.toUpperCase();
        });
    }

    // Carregar próximo ID ao abrir
    carregarProximoId();
});

// ==================== SUBMIT DO FORMULÁRIO ====================
document.getElementById('form-servico').addEventListener('submit', async function (e) {
    e.preventDefault();
    await salvarServico();
});

// ==================== CARREGAR PRÓXIMO ID ====================
async function carregarProximoId() {
    try {
        const response = await fetch('/api/servicos/proximo-id');
        const result = await response.json();

        if (result.success) {
            document.getElementById('id_servico_display').value = result.proximo_id;
        } else {
            document.getElementById('id_servico_display').value = 'Erro ao carregar ID';
        }
    } catch (error) {
        console.error('Erro ao carregar próximo ID:', error);
        document.getElementById('id_servico_display').value = 'Erro';
    }
}

// ==================== SALVAR SERVIÇO ====================
async function salvarServico() {
    const btn = document.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = modoEdicao ? 'Atualizando...' : 'Salvando...';

    const dados = {
        servico: document.getElementById('servico').value
    };

    try {
        const url = modoEdicao
            ? '/api/servicos/' + document.getElementById('servico-id').value
            : '/api/servicos';

        const method = modoEdicao ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        // Validar Content-Type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Servidor retornou erro. Verifique o terminal.');
        }

        const result = await response.json();

        if (result.success) {
            alert(modoEdicao ? 'Tipo de serviço atualizado com sucesso!' : 'Serviço cadastrado com sucesso!');
            limparFormulario();
            carregarLista();
            toggleView('list');
        } else {
            alert('Erro: ' + (result.error || 'Erro ao salvar o tipo de serviço'));
        }
    } catch (error) {
        alert('Erro de conexão: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '💾 Salvar';
    }
}

// ==================== CARREGAR LISTA ====================
async function carregarLista() {
    try {
        const response = await fetch('/api/servicos');
        const result = await response.json();

        if (result.success) {
            const tbody = document.getElementById('lista-servicos');

            if (result.dados.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="border border-gray-300 px-3 py-4 text-center text-gray-500">Nenhum tipo de serviço cadastrado</td></tr>';
                return;
            }

            tbody.innerHTML = result.dados.map(servico => {
                const idServico = (servico.id !== null && servico.id !== undefined && servico.id !== '')
                    ? String(servico.id)
                    : '';

                return `
                    <tr class="hover:bg-gray-50" data-id="${idServico}">
                        <td class="border border-gray-300 px-3 py-2">${idServico}</td>
                        <td class="border border-gray-300 px-3 py-2">${servico.servico || '-'}</td>
                        <td class="border border-gray-300 px-3 py-2 text-center">
                            <button onclick="editarServico('${idServico}')" class="text-blue-600 hover:text-blue-800 mr-2" title="Editar">✏️</button>
                            <button onclick="abrirModalExclusao('${idServico}')" class="text-red-600 hover:text-red-800" title="Excluir">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    } catch (error) {
        alert('Erro ao carregar lista: ' + error.message);
    }
}

// ==================== EDITAR SERVIÇO ====================
async function editarServico(id) {
    try {
        const response = await fetch('/api/servicos');
        const result = await response.json();

        if (result.success) {
            const servico = result.dados.find(s => String(s.id) === String(id));

            if (servico) {
                document.getElementById('servico-id').value = servico.id;
                document.getElementById('id_servico_display').value = servico.id;
                document.getElementById('servico').value = servico.servico || '';

                modoEdicao = true;
                toggleView('form');
                document.getElementById('form-servico').scrollIntoView({ behavior: 'smooth' });
            }
        }
    } catch (error) {
        alert('Erro ao carregar serviço: ' + error.message);
    }
}

// ==================== EXCLUIR SERVIÇO ====================
function abrirModalExclusao(id) {
    if (!id || id === 'null' || id === 'undefined' || id === '') {
        alert('Erro: ID do serviço não foi informado!');
        return;
    }

    // Armazenar ID no modal (atributo data) - SOLUÇÃO QUE FUNCIONA!
    const modal = document.getElementById('modal-delete');
    modal.setAttribute('data-servico-id', String(id));

    const display = document.getElementById('delete-id-display');
    if (display) {
        display.textContent = id;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function fecharModal() {
    const modal = document.getElementById('modal-delete');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function confirmarExclusao() {
    // Ler ID do atributo data do modal - SOLUÇÃO QUE FUNCIONA!
    const modal = document.getElementById('modal-delete');
    const servicoId = modal.getAttribute('data-servico-id');

    if (!servicoId || servicoId === 'null' || servicoId === '') {
        alert('Erro: ID do serviço não está definido!');
        return;
    }

    fecharModal();

    try {
        const url = '/api/servicos/' + servicoId;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Validar Content-Type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Servidor retornou erro. Verifique o terminal.');
        }

        const result = await response.json();

        if (result.success) {
            alert('Tipo de serviço excluído com sucesso!');
            carregarLista();
        } else {
            alert('Erro ao excluir: ' + (result.error || 'Erro desconhecido'));
        }
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

// ==================== LIMPAR FORMULÁRIO ====================
function limparFormulario() {
    document.getElementById('form-servico').reset();
    document.getElementById('servico-id').value = '';
    modoEdicao = false;

    // Recarregar próximo ID
    carregarProximoId();
}

// ==================== TOGGLE VIEW ====================
function toggleView(forcarView = null) {
    const formView = document.getElementById('view-form');
    const listView = document.getElementById('view-list');
    const btnToggle = document.getElementById('btn-toggle-view');

    if (forcarView === 'form' || (forcarView === null && !listView.classList.contains('hidden'))) {
        formView.classList.remove('hidden');
        listView.classList.add('hidden');
        btnToggle.textContent = ' Ver Lista';
    } else {
        formView.classList.add('hidden');
        listView.classList.remove('hidden');
        btnToggle.textContent = '✏️ Novo Tipo de Serviço';
        carregarLista();
    }
}