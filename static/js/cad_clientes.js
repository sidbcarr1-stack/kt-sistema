// ==================== VARIÁVEIS GLOBAIS ====================
let clienteParaExcluir = null;
let modoEdicao = false;

// ==================== CONVERSÃO AUTOMÁTICA PARA MAIÚSCULAS ====================
document.addEventListener('DOMContentLoaded', function () {
    // Campos que devem ser convertidos para maiúsculas
    const camposMaiusculas = ['instituicao', 'assistencia'];

    camposMaiusculas.forEach(campoId => {
        const campo = document.getElementById(campoId);
        if (campo) {
            campo.addEventListener('input', function () {
                this.value = this.value.toUpperCase();
            });
        }
    });

    // Máscara para telefone
    const telefone = document.getElementById('telefone');
    if (telefone) {
        telefone.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                if (value.length > 10) {
                    value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
                } else if (value.length > 6) {
                    value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
                } else if (value.length > 2) {
                    value = value.replace(/^(\d{2})(\d{0,4})(\d{0,4}).*/, '($1) $2$3');
                } else {
                    value = value.replace(/^(\d*)/, '($1');
                }
                e.target.value = value;
            }
        });
    }

    // Máscara para CEP
    const cep = document.getElementById('cep');
    if (cep) {
        cep.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 8) {
                value = value.replace(/^(\d{5})(\d{0,3}).*/, '$1-$2');
                e.target.value = value;
            }
        });
    }

    // Máscara para CNPJ/CPF
    const cnpjCpf = document.getElementById('cnpj_cpf');
    if (cnpjCpf) {
        cnpjCpf.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 14) {
                if (value.length > 11) {
                    value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5');
                } else if (value.length > 3) {
                    value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2}).*/, '$1.$2.$3-$4');
                }
                e.target.value = value;
            }
        });
    }
});

// ==================== SUBMIT DO FORMULÁRIO ====================
document.getElementById('form-cliente').addEventListener('submit', async function (e) {
    e.preventDefault();
    await salvarCliente();
});

