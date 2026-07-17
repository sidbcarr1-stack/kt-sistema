// static/js/comentarios_celula.js - VERSÃO ISOLADA (NÃO INTERFERE NAS ABAS)
console.log('✅ Script de comentários carregado (versão segura)');

let comentariosInicializado = false;

// Função única que inicializa uma vez só
function inicializarUmaVez() {
    if (comentariosInicializado) {
        console.log('ℹ️ Comentários já inicializado');
        return;
    }

    const form = document.getElementById('form-os');
    if (!form) {
        console.log('⏳ Aguardando formulário...');
        setTimeout(inicializarUmaVez, 1000);
        return;
    }

    if (typeof CAMPOS === 'undefined') {
        console.warn('⚠️ CAMPOS não definido, tentando novamente...');
        setTimeout(inicializarUmaVez, 1000);
        return;
    }

    console.log('✅ Inicializando comentários...');
    comentariosInicializado = true;

    // Cria botões apenas uma vez
    CAMPOS.forEach(campo => {
        if (campo.type === 'readonly_id' || campo.id === 'A') return;

        const el = document.getElementById('in_' + campo.id);
        if (el) {
            criarBotaoSimples(el, campo.id, campo.label);
        }
    });

    console.log('✅ Botões de comentário criados!');
}

// Cria botão simples sem interferir no layout
function criarBotaoSimples(el, coluna, label) {
    // Verifica se já existe
    if (el.nextElementSibling && el.nextElementSibling.classList.contains('btn-comentario')) {
        return;
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-comentario';
    btn.innerHTML = '💬';
    btn.title = `Comentário: ${label}`;
    btn.style.cssText = 'margin-left:4px;cursor:pointer;font-size:12px;opacity:0.6;';

    btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        abrirComentario(coluna, label, el);
    };

    // Insere após o elemento
    el.style.display = 'inline-flex';
    el.style.alignItems = 'center';
    el.insertAdjacentElement('afterend', btn);
}

// Abre diálogo de comentário
async function abrirComentario(coluna, label, el) {
    const linhaEl = document.getElementById('linha_atual');
    const linhaAtual = linhaEl ? linhaEl.value : '';

    let linhaReal = null;
    if (linhaAtual) {
        linhaReal = parseInt(linhaAtual) + 4;
    }

    const comentarioAtual = el.getAttribute('data-comentario') || '';
    const novoComentario = prompt(
        `Comentário para ${label} (${coluna}${linhaReal ? ' - Linha ' + linhaReal : ''})\n\n` +
        `${comentarioAtual ? 'Atual: "' + comentarioAtual + '"\n\n' : ''}` +
        'Digite novo comentário (ou deixe em branco para remover):',
        comentarioAtual
    );

    if (novoComentario === null) return; // Cancelou

    // Salva localmente
    el.setAttribute('data-comentario', novoComentario);

    // Atualiza visual
    if (novoComentario.trim()) {
        el.style.borderColor = '#3b82f6';
        el.style.backgroundColor = '#eff6ff';
    } else {
        el.style.borderColor = '';
        el.style.backgroundColor = '';
    }

    // Se tem linha, salva na planilha
    if (linhaReal) {
        try {
            await fetch('/api/atualizar_comentario_celula', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    row: linhaReal,
                    col: coluna,
                    comentario: novoComentario
                })
            });
            console.log(`✅ Comentário salvo em ${coluna}${linhaReal}`);
        } catch (e) {
            console.error('Erro ao salvar:', e);
        }
    } else {
        alert('Comentário será aplicado ao salvar a OS');
    }
}

// Inicialização segura - espera DOM completo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(inicializarUmaVez, 2000);
});

// NÃO interfere na função mostrarAba