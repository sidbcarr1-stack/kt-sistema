// ==================== VARIÁVEIS GLOBAIS ====================
const CAMPOS = [
    { id: 'A', label: 'ID (A)', type: 'readonly_id', aba: 1 },
    { id: 'B', label: 'Instituição (B)', type: 'select', source: 'inst', aba: 1 },
    { id: 'C', label: 'Assistência (C)', type: 'select', source: 'assist', dependsOn: 'B', aba: 1 },
    { id: 'D', label: 'Fechamento via Planilha (D)', type: 'select', source: 'D', aba: 1 },
    { id: 'E', label: 'Checklist (E)', type: 'select', options: ['SIM', 'NÃO', 'OK'], aba: 1 },
    // { id: 'F', label: 'Situação (F)', type: 'select', source: 'sit', dependsOn: 'B', aba: 1 },
    { id: 'F', label: 'Situação (F)', type: 'select', source: 'sit', aba: 1 },
    { id: 'G', label: 'Descrição (G)', type: 'text', aba: 1 },
    { id: 'H', label: 'Pendência (H)', type: 'select', source: 'H', aba: 1 },
    { id: 'I', label: 'Pedágio (I)', type: 'select', options: ['SIM', 'NÃO'], aba: 1 },
    { id: 'J', label: 'Protocolo (J)', type: 'text', aba: 1 },
    { id: 'K', label: 'Data (K)', type: 'date', aba: 1 },
    { id: 'L', label: 'Hora (L)', type: 'time', aba: 1 },
    { id: 'M', label: 'Serviço (M)', type: 'select', source: 'M', aba: 1 },
    { id: 'N', label: 'Motorista (N)', type: 'select', source: 'N', aba: 1 },
    { id: 'O', label: 'Foto Enviada Por (O)', type: 'select', source: 'N', aba: 1 },
    { id: 'P', label: 'Placa do Veículo (P)', type: 'plate', aba: 1 },
    { id: 'Q', label: 'Guincho (Q)', type: 'readonly', aba: 1 },
    { id: 'R', label: 'Placa do Guincho (R)', type: 'select', source: 'R', aba: 1 },
    { id: 'S', label: 'Valor da Saída (S)', type: 'currency_br', aba: 2 },
    { id: 'T', label: 'Valor Hora Parada (T)', type: 'currency_br', aba: 2 },
    { id: 'U', label: 'Qtd Hora Parada (U)', type: 'decimal', aba: 2 },
    { id: 'V', label: 'Total Hora Parada (V)', type: 'calc', aba: 2 },
    { id: 'W', label: 'Valor Hora Trabalhada (W)', type: 'currency_br', aba: 2 },
    { id: 'X', label: 'Qtd Hora Trabalhada (X)', type: 'decimal', aba: 2 },
    { id: 'Y', label: 'Total Hora Trabalhada (Y)', type: 'calc', aba: 2 },
    { id: 'Z', label: 'Valor KM Excedente (Z)', type: 'currency_br', aba: 2 },
    { id: 'AA', label: 'Qtd KM Excedente (AA)', type: 'decimal', aba: 2 },
    { id: 'AB', label: 'Total KM Excedente (AB)', type: 'calc', aba: 2 },
    { id: 'AC', label: 'Valor Patins (AC)', type: 'currency_br', aba: 2 },
    { id: 'AD', label: 'Qtd Patins (AD)', type: 'decimal', aba: 2 },
    { id: 'AE', label: 'Total Patins (AE)', type: 'calc', aba: 2 },
    { id: 'AF', label: 'Valor Macaco (AF)', type: 'currency_br', aba: 2 },
    { id: 'AG', label: 'Qtd Macaco (AG)', type: 'decimal', aba: 2 },
    { id: 'AH', label: 'Total Macaco (AH)', type: 'calc', aba: 2 },
    { id: 'AI', label: 'Valor Diária (AI)', type: 'currency_br', aba: 2 },
    { id: 'AJ', label: 'Qtd Diária (AJ)', type: 'decimal', aba: 2 },
    { id: 'AK', label: 'Total Diária (AK)', type: 'calc', aba: 2 },
    { id: 'AL', label: 'Valor Pedágio (AL)', type: 'currency_br', aba: 2 },
    { id: 'AM', label: 'Qtd Pedágio (AM)', type: 'decimal', aba: 2 },
    { id: 'AN', label: 'Total Pedágio (AN)', type: 'calc', aba: 2 },
    { id: 'AO', label: 'Carga (AO)', type: 'decimal', aba: 2 },
    { id: 'AP', label: 'Excedente / Ajuste (AP)', type: 'currency_br', aba: 2 },
    { id: 'AQ', label: 'Total do Serviço (AQ)', type: 'calc_total', aba: 2 },
    { id: 'AR', label: 'Valor Checklist (AR)', type: 'currency_br', aba: 2 },
    { id: 'AS', label: 'Diferença (AS)', type: 'calc', aba: 2 },
    { id: 'AT', label: 'Observação 1 (AT)', type: 'text', aba: 2 },
    { id: 'AU', label: 'Base Comissão (AU)', type: 'currency_br', aba: 2 },
    { id: 'AV', label: 'Obs. Comissão (AV)', type: 'text', aba: 3 },
    { id: 'AW', label: 'Data Prog. Pagamento (AW)', type: 'readonly', aba: 3, enviar: true },
    { id: 'AX', label: 'Nº Fat. VENITI (AX)', type: 'text', aba: 3 },
    { id: 'AY', label: 'Nº NF / Recibo KT (AY)', type: 'text', aba: 3 },
    { id: 'AZ', label: 'Nº Boleto KT (AZ)', type: 'text', aba: 3 },
    { id: 'BA', label: 'Valor Pago Assistência (BA)', type: 'currency_br', aba: 3 },
    { id: 'BB', label: 'Diferença Pagamento (BB)', type: 'currency_br', aba: 3 },
    { id: 'BC', label: 'Efetivado? (BC)', type: 'select', options: ['SIM', 'NÃO'], aba: 3 },
    { id: 'BD', label: 'Informação Adicional (BD)', type: 'text', aba: 3 },
    { id: 'BE', label: 'Fechamento Velox Ision (BE)', type: 'text', aba: 3 },
    { id: 'BF', label: 'Obs. Pedágio (BF)', type: 'text', aba: 3 },
    { id: 'BG', label: 'Em Negociação? (BG)', type: 'select', options: ['SIM', 'NÃO'], aba: 3 },
    { id: 'BH', label: 'Resultado Negociação (BH)', type: 'select', options: ['Favorável', 'Desfavorável'], aba: 3 },
    { id: 'BI', label: 'Valor Inicial Operadora (BI)', type: 'currency_br', aba: 3 },
    { id: 'BJ', label: 'Valor Negociado (BJ)', type: 'currency_br', aba: 3 },
    { id: 'BK', label: 'Data Emissão NF / Recibo (BK)', type: 'date_pagto', aba: 3 },
    { id: 'BL', label: 'Dias para Pagamento (BL)', type: 'readonly', aba: 3 },
    { id: 'BM', label: 'Dias Pagamento Manual (BM)', type: 'number', aba: 3 },
    { id: 'BN', label: 'Data de Pagamento (BN)', type: 'readonly', aba: 3 },
    { id: 'BO', label: 'Endereço Origem (BO)', type: 'text', aba: 3 },
    { id: 'BP', label: 'Endereço Destino (BP)', type: 'text', aba: 3 },
    { id: 'BQ', label: 'Nº OS / Pedido (BQ)', type: 'text', aba: 3 },
    { id: 'BR', label: 'Data Competência NF (BR)', type: 'date', aba: 3 },
    { id: 'BS', label: 'Segunda Data Pagamento (BS)', type: 'date', aba: 3 },
];

