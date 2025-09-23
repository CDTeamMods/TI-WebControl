/**
 * 🎫 Módulo de Gerenciamento de Atendimentos - TecSave
 * Responsável por todas as operações relacionadas aos atendimentos
 */

/**
 * Dados iniciais dos atendimentos (simulando banco de dados)
 */
let atendimentos = [
    {
        id: 1,
        title: 'Problema de Conectividade',
        description: 'Cliente relatou lentidão na conexão com o servidor',
        priority: 'Alta',
        status: 'Aberto',
        client: 'Empresa ABC Ltda',
        technician: 'João Silva',
        createdAt: new Date('2024-01-15T10:30:00'),
        updatedAt: new Date('2024-01-15T10:30:00')
    },
    {
        id: 2,
        title: 'Erro no Sistema de Backup',
        description: 'Backup automático falhou na madrugada',
        priority: 'Crítica',
        status: 'Em Andamento',
        client: 'TechCorp Solutions',
        technician: 'Maria Santos',
        createdAt: new Date('2024-01-14T08:15:00'),
        updatedAt: new Date('2024-01-15T09:45:00')
    },
    {
        id: 3,
        title: 'Atualização de Software',
        description: 'Solicitação de atualização do sistema operacional',
        priority: 'Média',
        status: 'Resolvido',
        client: 'Inovação Digital',
        technician: 'Carlos Oliveira',
        createdAt: new Date('2024-01-13T14:20:00'),
        updatedAt: new Date('2024-01-14T16:30:00')
    }
];

/**
 * Obtém todos os atendimentos
 * @returns {Array} Array de atendimentos
 */
export function getAllAtendimentos() {
    return atendimentos;
}

/**
 * Obtém atendimentos formatados para exibição
 * @returns {Array} Array de atendimentos formatados
 */
export function getFormattedAtendimentos() {
    return atendimentos.map(atendimento => ({
        ...atendimento,
        createdAt: atendimento.createdAt.toLocaleDateString('pt-BR'),
        updatedAt: atendimento.updatedAt.toLocaleDateString('pt-BR')
    }));
}

/**
 * Obtém um atendimento por ID
 * @param {number} id - ID do atendimento
 * @returns {Object|null} Atendimento encontrado ou null
 */
export function getAtendimentoById(id) {
    return atendimentos.find(atendimento => atendimento.id === parseInt(id));
}

/**
 * Cria um novo atendimento
 * @param {Object} atendimentoData - Dados do novo atendimento
 * @returns {Object} Atendimento criado
 */
export function createAtendimento(atendimentoData) {
    const newAtendimento = {
        id: atendimentos.length > 0 ? Math.max(...atendimentos.map(t => t.id)) + 1 : 1,
        title: atendimentoData.title,
        description: atendimentoData.description,
        priority: atendimentoData.priority || 'Média',
        status: atendimentoData.status || 'Aberto',
        client: atendimentoData.client,
        technician: atendimentoData.technician,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    atendimentos.push(newAtendimento);
    console.log(`✅ Atendimento criado: ${newAtendimento.title} (ID: ${newAtendimento.id})`);
    return newAtendimento;
}

/**
 * Atualiza um atendimento existente
 * @param {number} id - ID do atendimento
 * @param {Object} updateData - Dados para atualizar
 * @returns {Object|null} Atendimento atualizado ou null se não encontrado
 */
export function updateAtendimento(id, updateData) {
    const atendimentoIndex = atendimentos.findIndex(atendimento => atendimento.id === parseInt(id));
    
    if (atendimentoIndex === -1) {
        return null;
    }

    atendimentos[atendimentoIndex] = {
        ...atendimentos[atendimentoIndex],
        ...updateData,
        updatedAt: new Date()
    };

    console.log(`✅ Atendimento atualizado: ID ${id}`);
    return atendimentos[atendimentoIndex];
}

/**
 * Remove um atendimento
 * @param {number} id - ID do atendimento
 * @returns {boolean} True se removido, false se não encontrado
 */
export function deleteAtendimento(id) {
    const atendimentoIndex = atendimentos.findIndex(atendimento => atendimento.id === parseInt(id));
    
    if (atendimentoIndex === -1) {
        return false;
    }

    const removedAtendimento = atendimentos.splice(atendimentoIndex, 1)[0];
    console.log(`🗑️ Atendimento removido: ${removedAtendimento.title} (ID: ${id})`);
    return true;
}

/**
 * Filtra atendimentos por status
 * @param {string} status - Status para filtrar
 * @returns {Array} Atendimentos filtrados
 */
export function getAtendimentosByStatus(status) {
    return atendimentos.filter(atendimento => 
        atendimento.status.toLowerCase() === status.toLowerCase()
    );
}

/**
 * Filtra atendimentos por prioridade
 * @param {string} priority - Prioridade para filtrar
 * @returns {Array} Atendimentos filtrados
 */
export function getAtendimentosByPriority(priority) {
    return atendimentos.filter(atendimento => 
        atendimento.priority.toLowerCase() === priority.toLowerCase()
    );
}

/**
 * Busca atendimentos por texto (título ou descrição)
 * @param {string} searchTerm - Termo de busca
 * @returns {Array} Atendimentos encontrados
 */
export function searchAtendimentos(searchTerm) {
    const term = searchTerm.toLowerCase();
    return atendimentos.filter(atendimento => 
        atendimento.title.toLowerCase().includes(term) ||
        atendimento.description.toLowerCase().includes(term) ||
        atendimento.client.toLowerCase().includes(term) ||
        atendimento.technician.toLowerCase().includes(term)
    );
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
 * Valida dados de um atendimento
 * @param {Object} atendimentoData - Dados do atendimento
 * @returns {Object} Resultado da validação
 */
export function validateAtendimentoData(atendimentoData) {
    const errors = [];

    if (!atendimentoData.title || atendimentoData.title.trim().length === 0) {
        errors.push('Título é obrigatório');
    }

    if (!atendimentoData.description || atendimentoData.description.trim().length === 0) {
        errors.push('Descrição é obrigatória');
    }

    if (!atendimentoData.client || atendimentoData.client.trim().length === 0) {
        errors.push('Cliente é obrigatório');
    }

    const validPriorities = ['Baixa', 'Média', 'Alta', 'Crítica'];
    if (atendimentoData.priority && !validPriorities.includes(atendimentoData.priority)) {
        errors.push('Prioridade inválida');
    }

    const validStatuses = ['Aberto', 'Em Andamento', 'Resolvido'];
    if (atendimentoData.status && !validStatuses.includes(atendimentoData.status)) {
        errors.push('Status inválido');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}