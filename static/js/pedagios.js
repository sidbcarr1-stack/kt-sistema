// ==================== INICIALIZAÇÃO ====================
function initPedagios() {
    console.log('🚀 Inicializando Relatório de Pedágios...');
    carregarFiltrosIniciais();
}

// ==================== CARREGAR FILTROS INICIAIS ====================
async function carregarFiltrosIniciais() {
    try {
        // Carregar Instituições
        const respInst = await fetch('/api/instituicoes');
        const dataInst = await respInst.json();
        if (dataInst.success) {
            const select = document.getElementById('filtro_pedagio_instituicao');
            dataInst.instituicoes.forEach(inst => {
                const opt = document.createElement('option');
                opt.value = inst;
                opt.textContent = inst;
                select.appendChild(opt);
            });
        }

        // Carregar Motoristas
        const respMot = await fetch('/api/motoristas');
        const dataMot = await respMot.json();
        if (dataMot.success) {
            const select = document.getElementById('filtro_pedagio_motorista');
            dataMot.motoristas.forEach(mot => {
                const opt = document.createElement('option');
                opt.value = mot;
                opt.textContent = mot;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        console.error('Erro ao carregar filtros:', e);
    }
}

// ==================== CARREGAR RELATÓRIO ====================
async function carregarRelatorioPedagios() {
    const tableBody = document.getElementById('table-body-pedagios');
    const totalValorSpan = document.getElementById('total-pedagio-valor');
    const totalQtdeSpan = document.getElementById('total-pedagio-quantidade');
    const totalInfoP = document.getElementById('total-info-pedagios');

    // Pegar valores dos filtros
    const dataInicio = document.getElementById('filtro_pedagio_data_inicio').value;
    const dataFim = document.getElementById('filtro_pedagio_data_fim').value;
    const instituicao = document.getElementById('filtro_pedagio_instituicao').value;
    const motorista = document.getElementById('filtro_pedagio_motorista').value;
    const protocolo = document.getElementById('filtro_pedagio_protocolo').value;
    const placa = document.getElementById('filtro_pedagio_placa').value;

    tableBody.innerHTML = '<tr><td colspan="10" class="px-3 py-8 text-center text-blue-600 font-bold">⌛ Carregando dados...</td></tr>';

    try {
        let query = `?data_inicio=${dataInicio}&data_fim=${dataFim}&instituicao=${encodeURIComponent(instituicao)}&motorista=${encodeURIComponent(motorista)}&protocolo=${encodeURIComponent(protocolo)}&placa=${encodeURIComponent(placa)}`;
        
        const resp = await fetch(`/api/pedagios-pendentes${query}`);
        const result = await resp.json();

        if (!result.success) throw new Error(result.error);

        renderizarTabelaPedagios(result.dados);
        
        // Calcular total pedágio
        let totalPedagio = 0;
        result.dados.forEach(linha => {
            // Coluna AL (índice 37) - valor do pedágio
            let vlr = linha[37];
            if (typeof vlr === 'string') vlr = parseCurrency(vlr);
            if (typeof vlr !== 'number' || isNaN(vlr)) vlr = 0;
            totalPedagio += vlr;
        });

        totalValorSpan.textContent = fmtCurrency(totalPedagio);
        if (totalQtdeSpan) totalQtdeSpan.textContent = result.total;
        totalInfoP.textContent = `Total de ${result.total} registro(s) encontrado(s).`;

    } catch (e) {
        console.error('Erro ao carregar relatório:', e);
        tableBody.innerHTML = `<tr><td colspan="10" class="px-3 py-8 text-center text-red-600 font-bold">❌ Erro: ${e.message}</td></tr>`;
    }
}

// ==================== RENDERIZAR TABELA ====================
function renderizarTabelaPedagios(dados) {
    const tableBody = document.getElementById('table-body-pedagios');
    
    if (dados.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="10" class="px-3 py-8 text-center text-gray-500 italic">Nenhum pedágio pendente encontrado para os filtros aplicados.</td></tr>';
        return;
    }

    // Ordenar por Data (K=10) e Instituição (B=1)
    const dadosOrdenados = [...dados].sort((a, b) => {
        const dataA = a[10] ? a[10].split('/').reverse().join('') : '';
        const dataB = b[10] ? b[10].split('/').reverse().join('') : '';
        if (dataA !== dataB) return dataA < dataB ? -1 : 1;
        return (a[1] || '').localeCompare(b[1] || '');
    });

    tableBody.innerHTML = dadosOrdenados.map(linha => {
        // Índices baseados no SheetsService (1-based na planilha, 0-based aqui)
        // B=1, J=9, K=10, L=11, M=12, N=13, P=15, AL=37, Q=16, BF=57
        const vlrPedagio = typeof linha[37] === 'number' ? linha[37] : parseCurrency(linha[37]);
        return `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-3 py-2 text-center border-r">${linha[1] || '-'}</td>
                <td class="px-3 py-2 text-center border-r">${linha[9] || '-'}</td>
                <td class="px-3 py-2 text-center border-r">${linha[10] || '-'}</td>
                <td class="px-3 py-2 text-center border-r">${linha[11] || '-'}</td>
                <td class="px-3 py-2 text-center border-r">${linha[12] || '-'}</td>
                <td class="px-3 py-2 text-center border-r">${linha[13] || '-'}</td>
                <td class="px-3 py-2 text-center border-r">${linha[15] || '-'}</td>
                <td class="px-3 py-2 text-center border-r font-bold">${fmtCurrency(vlrPedagio)}</td>
                <td class="px-3 py-2 text-center border-r">${linha[16] || '-'}</td>
                <td class="px-3 py-2 text-xs max-w-xs truncate" title="${linha[57] || ''}">${linha[57] || ''}</td>
            </tr>
        `;
    }).join('');
}

// ==================== LIMPAR FILTROS ====================
function limparFiltrosPedagios() {
    document.getElementById('filtro_pedagio_data_inicio').value = '';
    document.getElementById('filtro_pedagio_data_fim').value = '';
    document.getElementById('filtro_pedagio_instituicao').value = '';
    document.getElementById('filtro_pedagio_motorista').value = '';
    document.getElementById('filtro_pedagio_protocolo').value = '';
    document.getElementById('filtro_pedagio_placa').value = '';
    
    document.getElementById('table-body-pedagios').innerHTML = '<tr><td colspan="10" class="px-3 py-8 text-center text-gray-500 italic">Preencha os filtros e clique em filtrar</td></tr>';
    document.getElementById('total-pedagio-valor').textContent = 'R$ 0,00';
    const totalQtdeSpan = document.getElementById('total-pedagio-quantidade');
    if (totalQtdeSpan) totalQtdeSpan.textContent = '0';
    document.getElementById('total-info-pedagios').textContent = '';
}

// ==================== EXPORTAR PDF ====================
function gerarPDFPedagios() {
    const tableBody = document.getElementById('table-body-pedagios');
    if (!tableBody || tableBody.rows.length === 0 || tableBody.innerText.includes('Nenhum')) {
        alert('Não há dados para exportar');
        return;
    }

    const agora = new Date();
    const dataStr = agora.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const nomeArquivo = `Relatorio_Pedagios_${dataStr}`;

    const elemento = document.createElement('div');
    elemento.style.cssText = 'font-family: Arial, sans-serif; padding: 10px;';

    elemento.innerHTML = `
        <div style="position: relative; text-align: center; margin-bottom: 10px;">
            <h1 style="color: #1e3a8a; margin: 0 0 5px 0; font-size: 16px; font-weight: bold;">Klayton Transportes</h1>
            <h2 style="color: #444; margin: 0; font-size: 14px;">Relatório de Pedágios Pendentes</h2>
            <p style="text-align: center; font-size: 11px; color: #666; margin: 5px 0 0 0;">
                Gerado em: ${agora.toLocaleString('pt-BR')}
            </p>
            <div style="position: absolute; top: 0; right: 0; text-align: right; color: #666; font-size: 9px;">
                <div style="margin: 0;">KTSistema - Gestão de Ordens de Serviço</div>
                <div style="margin: 0;">Desenvolvido por Sidnei Carraco</div>
            </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
                <tr style="background-color: #f3f4f6; border-bottom: 2px solid #ddd;">
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Instituição</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Protocolo</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Data</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Serviço</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Motorista</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Placa</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Valor</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Observação</th>
                </tr>
            </thead>
            <tbody>
                ${Array.from(tableBody.rows).map(row => `
                    <tr style="page-break-inside: avoid;">
                        <td style="padding: 6px; text-align: center; border: 1px solid #eee;">${row.cells[0].textContent}</td>
                        <td style="padding: 6px; text-align: center; border: 1px solid #eee;">${row.cells[1].textContent}</td>
                        <td style="padding: 6px; text-align: center; border: 1px solid #eee;">${row.cells[2].textContent}</td>
                        <td style="padding: 6px; text-align: center; border: 1px solid #eee;">${row.cells[4].textContent}</td>
                        <td style="padding: 6px; text-align: center; border: 1px solid #eee;">${row.cells[5].textContent}</td>
                        <td style="padding: 6px; text-align: center; border: 1px solid #eee;">${row.cells[6].textContent}</td>
                        <td style="padding: 6px; text-align: center; border: 1px solid #eee; font-weight: bold;">${row.cells[7].textContent}</td>
                        <td style="padding: 6px; text-align: left; border: 1px solid #eee; font-size: 8px;">${row.cells[9].textContent || ''}</td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr style="background-color: #f9fafb; font-weight: bold;">
                    <td colspan="6" style="padding: 10px; text-align: right; border: 1px solid #ddd;">TOTAL GERAL:</td>
                    <td style="padding: 10px; text-align: center; border: 1px solid #ddd; color: #1e3a8a;">${document.getElementById('total-pedagio-valor').textContent}</td>
                    <td style="border: 1px solid #ddd;"></td>
                </tr>
            </tfoot>
        </table>
    `;

    const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `${nomeArquivo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            logging: false
        },
        jsPDF: {
            unit: 'in',
            format: 'a4',
            orientation: 'landscape',
            putOnlyUsedFonts: true,
            floatPrecision: 16,
            compress: true
        },
        pagebreak: {
            mode: 'avoid-all',
            before: '',
            after: '',
            avoid: ['tr', 'tbody', 'tfoot']
        }
    };

    html2pdf().set(opt).from(elemento).toPdf().get('pdf').then(pdf => {
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor(150);
            const pageText = `Página ${i} de ${totalPages}`;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            pdf.text(pageText, pageWidth - 0.8, pageHeight - 0.15, { align: 'right' });
        }
    }).save().then(() => {
        elemento.remove();
        console.log('✅ PDF de Pedágios exportado com sucesso');
    }).catch(err => {
        console.error('Erro ao gerar PDF:', err);
        alert('Erro ao gerar PDF. Tente novamente.');
        elemento.remove();
    });
}

// ==================== IMPRIMIR ====================
function imprimirPedagios() {
    const tableBody = document.getElementById('table-body-pedagios');
    if (!tableBody || tableBody.rows.length === 0 || tableBody.innerText.includes('Nenhum')) {
        alert('Não há dados para imprimir');
        return;
    }

    const agora = new Date();

    const elemento = document.createElement('div');
    elemento.id = 'conteudo-impressao';
    elemento.style.cssText = 'font-family: Arial, sans-serif; padding: 15px; position: relative;';

    elemento.innerHTML = `
        <div style="position: relative; text-align: center; margin-bottom: 15px;">
            <h1 style="color: #1e3a8a; margin: 0 0 5px 0; font-size: 16px; font-weight: bold;">Klayton Transportes</h1>
            <h2 style="color: #444; margin: 0; font-size: 14px;">Relatório de Pedágios Pendentes</h2>
            <p style="text-align: center; font-size: 11px; color: #666; margin: 5px 0 0 0;">
                Gerado em: ${agora.toLocaleString('pt-BR')}
            </p>
            <div style="position: absolute; top: 0; right: 0; text-align: right; color: #666; font-size: 9px;">
                <div style="margin: 0;">KTSistema - Gestão de Ordens de Serviço</div>
                <div style="margin: 0;">Desenvolvido por Sidnei Carraco</div>
            </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
                <tr style="background-color: #f3f4f6; border-bottom: 2px solid #ddd;">
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Instituição</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Protocolo</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Data</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Serviço</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Motorista</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Placa</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Valor</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">Observação</th>
                </tr>
            </thead>
            <tbody>
                ${Array.from(tableBody.rows).map(row => `
                    <tr style="page-break-inside: avoid;">
                        <td style="padding: 6px; text-align: center; border: 1px solid #eee;">${row.cells[0].textContent}</td>
                        <td style="padding: 6px; text-align: center; border: 1px solid #eee;">${row.cells[1].textContent}</td>
                        <td style="padding: 6px; text-align: center; border: 1px solid #eee;">${row.cells[2].textContent}</td>
                        <td style="padding: 6px; text-align: center; border: 1px solid #eee;">${row.cells[4].textContent}</td>
                        <td style="padding: 6px; text-align: center; border: 1px solid #eee;">${row.cells[5].textContent}</td>
                        <td style="padding: 6px; text-align: center; border: 1px solid #eee;">${row.cells[6].textContent}</td>
                        <td style="padding: 6px; text-align: center; border: 1px solid #eee; font-weight: bold;">${row.cells[7].textContent}</td>
                        <td style="padding: 6px; text-align: left; border: 1px solid #eee; font-size: 8px;">${row.cells[9].textContent || ''}</td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr style="background-color: #f9fafb; font-weight: bold;">
                    <td colspan="6" style="padding: 10px; text-align: right; border: 1px solid #ddd;">TOTAL GERAL:</td>
                    <td style="padding: 10px; text-align: center; border: 1px solid #ddd; color: #1e3a8a;">${document.getElementById('total-pedagio-valor').textContent}</td>
                    <td style="border: 1px solid #ddd;"></td>
                </tr>
            </tfoot>
        </table>
        <div id="rodape-numeracao" style="position: fixed; bottom: 10mm; right: 15mm; font-size: 9px; color: #666; font-family: Arial, sans-serif;">
            Página 1 de 1
        </div>
    `;

    // Adiciona temporariamente ao documento
    document.body.appendChild(elemento);

    // Configurações de impressão
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Relatório de Pedágios Pendentes</title>
                <style>
                    @page {
                        size: A4 landscape;
                        margin: 10mm;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                    }
                    @media print {
                        body { 
                            print-color-adjust: exact; 
                            -webkit-print-color-adjust: exact; 
                        }
                    }
                </style>
            </head>
            <body>
                ${document.getElementById('conteudo-impressao').innerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();

    // Remove elemento temporário
    setTimeout(() => {
        elemento.remove();
    }, 1000);

    printWindow.onload = () => {
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };
}