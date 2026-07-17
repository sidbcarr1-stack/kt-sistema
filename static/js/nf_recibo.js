// ==================== CARREGAR INSTITUIÇÕES ====================
async function carregarInstituicoes() {
    try {
        const response = await fetch('/api/instituicoes');
        const result = await response.json();

        if (result.success) {
            const select = document.getElementById('instituicao');
            if (select) {
                select.innerHTML = '<option value="">Todas</option>' +
                    result.instituicoes.map(inst => `<option value="${inst}">${inst}</option>`).join('');
            }
        }
    } catch (e) {
        console.error('Erro ao carregar instituições:', e);
    }
}

// ==================== CARREGAR RELATÓRIO ====================
async function carregarRelatorio() {
    // Verificar se elementos existem antes de acessar
    const instituicaoEl = document.getElementById('instituicao');
    const dataInicioEl = document.getElementById('data-inicio');
    const dataFinalEl = document.getElementById('data-final');

    if (!instituicaoEl || !dataInicioEl || !dataFinalEl) {
        console.error('Elementos do formulário não encontrados!');
        console.log('instituicao:', !!instituicaoEl);
        console.log('data-inicio:', !!dataInicioEl);
        console.log('data-final:', !!dataFinalEl);
        return;
    }

    const instituicao = instituicaoEl.value;
    const dataInicio = dataInicioEl.value;
    const dataFinal = dataFinalEl.value;

    const container = document.getElementById('view-nf-recibo');
    if (container) container.classList.add('loading');

    try {
        let url = '/api/nf-recibo?';
        if (instituicao) url += `instituicao=${encodeURIComponent(instituicao)}&`;
        if (dataInicio) url += `data_inicio=${dataInicio}&`;
        if (dataFinal) url += `data_final=${dataFinal}&`;

        const response = await fetch(url);
        const result = await response.json();

        if (!result.success) throw new Error(result.error || 'Erro ao carregar dados');

        renderizarTabelaNFRecibo(result.dados);

        // Verificar se elementos de total existem
        const totalQtdeEl = document.getElementById('total-qtde');
        const totalValorEl = document.getElementById('total-valor');
        const totalInfoEl = document.getElementById('total-info');

        if (totalQtdeEl) totalQtdeEl.textContent = result.total_qtde;
        if (totalValorEl) totalValorEl.textContent = fmtCurrency(result.total_valor);
        if (totalInfoEl) totalInfoEl.textContent = `Total de instituições: ${result.dados.length}`;

    } catch (e) {
        console.error('Erro:', e);
        alert('Erro: ' + e.message);
    } finally {
        if (container) container.classList.remove('loading');
    }
}

