/**
 * 🎫 Módulo de Gerenciamento de Atendimentos - TI-WebControl
 * Responsável por todas as operações relacionadas aos atendimentos
 */

import database from '../auth/database.mjs';

/**
 * Dados dos atendimentos (cache local para compatibilidade)
 */
let atendimentos = [];

/**
 * Obtém todos os atendimentos
 * @returns {Array} Lista de atendimentos
 */
export async function obterAtendimentos() {
    try {
        const atendimentosDB = await database.getAllAtendimentos();
        
        // Atualiza o cache local
        atendimentos = atendimentosDB;
        
        return atendimentosDB;
    } catch (error) {
        console.error('❌ Erro ao obter atendimentos do banco de dados:', error);
        
        // Fallback para cache local
        return atendimentos;
    }
}

/**
 * Obtém atendimentos formatados para exibição
 * @param {Array} atendimentosList - Lista de atendimentos (opcional)
 * @returns {Array} Array de atendimentos formatados
 */
export function getFormattedAtendimentos(atendimentosList = null) {
    const lista = atendimentosList || atendimentos;
    
    return lista.map(atendimento => ({
        ...atendimento,
        // Mapear campos do backend para o frontend
        descricao: atendimento.description || atendimento.descricao || 'Descrição não informada',
        // Preservar datas originais em formato ISO para que o frontend possa formatá-las corretamente
        dataCriacao: atendimento.created_at || atendimento.dataCriacao || new Date().toISOString(),
        createdAt: atendimento.created_at || atendimento.createdAt || new Date().toISOString(),
        updatedAt: atendimento.updated_at || atendimento.updatedAt || new Date().toISOString()
    }));
}

/**
 * Obtém um atendimento por ID
 * @param {string} id - ID do atendimento
 * @returns {Object|null} Atendimento encontrado ou null
 */
export async function obterAtendimentoPorId(id) {
    try {
        const atendimento = await database.getAtendimentoById(id);
        return atendimento;
    } catch (error) {
        console.error('❌ Erro ao obter atendimento por ID do banco de dados:', error);
        
        // Fallback para cache local
        return atendimentos.find(atendimento => atendimento.id === id) || null;
    }
}

/**
 * Cria um novo atendimento
 * @param {Object} dadosAtendimento - Dados do atendimento
 * @returns {Object} Atendimento criado
 */
export async function criarAtendimento(dadosAtendimento) {
    const novoAtendimento = {
        title: dadosAtendimento.title || 'Atendimento sem título',
        description: dadosAtendimento.description || '',
        cliente: dadosAtendimento.cliente || '',
        empresa: dadosAtendimento.empresa || '',
        problema: dadosAtendimento.problema || '',
        prioridade: dadosAtendimento.prioridade || 'baixa',
        status: 'em andamento',
        created_by: dadosAtendimento.created_by || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };



    try {
        const atendimentoCriado = await database.createAtendimento(novoAtendimento);
        
        // Atualiza o cache local para compatibilidade
        atendimentos.push(atendimentoCriado);
        
        return atendimentoCriado;
    } catch (error) {
        console.error('❌ Erro ao criar atendimento no banco de dados:', error);
        
        // Fallback para cache local
        const fallbackAtendimento = {
            id: Date.now().toString(),
            ...novoAtendimento
        };
        atendimentos.push(fallbackAtendimento);
        return fallbackAtendimento;
    }
}

/**
 * Atualiza um atendimento
 * @param {string} id - ID do atendimento
 * @param {Object} dadosAtualizacao - Dados para atualização
 * @returns {Object|null} Atendimento atualizado ou null
 */
