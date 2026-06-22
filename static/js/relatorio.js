// ==================== CARREGAR VALORES ÚNICOS ====================
async function carregarValoresUnicos(campo, selectId) {
    try {
        const select = document.getElementById(selectId);
        if (!select) return;

        // Limpar select
        select.innerHTML = '<option value="">Carregando...</option>';

        // Buscar valores únicos da API
        const response = await fetch(`/api/valores-unicos/${campo}`);
        const result = await response.json();

        if (result.success && result.valores.length > 0) {
            select.innerHTML = '<option value="">Selecione...</option>' +
                result.valores.map(valor => `<option value="${valor}">${valor}</option>`).join('');
        } else {
            select.innerHTML = '<option value="">Nenhum valor encontrado</option>';
        }
    } catch (e) {
        console.error('Erro ao carregar valores:', e);
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }
}

// ==================== CONFIGURAR FILTRO DATA ====================
function configurarFiltroData(numFiltro) {
    const campo = document.getElementById(`filtro_campo${numFiltro}`).value;
    const camposData = ['K']; // Apenas coluna K é data no relatório

    if (camposData.includes(campo)) {
        // Se for data, mostrar inputs de data
        document.getElementById(`filtro${numFiltro}_texto`).classList.add('hidden');
        document.getElementById(`filtro${numFiltro}_data_inicio`).classList.remove('hidden');
        document.getElementById(`filtro${numFiltro}_data_fim`).classList.remove('hidden');
    } else {
        // Se for outro campo, mostrar select com valores
        document.getElementById(`filtro${numFiltro}_texto`).classList.remove('hidden');
        document.getElementById(`filtro${numFiltro}_data_inicio`).classList.add('hidden');
        document.getElementById(`filtro${numFiltro}_data_fim`).classList.add('hidden');

        // Carregar valores únicos
        if (campo) {
            carregarValoresUnicos(campo, `filtro_valor${numFiltro}`);
        }
    }
}

// ==================== INICIALIZAÇÃO DO RELATÓRIO ====================
function initRelatorio() {
    carregarRelatorio();
}

// ==================== CARREGAR RELATÓRIO ====================
async function carregarRelatorio() {
    const container = document.getElementById('view-relatorio');
    if (container) container.classList.add('loading');

    try {
        const campo1 = document.getElementById('filtro_campo1')?.value || '';
        const valor1 = document.getElementById('filtro_valor1')?.value || '';
        const data1Inicio = document.getElementById('filtro_data1_inicio')?.value || '';
        const data1Fim = document.getElementById('filtro_data1_fim')?.value || '';

        const campo2 = document.getElementById('filtro_campo2')?.value || '';
        const valor2 = document.getElementById('filtro_valor2')?.value || '';
        const data2Inicio = document.getElementById('filtro_data2_inicio')?.value || '';
        const data2Fim = document.getElementById('filtro_data2_fim')?.value || '';

        let url = '/api/registros?pagina=1&por_pagina=1000';

        if (campo1) {
            url += `&filtro_campo1=${encodeURIComponent(campo1)}`;
            if (valor1) url += `&filtro_valor1=${encodeURIComponent(valor1)}`;
            if (data1Inicio) url += `&filtro_data1_inicio=${data1Inicio}`;
            if (data1Fim) url += `&filtro_data1_fim=${data1Fim}`;
        }

        if (campo2) {
            url += `&filtro_campo2=${encodeURIComponent(campo2)}`;
            if (valor2) url += `&filtro_valor2=${encodeURIComponent(valor2)}`;
            if (data2Inicio) url += `&filtro_data2_inicio=${data2Inicio}`;
            if (data2Fim) url += `&filtro_data2_fim=${data2Fim}`;
        }

        console.log('URL:', url);

        const r = await fetch(url);
        const result = await r.json();

        if (!result.success) throw new Error(result.error || 'Erro ao carregar relatório');

        renderizarRelatorio(result.dados);
        document.getElementById('total-info-relatorio').textContent = `Total: ${result.total} registro(s)`;
    } catch (e) {
        console.error('Erro:', e);
        alert('Erro: ' + e.message);
    }
    finally {
        if (container) container.classList.remove('loading');
    }
}