const NAO_GRAVAR = new Set(['A', 'Q', 'V', 'Y', 'AB', 'AE', 'AH', 'AK', 'AN', 'AQ', 'AS', 'BL', 'BN']);
const COLUNAS_TABELA = ['A', 'B', 'F', 'J', 'K', 'P', 'M', 'N', 'AQ', 'AY', 'AZ', 'BK', 'BN', 'BR'];
const LABELS_TABELA = {
    'A': 'ID', 'B': 'Instituição', 'F': 'Situação', 'J': 'Protocolo',
    'K': 'Data', 'P': 'Placa', 'M': 'Serviço', 'N': 'Motorista',
    'AQ': 'Total', 'AY': 'Nº NF/Rec KT', 'AZ': 'Nº Boleto KT',
    'BK': 'Data Emissão NF', 'BN': 'Data Pagto', 'BR': 'Data Comp. NF'
};

const MAPA_GUINCHO = {
    'EEH-6209': 'HR / EEH-6209', 'DBL-5132': 'IVECO / DBL-5132', 'VOLVO': 'VOLVO',
    'DGB-1J21': '', 'DIR-7560': 'VOLKSWAGEN', 'CGR-1297': 'MERCEDES',
};

let paramRows = [], assistRows = [], situRows = [], auOverridden = false;
let listaAtual = { dados: [], pagina: 1, totalPaginas: 1 };
let modoEdicao = false;
let idEdicao = null;
let idParaExcluir = null;
let viewAtual = 'form';
let abaAtiva = 1;

// ==================== FUNÇÕES UTILITÁRIAS ====================
function uniqueCol(rows, idx) {
    return [...new Set(rows.map(r => (r[idx] || '').trim()).filter(Boolean))].sort();
}

function fillSelect(id, options, placeholder = 'Selecione...') {
    const sel = document.getElementById(id);
    if (!sel) return;
    const curr = sel.value;
    sel.innerHTML = `<option value="">${placeholder}</option>` +
        options.map(o => `<option value="${o}"${o === curr ? ' selected' : ''}>${o}</option>`).join('');
}

