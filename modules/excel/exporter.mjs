import ExcelJS from 'exceljs';

/**
 * 📊 Módulo de Exportação Excel - TecSave
 * Responsável por gerar relatórios Excel formatados dos atendimentos
 */

/**
 * Gera um relatório Excel formatado com os atendimentos
 * @param {Array} atendimentos - Array de atendimentos para exportar
 * @returns {Buffer} Buffer do arquivo Excel
 */
export async function generateAtendimentosExcel(atendimentos) {
    try {
        // Criar workbook com ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Relatório de Atendimentos TecSave');

        // Congela cabeçalho
        worksheet.views = [{ state: "frozen", ySplit: 3 }];

        // Título principal
        worksheet.mergeCells('A1:I1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = '📊 RELATÓRIO DE ATENDIMENTOS - TECSAVE';
        titleCell.font = { bold: true, size: 16, color: { argb: 'FF1F4E78' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F8FF' } };

        // Data de geração
        worksheet.mergeCells('A2:I2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `📅 Gerado em: ${new Date().toLocaleString('pt-BR')}`;
        dateCell.font = { italic: true, size: 11, color: { argb: 'FF666666' } };
        dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

        // Cabeçalho das colunas
        const headers = [
            'ID', 'Título', 'Descrição', 'Prioridade', 'Status', 
            'Cliente', 'Técnico', 'Data de Criação', 'Última Atualização'
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

        // Largura das colunas
        const colWidths = [8, 30, 45, 15, 15, 25, 20, 18, 18];
        colWidths.forEach((width, i) => worksheet.getColumn(i + 1).width = width);

        // Quebra automática de linha para descrição
        worksheet.getColumn(3).alignment = { wrapText: true, vertical: 'top' };

        // Adicionar dados dos atendimentos
        atendimentos.forEach((atendimento) => {
            const row = worksheet.addRow([
                atendimento.id,
                atendimento.title,
                atendimento.description,
                atendimento.priority,
                atendimento.status,
                atendimento.client || 'N/A',
                atendimento.technician || 'N/A',
                new Date(atendimento.createdAt).toLocaleDateString('pt-BR'),
                new Date(atendimento.updatedAt).toLocaleDateString('pt-BR')
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

                // Quebra de linha para descrição
                if (colNumber === 3) {
                    cell.alignment = { wrapText: true, vertical: 'top' };
                } else {
                    cell.alignment = { vertical: 'middle' };
                }

                // Cores especiais para Status (coluna 5)
                if (colNumber === 5) {
                    const status = cell.value ? cell.value.toString().toLowerCase() : '';
                    if (status.includes('resolvido')) {
                        cell.font = { color: { argb: 'FF228B22' }, bold: true }; // Verde
                    } else if (status.includes('aberto')) {
                        cell.font = { color: { argb: 'FFB22222' }, bold: true }; // Vermelho
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } }; // Amarelo claro
                    } else if (status.includes('em andamento')) {
                        cell.font = { color: { argb: 'FF1E90FF' }, bold: true }; // Azul
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB0E0E6' } }; // Azul claro
                    }
                }

                // Cores especiais para Prioridade (coluna 4)
                if (colNumber === 4) {
                    const priority = cell.value ? cell.value.toString().toLowerCase() : '';
                    if (priority.includes('crítica')) {
                        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC3545' } }; // Vermelho
                    } else if (priority.includes('alta')) {
                        cell.font = { color: { argb: 'FF000000' }, bold: true };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC107' } }; // Amarelo
                    } else if (priority.includes('média')) {
                        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17A2B8' } }; // Azul
                    } else if (priority.includes('baixa')) {
                        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } }; // Verde
                    }
                }
            });

            // Autoajusta altura da linha baseado no conteúdo
            const maxLines = Math.max(1, Math.ceil((row.getCell(3).value || '').toString().length / 50));
            row.height = maxLines * 15;
        });

        // Resumo automático no final
        const totalRows = worksheet.rowCount;
        const resumoRow = worksheet.addRow([]);
        resumoRow.getCell(2).value = '📈 Resumo:';
        resumoRow.getCell(2).font = { bold: true, size: 12, color: { argb: 'FF1F4E78' } };

        // Contar status
        const statusCount = {
            'Aberto': atendimentos.filter(a => a.status === 'Aberto').length,
            'Em Andamento': atendimentos.filter(a => a.status === 'Em Andamento').length,
            'Resolvido': atendimentos.filter(a => a.status === 'Resolvido').length
        };

        let colIndex = 3;
        Object.entries(statusCount).forEach(([status, count]) => {
            resumoRow.getCell(colIndex).value = `${status}: ${count}`;
            resumoRow.getCell(colIndex).font = { bold: true };
            colIndex++;
        });

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
    const date = new Date().toISOString().split('T')[0];
    return `relatorio_atendimentos_tecsave_${date}.xlsx`;
}