export async function atualizarAtendimento(id, dadosAtualizacao) {
    try {
        const dadosComTimestamp = {
            ...dadosAtualizacao,
            updated_at: new Date().toISOString()
        };
        
        const atendimentoAtualizado = await database.updateAtendimento(id, dadosComTimestamp);
        
        if (!atendimentoAtualizado) {
            throw new Error(`Atendimento com ID ${id} não foi encontrado ou não pôde ser atualizado`);
        }
        
        // Atualiza o cache local
        const index = atendimentos.findIndex(atendimento => atendimento.id === id);
        if (index !== -1) {
            atendimentos[index] = atendimentoAtualizado;
        }
        
        return atendimentoAtualizado;
    } catch (error) {
        console.error('❌ Erro ao atualizar atendimento no banco de dados:', error);
        
        // Verificar se o atendimento existe no cache local
        const index = atendimentos.findIndex(atendimento => atendimento.id === id);
        if (index === -1) {
            throw new Error(`Atendimento com ID ${id} não foi encontrado`);
        }
        
        // Fallback: tentar atualizar apenas no cache local
        try {
            atendimentos[index] = {
                ...atendimentos[index],
                ...dadosAtualizacao,
                updated_at: new Date().toISOString()
            };
            console.warn('Atualização realizada apenas no cache local devido a erro no banco de dados');
            return atendimentos[index];
        } catch (cacheError) {
            console.error('Erro ao atualizar cache local:', cacheError);
            throw new Error(`Erro ao atualizar status do atendimento: ${error.message}`);
        }
    }
}

/**
 * Exclui um atendimento
 * @param {string} id - ID do atendimento
 * @returns {boolean} True se excluído com sucesso
 */
export async function excluirAtendimento(id) {
    try {
        const sucesso = await database.deleteAtendimento(id);
        
        if (sucesso) {
            // Remove do cache local
            const index = atendimentos.findIndex(atendimento => atendimento.id === id);
            if (index !== -1) {
                atendimentos.splice(index, 1);
            }
        }
        
        return sucesso;
    } catch (error) {
        console.error('❌ Erro ao excluir atendimento do banco de dados:', error);
        
        // Fallback para cache local
        const index = atendimentos.findIndex(atendimento => atendimento.id === id);
        
        if (index === -1) {
            return false;
        }

        atendimentos.splice(index, 1);
        return true;
    }
}

/**
 * Filtra atendimentos por status
 * @param {string} status - Status para filtrar
 * @returns {Array} Atendimentos filtrados
 */
export async function getAtendimentosByStatus(status) {
    try {
        const atendimentosStatus = await database.getAtendimentosByStatus(status);
        return atendimentosStatus;
    } catch (error) {
        console.error('❌ Erro ao obter atendimentos por status do banco de dados:', error);
        
        // Fallback para cache local
        return atendimentos.filter(atendimento => 
            atendimento.status.toLowerCase() === status.toLowerCase()
        );
    }
}

/**
 * Filtra atendimentos por prioridade
 * @param {string} priority - Prioridade para filtrar
 * @returns {Array} Atendimentos filtrados
 */
export async function getAtendimentosByPriority(priority) {
    try {
        const atendimentosPrioridade = await database.getAtendimentosByPrioridade(priority);
        return atendimentosPrioridade;
    } catch (error) {
        console.error('❌ Erro ao obter atendimentos por prioridade do banco de dados:', error);
        
        // Fallback para cache local
        return atendimentos.filter(atendimento => 
            atendimento.priority?.toLowerCase() === priority.toLowerCase() ||
            atendimento.prioridade?.toLowerCase() === priority.toLowerCase()
        );
    }
}

/**
 * Busca atendimentos por texto (título ou descrição)
 * @param {string} searchTerm - Termo de busca
 * @returns {Array} Atendimentos encontrados
 */
export async function searchAtendimentos(searchTerm) {
    try {
        if (!searchTerm) {
            return await obterAtendimentos();
        }
        
        const atendimentosEncontrados = await database.searchAtendimentos(searchTerm);
        return atendimentosEncontrados;
    } catch (error) {
        console.error('❌ Erro ao buscar atendimentos no banco de dados:', error);
        
        // Fallback para cache local
        if (!searchTerm) return atendimentos;
        
        const term = searchTerm.toLowerCase();
        return atendimentos.filter(atendimento => 
            atendimento.title?.toLowerCase().includes(term) ||
            atendimento.description?.toLowerCase().includes(term) ||
            atendimento.client?.toLowerCase().includes(term) ||
            atendimento.technician?.toLowerCase().includes(term) ||
            atendimento.cliente?.toLowerCase().includes(term) ||
            atendimento.problema?.toLowerCase().includes(term) ||
            atendimento.empresa?.toLowerCase().includes(term)
        );
    }
}

