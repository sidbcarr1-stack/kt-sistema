// ==================== SISTEMA DE COMENTÁRIOS POR CAMPO ====================
// Funciona apenas nos formulários de OS (BD_Geral) - cadastro e edição

// Armazena os comentários do registro atualmente aberto
let _comentariosRegistroAtual = {};

// ==================== CARREGAMENTO ====================

/**
 * Carrega todos os comentários de um registro e aplica visualização nos campos.
 * Chamado automaticamente ao abrir um registro para edição.
 * @param {string|number} idRegistro - ID do registro na BD_Geral
 */
async function carregarComentariosRegistro(idRegistro) {
    if (!idRegistro) {
        _comentariosRegistroAtual = {};
        return;
    }
    try {
        const resp = await fetch(`/api/comentarios/${idRegistro}`);
        const result = await resp.json();
        if (result.success) {
            _comentariosRegistroAtual = result.comentarios || {};
            _aplicarVisualizacaoComentarios();
        } else {
            console.warn('[Comentários] Aviso ao carregar:', result.error);
            _comentariosRegistroAtual = {};
        }
    } catch (e) {
        console.error('[Comentários] Erro ao carregar comentários:', e);
        _comentariosRegistroAtual = {};
    }
}

// ==================== VISUALIZAÇÃO ====================

/**
 * Aplica a cor de destaque (#191970 fundo, #FFBF00 texto) em todos os campos
 * que possuem comentário no registro atual.
 */
function _aplicarVisualizacaoComentarios() {
    // Primeiro, limpa qualquer destaque anterior
    _limparVisualizacaoComentarios(false);

    // Aplica destaque apenas nos campos com comentário
    Object.keys(_comentariosRegistroAtual).forEach(coluna => {
        const wrapper = document.querySelector(`#form-os .field-wrapper[data-col="${coluna}"]`);
        if (!wrapper) return;

        const dadosComent = _comentariosRegistroAtual[coluna];
        if (!dadosComent || !dadosComent.comentario) return;

        wrapper.classList.add('field-com-comentario');

        // Atualizar o título e aparência do botão de comentário
        const btnComent = wrapper.querySelector('.btn-comentario-campo');
        if (btnComent) {
            btnComent.title = `Comentário: ${dadosComent.comentario}\nPor: ${dadosComent.usuario} em ${dadosComent.data_hora}`;
            btnComent.setAttribute('data-tem-comentario', 'true');
        }
    });
}

/**
 * Remove todos os destaques de comentário do formulário.
 * @param {boolean} limparCache - Se true, também limpa o cache de comentários
 */
function _limparVisualizacaoComentarios(limparCache = true) {
    document.querySelectorAll('#form-os .field-wrapper.field-com-comentario').forEach(wrapper => {
        wrapper.classList.remove('field-com-comentario');
    });
    // Restaurar atributos dos botões
    document.querySelectorAll('#form-os .btn-comentario-campo').forEach(btn => {
        btn.removeAttribute('data-tem-comentario');
        btn.title = 'Adicionar comentário';
    });
    if (limparCache) {
        _comentariosRegistroAtual = {};
    }
}

/**
 * Limpa visualização e cache. Chamado ao cancelar edição ou limpar formulário.
 */
function limparComentariosFormulario() {
    _limparVisualizacaoComentarios(true);
}

// ==================== MODAL DE COMENTÁRIO ====================

// Armazena qual campo está sendo comentado no momento
let _colunaComentandoAtual = null;
let _labelColunaAtual = '';

/**
 * Abre o modal de comentário para um campo específico.
 * @param {string} coluna - Letra da coluna (ex: 'B', 'AQ')
 * @param {string} labelCampo - Label legível do campo
 */
