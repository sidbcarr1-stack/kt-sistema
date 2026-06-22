// ==================== INICIALIZAÇÃO ====================
function initComissao() {
    carregarMotoristas();

    // Definir datas padrão (mês atual)
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    document.getElementById('data-inicio').value = formatarDataInput(primeiroDia);
    document.getElementById('data-final').value = formatarDataInput(ultimoDia);
}

// ==================== CARREGAR MOTORISTAS ====================
async function carregarMotoristas() {
    try {
        const response = await fetch('/api/motoristas');
        const result = await response.json();

        if (result.success) {
            const select = document.getElementById('motorista');
            select.innerHTML = '<option value="">Selecione...</option>' +
                result.motoristas.map(m => `<option value="${m}">${m}</option>`).join('');
        }
    } catch (e) {
        console.error('Erro ao carregar motoristas:', e);
    }
}

// ==================== CARREGAR COMISSÃO ====================
async function carregarComissao() {
    const motorista = document.getElementById('motorista').value;
    const dataInicio = document.getElementById('data-inicio').value;
    const dataFinal = document.getElementById('data-final').value;

    if (!motorista || !dataInicio || !dataFinal) {
        alert('Preencha motorista, data inicial e data final');
        return;
    }

    const container = document.getElementById('view-comissao');
    if (container) container.classList.add('loading');

    try {
        // Converter datas para formato brasileiro
        const dataIniBR = formatarDataBR(dataInicio);
        const dataFimBR = formatarDataBR(dataFinal);

        const url = `/api/comissao?motorista=${encodeURIComponent(motorista)}&data_inicio=${dataIniBR}&data_final=${dataFimBR}`;

        const response = await fetch(url);
        const result = await response.json();

        if (!result.success) throw new Error(result.error || 'Erro ao carregar dados');

        renderizarComissao(result.dados);
        document.getElementById('qtd-servicos').value = result.total;
        document.getElementById('total-info-comissao').textContent = `Total: ${result.total} registro(s)`;

        recalcularComissoes();
    } catch (e) {
        console.error('Erro:', e);
        alert('Erro: ' + e.message);
    } finally {
        if (container) container.classList.remove('loading');
    }
}

// ==================== RENDERIZAR TABELA ====================
function renderizarComissao(dados) {
    const tbody = document.getElementById('table-body-comissao');

    if (!dados || dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" class="px-3 py-8 text-center text-gray-500">Nenhum registro encontrado</td></tr>`;
        return;
    }

    tbody.innerHTML = dados.map((linha, idx) => {
        const pedagio = linha.pedagio > 0 ? fmtCurrency(linha.pedagio) : '';
        const valorTotal = fmtCurrency(linha.valor_total);
        const valorSemPedagio = fmtCurrency(linha.valor_sem_pedagio);

        return `<tr class="hover:bg-gray-50" data-idx="${idx}">
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${idx + 1}</td>
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${linha.empresa}</td>
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${linha.data}</td>
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${linha.protocolo}</td>
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${linha.placa}</td>
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${linha.observacao}</td>
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${pedagio}</td>
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${valorTotal}</td>
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${valorSemPedagio}</td>
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">
                <input type="number" class="w-20 border rounded px-2 py-1 text-xs text-center" 
                    data-field="percentual" data-idx="${idx}" 
                    onchange="recalcularComissoes()" placeholder="%" step="0.01">
            </td>
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center font-bold text-blue-900" 
                data-field="comissao" data-idx="${idx}">R$ 0,00</td>
        </tr>`;
    }).join('');
}

// ==================== RECALCULAR COMISSÕES ====================
function recalcularComissoes() {
    const percentualGeral = parseFloat(document.getElementById('percentual-comissao').value) || 0;
    const linhas = document.querySelectorAll('#table-body-comissao tr[data-idx]');

    let totalComissao = 0;

    linhas.forEach(linha => {
        const idx = linha.getAttribute('data-idx');
        const percentualInput = linha.querySelector('[data-field="percentual"]');
        const comissaoCell = linha.querySelector('[data-field="comissao"]');

        const percentualEspecifico = parseFloat(percentualInput.value) || 0;
        const valorSemPedagioText = linha.children[8].textContent.trim();
        const valorSemPedagio = parseCurrency(valorSemPedagioText);

        let comissao = 0;
        if (percentualEspecifico > 0) {
            comissao = valorSemPedagio * (percentualEspecifico / 100);
        } else {
            comissao = valorSemPedagio * (percentualGeral / 100);
        }

        comissaoCell.textContent = fmtCurrency(comissao);
        totalComissao += comissao;
    });

    document.getElementById('total-comissao').value = fmtCurrency(totalComissao);
}