/**
 * Obtém estatísticas dos atendimentos
 * @returns {Object} Estatísticas
 */
export function getAtendimentoStats() {
    const total = atendimentos.length;
    const statusCount = {
        'Aberto': atendimentos.filter(t => t.status === 'Aberto').length,
        'Em Andamento': atendimentos.filter(t => t.status === 'Em Andamento').length,
        'Resolvido': atendimentos.filter(t => t.status === 'Resolvido').length
    };
    
    const priorityCount = {
        'Crítica': atendimentos.filter(t => t.priority === 'Crítica').length,
        'Alta': atendimentos.filter(t => t.priority === 'Alta').length,
        'Média': atendimentos.filter(t => t.priority === 'Média').length,
        'Baixa': atendimentos.filter(t => t.priority === 'Baixa').length
    };

    return {
        total,
        statusCount,
        priorityCount
    };
}

/**
 * Valida dados de um atendimento para criação (todos os campos obrigatórios)
 * @param {Object} atendimentoData - Dados do atendimento
 * @returns {Object} Resultado da validação
 */
export function validateAtendimentoData(atendimentoData) {
    const errors = [];

    // Verificar título/problema
    const title = atendimentoData.title || atendimentoData.problema;
    if (!title || title.trim().length === 0) {
        errors.push('Título/Problema é obrigatório');
    }

    // Verificar descrição
    const description = atendimentoData.description || atendimentoData.descricao;
    if (!description || description.trim().length === 0) {
        errors.push('Descrição é obrigatória');
    }

    // Verificar cliente
    const client = atendimentoData.client || atendimentoData.cliente;
    if (!client || client.trim().length === 0) {
        errors.push('Cliente é obrigatório');
    }

    // Validar prioridades (aceitar ambos os formatos)
    const validPriorities = ['Baixa', 'Média', 'Alta', 'Crítica', 'baixa', 'media', 'alta', 'urgente'];
    const priority = atendimentoData.priority || atendimentoData.prioridade;
    if (priority && !validPriorities.includes(priority)) {
        errors.push('Prioridade inválida');
    }

    // Validar status (aceitar ambos os formatos)
    const validStatuses = ['Aberto', 'Em Andamento', 'Resolvido', 'em-andamento', 'resolvido'];
    const status = atendimentoData.status;
    if (status && !validStatuses.includes(status)) {
        errors.push('Status inválido');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Valida dados de um atendimento para atualização (campos opcionais)
 * @param {Object} updateData - Dados de atualização
 * @returns {Object} Resultado da validação
 */
export function validateAtendimentoUpdateData(updateData) {
    const errors = [];

    // Validar prioridades se fornecida
    const validPriorities = ['Baixa', 'Média', 'Alta', 'Crítica', 'baixa', 'media', 'alta', 'urgente'];
    const priority = updateData.priority || updateData.prioridade;
    if (priority && !validPriorities.includes(priority)) {
        errors.push('Prioridade inválida');
    }

    // Validar status se fornecido
    const validStatuses = ['Aberto', 'Em Andamento', 'Resolvido', 'em-andamento', 'resolvido'];
    const status = updateData.status;
    if (status && !validStatuses.includes(status)) {
        errors.push('Status inválido');
    }

    // Validar campos de texto se fornecidos
    const title = updateData.title || updateData.problema;
    if (title !== undefined && title.trim().length === 0) {
        errors.push('Título/Problema não pode estar vazio');
    }

    const description = updateData.description || updateData.descricao;
    if (description !== undefined && description.trim().length === 0) {
        errors.push('Descrição não pode estar vazia');
    }

    const client = updateData.client || updateData.cliente;
    if (client !== undefined && client.trim().length === 0) {
        errors.push('Cliente não pode estar vazio');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}