function abrirComentarioCampo(coluna, labelCampo) {
    // Verifica se está em modo de edição
    if (!modoEdicao || !idEdicao) {
        alert('💬 Comentários só podem ser adicionados ao editar um registro existente.\n\nSalve o registro primeiro e depois edite-o para adicionar comentários.');
        return;
    }

    _colunaComentandoAtual = coluna;
    _labelColunaAtual = labelCampo;

    const modal = document.getElementById('modal-comentario');
    if (!modal) return;

    // Preencher título do modal
    const titulo = modal.querySelector('#modal-comentario-titulo');
    if (titulo) titulo.textContent = `💬 Comentário — ${labelCampo}`;

    // Preencher textarea com comentário existente (se houver)
    const textarea = document.getElementById('modal-comentario-texto');
    const dadosExistentes = _comentariosRegistroAtual[coluna];

    if (dadosExistentes && dadosExistentes.comentario) {
        textarea.value = dadosExistentes.comentario;
        _atualizarInfoComentarioModal(dadosExistentes.usuario, dadosExistentes.data_hora);
        document.getElementById('btn-excluir-comentario').classList.remove('hidden');
    } else {
        textarea.value = '';
        _atualizarInfoComentarioModal('', '');
        document.getElementById('btn-excluir-comentario').classList.add('hidden');
    }

    // Exibir o modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Focar na textarea
    setTimeout(() => textarea.focus(), 50);
}

/**
 * Fecha o modal de comentário sem salvar.
 */
function fecharModalComentario() {
    const modal = document.getElementById('modal-comentario');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    _colunaComentandoAtual = null;
    _labelColunaAtual = '';
}

/**
 * Atualiza as informações de autor/data no modal.
 */
function _atualizarInfoComentarioModal(usuario, dataHora) {
    const infoEl = document.getElementById('modal-comentario-info');
    if (!infoEl) return;
    if (usuario && dataHora) {
        infoEl.textContent = `Por: ${usuario} em ${dataHora}`;
        infoEl.classList.remove('hidden');
    } else {
        infoEl.textContent = '';
        infoEl.classList.add('hidden');
    }
}

// ==================== AÇÕES DO MODAL ====================

/**
 * Salva o comentário via API e atualiza a visualização.
 */
async function confirmarSalvarComentario() {
    const coluna = _colunaComentandoAtual;
    if (!coluna || !idEdicao) return;

    const textarea = document.getElementById('modal-comentario-texto');
    const texto = textarea ? textarea.value.trim() : '';

    if (!texto) {
        alert('Por favor, escreva um comentário antes de salvar.');
        textarea?.focus();
        return;
    }

    const btnSalvar = document.getElementById('btn-salvar-comentario');
    if (btnSalvar) {
        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Salvando...';
    }

    try {
        const resp = await fetch(`/api/comentarios/${idEdicao}/${coluna}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comentario: texto })
        });
        const result = await resp.json();

        if (result.success) {
            // Atualizar cache local
            _comentariosRegistroAtual[coluna] = {
                comentario: texto,
                usuario: result.usuario || '',
                data_hora: result.data_hora || ''
            };
            // Aplicar visualização
            _aplicarVisualizacaoComentarios();
            // Fechar modal
            fecharModalComentario();
        } else {
            alert('Erro ao salvar comentário: ' + (result.error || 'Erro desconhecido'));
        }
    } catch (e) {
        alert('Erro de conexão ao salvar comentário: ' + e.message);
    } finally {
        if (btnSalvar) {
            btnSalvar.disabled = false;
            btnSalvar.textContent = '💾 Salvar';
        }
    }
}

/**
 * Exclui o comentário de um campo via API.
 */
async function confirmarExcluirComentario() {
    const coluna = _colunaComentandoAtual;
    if (!coluna || !idEdicao) return;

    if (!confirm(`Deseja realmente excluir o comentário do campo "${_labelColunaAtual}"?`)) return;

    const btnExcluir = document.getElementById('btn-excluir-comentario');
    if (btnExcluir) {
        btnExcluir.disabled = true;
        btnExcluir.textContent = 'Excluindo...';
    }

    try {
        const resp = await fetch(`/api/comentarios/${idEdicao}/${coluna}`, {
            method: 'DELETE'
        });
        const result = await resp.json();

        if (result.success) {
            // Remover do cache local
            delete _comentariosRegistroAtual[coluna];
            // Reaplicar visualização (remove destaque do campo excluído)
            _aplicarVisualizacaoComentarios();
            // Fechar modal
            fecharModalComentario();
        } else {
            alert('Erro ao excluir comentário: ' + (result.error || 'Erro desconhecido'));
        }
    } catch (e) {
        alert('Erro de conexão ao excluir comentário: ' + e.message);
    } finally {
        if (btnExcluir) {
            btnExcluir.disabled = false;
            btnExcluir.textContent = '🗑️ Excluir';
        }
    }
}

// ==================== TECLA ESC para fechar modal ====================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('modal-comentario');
        if (modal && !modal.classList.contains('hidden')) {
            fecharModalComentario();
        }
    }
});