// ==================== RENDERIZAR RELATÓRIO ====================
function renderizarRelatorio(dados) {
    const tbody = document.getElementById('table-body-relatorio');

    if (!dados || dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-3 py-8 text-center text-gray-500">Nenhum registro encontrado</td></tr>`;
        return;
    }

    // DEBUG: Mostrar primeiras 3 linhas no console
    console.log('=== DEBUG RELATÓRIO ===');
    console.log('Total de registros:', dados.length);
    console.log('Primeira linha completa:', dados[0]);
    console.log('Tamanho da primeira linha:', dados[0].length);
    console.log('Valor no índice 42 (AQ):', dados[0][42]);
    console.log('Tipo do valor:', typeof dados[0][42]);
    console.log('Últimos 5 valores da linha:', dados[0].slice(-5));

    // Ordenar dados: DATA (K=10), INSTITUIÇÃO (B=1), PROTOCOLO (J=9)
    const dadosOrdenados = [...dados].sort((a, b) => {
        const dataA = a[10] ? a[10].split('/').reverse().join('') : '';
        const dataB = b[10] ? b[10].split('/').reverse().join('') : '';

        if (dataA < dataB) return -1;
        if (dataA > dataB) return 1;

        const instA = (a[1] || '').toLowerCase();
        const instB = (b[1] || '').toLowerCase();
        if (instA < instB) return -1;
        if (instA > instB) return 1;

        const protoA = (a[9] || '').toLowerCase();
        const protoB = (b[9] || '').toLowerCase();
        if (protoA < protoB) return -1;
        if (protoA > protoB) return 1;

        return 0;
    });

    // Calcular total dos valores
    let totalValores = 0;
    dadosOrdenados.forEach(linha => {
        let valorBruto = linha[42];
        if (valorBruto !== undefined && valorBruto !== null && valorBruto !== '') {
            if (typeof valorBruto === 'number') {
                totalValores += valorBruto;
            } else {
                totalValores += parseCurrency(valorBruto);
            }
        }
    });

    // Exibir total
    const totalDiv = document.getElementById('total-valores-relatorio');
    const totalSpan = document.getElementById('total-valores');
    if (totalDiv && totalSpan) {
        totalDiv.classList.remove('hidden');
        totalSpan.textContent = fmtCurrency(totalValores);
    }

    tbody.innerHTML = dadosOrdenados.map(linha => {
        const dataServico = linha[10] || '-';
        const instituicao = linha[1] || '-';
        const protocolo = linha[9] || '-';
        const placa = linha[15] || '-';

        let valorBruto = linha[42];
        let valor = '0,00';

        if (valorBruto !== undefined && valorBruto !== null && valorBruto !== '') {
            if (typeof valorBruto === 'number') {
                valor = fmtCurrency(valorBruto);
            } else {
                const num = parseCurrency(valorBruto);
                valor = num > 0 ? fmtCurrency(num) : '0,00';
            }
        }

        const nfRecibo = linha[50] || '-';
        const dataRecebProgramada = linha[65] || '-'; // Coluna BN
        const motorista = linha[13] || '-';

        return `<tr class="hover:bg-gray-50">
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${dataServico}</td>
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${instituicao}</td>
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${protocolo}</td>
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${placa}</td>
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${valor}</td>
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${nfRecibo}</td>
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${dataRecebProgramada}</td>
            <td class="px-3 py-2 whitespace-nowrap text-sm text-center">${motorista}</td>
        </tr>`;
    }).join('');
}

// ==================== LIMPAR FILTROS ====================
function limparFiltrosRelatorio() {
    document.getElementById('filtro_campo1').value = '';
    document.getElementById('filtro_valor1').value = '';
    document.getElementById('filtro_data1_inicio').value = '';
    document.getElementById('filtro_data1_fim').value = '';
    document.getElementById('filtro1_texto').classList.remove('hidden');
    document.getElementById('filtro1_data_inicio').classList.add('hidden');
    document.getElementById('filtro1_data_fim').classList.add('hidden');

    document.getElementById('filtro_campo2').value = '';
    document.getElementById('filtro_valor2').value = '';
    document.getElementById('filtro_data2_inicio').value = '';
    document.getElementById('filtro_data2_fim').value = '';
    document.getElementById('filtro2_texto').classList.remove('hidden');
    document.getElementById('filtro2_data_inicio').classList.add('hidden');
    document.getElementById('filtro2_data_fim').classList.add('hidden');

    carregarRelatorio();
}