// ==================== LIMPAR FILTROS ====================
function limparFiltrosComissao() {
    document.getElementById('motorista').value = '';
    document.getElementById('percentual-comissao').value = '20';
    document.getElementById('qtd-servicos').value = '0';
    document.getElementById('total-comissao').value = 'R$ 0,00';
    document.getElementById('table-body-comissao').innerHTML = '';
    document.getElementById('total-info-comissao').textContent = '';
}

// ==================== EXPORTAR PDF ====================
function exportarComissaoPDF() {
    const tbody = document.getElementById('table-body-comissao');
    if (!tbody || tbody.children.length === 0) {
        alert('Não há dados para exportar');
        return;
    }

    const motorista = document.getElementById('motorista').value;
    const dataInicio = document.getElementById('data-inicio').value;
    const dataFinal = document.getElementById('data-final').value;
    const percentual = document.getElementById('percentual-comissao').value;
    const qtd = document.getElementById('qtd-servicos').value;
    const total = document.getElementById('total-comissao').value;

    const agora = new Date();
    const dataStr = agora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).replace(/\//g, '');
    const horaStr = agora.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false }).replace(/:/g, '');
    const nomeArquivo = `Comissao_${motorista.replace(/\s+/g, '_')}_${dataStr}_${horaStr}`;

    const elemento = document.createElement('div');
    elemento.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="text-align: center; color: #1e3a8a; margin-bottom: 10px;">Relatório de Comissão Por Período</h1>
            <div style="margin-bottom: 20px; padding: 10px; background-color: #f3f4f6; border-radius: 6px;">
                <p><strong>Motorista:</strong> ${motorista}</p>
                <p><strong>Período:</strong> ${formatarDataBR(dataInicio)} a ${formatarDataBR(dataFinal)}</p>
                <p><strong>% Comissão Geral:</strong> ${percentual}%</p>
                <p><strong>Qtd. Serviços:</strong> ${qtd}</p>
                <p style="font-size: 18px; color: #1e3a8a;"><strong>TOTAL: ${total}</strong></p>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                    <tr style="background-color: #3b82f6; color: white;">
                        <th style="padding: 6px; border: 1px solid #ddd;">ID</th>
                        <th style="padding: 6px; border: 1px solid #ddd;">Empresa</th>
                        <th style="padding: 6px; border: 1px solid #ddd;">Data</th>
                        <th style="padding: 6px; border: 1px solid #ddd;">Protocolo</th>
                        <th style="padding: 6px; border: 1px solid #ddd;">Placa</th>
                        <th style="padding: 6px; border: 1px solid #ddd;">Observação</th>
                        <th style="padding: 6px; border: 1px solid #ddd;">Pedágio</th>
                        <th style="padding: 6px; border: 1px solid #ddd;">Valor Total</th>
                        <th style="padding: 6px; border: 1px solid #ddd;">Sem Pedágio</th>
                        <th style="padding: 6px; border: 1px solid #ddd;">%</th>
                        <th style="padding: 6px; border: 1px solid #ddd;">Comissão</th>
                    </tr>
                </thead>
                <tbody>
                    ${Array.from(tbody.children).map(row => `
                        <tr>
                            ${Array.from(row.children).map(cell => `
                                <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${cell.textContent}</td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #666;">
                <p>KTSistema - Gestão de Ordens de Serviço</p>
                <p>Desenvolvido por Sidnei Carraco</p>
            </div>
        </div>
    `;

    const opt = {
        margin: [0.3, 0.3, 0.5, 0.3],
        filename: `${nomeArquivo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: {
            unit: 'in',
            format: 'a4',
            orientation: 'landscape',
            putOnlyUsedFonts: true,
            floatPrecision: 16
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(elemento).toPdf().get('pdf').then(pdf => {
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(10);
            pdf.setTextColor(150);
            const pageText = `Página ${i} de ${totalPages}`;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            pdf.text(pageText, pageWidth - 1.2, pageHeight - 0.3, { align: 'right' });
        }
    }).save().then(() => {
        elemento.remove();
    }).catch(err => {
        console.error('Erro ao gerar PDF:', err);
        alert('Erro ao gerar PDF. Tente novamente.');
        elemento.remove();
    });
}

// ==================== FUNÇÕES AUXILIARES ====================
function formatarDataInput(date) {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function formatarDataBR(dataISO) {
    if (!dataISO) return '';
    const partes = dataISO.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataISO;
}