// ==================== SALVAR CLIENTE ====================
async function salvarCliente() {
    const btn = document.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = modoEdicao ? 'Atualizando...' : 'Salvando...';

    const dados = {
        instituicao: document.getElementById('instituicao').value,
        assistencia: document.getElementById('assistencia').value,
        nome_fantasia: document.getElementById('nome_fantasia').value,
        razao_social: document.getElementById('razao_social').value,
        cnpj_cpf: document.getElementById('cnpj_cpf').value,
        insc_municipal: document.getElementById('insc_municipal').value,
        insc_estadual: document.getElementById('insc_estadual').value,
        email: document.getElementById('email').value,
        email_nfe: document.getElementById('email_nfe').value,
        copia_para: document.getElementById('copia_para').value,
        site: document.getElementById('site').value,
        endereco: document.getElementById('endereco').value,
        bairro: document.getElementById('bairro').value,
        cidade: document.getElementById('cidade').value,
        estado: document.getElementById('estado').value,
        cep: document.getElementById('cep').value,
        telefone: document.getElementById('telefone').value,
        observacoes: document.getElementById('observacoes').value
    };

    try {
        const url = modoEdicao
            ? `/api/clientes/${document.getElementById('cliente-id').value}`
            : '/api/clientes';

        const method = modoEdicao ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        const result = await response.json();

        if (result.success) {
            alert(modoEdicao ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!');
            limparFormulario();
            carregarLista();
            toggleView('list');
        } else {
            alert('Erro: ' + (result.error || 'Erro ao salvar cliente'));
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
        const response = await fetch('/api/clientes');
        const result = await response.json();

        if (result.success) {
            const tbody = document.getElementById('lista-clientes');

            if (result.dados.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="border border-gray-300 px-3 py-4 text-center text-gray-500">Nenhum cliente cadastrado</td></tr>';
                return;
            }

            tbody.innerHTML = result.dados.map(cliente => `
                <tr class="hover:bg-gray-50">
                    <td class="border border-gray-300 px-3 py-2">${cliente.id}</td>
                    <td class="border border-gray-300 px-3 py-2">${cliente.instituicao}</td>
                    <td class="border border-gray-300 px-3 py-2">${cliente.assistencia}</td>
                    <td class="border border-gray-300 px-3 py-2">${cliente.nome_fantasia}</td>
                    <td class="border border-gray-300 px-3 py-2">${cliente.cnpj_cpf}</td>
                    <td class="border border-gray-300 px-3 py-2">${cliente.email}</td>
                    <td class="border border-gray-300 px-3 py-2">${cliente.telefone}</td>
                    <td class="border border-gray-300 px-3 py-2 text-center">
                        <button onclick="editarCliente('${cliente.id}')" class="text-blue-600 hover:text-blue-800 mr-2" title="Editar">✏️</button>
                        <button onclick="abrirModalExclusao('${cliente.id}')" class="text-red-600 hover:text-red-800" title="Excluir">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        alert('Erro ao carregar lista: ' + error.message);
    }
}

// ==================== EDITAR CLIENTE ====================
async function editarCliente(id) {
    try {
        const response = await fetch('/api/clientes');
        const result = await response.json();

        if (result.success) {
            const cliente = result.dados.find(c => c.id == id);

            if (cliente) {
                document.getElementById('cliente-id').value = cliente.id;
                document.getElementById('instituicao').value = cliente.instituicao;
                document.getElementById('assistencia').value = cliente.assistencia;
                document.getElementById('nome_fantasia').value = cliente.nome_fantasia || '';
                document.getElementById('razao_social').value = cliente.razao_social || '';
                document.getElementById('cnpj_cpf').value = cliente.cnpj_cpf || '';
                document.getElementById('insc_municipal').value = cliente.insc_municipal || '';
                document.getElementById('insc_estadual').value = cliente.insc_estadual || '';
                document.getElementById('email').value = cliente.email || '';
                document.getElementById('email_nfe').value = cliente.email_nfe || '';
                document.getElementById('copia_para').value = cliente.copia_para || '';
                document.getElementById('site').value = cliente.site || '';
                document.getElementById('endereco').value = cliente.endereco || '';
                document.getElementById('bairro').value = cliente.bairro || '';
                document.getElementById('cidade').value = cliente.cidade || '';
                document.getElementById('estado').value = cliente.estado || '';
                document.getElementById('cep').value = cliente.cep || '';
                document.getElementById('telefone').value = cliente.telefone || '';
                document.getElementById('observacoes').value = cliente.observacoes || '';

                modoEdicao = true;
                toggleView('form');
                document.getElementById('form-cliente').scrollIntoView({ behavior: 'smooth' });
            }
        }
    } catch (error) {
        alert('Erro ao carregar cliente: ' + error.message);
    }
}

// ==================== EXCLUIR CLIENTE ====================
function abrirModalExclusao(id) {
    clienteParaExcluir = id;
    document.getElementById('delete-id-display').textContent = id;
    document.getElementById('modal-delete').classList.remove('hidden');
    document.getElementById('modal-delete').classList.add('flex');
}

function fecharModal() {
    clienteParaExcluir = null;
    document.getElementById('modal-delete').classList.add('hidden');
    document.getElementById('modal-delete').classList.remove('flex');
}

async function confirmarExclusao() {
    if (!clienteParaExcluir) return;

    fecharModal();

    try {
        const response = await fetch(`/api/clientes/${clienteParaExcluir}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            alert('Cliente excluído com sucesso!');
            carregarLista();
        } else {
            alert('Erro ao excluir: ' + (result.error || 'Erro desconhecido'));
        }
    } catch (error) {
        alert('Erro de conexão: ' + error.message);
    }
}

// ==================== LIMPAR FORMULÁRIO ====================
function limparFormulario() {
    document.getElementById('form-cliente').reset();
    document.getElementById('cliente-id').value = '';
    modoEdicao = false;
}

// ==================== TOGGLE VIEW ====================
function toggleView(forcarView = null) {
    const formView = document.getElementById('view-form');
    const listView = document.getElementById('view-list');
    const btnToggle = document.getElementById('btn-toggle-view');

    if (forcarView === 'form' || (forcarView === null && !listView.classList.contains('hidden'))) {
        formView.classList.remove('hidden');
        listView.classList.add('hidden');
        btnToggle.textContent = '📋 Ver Lista';
    } else {
        formView.classList.add('hidden');
        listView.classList.remove('hidden');
        btnToggle.textContent = '✏️ Novo Cliente';
        carregarLista();
    }
}