// ==================== CONFIGURAR FILTRO DATA ====================
/* function configurarFiltroData(numFiltro) {
    const campo = document.getElementById(`filtro_campo${numFiltro}`).value;
    const camposData = ['K'];
    if (camposData.includes(campo)) {
        document.getElementById(`filtro${numFiltro}_texto`).classList.add('hidden');
        document.getElementById(`filtro${numFiltro}_data_inicio`).classList.remove('hidden');
        document.getElementById(`filtro${numFiltro}_data_fim`).classList.remove('hidden');
    } else {
        document.getElementById(`filtro${numFiltro}_texto`).classList.remove('hidden');
        document.getElementById(`filtro${numFiltro}_data_inicio`).classList.add('hidden');
        document.getElementById(`filtro${numFiltro}_data_fim`).classList.add('hidden');
    }
} */

// ==================== EXPORTAR PDF (SALVAR EM DOWNLOADS) ====================
function exportarPDF() {
    const tbody = document.getElementById('table-body-relatorio');
    if (!tbody || tbody.children.length === 0) {
        alert('Não há dados para exportar');
        return;
    }

    // Gerar nome do arquivo com data e hora atuais
    const agora = new Date();
    const dataStr = agora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).replace(/\//g, '');
    const horaStr = agora.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false }).replace(/:/g, '');
    const nomeArquivo = `Relatorio_Servico_${dataStr}_${horaStr}`;

    // Criar elemento temporário com o conteúdo da tabela
    const elemento = document.createElement('div');
    elemento.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 5px 20px 20px 20px;">
            <h1 style="text-align: center; color: #1e3a8a; margin: 0 0 5px 0; font-size: 18px;">Klayton Transportes – Relatório de Serviço</h1>
            <p style="text-align: center; color: #666; margin: 0 0 15px 0; font-size: 12px;">Gerado em: ${agora.toLocaleString('pt-BR')}</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background-color: #3b82f6; color: white;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Data do Serviço</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Instituição</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Nº Protocolo</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Placa</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Valor</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Nº NF/Recibo</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Data Receb. Programada</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Motorista</th>
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
                </tbody>
                <tfoot>
                    <tr style="background-color: #f3f4f6; font-weight: bold;">
                        <td colspan="4" style="padding: 8px; border: 1px solid #ddd; text-align: right;">Total dos Valores:</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${document.getElementById('total-valores').textContent}</td>
                        <td colspan="3" style="padding: 8px; border: 1px solid #ddd;"></td>
                    </tr>
                </tfoot>
            </table>
            <p style="margin-top: 20px; text-align: right; font-weight: bold;">${document.getElementById('total-info-relatorio').textContent}</p>

            <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #666;">
                <p>KTSistema - Gestão de Ordens de Serviço</p>
                <p>Desenvolvido por Sidnei Carraco</p>
            </div>
        </div>
    `;

    // Configurações do PDF
    const opt = {
        margin: [0.2, 0.5, 0.7, 0.5], // [top=0.2, right, bottom, left] - margem superior reduzida
        filename: `${nomeArquivo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Adicionar rodapé com numeração de página
    opt.jsPDF = {
        unit: 'in',
        format: 'a4',
        orientation: 'landscape',
        putOnlyUsedFonts: true,
        floatPrecision: 16
    };

    // Gerar PDF com numeração de páginas
    html2pdf().set(opt).from(elemento).toPdf().get('pdf').then(pdf => {
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(10);
            pdf.setTextColor(150);
            const pageText = `Página ${i} de ${totalPages}`;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            pdf.text(pageText, pageWidth - 1.2, pageHeight - 0.4, { align: 'right' });
        }
    }).save().then(() => {
        elemento.remove();
    }).catch(err => {
        console.error('Erro ao gerar PDF:', err);
        alert('Erro ao gerar PDF. Tente novamente.');
        elemento.remove();
    });

    // Gerar e baixar PDF
    html2pdf().set(opt).from(elemento).save().then(() => {
        // Limpar elemento temporário
        elemento.remove();
    }).catch(err => {
        console.error('Erro ao gerar PDF:', err);
        alert('Erro ao gerar PDF. Tente novamente.');
        elemento.remove();
    });
}

