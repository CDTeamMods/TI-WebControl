/**
 * 🛠️ Módulo de Utilitários - TecSave
 * Funções auxiliares para formatação, validação e operações comuns
 */

/**
 * Formata data para o padrão brasileiro
 * @param {Date|string} date - Data para formatar
 * @returns {string} Data formatada
 */
export function formatDateBR(date) {
    if (!date) return 'N/A';
    
    try {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('pt-BR');
    } catch (error) {
        console.error('❌ Erro ao formatar data:', error);
        return 'Data inválida';
    }
}

/**
 * Formata data e hora para o padrão brasileiro
 * @param {Date|string} date - Data para formatar
 * @returns {string} Data e hora formatadas
 */
export function formatDateTimeBR(date) {
    if (!date) return 'N/A';
    
    try {
        const dateObj = new Date(date);
        return dateObj.toLocaleString('pt-BR');
    } catch (error) {
        console.error('❌ Erro ao formatar data/hora:', error);
        return 'Data inválida';
    }
}

/**
 * Valida se um email é válido
 * @param {string} email - Email para validar
 * @returns {boolean} True se válido
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Valida se um telefone brasileiro é válido
 * @param {string} phone - Telefone para validar
 * @returns {boolean} True se válido
 */
export function isValidPhoneBR(phone) {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Verifica se tem 10 ou 11 dígitos (com DDD)
    return cleanPhone.length === 10 || cleanPhone.length === 11;
}

/**
 * Formata telefone brasileiro
 * @param {string} phone - Telefone para formatar
 * @returns {string} Telefone formatado
 */
export function formatPhoneBR(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 10) {
        return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (cleanPhone.length === 11) {
        return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
}

/**
 * Capitaliza primeira letra de cada palavra
 * @param {string} text - Texto para capitalizar
 * @returns {string} Texto capitalizado
 */
export function capitalizeWords(text) {
    if (!text) return '';
    
    return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Remove acentos de uma string
 * @param {string} text - Texto para remover acentos
 * @returns {string} Texto sem acentos
 */
export function removeAccents(text) {
    if (!text) return '';
    
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Gera um ID único simples
 * @returns {string} ID único
 */
export function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Trunca texto com reticências
 * @param {string} text - Texto para truncar
 * @param {number} maxLength - Tamanho máximo
 * @returns {string} Texto truncado
 */
export function truncateText(text, maxLength = 100) {
    if (!text) return '';
    
    if (text.length <= maxLength) {
        return text;
    }
    
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Converte string para slug (URL amigável)
 * @param {string} text - Texto para converter
 * @returns {string} Slug
 */
export function createSlug(text) {
    if (!text) return '';
    
    return removeAccents(text)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
}

/**
 * Valida se uma string não está vazia
 * @param {string} value - Valor para validar
 * @returns {boolean} True se não estiver vazia
 */
export function isNotEmpty(value) {
    return value && value.toString().trim().length > 0;
}

/**
 * Sanitiza entrada de texto removendo caracteres perigosos
 * @param {string} text - Texto para sanitizar
 * @returns {string} Texto sanitizado
 */
export function sanitizeText(text) {
    if (!text) return '';
    
    return text
        .replace(/[<>]/g, '') // Remove < e >
        .replace(/javascript:/gi, '') // Remove javascript:
        .replace(/on\w+=/gi, '') // Remove eventos on*=
        .trim();
}

/**
 * Formata número com separadores de milhares
 * @param {number} number - Número para formatar
 * @returns {string} Número formatado
 */
export function formatNumber(number) {
    if (isNaN(number)) return '0';
    
    return number.toLocaleString('pt-BR');
}

/**
 * Calcula diferença em dias entre duas datas
 * @param {Date|string} date1 - Primeira data
 * @param {Date|string} date2 - Segunda data
 * @returns {number} Diferença em dias
 */
export function daysDifference(date1, date2) {
    try {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
        console.error('❌ Erro ao calcular diferença de dias:', error);
        return 0;
    }
}

/**
 * Obtém emoji baseado na prioridade
 * @param {string} priority - Prioridade do ticket
 * @returns {string} Emoji correspondente
 */
export function getPriorityEmoji(priority) {
    const emojiMap = {
        'Crítica': '🔴',
        'Alta': '🟡',
        'Média': '🔵',
        'Baixa': '🟢'
    };
    
    return emojiMap[priority] || '⚪';
}

/**
 * Obtém emoji baseado no status
 * @param {string} status - Status do ticket
 * @returns {string} Emoji correspondente
 */
export function getStatusEmoji(status) {
    const emojiMap = {
        'Aberto': '🆕',
        'Em Andamento': '⏳',
        'Resolvido': '✅',
        'Fechado': '🔒'
    };
    
    return emojiMap[status] || '❓';
}

/**
 * Gera cor hexadecimal baseada no status
 * @param {string} status - Status do ticket
 * @returns {string} Cor hexadecimal
 */
export function getStatusColor(status) {
    const colorMap = {
        'Aberto': '#dc3545',      // Vermelho
        'Em Andamento': '#007bff', // Azul
        'Resolvido': '#28a745',   // Verde
        'Fechado': '#6c757d'      // Cinza
    };
    
    return colorMap[status] || '#6c757d';
}

/**
 * Gera cor hexadecimal baseada na prioridade
 * @param {string} priority - Prioridade do ticket
 * @returns {string} Cor hexadecimal
 */
export function getPriorityColor(priority) {
    const colorMap = {
        'Crítica': '#dc3545',  // Vermelho
        'Alta': '#ffc107',     // Amarelo
        'Média': '#17a2b8',    // Azul claro
        'Baixa': '#28a745'     // Verde
    };
    
    return colorMap[priority] || '#6c757d';
}

/**
 * Log formatado com timestamp
 * @param {string} message - Mensagem para log
 * @param {string} type - Tipo do log (info, error, success, warning)
 */
export function logWithTimestamp(message, type = 'info') {
    const timestamp = new Date().toLocaleString('pt-BR');
    const emoji = {
        info: 'ℹ️',
        error: '❌',
        success: '✅',
        warning: '⚠️'
    };
    
    console.log(`${emoji[type] || 'ℹ️'} [${timestamp}] ${message}`);
}