/* function parseCurrency(v) {
    if (!v || !String(v).trim()) return 0;

    let str = String(v).trim();

    // Remover símbolo R$ e espaços
    str = str.replace(/R\$/g, '').trim();

    // Detectar formato e converter
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');

    if (lastComma > lastDot) {
        // Formato brasileiro: 1.400,00
        str = str.replace(/\./g, '').replace(',', '.');
    } else if (lastDot > lastComma) {
        // Formato americano: 1,400.00
        str = str.replace(/,/g, '');
    } else {
        // Sem separadores ou apenas um tipo
        str = str.replace(/[.,]/g, '');
    }

    return parseFloat(str) || 0;
} */


function parseCurrency(v) {
    if (!v || !String(v).trim()) return 0;
    let str = String(v).trim();
    const isNegative = str.startsWith('-');  // ✅ Detecta negativo
    str = str.replace(/R\$/g, '').trim();
    if (isNegative) str = str.substring(1);
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    if (lastComma > lastDot) {
        str = str.replace(/\./g, '').replace(',', '.');
    } else if (lastDot > lastComma) {
        str = str.replace(/,/g, '');
    } else {
        str = str.replace(/[.,]/g, '');
    }
    const result = parseFloat(str) || 0;
    return isNegative ? -result : result;  // ✅ Retorna negativo
}


function fmtCurrency(n) {
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseDecimal(v) {
    if (!v || !String(v).trim()) return 0;
    return parseFloat(String(v).replace(',', '.')) || 0;
}

function convertDateForSheet(val) {
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return val;
}

function convertDateForInput(val) {
    if (!val) return '';
    if (typeof val === 'string' && val.includes('/')) {
        const parts = val.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return val;
}

function colToIndex(col) {
    let idx = 0;
    for (let char of col) {
        idx = idx * 26 + (char.charCodeAt(0) - 'A'.charCodeAt(0) + 1);
    }
    return idx - 1;
}

// Converte ano de 2 para 4 dígitos (ex: 26 → 2026)
function convertYearTo4Digits(year) {
    if (!year) return '';
    const yearStr = String(year).trim();
    // Se tem 2 dígitos, adiciona 20 na frente
    if (yearStr.length === 2) {
        return '20' + yearStr;
    }
    // Se tem 4 dígitos mas começa com "00" (ex: 0026), troca para 20xx
    if (yearStr.length === 4 && yearStr.startsWith('00')) {
        return '20' + yearStr.substring(2);
    }
    return yearStr;
}

// Aplica máscara em campos de data
function applyDateMask() {
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.addEventListener('blur', function () {
            if (this.value) {
                const parts = this.value.split('-');
                if (parts.length === 3) {
                    const year = convertYearTo4Digits(parts[0]);
                    if (year !== parts[0]) {
                        this.value = `${year}-${parts[1]}-${parts[2]}`;
                    }
                }
            }
        });
    });
}

// Atalhos para alternar abas (não interfere no navegador)
document.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey) {
        if (e.key === '1') {
            e.preventDefault();
            document.querySelector('[data-aba="dados-gerais"]')?.click();
        } else if (e.key === '2') {
            e.preventDefault();
            document.querySelector('[data-aba="valores-totais"]')?.click();
        } else if (e.key === '3') {
            e.preventDefault();
            document.querySelector('[data-aba="pagamento-obs"]')?.click();
        }
    }
});

// ==================== ATALHOS DE TECLADO (Abas) ====================
document.addEventListener('keydown', function (e) {
    // Só funciona se o formulário estiver visível
    const viewForm = document.getElementById('view-form');
    if (!viewForm || viewForm.classList.contains('hidden')) return;

    // CTRL + ALT + 1 -> Dados Gerais
    if (e.ctrlKey && e.altKey && e.key === '1') {
        e.preventDefault();
        const btn = document.querySelector('button[data-aba="dados-gerais"]');
        if (btn) btn.click();
    }
    // CTRL + ALT + 2 -> Valores e Totais
    else if (e.ctrlKey && e.altKey && e.key === '2') {
        e.preventDefault();
        const btn = document.querySelector('button[data-aba="valores-totais"]');
        if (btn) btn.click();
    }
    // CTRL + ALT + 3 -> Pagamento e Obs
    else if (e.ctrlKey && e.altKey && e.key === '3') {
        e.preventDefault();
        const btn = document.querySelector('button[data-aba="pagamento-obs"]');
        if (btn) btn.click();
    }

    // CTRL + ALT + Seta Esquerda/Direita -> Navegar entre abas
    if (e.ctrlKey && e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const abas = Array.from(document.querySelectorAll('button[data-aba]'));
        const abaAtiva = document.querySelector('button[data-aba].bg-blue-600'); // Ou a classe que indica ativo
        let idx = abas.indexOf(abaAtiva);
        if (idx === -1) idx = 0;

        if (e.key === 'ArrowRight') idx = (idx + 1) % abas.length;
        else idx = (idx - 1 + abas.length) % abas.length;

        if (abas[idx]) abas[idx].click();
    }
});