// ==================== IMPRIMIR PDF (ABRIR DIÁLOGO DE IMPRESSÃO) ====================
function imprimirPDF() {
    const tbody = document.getElementById('table-body-relatorio');
    if (!tbody || tbody.children.length === 0) {
        alert('Não há dados para imprimir');
        return;
    }

    // Gerar nome do arquivo com data e hora atuais
    const agora = new Date();
    const dataStr = agora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }).replace(/\//g, '');
    const horaStr = agora.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false }).replace(/:/g, '');
    const nomeArquivo = `Relatorio_Servico_${dataStr}_${horaStr}`;

    // Criar elemento temporário
    const elemento = document.createElement('div');
    elemento.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 5px 20px 20px 20px;">
            <h1 style="text-align: center; color: #1e3a8a; margin: 0 0 5px 0; font-size: 18px;">Klayton Transportes – Relatório de Serviço</h1>
            <p style="text-align: center; color: #666; margin: 0 0 15px 0; font-size: 12px;">Gerado em: ${agora.toLocaleString('pt-BR')}</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background-color: #3b82f6; color: white;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Data do Serviço</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Instituição</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Nº Protocolo</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Placa</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Valor</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Nº NF/Recibo</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Data Receb. Programada</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Motorista</th>
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
                </tbody>
                <tfoot>
                    <tr style="background-color: #f3f4f6; font-weight: bold;">
                        <td colspan="4" style="padding: 8px; border: 1px solid #ddd; text-align: right;">Total dos Valores:</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${document.getElementById('total-valores').textContent}</td>
                        <td colspan="3" style="padding: 8px; border: 1px solid #ddd;"></td>
                    </tr>
                </tfoot>
            </table>
            <p style="margin-top: 20px; text-align: right; font-weight: bold;">${document.getElementById('total-info-relatorio').textContent}</p>

            <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #666;">
                <p>KTSistema - Gestão de Ordens de Serviço</p>
                <p>Desenvolvido por Sidnei Carraco</p>
            </div>
        </div>
    `;

    // Configurações do PDF
    const opt = {
        margin: [0.2, 0.5, 0.7, 0.5], // [top=0.2, right, bottom, left] - margem superior reduzida
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

    // Gerar PDF com numeração de páginas
    html2pdf().set(opt).from(elemento).toPdf().get('pdf').then(pdf => {
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(10);
            pdf.setTextColor(150);
            const pageText = `Página ${i} de ${totalPages}`;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            pdf.text(pageText, pageWidth - 1.2, pageHeight - 0.4, { align: 'right' });
        }

        // Converter para blob e abrir
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const janela = window.open(pdfUrl, '_blank');

        if (janela) {
            janela.onload = () => {
                setTimeout(() => {
                    janela.print();
                }, 250);
            };
        }

        setTimeout(() => {
            URL.revokeObjectURL(pdfUrl);
            elemento.remove();
        }, 5000);
    }).catch(err => {
        console.error('Erro ao gerar PDF:', err);
        alert('Erro ao gerar PDF. Tente novamente.');
        elemento.remove();
    });

    // Gerar PDF e abrir diálogo de impressão
    html2pdf().set(opt).from(elemento).outputPdf('blob').then(pdfBlob => {
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const janela = window.open(pdfUrl, '_blank');

        // Aguardar carregar e imprimir
        if (janela) {
            janela.onload = () => {
                setTimeout(() => {
                    janela.print();
                }, 250);
            };
        }

        // Limpar após 5 segundos
        setTimeout(() => {
            URL.revokeObjectURL(pdfUrl);
            elemento.remove();
        }, 5000);
    }).catch(err => {
        console.error('Erro ao gerar PDF:', err);
        alert('Erro ao gerar PDF. Tente novamente.');
        elemento.remove();
    });
}