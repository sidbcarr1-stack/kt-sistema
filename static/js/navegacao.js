// static/js/navegacao.js
// Sistema de Navegacao Unificado

function definirOrigemNavegacao(origem) {
    if (typeof definirOrigem === 'function') {
        definirOrigem(origem);
        console.log('Origem de navegacao definida: ' + origem);
    }
}

function voltarParaTelaAnterior() {
    if (typeof voltarInteligente === 'function') {
        voltarInteligente();
    } else {
        window.location.href = '/';
    }
}

function irParaMenuPrincipal() {
    console.log('Retornando ao Menu Principal');
    window.location.href = '/';
}

function inicializarNavegacaoPagina(paginaAtual, origemPadrao) {
    if (typeof origemPadrao === 'undefined') {
        origemPadrao = 'menu';
    }
    
    var urlParams = new URLSearchParams(window.location.search);
    var origem = urlParams.get('origem') || origemPadrao;
    
    definirOrigemNavegacao(origem);
    console.log('Pagina: ' + paginaAtual + ' | Origem: ' + origem);
}

function criarLinkComOrigem(url, origem) {
    var separador = url.indexOf('?') !== -1 ? '&' : '?';
    return url + separador + 'origem=' + encodeURIComponent(origem);
}

document.addEventListener('DOMContentLoaded', function() {
    var pathname = window.location.pathname;
    
    var paginasConfig = {
        '/': 'menu',
        '/cadastro': 'lista',
        '/cadastros': 'menu',
        '/relatorios': 'menu',
        '/relatorio': 'relatorios',
        '/comissao': 'relatorios',
        '/nf-recibo': 'relatorios',
        '/cadastro-clientes': 'cadastros',
        '/cadastro-servicos': 'cadastros',
        '/cadastro-instituicao-situacao': 'cadastros'
    };
    
    var paginaConfig = null;
    var origemPadrao = 'menu';
    
    for (var path in paginasConfig) {
        if (pathname === path || pathname.indexOf(path + '/') === 0) {
            paginaConfig = path;
            origemPadrao = paginasConfig[path];
            break;
        }
    }
    
    if (paginaConfig) {
        var nomePagina = paginaConfig.replace('/', '') || 'menu';
        inicializarNavegacaoPagina(nomePagina, origemPadrao);
    }
});

window.definirOrigemNavegacao = definirOrigemNavegacao;
window.voltarParaTelaAnterior = voltarParaTelaAnterior;
window.irParaMenuPrincipal = irParaMenuPrincipal;
window.inicializarNavegacaoPagina = inicializarNavegacaoPagina;
window.criarLinkComOrigem = criarLinkComOrigem;