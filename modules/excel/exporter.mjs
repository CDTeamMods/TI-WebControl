import ExcelJS from 'exceljs';

/**
 * 📊 Módulo de Exportação Excel - TI-WebControl
 * Responsável por gerar relatórios Excel formatados dos atendimentos
 */

/**
 * Retorna o nome fixo do website
 * @returns {string} Nome do website
 */
function getWebsiteName() {
    return 'TI-WEBCONTROL';
}

/**
 * Gera um relatório Excel formatado com os atendimentos
 * @param {Array} atendimentos - Array de atendimentos para exportar
 * @returns {Buffer} Buffer do arquivo Excel
 */
export async function generateAtendimentosExcel(atendimentos) {
    try {
        // Obter nome do website
        const websiteName = getWebsiteName();
        
        // Criar workbook com ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Relatório de Atendimentos ${websiteName}`);
        const resumoWorksheet = workbook.addWorksheet('Resumo');

        // Congela cabeçalho
        worksheet.views = [{ state: "frozen", ySplit: 3 }];

        // Título principal
        worksheet.mergeCells('A1:F1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `📊 RELATÓRIO DE ATENDIMENTOS - ${websiteName}`;
        titleCell.font = { bold: true, size: 16, color: { argb: 'FF1F4E78' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F8FF' } };

        // Data de geração
        worksheet.mergeCells('A2:F2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `📅 Gerado em: ${new Date().toLocaleString('pt-BR')}`;
        dateCell.font = { italic: true, size: 11, color: { argb: 'FF666666' } };
        dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Cabeçalho das colunas (nova ordem: Empresa, Cliente, Descrição, Problema, Data de Criação, Status)
        const headers = [
            'Empresa', 'Cliente', 'Descrição', 'Problema', 'Data de Criação', 'Status'
        ];
        const headerRow = worksheet.addRow(headers);

        // Estilo do cabeçalho
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'medium', color: { argb: 'FF000000' } }
            };
        });

        // Largura das colunas (ajustadas para nova ordem)
        const colWidths = [20, 20, 35, 25, 18, 15];
        colWidths.forEach((width, i) => worksheet.getColumn(i + 1).width = width);

        // Quebra automática de linha para descrição
        worksheet.getColumn(3).alignment = { wrapText: true, vertical: 'top' };

        // Adicionar dados dos atendimentos
        atendimentos.forEach((atendimento) => {
            // Mapear campos corretamente baseado na estrutura do banco (nova ordem)
            const row = worksheet.addRow([
                atendimento.empresa || 'Não informada',
                atendimento.cliente || atendimento.client || 'Não informado',
                atendimento.description || atendimento.descricao || 'Sem descrição',
                atendimento.problema || atendimento.title || 'Não especificado',
                atendimento.created_at ? new Date(atendimento.created_at).toLocaleDateString('pt-BR') : 
                    (atendimento.createdAt ? new Date(atendimento.createdAt).toLocaleDateString('pt-BR') : 'Não informada'),
                (atendimento.status || 'Não informado').toUpperCase()
            ]);
        });

        // Aplicar formatação avançada nas linhas de dados
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber <= 3) return; // Pular título, data e cabeçalho

            row.eachCell((cell, colNumber) => {
                // Bordas
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                };

                // Zebra (linhas alternadas)
                if (rowNumber % 2 === 0) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
                }

                // Alinhamento específico por coluna
                if (colNumber === 1 || colNumber === 2 || colNumber === 3 || colNumber === 6) {
                    // Empresa (1), Cliente (2), Descrição (3) e Status (6) - centralizados
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    if (colNumber === 3) {
                        // Descrição (3) - centralizada com quebra de linha
                        cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
                    }
                } else if (colNumber === 5) {
                    // Data de Criação (5) - centralizada
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    // Aplicar formato de data
                    cell.numFmt = 'dd/mm/yyyy';
                } else {
                    cell.alignment = { vertical: 'middle' };
                }

                // Cores especiais para Status (coluna 6)
                if (colNumber === 6) {
                    const status = cell.value ? cell.value.toString().toLowerCase() : '';
                    if (status.includes('resolvido')) {
                        cell.font = { color: { argb: 'FF228B22' }, bold: true }; // Verde
                    } else if (status.includes('aberto')) {
                        cell.font = { color: { argb: 'FFB22222' }, bold: true }; // Vermelho
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } }; // Amarelo claro
                    } else if (status.includes('em andamento') || status.includes('andamento')) {
                        cell.font = { color: { argb: 'FF1E90FF' }, bold: true }; // Azul
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB0E0E6' } }; // Azul claro
                    } else if (status.includes('pendente')) {
                        cell.font = { color: { argb: 'FFFF8C00' }, bold: true }; // Laranja
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEAA7' } }; // Laranja claro
                    }
                }
            });

            // Autoajusta altura da linha baseado no conteúdo
            const maxLines = Math.max(1, Math.ceil((row.getCell(3).value || '').toString().length / 50));
            row.height = maxLines * 15;
        });

        // ===== ABA DE RESUMO =====
        // Título da aba de resumo
        resumoWorksheet.mergeCells('A1:D1');
        const resumoTitleCell = resumoWorksheet.getCell('A1');
        resumoTitleCell.value = `📈 RESUMO DE ATENDIMENTOS - ${websiteName}`;
        resumoTitleCell.font = { bold: true, size: 16, color: { argb: 'FF1F4E78' } };
        resumoTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        resumoTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F8FF' } };

        // Data de geração na aba de resumo
        resumoWorksheet.mergeCells('A2:D2');
        const resumoDateCell = resumoWorksheet.getCell('A2');
        resumoDateCell.value = `📅 Gerado em: ${new Date().toLocaleString('pt-BR')}`;
        resumoDateCell.font = { italic: true, size: 11, color: { argb: 'FF666666' } };
        resumoDateCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Cabeçalho do resumo
        const resumoHeaderRow = resumoWorksheet.addRow(['Status', 'Quantidade', 'Percentual', '']);
        resumoHeaderRow.eachCell((cell, colNumber) => {
            if (colNumber <= 3) {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'medium', color: { argb: 'FF000000' } }
                };
            }
        });

        // Contar status
        const statusCount = {
            'Em Andamento': atendimentos.filter(a => (a.status || '').toLowerCase().includes('andamento')).length,
            'Resolvido': atendimentos.filter(a => (a.status || '').toLowerCase().includes('resolvido')).length
        };

        const total = atendimentos.length;

        // Adicionar dados do resumo
        Object.entries(statusCount).forEach(([status, count]) => {
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
            const resumoDataRow = resumoWorksheet.addRow([status, count, `${percentage}%`, '']);
            
            resumoDataRow.eachCell((cell, colNumber) => {
                if (colNumber <= 3) {
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },
                        left: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } }
                    };
                }
            });
        });

        // Total na aba de resumo
        const totalRow = resumoWorksheet.addRow(['TOTAL', total, '100%', '']);
        totalRow.eachCell((cell, colNumber) => {
            if (colNumber <= 3) {
                cell.font = { bold: true };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F8FF' } };
                cell.border = {
                    top: { style: 'medium', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'medium', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                };
            }
        });

        // Largura das colunas na aba de resumo
        resumoWorksheet.getColumn(1).width = 15;
        resumoWorksheet.getColumn(2).width = 12;
        resumoWorksheet.getColumn(3).width = 12;

        // Gerar buffer do Excel
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;

    } catch (error) {
        console.error('❌ Erro ao gerar Excel:', error);
        throw new Error('Erro ao gerar arquivo Excel');
    }
}

/**
 * Gera nome do arquivo Excel com data atual
 * @returns {string} Nome do arquivo
 */
export function generateExcelFileName() {
    const websiteName = getWebsiteName().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const date = new Date().toISOString().split('T')[0];
    return `relatorio_atendimentos_${websiteName}_${date}.xlsx`;
}