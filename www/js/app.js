// Sistema de Suporte TecSave
class TecSaveApp {
    constructor() {
        this.atendimentos = JSON.parse(localStorage.getItem('tecsave_atendimentos')) || [];
        this.currentSection = 'dashboard';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadWebsiteName();
        this.loadDashboard();
        this.loadAtendimentos();
        
        // Verificar se está rodando no Cordova
        if (window.cordova) {
            document.addEventListener('deviceready', () => {
                console.log('📱 Cordova carregado com sucesso!');
                this.setupMobileFeatures();
            });
        }
    }

    setupEventListeners() {
        // Menu mobile hambúrguer
        this.setupMobileMenu();
        
        // Navegação
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.closest('.nav-btn').dataset.section;
                this.showSection(section);
                // Fechar menu mobile após seleção
                this.closeMobileMenu();
            });
        });

        // Formulário de atendimento
        const atendimentoForm = document.getElementById('atendimento-form');
        if (atendimentoForm) {
            atendimentoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createAtendimento();
            });
        }

        // Filtros de atendimentos
        const filterStatus = document.getElementById('filter-status');
        const filterPriority = document.getElementById('filter-priority');
        
        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.filterAtendimentos());
        }
        
        if (filterPriority) {
            filterPriority.addEventListener('change', () => this.filterAtendimentos());
        }
    }

    setupMobileFeatures() {
        // Funcionalidades específicas para mobile
        console.log('🔧 Configurando funcionalidades mobile...');
        
        // Adicionar suporte a vibração para notificações
        if (navigator.vibrate) {
            console.log('📳 Suporte à vibração disponível');
        }
        
        // Configurar orientação da tela
        if (screen.orientation) {
            console.log('🔄 Controle de orientação disponível');
        }
        
        // Configurar Hot Code Push
        this.setupHotCodePush();
    }
    
    setupHotCodePush() {
        if (!window.chcp) {
            console.log('⚠️ Hot Code Push não disponível');
            return;
        }
        
        console.log('🔄 Inicializando Hot Code Push...');
        
        // Verificar atualizações automaticamente
        chcp.fetchUpdate((error, data) => {
            if (error) {
                console.log('❌ Erro ao verificar atualizações:', error.description);
                return;
            }
            
            console.log('✅ Atualização disponível:', data);
            this.showNotification('Nova atualização disponível! 🚀', 'info');
            
            // Instalar automaticamente
            chcp.installUpdate((error) => {
                if (error) {
                    console.log('❌ Erro ao instalar atualização:', error.description);
                    this.showNotification('Erro ao instalar atualização', 'error');
                    return;
                }
                
                console.log('✅ Atualização instalada com sucesso!');
                this.showNotification('Atualização instalada! Reiniciando...', 'success');
                
                // Reiniciar após 2 segundos
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            });
        });
        
        // Listener para eventos de atualização
        document.addEventListener('chcp_updateIsReadyToInstall', () => {
            console.log('📦 Atualização pronta para instalar');
            this.showNotification('Atualização baixada! Instalando...', 'info');
        });
        
        document.addEventListener('chcp_updateLoadFailed', (eventData) => {
            console.log('❌ Falha ao carregar atualização:', eventData.detail.error);
            this.showNotification('Falha ao carregar atualização', 'error');
        });
        
        document.addEventListener('chcp_nothingToUpdate', () => {
            console.log('✅ App está atualizado');
        });
    }

    showSection(sectionName) {
        // Remover classe active de todas as seções
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remover classe active de todos os botões
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Mostrar seção selecionada
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Ativar botão correspondente
        const targetBtn = document.querySelector(`[data-section="${sectionName}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
        
        this.currentSection = sectionName;
        
        // Carregar dados específicos da seção
        if (sectionName === 'dashboard') {
            this.loadDashboard();
        } else if (sectionName === 'atendimentos') {
            this.loadAtendimentos();
        }
    }

    async loadWebsiteName() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            
            // Atualizar o título da página
            document.title = config.websiteName;
            
            // Atualizar o título no cabeçalho se existir
            const headerTitle = document.querySelector('.header h1');
            if (headerTitle) {
                headerTitle.textContent = config.websiteName;
            }
        } catch (error) {
            console.error('❌ Erro ao carregar configurações:', error);
            // Usar título padrão em caso de erro
            document.title = 'Sistema de Atendimento';
        }
    }

    loadDashboard() {
        const totalAtendimentos = this.atendimentos.filter(a => a.status !== 'resolvido').length;
        const urgentAtendimentos = this.atendimentos.filter(a => a.prioridade === 'urgente' && a.status !== 'resolvido').length;
        const completedToday = this.atendimentos.filter(a => {
            const today = new Date().toDateString();
            const atendimentoDate = new Date(a.dataResolucao || '').toDateString();
            return a.status === 'resolvido' && atendimentoDate === today;
        }).length;

        // Atualizar estatísticas
        document.getElementById('total-atendimentos').textContent = totalAtendimentos;
        document.getElementById('urgent-atendimentos').textContent = urgentAtendimentos;
        document.getElementById('completed-atendimentos').textContent = completedToday;

        // Carregar atividade recente
        this.loadRecentActivity();
    }

    loadRecentActivity() {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;

        const recentAtendimentos = this.atendimentos
            .sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao))
            .slice(0, 5);

        if (recentAtendimentos.length === 0) {
            activityList.innerHTML = '<p style="color: #7f8c8d; text-align: center;">Nenhuma atividade recente</p>';
            return;
        }

        activityList.innerHTML = recentAtendimentos.map(atendimento => `
            <div class="activity-item">
                <strong>${atendimento.cliente}</strong> - ${atendimento.problema}
                <br>
                <small style="color: #7f8c8d;">
                    ${this.formatDate(atendimento.dataCriacao)} - 
                    <span class="priority-${atendimento.prioridade}">${atendimento.prioridade.toUpperCase()}</span>
                </small>
            </div>
        `).join('');
    }

    createAtendimento() {
        const form = document.getElementById('atendimento-form');
        const formData = new FormData(form);
        
        const atendimento = {
            id: Date.now().toString(),
            cliente: formData.get('cliente'),
            problema: formData.get('problema'),
            prioridade: formData.get('prioridade'),
            descricao: formData.get('descricao'),
            status: 'aberto',
            dataCriacao: new Date().toISOString(),
            dataResolucao: null
        };

        this.atendimentos.push(atendimento);
        this.saveAtendimentos();
        
        // Mostrar mensagem de sucesso
        this.showNotification('✅ Atendimento criado com sucesso!', 'success');
        
        // Limpar formulário
        form.reset();
        
        // Voltar para dashboard
        this.showSection('dashboard');
        
        // Vibrar no mobile se disponível
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
    }

    loadAtendimentos() {
        const atendimentosList = document.getElementById('atendimentos-list');
        if (!atendimentosList) return;

        if (this.atendimentos.length === 0) {
            atendimentosList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #7f8c8d;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>Nenhum atendimento encontrado</p>
                    <p>Crie seu primeiro atendimento para começar!</p>
                </div>
            `;
            return;
        }

        this.renderAtendimentos(this.atendimentos);
    }

    renderAtendimentos(atendimentos) {
        const atendimentosList = document.getElementById('atendimentos-list');
        
        atendimentosList.innerHTML = atendimentos.map(atendimento => `
            <div class="atendimento-item">
                <div class="atendimento-header">
                    <div>
                        <span class="atendimento-id">#${atendimento.id}</span>
                        <h4>${atendimento.cliente}</h4>
                    </div>
                    <span class="atendimento-priority priority-${atendimento.prioridade}">
                        ${atendimento.prioridade}
                    </span>
                </div>
                <div class="atendimento-content">
                    <p><strong>Problema:</strong> ${atendimento.problema}</p>
                    <p><strong>Descrição:</strong> ${atendimento.descricao}</p>
                    <p><strong>Status:</strong> ${atendimento.status}</p>
                    <p><strong>Data:</strong> ${this.formatDate(atendimento.dataCriacao)}</p>
                </div>
                <div class="atendimento-actions" style="margin-top: 1rem;">
                    ${atendimento.status !== 'resolvido' ? `
                        <button onclick="app.updateAtendimentoStatus('${atendimento.id}', 'em-andamento')" 
                                class="btn-action" style="background: #f39c12; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; margin-right: 0.5rem; cursor: pointer;">
                            Em Andamento
                        </button>
                        <button onclick="app.updateAtendimentoStatus('${atendimento.id}', 'resolvido')" 
                                class="btn-action" style="background: #27ae60; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; margin-right: 0.5rem; cursor: pointer;">
                            Resolver
                        </button>
                    ` : ''}
                    <button onclick="app.deleteAtendimento('${atendimento.id}')" 
                            class="btn-action" style="background: #e74c3c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">
                        Excluir
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterAtendimentos() {
        const statusFilter = document.getElementById('filter-status').value;
        const priorityFilter = document.getElementById('filter-priority').value;
        
        let filteredAtendimentos = this.atendimentos;
        
        if (statusFilter) {
            filteredAtendimentos = filteredAtendimentos.filter(atendimento => atendimento.status === statusFilter);
        }
        
        if (priorityFilter) {
            filteredAtendimentos = filteredAtendimentos.filter(atendimento => atendimento.prioridade === priorityFilter);
        }
        
        this.renderAtendimentos(filteredAtendimentos);
    }

    updateAtendimentoStatus(atendimentoId, newStatus) {
        const atendimento = this.atendimentos.find(a => a.id === atendimentoId);
        if (atendimento) {
            atendimento.status = newStatus;
            if (newStatus === 'resolvido') {
                atendimento.dataResolucao = new Date().toISOString();
            }
            this.saveAtendimentos();
            this.loadAtendimentos();
            this.loadDashboard();
            this.showNotification(`✅ Atendimento ${newStatus}!`, 'success');
        }
    }

    deleteAtendimento(atendimentoId) {
        if (confirm('Tem certeza que deseja excluir este atendimento?')) {
            this.atendimentos = this.atendimentos.filter(a => a.id !== atendimentoId);
            this.saveAtendimentos();
            this.loadAtendimentos();
            this.loadDashboard();
            this.showNotification('🗑️ Atendimento excluído!', 'info');
        }
    }

    saveAtendimentos() {
        localStorage.setItem('tecsave_atendimentos', JSON.stringify(this.atendimentos));
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        // Adicionar CSS da animação se não existir
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.remove();
        }, 3000);
        
        // Vibrar no mobile se disponível
        if (window.cordova && navigator.vibrate) {
            navigator.vibrate(200);
        }
    }

    // Função para exportar tickets para Excel
    async exportAtendimentosToExcel() {
        try {
            this.showNotification('📊 Gerando arquivo Excel...', 'info');
            
            const response = await fetch('/api/atendimentos/export');
            
            if (!response.ok) {
                throw new Error('Erro ao gerar arquivo Excel');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Criar link para download
            const a = document.createElement('a');
            a.href = url;
            a.download = `atendimentos_tecsave_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            
            // Limpar
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showNotification('✅ Arquivo Excel baixado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao exportar Excel:', error);
            this.showNotification('❌ Erro ao exportar arquivo Excel', 'error');
        }
    }



    // Ferramentas de suporte

    async showSystemInfo() {
        this.showSection('ferramentas');
        const toolResult = document.getElementById('tool-result');
        const toolOutput = document.getElementById('tool-output');
        
        if (toolResult) toolResult.style.display = 'block';
        if (toolOutput) {
            toolOutput.innerHTML = `
                <h4>💻 Informações do Sistema</h4>
                <div class="loading">🔄 Carregando informações do sistema...</div>
            `;
        }

        try {
            console.log('🔍 Iniciando requisição para /api/system-info');
            
            // Obter informações do servidor (com timestamp para evitar cache)
            const response = await fetch(`/api/system-info?t=${Date.now()}`);
            console.log('📡 Resposta recebida:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            console.log('📋 Content-Type:', contentType);
            
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Resposta não é JSON. Content-Type: ${contentType}. Conteúdo: ${text.substring(0, 200)}...`);
            }
            
            const serverInfo = await response.json();
            console.log('✅ Dados do servidor carregados:', serverInfo);
            
            // Calcular uso de memória
            const memoryUsage = ((serverInfo.totalMemory - serverInfo.freeMemory) / serverInfo.totalMemory * 100).toFixed(1);
            
            // Formatar uptime
            const uptimeHours = Math.floor(serverInfo.uptime / 3600);
            const uptimeMinutes = Math.floor((serverInfo.uptime % 3600) / 60);
            const uptimeFormatted = `${uptimeHours}h ${uptimeMinutes}m`;
            
            if (toolOutput) {
                toolOutput.innerHTML = `
                    <h4>💻 Informações do Sistema</h4>
                    <div class="system-info">
                        <div class="info-section">
                            <h5>🖥️ Sistema Operacional</h5>
                            <div class="info-item">📋 <strong>Plataforma:</strong> ${serverInfo.type} (${serverInfo.platform})</div>
                            <div class="info-item">🏗️ <strong>Arquitetura:</strong> ${serverInfo.architecture}</div>
                            <div class="info-item">📦 <strong>Versão:</strong> ${serverInfo.release}</div>
                        </div>
                        
                        <div class="info-section">
                            <h5>🖥️ Cliente (Navegador)</h5>
                            <div class="info-item">🌐 <strong>Navegador:</strong> ${navigator.userAgent.split(' ')[0]}</div>
                            <div class="info-item">📱 <strong>Mobile:</strong> ${window.cordova ? 'Sim (Cordova)' : 'Não'}</div>
                            <div class="info-item">🕒 <strong>Timezone:</strong> ${Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
                            <div class="info-item">📺 <strong>Resolução:</strong> ${screen.width}x${screen.height}</div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Erro ao carregar informações do sistema:', error);
            if (toolOutput) {
                toolOutput.innerHTML = `
                    <h4>💻 Informações do Sistema</h4>
                    <div class="error">
                        ❌ Erro ao carregar informações do sistema<br>
                        <small>Detalhes: ${error.message}</small>
                    </div>
                `;
            }
        }
    }

    // Métodos para menu mobile
    setupMobileMenu() {
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        const navOverlay = document.getElementById('nav-overlay');

        if (mobileToggle && navMenu && navOverlay) {
            // Toggle do menu
            mobileToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });

            // Fechar menu ao clicar no overlay
            navOverlay.addEventListener('click', () => {
                this.closeMobileMenu();
            });

            // Fechar menu com ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeMobileMenu();
                }
            });
        }
    }

    toggleMobileMenu() {
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        const navOverlay = document.getElementById('nav-overlay');

        if (mobileToggle && navMenu && navOverlay) {
            const isActive = navMenu.classList.contains('active');
            
            if (isActive) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        }
    }

    openMobileMenu() {
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        const navOverlay = document.getElementById('nav-overlay');

        if (mobileToggle && navMenu && navOverlay) {
            mobileToggle.classList.add('active');
            navMenu.classList.add('active');
            navOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevenir scroll
        }
    }

    closeMobileMenu() {
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        const navOverlay = document.getElementById('nav-overlay');

        if (mobileToggle && navMenu && navOverlay) {
            mobileToggle.classList.remove('active');
            navMenu.classList.remove('active');
            navOverlay.classList.remove('active');
            document.body.style.overflow = ''; // Restaurar scroll
        }
    }
}

// Inicializar aplicação
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TecSaveApp();
    console.log('🚀 TecSave App iniciado com sucesso!');
});