// ==================== RENDERIZAR TABELA ====================
function renderizarTabelaNFRecibo(dados) {
    const tbody = document.getElementById('table-body-nf-recibo');

    if (!tbody) {
        console.error('Elemento table-body-nf-recibo não encontrado!');
        return;
    }

    if (!dados || dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="px-3 py-8 text-center text-gray-500">Nenhum registro encontrado</td></tr>`;
        return;
    }

    tbody.innerHTML = dados.map(linha => {
        const total = fmtCurrency(linha.total);

        return `<tr class="hover:bg-gray-50">
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${linha.instituicao}</td>
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${linha.qtde}</td>
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${total}</td>
        </tr>`;
    }).join('');
}

// ==================== LIMPAR FILTROS ====================
function limparFiltros() {
    // Verificar se elementos existem antes de acessar
    const instituicaoEl = document.getElementById('instituicao');
    const dataInicioEl = document.getElementById('data-inicio');
    const dataFinalEl = document.getElementById('data-final');
    const tbodyEl = document.getElementById('table-body-nf-recibo');
    const totalQtdeEl = document.getElementById('total-qtde');
    const totalValorEl = document.getElementById('total-valor');
    const totalInfoEl = document.getElementById('total-info');

    if (instituicaoEl) instituicaoEl.value = '';
    if (dataInicioEl) dataInicioEl.value = '';
    if (dataFinalEl) dataFinalEl.value = '';
    if (tbodyEl) tbodyEl.innerHTML = '';
    if (totalQtdeEl) totalQtdeEl.textContent = '0';
    if (totalValorEl) totalValorEl.textContent = 'R$ 0,00';
    if (totalInfoEl) totalInfoEl.textContent = '';
}

// ==================== EXPORTAR PDF ====================
function exportarPDF() {
    const tbody = document.getElementById('table-body-nf-recibo');

    if (!tbody || tbody.children.length === 0) {
        alert('Não há dados para exportar');
        return;
    }

    const instituicaoEl = document.getElementById('instituicao');
    const instituicao = instituicaoEl ? (instituicaoEl.value || 'Todas') : 'Todas';

    // Converter datas de YYYY-MM-DD para DD/MM/YYYY
    function formatarDataBR(dataISO) {
        if (!dataISO || dataISO === 'Todos') return 'Todos';
        const partes = dataISO.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return dataISO;
    }

    const dataInicioEl = document.getElementById('data-inicio');
    const dataFinalEl = document.getElementById('data-final');
    const totalQtdeEl = document.getElementById('total-qtde');
    const totalValorEl = document.getElementById('total-valor');

    const dataInicio = formatarDataBR(dataInicioEl ? dataInicioEl.value : '');
    const dataFinal = formatarDataBR(dataFinalEl ? dataFinalEl.value : '');
    const totalQtde = totalQtdeEl ? totalQtdeEl.textContent : '0';
    const totalValor = totalValorEl ? totalValorEl.textContent : 'R$ 0,00';

    const agora = new Date();
    const dataStr = agora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).replace(/\//g, '');
    const horaStr = agora.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false }).replace(/:/g, '');
    const nomeArquivo = `Totais_${instituicao.replace(/\s+/g, '_')}_${dataStr}_${horaStr}`;

    const elemento = document.createElement('div');
    elemento.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 10px;">
            <style>
                table { 
                    border-collapse: collapse; 
                    width: 100%;
                    page-break-inside: auto;
                }
                tr { 
                    page-break-inside: avoid; 
                    page-break-after: auto;
                }
                td, th { 
                    border: 1px solid #ddd; 
                    padding: 6px;
                    text-align: center;
                    font-size: 10px;
                }
                thead { 
                    display: table-header-group; 
                }
                tfoot { 
                    display: table-footer-group; 
                }
                .no-break { 
                    page-break-inside: avoid; 
                }
            </style>
            <h1 style="text-align: center; color: #1e3a8a; margin: 0 0 10px 0; font-size: 16px;">Relatório de Quantidade de Serviços e Totais por Instituição</h1>
            <div style="margin-bottom: 15px; padding: 8px; background-color: #f3f4f6; border-radius: 4px;">
                <p style="margin: 2px 0;"><strong>Instituição:</strong> ${instituicao}</p>
                <p style="margin: 2px 0;"><strong>Período:</strong> ${dataInicio} a ${dataFinal}</p>
                <p style="margin: 2px 0; font-size: 14px; color: #1e3a8a;"><strong>Total de Serviços: ${totalQtde} | Total Geral: ${totalValor}</strong></p>
            </div>
            <table style="width: 100%; border-collapse: collapse;" class="no-break">
                <thead>
                    <tr style="background-color: #3b82f6; color: white;">
                        <th style="padding: 6px; border: 1px solid #ddd; text-align: center;">Instituição</th>
                        <th style="padding: 6px; border: 1px solid #ddd; text-align: center;">Qtde Serviços</th>
                        <th style="padding: 6px; border: 1px solid #ddd; text-align: center;">Total</th>
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
                    <tr style="background-color: #dbeafe; font-weight: bold;">
                        <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">TOTAL GERAL →</td>
                        <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${totalQtde}</td>
                        <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${totalValor}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    const opt = {
        margin: [0.4, 0.4, 0.6, 0.4], // [top=0.25 (~0.6cm), left, bottom, right] - margem superior reduzida
        filename: `${nomeArquivo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true
        },
        jsPDF: {
            unit: 'in',
            format: 'a4',
            orientation: 'landscape',
            putOnlyUsedFonts: true,
            floatPrecision: 16
        },
        pagebreak: {
            mode: ['css', 'legacy'],
            before: '.page-break'
        }
    };

    // Gerar PDF e adicionar rodapé personalizado
    html2pdf().set(opt).from(elemento).toPdf().get('pdf').then(pdf => {
        const totalPages = pdf.internal.getNumberOfPages();

        // Adicionar rodapé em TODAS as páginas
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(120); // Cinza

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const footerY = pageHeight - 0.4; // Posição vertical do rodapé

            // Texto à ESQUERDA: KT-Sistema
            const textoRodape = 'KT-Sistema Gestão de Ordens de Serviço - Desenvolvido por Sidnei Carraco';
            pdf.text(textoRodape, 0.35, footerY);

            // Numeração à DIREITA
            const numPagina = `Página ${i} de ${totalPages}`;
            pdf.text(numPagina, pageWidth - 0.35, footerY, { align: 'right' });
        }
    }).save().then(() => {
        elemento.remove();
        console.log('✅ PDF exportado com sucesso');
    }).catch(err => {
        console.error('Erro ao gerar PDF:', err);
        alert('Erro ao gerar PDF. Tente novamente.');
        elemento.remove();
    });
}