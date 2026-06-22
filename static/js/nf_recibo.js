// ==================== CARREGAR INSTITUIÇÕES ====================
async function carregarInstituicoes() {
    try {
        const response = await fetch('/api/instituicoes');
        const result = await response.json();

        if (result.success) {
            const select = document.getElementById('instituicao');
            select.innerHTML = '<option value="">Todas</option>' +
                result.instituicoes.map(inst => `<option value="${inst}">${inst}</option>`).join('');
        }
    } catch (e) {
        console.error('Erro ao carregar instituições:', e);
    }
}

// ==================== CARREGAR RELATÓRIO ====================
async function carregarRelatorio() {
    const instituicao = document.getElementById('instituicao').value;
    const dataInicio = document.getElementById('data-inicio').value;
    const dataFinal = document.getElementById('data-final').value;

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

        document.getElementById('total-qtde').textContent = result.total_qtde;
        document.getElementById('total-valor').textContent = fmtCurrency(result.total_valor);
        document.getElementById('total-info').textContent = `Total de instituições: ${result.dados.length}`;

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
    document.getElementById('instituicao').value = '';
    document.getElementById('data-inicio').value = '';
    document.getElementById('data-final').value = '';
    document.getElementById('table-body-nf-recibo').innerHTML = '';
    document.getElementById('total-qtde').textContent = '0';
    document.getElementById('total-valor').textContent = 'R$ 0,00';
    document.getElementById('total-info').textContent = '';
}

// ==================== EXPORTAR PDF ====================
function exportarPDF() {
    const tbody = document.getElementById('table-body-nf-recibo');
    if (!tbody || tbody.children.length === 0) {
        alert('Não há dados para exportar');
        return;
    }

    const instituicao = document.getElementById('instituicao').value || 'Todas';

    // Converter datas de YYYY-MM-DD para DD/MM/YYYY
    function formatarDataBR(dataISO) {
        if (!dataISO || dataISO === 'Todos') return 'Todos';
        const partes = dataISO.split('-');
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
        return dataISO;
    }

    const dataInicio = formatarDataBR(document.getElementById('data-inicio').value);
    const dataFinal = formatarDataBR(document.getElementById('data-final').value);
    const totalQtde = document.getElementById('total-qtde').textContent;
    const totalValor = document.getElementById('total-valor').textContent;

    const agora = new Date();
    const dataStr = agora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).replace(/\//g, '');
    const horaStr = agora.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false }).replace(/:/g, '');
    const nomeArquivo = `Totais_${instituicao.replace(/\s+/g, '_')}_${dataStr}_${horaStr}`;

    const elemento = document.createElement('div');
    elemento.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
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
                    padding: 8px;
                    text-align: center;
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
            <h1 style="text-align: center; color: #1e3a8a; margin-bottom: 10px;">Relatório de Quantidade de Serviços e Totais por Instituição</h1>
            <div style="margin-bottom: 20px; padding: 10px; background-color: #f3f4f6; border-radius: 6px;">
                <p><strong>Instituição:</strong> ${instituicao}</p>
                <p><strong>Período:</strong> ${dataInicio} a ${dataFinal}</p>
                <p style="font-size: 16px; color: #1e3a8a;"><strong>Total de Serviços: ${totalQtde} | Total Geral: ${totalValor}</strong></p>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;" class="no-break">
                <thead>
                    <tr style="background-color: #3b82f6; color: white;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Instituição</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Qtde Serviços</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${Array.from(tbody.children).map(row => `
                        <tr>
                            ${Array.from(row.children).map(cell => `
                                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${cell.textContent}</td>
                            `).join('')}
                        </tr>
                    `).join('')}
                    <tr style="background-color: #dbeafe; font-weight: bold;">
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">TOTAL GERAL →</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${totalQtde}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${totalValor}</td>
                    </tr>
                </tbody>
            </table>
            <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #666;">
                <p>KTSistema - Gestão de Ordens de Serviço</p>
                <p>Desenvolvido por Sidnei Carraco</p>
            </div>
        </div>
    `;

    const opt = {
        margin: [0.5, 0.4, 0.6, 0.4],
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