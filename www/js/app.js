/**
 * TIWebControlApp
 */

class TIWebControlApp {

    constructor() {
        this.atendimentos = [];
        this.user = null;
        this.init();
    }

    async init() {
        try {
            
            // Configurar interface básica
            this.setupEventListeners();
            this.setupCreateUserForm();
            
            // Carregar dados públicos (que não precisam de autenticação)
            await this.loadWebsiteName();
            
            // Verificar se há token de autenticação
            const token = localStorage.getItem('authToken');
            
            if (token) {
                try {
                    // Se há token, verificar autenticação e carregar dados protegidos
                    await this.checkAuth();
                    
                    this.setupUserInterface();
                    await this.loadProtectedData();
                } catch (authError) {
                    // Token inválido, redirecionar para login
                    window.location.href = '/login.html';
                    return;
                }
            } else {
                window.location.href = '/login.html';
                return;
            }
            
        } catch (error) {
            // Em caso de erro, redirecionar para login
            window.location.href = '/login.html';
        }
    }

    async checkAuth() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Token não encontrado');
        }

        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Token inválido');
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Token inválido');
            }
            
            this.user = data.user;
            return true;
        } catch (error) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            throw error;
        }
    }

    async loadInitialData() {
        // Carregar dados iniciais
        await this.loadWebsiteName();
        await this.loadEmpresas();
        await this.loadEmpresasFilter();
        await this.loadAtendimentos();
        this.loadDashboard();
        
        // Mostrar seção inicial
        this.showSection('dashboard');
    }

    async loadProtectedData() {
        try {
            // Carregar dados que precisam de autenticação
            await this.loadEmpresas();
            await this.loadEmpresasFilter();
            await this.loadAtendimentos();
            this.loadDashboard();
            
            // Mostrar seção inicial
            this.showSection('dashboard');
        } catch (error) {
            throw new Error(error)
        }
    }

    setupUserInterface() {
        // Mostrar informações do usuário na interface
        const userInfo = document.querySelector('.user-info');
        if (userInfo && this.user) {
            const adminBadge = this.user.isLocalAdmin ? ' 🔑' : (this.user.role === 'admin' ? ' 👑' : '');
            const adminTitle = this.user.isLocalAdmin ? 'Admin Local' : (this.user.role === 'admin' ? 'Administrador' : 'Usuário');
            
            userInfo.innerHTML = `
                <span class="user-name" title="${adminTitle}">👤 ${this.user.username}${adminBadge}</span>
                <button onclick="logout()" class="logout-btn" title="Sair">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            `;
        }

        // Mostrar aba "Criar Usuário" apenas para usuários locais
        const criarUsuarioTab = document.getElementById('nav-criar-usuario');
        if (criarUsuarioTab) {
            if (this.user && this.user.isLocalAdmin) {
                criarUsuarioTab.style.display = 'block';
            } else {
                criarUsuarioTab.style.display = 'none';
            }
        }
    }

    getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    setupEventListeners() {
        // Menu mobile hambúrguer
        this.setupMobileMenu();
        
        // Botão flutuante (FAB) para criar ticket
        this.setupFloatingActionButton();
        
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
        const filterEmpresa = document.getElementById('filter-empresa');
        
        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.filterAtendimentos());
        }
        
        if (filterPriority) {
            filterPriority.addEventListener('change', () => this.filterAtendimentos());
        }
        
        if (filterEmpresa) {
            filterEmpresa.addEventListener('change', () => this.filterAtendimentos());
        }

        // Dropdown de cliente
        const clienteSelect = document.getElementById('cliente');
        if (clienteSelect) {
            clienteSelect.addEventListener('change', (e) => this.handleClienteChange(e));
        }

        // Dropdown de problema
        const problemaSelect = document.getElementById('problema');
        if (problemaSelect) {
            problemaSelect.addEventListener('change', (e) => this.handleProblemaChange(e));
        }

        // Dropdown de empresa
        const empresaSelect = document.getElementById('empresa');
        if (empresaSelect) {
            empresaSelect.addEventListener('change', (e) => this.handleEmpresaChange(e));
        }
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
            if (response.ok) {
                const data = await response.json();
                const titleElement = document.querySelector('title');
                const headerTitle = document.querySelector('h1');
                
                if (titleElement) titleElement.textContent = data.websiteName;
                if (headerTitle) headerTitle.textContent = data.websiteName;
            } 
        } catch (error) {
            // Usar nome padrão se houver erro
            const titleElement = document.querySelector('title');
            const headerTitle = document.querySelector('h1');
            
            if (titleElement) titleElement.textContent = 'CDSuporte';
            if (headerTitle) headerTitle.textContent = 'CDSuporte';
        }
    }

    async loadClientes(empresaSelecionada = null) {
        try {
            const response = await fetch('/res/json/listaClientes.json');
            if (response.ok) {
                const data = await response.json();
                let clientes = [];
                
                if (empresaSelecionada) {
                    // Encontrar a empresa específica e seus clientes
                    const empresaData = data.find(item => item.empresa === empresaSelecionada);
                    if (empresaData) {
                        clientes = empresaData.clientes;
                    }
                } else {
                    // Se nenhuma empresa for especificada, carregar todos os clientes
                    clientes = data.flatMap(item => item.clientes);
                }
                
                this.populateClienteDropdown(clientes);
            } else {
                this.populateClienteDropdown(['Cliente não encontrado']);
            }
        } catch (error) {
            this.populateClienteDropdown(['Erro ao carregar clientes']);
        }
    }

    populateClienteDropdown(clientes) {
        const clienteSelect = document.getElementById('cliente');
        if (!clienteSelect) return;

        // Limpar opções existentes (exceto a primeira)
        clienteSelect.innerHTML = '<option value="">Selecione o cliente</option>';

        // Adicionar opções dos clientes
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente;
            option.textContent = cliente;
            clienteSelect.appendChild(option);
        });

        // Adicionar opção para "Outro" no final
        const optionOutro = document.createElement('option');
        optionOutro.value = 'outro';
        optionOutro.textContent = '➕ Outro (especificar)';
        clienteSelect.appendChild(optionOutro);
    }

    async loadEmpresas() {
        try {
            const response = await fetch('/res/json/listaClientes.json');
            if (response.ok) {
                const data = await response.json();
                // Extrair apenas os nomes das empresas
                const empresas = data.map(item => item.empresa);
                this.populateEmpresaDropdown(empresas);
                // Armazenar dados completos para uso posterior
                this.empresasData = data;
            }
        } catch (error) {
            throw new Error(error)
        }
    }

    populateEmpresaDropdown(empresas) {
        const empresaSelect = document.getElementById('empresa');
        if (!empresaSelect) return;

        // Limpar opções existentes (exceto a primeira)
        empresaSelect.innerHTML = '<option value="">Selecione a empresa</option>';

        // Adicionar opções das empresas
        empresas.forEach(empresa => {
            const option = document.createElement('option');
            option.value = empresa;
            option.textContent = empresa;
            empresaSelect.appendChild(option);
        });

        // Adicionar opção "Outro"
        const outroOption = document.createElement('option');
        outroOption.value = 'outro';
        outroOption.textContent = 'Outro (especificar)';
        empresaSelect.appendChild(outroOption);
    }

    async loadEmpresasFilter() {
        try {
            const response = await fetch('/res/json/listaClientes.json');
            if (response.ok) {
                const data = await response.json();
                // Extrair apenas os nomes das empresas
                const empresas = data.map(item => item.empresa);
                this.populateEmpresaFilter(empresas);
            } else {
            }
        } catch (error) {
            throw new Error(error)
        }
    }

    populateEmpresaFilter(empresas) {
        const empresaSelect = document.getElementById('filter-empresa');
        if (!empresaSelect) return;

        // Limpar opções existentes (exceto a primeira)
        empresaSelect.innerHTML = '<option value="">Todas as Empresas</option>';

        // Adicionar opções das empresas
        empresas.forEach(empresa => {
            const option = document.createElement('option');
            option.value = empresa;
            option.textContent = empresa;
            empresaSelect.appendChild(option);
        });
    }

    handleClienteChange(event) {
        const clienteCustom = document.getElementById('cliente-custom');
        if (!clienteCustom) return;

        if (event.target.value === 'outro') {
            clienteCustom.style.display = 'block';
            clienteCustom.required = true;
            clienteCustom.focus();
        } else {
            clienteCustom.style.display = 'none';
            clienteCustom.required = false;
            clienteCustom.value = '';
        }
    }

    handleProblemaChange(event) {
        const selectedValue = event.target.value;
        const customField = document.getElementById('problema-custom');
        
        if (selectedValue === 'outro') {
            customField.style.display = 'block';
            customField.required = true;
        } else {
            customField.style.display = 'none';
            customField.required = false;
            customField.value = '';
        }
    }

    handleEmpresaChange(event) {
        const selectedValue = event.target.value;
        const customField = document.getElementById('empresa-custom');
        const clienteSelect = document.getElementById('cliente');
        
        if (selectedValue === 'outro') {
            customField.style.display = 'block';
            customField.required = true;
            // Habilitar campo cliente e carregar todos os clientes quando "Outro" for selecionado
            clienteSelect.disabled = false;
            clienteSelect.innerHTML = '<option value="">Selecione o cliente</option>';
            this.loadClientes();
        } else {
            customField.style.display = 'none';
            customField.required = false;
            customField.value = '';
            
            if (selectedValue) {
                // Habilitar campo cliente e carregar clientes da empresa selecionada
                clienteSelect.disabled = false;
                clienteSelect.innerHTML = '<option value="">Selecione o cliente</option>';
                this.loadClientes(selectedValue);
            } else {
                // Se nenhuma empresa for selecionada, desabilitar o dropdown de clientes
                clienteSelect.disabled = true;
                clienteSelect.innerHTML = '<option value="">Primeiro selecione uma empresa</option>';
                this.populateClienteDropdown([]);
            }
        }
    }

    loadDashboard() {
        // Garantir que this.atendimentos seja um array válido
        if (!Array.isArray(this.atendimentos)) {
            this.atendimentos = [];
        }

        const totalAtendimentos = this.atendimentos.filter(a => a.status !== 'resolvido').length;
        const urgentAtendimentos = this.atendimentos.filter(a => a.prioridade === 'urgente' && a.status !== 'resolvido').length;
        const completedToday = this.atendimentos.filter(a => {
            if (a.status !== 'resolvido' || !a.dataResolucao) return false;
            
            const today = new Date().toDateString();
            const resolucaoDate = new Date(a.dataResolucao);
            
            // Verificar se a data de resolução é válida
            if (isNaN(resolucaoDate.getTime())) return false;
            
            return resolucaoDate.toDateString() === today;
        }).length;

        // Atualizar estatísticas
        document.getElementById('total-atendimentos').textContent = totalAtendimentos;
        document.getElementById('urgent-atendimentos').textContent = urgentAtendimentos;
        document.getElementById('completed-atendimentos').textContent = completedToday;

        // Carregar atividade recente e atendimentos atrasados
        this.loadRecentActivity();
        this.loadOverdueActivity();
    }

    loadRecentActivity() {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;

        // Garantir que this.atendimentos seja um array válido
        if (!Array.isArray(this.atendimentos)) {
            this.atendimentos = [];
        }

        // Obter data atual (início do dia)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Obter final do dia atual
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        // Filtrar apenas atendimentos não resolvidos do dia atual
        const recentAtendimentos = this.atendimentos
            .filter(atendimento => {
                // Verificar se o status não é "resolvido" ou "concluído"
                const status = (atendimento.status || '').toLowerCase();
                const isNotResolved = !['resolvido', 'concluído', 'finalizado', 'fechado'].includes(status);
                
                if (!isNotResolved) return false;

                // Verificar se foi criado hoje
                const getValidDate = (atendimento) => {
                    const possibleDates = [
                        atendimento.dataCriacao,
                        atendimento.created_at,
                        atendimento.createdAt
                    ];
                    
                    for (const dateStr of possibleDates) {
                        if (dateStr) {
                            const date = new Date(dateStr);
                            if (!isNaN(date.getTime())) {
                                return date;
                            }
                        }
                    }
                    
                    return null;
                };

                const createdDate = getValidDate(atendimento);
                if (!createdDate) return false;

                // Verificar se foi criado hoje
                return createdDate >= today && createdDate <= endOfToday;
            })
            .sort((a, b) => {
                const getValidDate = (atendimento) => {
                    const possibleDates = [
                        atendimento.dataCriacao,
                        atendimento.created_at,
                        atendimento.createdAt
                    ];
                    
                    for (const dateStr of possibleDates) {
                        if (dateStr) {
                            const date = new Date(dateStr);
                            if (!isNaN(date.getTime())) {
                                return date;
                            }
                        }
                    }
                    
                    return new Date();
                };
                
                const dateA = getValidDate(a);
                const dateB = getValidDate(b);
                
                return dateB - dateA;
            })
            .slice(0, 5);

        if (recentAtendimentos.length === 0) {
            activityList.innerHTML = '<div class="activity-empty">📭 Nenhuma atividade recente de hoje</div>';
            return;
        }

        activityList.innerHTML = recentAtendimentos.map(atendimento => {
            // Garantir que temos uma data válida para exibição
            const getDisplayDate = (atendimento) => {
                const possibleDates = [
                    atendimento.dataCriacao,
                    atendimento.created_at,
                    atendimento.createdAt
                ];
                
                for (const dateStr of possibleDates) {
                    if (dateStr) {
                        const date = new Date(dateStr);
                        if (!isNaN(date.getTime())) {
                            return this.formatDate(dateStr);
                        }
                    }
                }
                
                return 'Agora mesmo';
            };

            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        ${this.getStatusIcon(atendimento.status)}
                    </div>
                    <div class="activity-item-content">
                        <div class="activity-details">
                            <div class="activity-title">
                                <strong>👤 ${atendimento.cliente || 'Cliente não informado'}</strong>
                            </div>
                            <div class="activity-description">
                                🏢 ${atendimento.empresa || 'Empresa não informada'} • 🔧 ${this.formatProblema(atendimento.problema)}
                            </div>
                        </div>
                        <div class="activity-time">
                            ⏰ ${getDisplayDate(atendimento)}
                        </div>
                        <div class="activity-priority priority-${atendimento.prioridade || 'media'}">
                            ${this.getPriorityIcon(atendimento.prioridade)} ${(atendimento.prioridade || 'media').toUpperCase()}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    loadOverdueActivity() {
        const overdueList = document.getElementById('overdue-list');
        if (!overdueList) return;

        // Garantir que this.atendimentos seja um array válido
        if (!Array.isArray(this.atendimentos)) {
            this.atendimentos = [];
        }

        // Obter data atual (início do dia)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filtrar atendimentos em andamento de dias anteriores (atrasados)
        const overdueAtendimentos = this.atendimentos
            .filter(atendimento => {
                // Verificar se o status é "em andamento" ou similar
                const status = (atendimento.status || '').toLowerCase();
                const isInProgress = ['em andamento', 'pendente', 'aberto', 'aguardando'].includes(status);
                
                if (!isInProgress) return false;

                // Verificar se foi criado antes de hoje
                const getValidDate = (atendimento) => {
                    const possibleDates = [
                        atendimento.dataCriacao,
                        atendimento.created_at,
                        atendimento.createdAt
                    ];
                    
                    for (const dateStr of possibleDates) {
                        if (dateStr) {
                            const date = new Date(dateStr);
                            if (!isNaN(date.getTime())) {
                                return date;
                            }
                        }
                    }
                    
                    return null;
                };

                const createdDate = getValidDate(atendimento);
                if (!createdDate) return false;

                // Verificar se foi criado antes de hoje
                return createdDate < today;
            })
            .sort((a, b) => {
                const getValidDate = (atendimento) => {
                    const possibleDates = [
                        atendimento.dataCriacao,
                        atendimento.created_at,
                        atendimento.createdAt
                    ];
                    
                    for (const dateStr of possibleDates) {
                        if (dateStr) {
                            const date = new Date(dateStr);
                            if (!isNaN(date.getTime())) {
                                return date;
                            }
                        }
                    }
                    
                    return new Date();
                };
                
                const dateA = getValidDate(a);
                const dateB = getValidDate(b);
                
                // Ordenar do mais antigo para o mais recente (priorizar mais atrasados)
                return dateA - dateB;
            })
            .slice(0, 5);

        if (overdueAtendimentos.length === 0) {
            overdueList.innerHTML = '<div class="activity-empty">✅ Nenhum atendimento atrasado</div>';
            return;
        }

        overdueList.innerHTML = overdueAtendimentos.map(atendimento => {
            // Calcular quantos dias está atrasado
            const getValidDate = (atendimento) => {
                const possibleDates = [
                    atendimento.dataCriacao,
                    atendimento.created_at,
                    atendimento.createdAt
                ];
                
                for (const dateStr of possibleDates) {
                    if (dateStr) {
                        const date = new Date(dateStr);
                        if (!isNaN(date.getTime())) {
                            return date;
                        }
                    }
                }
                
                return new Date();
            };

            const createdDate = getValidDate(atendimento);
            const daysDiff = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
            const daysText = daysDiff === 1 ? '1 dia' : `${daysDiff} dias`;

            return `
                <div class="activity-item overdue-item">
                    <div class="activity-icon">
                        ⚠️
                    </div>
                    <div class="activity-item-content">
                        <div class="activity-details">
                            <div class="activity-title">
                                <strong>👤 ${atendimento.cliente || 'Cliente não informado'}</strong>
                                <span class="overdue-badge">🕐 ${daysText} atrasado</span>
                            </div>
                            <div class="activity-description">
                                🏢 ${atendimento.empresa || 'Empresa não informada'} • 🔧 ${this.formatProblema(atendimento.problema)}
                            </div>
                        </div>
                        <div class="activity-time">
                            📅 ${this.formatDate(createdDate)}
                        </div>
                        <div class="activity-priority priority-${atendimento.prioridade || 'media'}">
                            ${this.getPriorityIcon(atendimento.prioridade)} ${(atendimento.prioridade || 'media').toUpperCase()}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async createAtendimento() {
        const form = document.getElementById('atendimento-form');
        const formData = new FormData(form);
        
        // Determinar o cliente correto (dropdown ou campo personalizado)
        let clienteValue = formData.get('cliente');
        if (clienteValue === 'outro') {
            clienteValue = formData.get('cliente-custom');
        }
        
        // Determinar a empresa correta (dropdown ou campo personalizado)
        let empresaValue = formData.get('empresa');
        if (empresaValue === 'outro') {
            empresaValue = formData.get('empresa-custom');
        }
        
        // Determinar o problema correto (dropdown ou campo personalizado)
        let problemaValue = formData.get('problema');
        if (problemaValue === 'outro') {
            problemaValue = formData.get('problema-custom');
        }
        
        const atendimento = {
            cliente: clienteValue,
            empresa: empresaValue,
            problema: problemaValue,
            prioridade: formData.get('prioridade'),
            descricao: formData.get('descricao'),
            status: 'resolvido',
            dataCriacao: new Date().toISOString(),
            dataResolucao: null
        };

        try {
            const response = await fetch('/api/atendimento', {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(atendimento)
            });

            if (response.ok) {
                const result = await response.json();
                
                // Mostrar mensagem de sucesso antes da atualização
                this.showNotification('✅ Atendimento criado com sucesso! Atualizando página...', 'success');
                
                // Vibrar no mobile se disponível
                if (navigator.vibrate) {
                    navigator.vibrate(200);
                }
                
                // Aguardar um pouco para mostrar a mensagem
                setTimeout(() => {
                    // Atualizar a página inteira para garantir sincronização completa
                    window.location.reload(true); // true força reload do servidor
                }, 1500);
            } else {
                throw new Error('Erro ao criar atendimento');
            }
        } catch (error) {
            this.showNotification('❌ Erro ao criar atendimento. Tente novamente.', 'error');
        }
    }

    async loadAtendimentos() {
        const atendimentosList = document.getElementById('atendimentos-list');
        if (!atendimentosList) return;

        try {
            const response = await fetch('/api/atendimentos', {
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                const atendimentos = await response.json();
                // Garantir que sempre seja um array
                this.atendimentos = Array.isArray(atendimentos) ? atendimentos : [];
                this.saveAtendimentos(); // Salvar no localStorage como backup
            }
        } catch (error) {
            throw new Error(error)
        }

        // Garantir que atendimentos sempre seja um array antes de usar
        if (!Array.isArray(this.atendimentos)) {
            this.atendimentos = [];
        }

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
        
        // Garantir que atendimentos seja um array válido
        if (!Array.isArray(atendimentos)) {
            atendimentos = [];
        }
        
        if (atendimentos.length === 0) {
            atendimentosList.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #7f8c8d;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>Nenhum atendimento encontrado</p>
                    <p>Crie seu primeiro atendimento para começar!</p>
                </div>
            `;
            return;
        }
        
        atendimentosList.innerHTML = atendimentos.map(atendimento => {
            const statusIcon = this.getStatusIcon(atendimento.status);
            const priorityIcon = this.getPriorityIcon(atendimento.prioridade);
            
            return `
            <div class="atendimento-item">
                <div class="atendimento-header">
                    <div>
                        <span class="atendimento-id">#${atendimento.id}</span>
                        <h4>${priorityIcon} ${atendimento.cliente}</h4>
                    </div>
                    <span class="atendimento-priority priority-${atendimento.prioridade}">
                        ${atendimento.prioridade}
                    </span>
                </div>
                <div class="atendimento-content">
                    ${atendimento.empresa ? `<p><strong>🏢 Empresa:</strong> <span class="empresa-info">${atendimento.empresa}</span></p>` : ''}
                    <p><strong>🔧 Problema:</strong> <span class="problema-${this.getProblemaClass(atendimento.problema)}">${this.formatProblema(atendimento.problema)}</span></p>
                    <p><strong>📝 Descrição:</strong> ${atendimento.descricao}</p>
                    <p><strong>📊 Status:</strong> 
                        <span class="atendimento-status status-${atendimento.status}">
                            ${statusIcon} ${this.formatStatus(atendimento.status)}
                        </span>
                    </p>
                    <p><strong>📅 Data:</strong> ${this.formatDate(atendimento.dataCriacao)}</p>
                </div>
                <div class="atendimento-actions">
                    ${atendimento.status !== 'resolvido' ? `
                        <button onclick="app.updateAtendimentoStatus('${atendimento.id}', 'resolvido')" 
                                class="btn-action" style="background: linear-gradient(135deg, #95e1d3 0%, #6c5ce7 100%); color: white; box-shadow: 0 4px 12px rgba(149, 225, 211, 0.3);">
                            ✅ Resolver
                        </button>
                    ` : ''}
                    <button onclick="app.deleteAtendimento('${atendimento.id}')" 
                            class="btn-action" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); color: white; box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);">
                        🗑️ Excluir
                    </button>
                </div>
            </div>
        `}).join('');
    }

    getStatusIcon(status) {
        const icons = {
            'resolvido': '✅',
            'em andamento': '',
            'pendente': '',
            'aberto': ''
        };
        return icons[status] || '';
    }

    getPriorityIcon(prioridade) {
        const icons = {
            'baixa': '🟢',
            'media': '🟡',
            'alta': '🟠',
            'urgente': '🔴'
        };
        return icons[prioridade] || '⚪';
    }

    formatStatus(status) {
        // Verificar se status é válido
        if (!status || typeof status !== 'string') {
            return 'Pendente';
        }
        
        const statusMap = {
            'pendente': 'Pendente',
            'resolvido': 'Resolvido',
            'em andamento': 'Em Andamento',
            'aberto': 'Aberto'
        };
        return statusMap[status] || status;
    }

    formatProblema(problema) {
        // Verificar se problema é válido
        if (!problema || typeof problema !== 'string') {
            return 'NÃO INFORMADO';
        }
        return problema.toUpperCase();
    }

    getProblemaClass(problema) {
        // Verificar se problema é válido
        if (!problema || typeof problema !== 'string') {
            return 'outro';
        }
        
        const problemaLower = problema.toLowerCase();
        const classMap = {
            'hardware': 'hardware',
            'software': 'software',
            'rede': 'rede',
            'rede/internet': 'rede',
            'email': 'email',
            'e-mail': 'email',
            'impressora': 'impressora',
            'sistema': 'sistema',
            'sistema operacional': 'sistema',
            'backup': 'backup',
            'backup/recuperação': 'backup'
        };
        return classMap[problemaLower] || 'outro';
    }

    filterAtendimentos() {
        const statusFilter = document.getElementById('filter-status').value;
        const priorityFilter = document.getElementById('filter-priority').value;
        const empresaFilter = document.getElementById('filter-empresa').value;
        
        // Garantir que this.atendimentos seja um array válido
        if (!Array.isArray(this.atendimentos)) {
            this.atendimentos = [];
        }
        
        let filteredAtendimentos = this.atendimentos;
        
        if (statusFilter) {
            filteredAtendimentos = filteredAtendimentos.filter(atendimento => {
                const match = atendimento.status && atendimento.status.toLowerCase() === statusFilter.toLowerCase();
                return match;
            });
        }
        
        if (priorityFilter) {
            filteredAtendimentos = filteredAtendimentos.filter(atendimento => {
                const match = atendimento.prioridade && atendimento.prioridade.toLowerCase() === priorityFilter.toLowerCase();
                return match;
            });
        }
        
        if (empresaFilter) {
            filteredAtendimentos = filteredAtendimentos.filter(atendimento => {
                const match = atendimento.empresa === empresaFilter;
                return match;
            });
        }

        this.renderAtendimentos(filteredAtendimentos);
    }

    async updateAtendimentoStatus(atendimentoId, newStatus) {
        try {
            const dadosAtualizacao = {
                status: newStatus
            };
            
            if (newStatus === 'resolvido') {
                dadosAtualizacao.dataResolucao = new Date().toISOString();
            }

            const response = await fetch(`/api/atendimento/${atendimentoId}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(dadosAtualizacao)
            });

            if (response.ok) {
                const result = await response.json();
                
                // Atualizar o cache local
                const atendimento = this.atendimentos.find(a => a.id === atendimentoId);
                if (atendimento) {
                    atendimento.status = newStatus;
                    if (newStatus === 'resolvido') {
                        atendimento.dataResolucao = dadosAtualizacao.dataResolucao;
                    }
                    this.saveAtendimentos();
                }
                
                // Recarregar dados
                await this.loadAtendimentos();
                this.loadDashboard();
                this.showNotification(`✅ Atendimento ${newStatus}!`, 'success');
            } else {
                throw new Error('Erro ao atualizar status do atendimento');
            }
        } catch (error) {
            this.showNotification('❌ Erro ao atualizar status. Tente novamente.', 'error');
        }
    }

    async deleteAtendimento(atendimentoId) {
        if (confirm('Tem certeza que deseja excluir este atendimento?')) {
            try {
                const response = await fetch(`/api/atendimento/${atendimentoId}`, {
                    method: 'DELETE',
                    headers: this.getAuthHeaders()
                });

                if (response.ok) {
                    // Remover do cache local
                    if (Array.isArray(this.atendimentos)) {
                        this.atendimentos = this.atendimentos.filter(a => a.id !== atendimentoId);
                        this.saveAtendimentos();
                    }
                    
                    // Recarregar dados
                    await this.loadAtendimentos();
                    this.loadDashboard();
                    this.showNotification('🗑️ Atendimento excluído com sucesso!', 'success');
                } else {
                    throw new Error('Erro ao excluir atendimento');
                }
            } catch (error) {
                this.showNotification('❌ Erro ao excluir atendimento. Tente novamente.', 'error');
            }
        }
    }

    saveAtendimentos() {
        localStorage.setItem('tiwebcontrol_atendimentos', JSON.stringify(this.atendimentos));
    }

    formatDate(dateString) {
        if (!dateString || dateString === 'undefined' || dateString === 'null') {
            return 'Data não informada';
        }
        
        try {
            let date;
            
            // Tentar diferentes formatos de data
            if (typeof dateString === 'string') {
                // Se for uma string ISO (formato padrão do banco)
                if (dateString.includes('T') || dateString.includes('Z')) {
                    date = new Date(dateString);
                }
                // Se for uma data no formato brasileiro (dd/mm/yyyy)
                else if (dateString.includes('/')) {
                    const parts = dateString.split(' ')[0].split('/');
                    if (parts.length === 3) {
                        // Converter dd/mm/yyyy para yyyy-mm-dd
                        const [day, month, year] = parts;
                        date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
                    } else {
                        date = new Date(dateString);
                    }
                }
                // Se for uma data no formato ISO sem T (yyyy-mm-dd)
                else if (dateString.includes('-')) {
                    date = new Date(dateString);
                }
                // Se for um timestamp numérico
                else if (!isNaN(dateString)) {
                    const timestamp = parseInt(dateString);
                    date = new Date(timestamp);
                }
                // Fallback para outros formatos
                else {
                    date = new Date(dateString);
                }
            } else if (typeof dateString === 'number') {
                date = new Date(dateString);
            } else {
                date = new Date(dateString);
            }
            
            // Verificar se a data é válida
            if (isNaN(date.getTime())) {
                return 'Data não informada';
            }
            
            // Verificar se a data não é muito antiga (antes de 1970) ou muito futura
            const year = date.getFullYear();
            if (year < 1970 || year > 2100) {
                return 'Data não informada';
            }
            
            return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Data não informada';
        }
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
            
            const response = await fetch('/api/atendimentos/export', {
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error('Erro ao gerar arquivo Excel');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Criar link para download
            const a = document.createElement('a');
            a.href = url;
            a.download = `atendimentos_tiwebcontrol_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            
            // Limpar
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showNotification('✅ Arquivo Excel baixado com sucesso!', 'success');
            
        } catch (error) {
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
                <div class="tool-loading">
                    <div class="spinner-container">
                        <div class="spinner"></div>
                    </div>
                    <div class="loading-text">
                        Carregando informações do sistema<span class="loading-dots"></span>
                    </div>
                </div>
            `;
        }

        try  {
            // Obter informações do servidor (com timestamp para evitar cache)
            const response = await fetch(`/api/system-info?t=${Date.now()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Resposta não é JSON. Content-Type: ${contentType}. Conteúdo: ${text.substring(0, 200)}...`);
            }
            
            const serverInfo = await response.json();
            
            // Calcular uso de memória
            const memoryUsage = ((serverInfo.totalMemory - serverInfo.freeMemory) / serverInfo.totalMemory * 100).toFixed(1);
            
            // Formatar uptime
            const uptimeHours = Math.floor(serverInfo.uptime / 3600);
            const uptimeMinutes = Math.floor((serverInfo.uptime % 3600) / 60);
            const uptimeFormatted = `${uptimeHours}h ${uptimeMinutes}m`;
            
            if (toolOutput) {
                toolOutput.innerHTML = `
                    <div class="success">
                        Informações do sistema carregadas com sucesso!
                    </div>
                    
                    <div class="separator"></div>
                    
                    <pre><strong>🖥️ Informações do Sistema</strong>

📋 <span class="highlight">Plataforma:</span> ${serverInfo.type} (${serverInfo.platform})
🏗️ <span class="highlight">Arquitetura:</span> ${serverInfo.architecture}
📦 <span class="highlight">Versão:</span> ${serverInfo.release}</pre>
                    
                    <div class="separator"></div>
                    
                    <pre><strong>🖥️ Cliente (Navegador)</strong>

🌐 <span class="highlight">Navegador:</span> ${navigator.userAgent.split(' ')[0]}
📱 <span class="highlight">Mobile:</span> ${window.cordova ? 'Sim (Cordova)' : 'Não'}
🕒 <span class="highlight">Timezone:</span> ${Intl.DateTimeFormat().resolvedOptions().timeZone}</pre>
                `;
            }
        } catch (error) {
            if (toolOutput) {
                toolOutput.innerHTML = `
                    <h4>💻 Informações do Sistema</h4>
                    <div class="error">
                        Erro ao carregar informações do sistema<br>
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
        const navOverlay = document.getElementById('mobile-menu-overlay');
        const navClose = document.getElementById('nav-close');

        if (mobileToggle && navMenu) {
            // Inicializar botões como não focalizáveis (menu inicia fechado)
            const navButtons = navMenu.querySelectorAll('.nav-btn, .nav-close');
            navButtons.forEach(btn => btn.setAttribute('tabindex', '-1'));
            // Toggle do menu
            mobileToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleMobileMenu();
            });

            // Fechar menu ao clicar no overlay
            if (navOverlay) {
                navOverlay.addEventListener('click', () => {
                    this.closeMobileMenu();
                });
            }

            // Fechar menu com botão X
            if (navClose) {
                navClose.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.closeMobileMenu();
                });
            }

            // Fechar menu com ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeMobileMenu();
                }
            });

            // Fechar menu ao clicar em um item de navegação
            const navBtns = navMenu.querySelectorAll('.nav-btn');
            navBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Pequeno delay para permitir a transição da seção
                    setTimeout(() => {
                        this.closeMobileMenu();
                    }, 100);
                });
            });

            // Prevenir propagação de cliques dentro do menu
            navMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }

    toggleMobileMenu() {
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        const navOverlay = document.getElementById('mobile-menu-overlay');

        if (mobileToggle && navMenu) {
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
        const navOverlay = document.getElementById('mobile-menu-overlay');

        if (mobileToggle && navMenu) {
            // Adicionar classes ativas
            mobileToggle.classList.add('active');
            navMenu.classList.add('active');
            
            if (navOverlay) {
                navOverlay.classList.add('active');
            }
            
            // Prevenir scroll do body
            document.body.style.overflow = 'hidden';
            
            // Adicionar atributos de acessibilidade
            mobileToggle.setAttribute('aria-expanded', 'true');
            navMenu.setAttribute('aria-hidden', 'false');
            
            // Tornar botões focalizáveis
            const navButtons = navMenu.querySelectorAll('.nav-btn, .nav-close');
            navButtons.forEach(btn => btn.removeAttribute('tabindex'));
            
            // Focar no primeiro item do menu
            const firstNavBtn = navMenu.querySelector('.nav-btn');
            if (firstNavBtn) {
                setTimeout(() => firstNavBtn.focus(), 300);
            }
        }
    }

    closeMobileMenu() {
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        const navOverlay = document.getElementById('mobile-menu-overlay');

        if (mobileToggle && navMenu) {
            // Remover classes ativas
            mobileToggle.classList.remove('active');
            navMenu.classList.remove('active');
            
            if (navOverlay) {
                navOverlay.classList.remove('active');
            }
            
            // Restaurar scroll do body
            document.body.style.overflow = '';
            
            // Atualizar atributos de acessibilidade
            mobileToggle.setAttribute('aria-expanded', 'false');
            navMenu.setAttribute('aria-hidden', 'true');
            
            // Tornar botões não focalizáveis quando menu está fechado
            const navButtons = navMenu.querySelectorAll('.nav-btn, .nav-close');
            navButtons.forEach(btn => btn.setAttribute('tabindex', '-1'));
            
            // Retornar foco para o botão hambúrguer
            mobileToggle.focus();
        }
    }

    // Método para configurar o botão flutuante (FAB)
    setupFloatingActionButton() {
        const fab = document.getElementById('fab-create-ticket');
        
        if (fab) {
            // Garantir visibilidade inicial do FAB
            fab.style.opacity = '1';
            fab.style.pointerEvents = 'auto';
            fab.style.display = 'flex';
            fab.style.visibility = 'visible';
            
            // Adicionar listener de clique
            fab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Navegar para a seção de novo atendimento
                this.showSection('novo-atendimento');
                
                // Fechar menu mobile se estiver aberto
                this.closeMobileMenu();
                
                // Focar no primeiro campo do formulário após um pequeno delay
                setTimeout(() => {
                    const firstInput = document.querySelector('#novo-atendimento input, #novo-atendimento select');
                    if (firstInput) {
                        firstInput.focus();
                    }
                }, 300);
                
                // Feedback visual
                this.showNotification('📝 Criando novo atendimento...', 'info');
            });

            // Adicionar efeito de ripple ao clicar
            fab.addEventListener('mousedown', (e) => {
                this.createRippleEffect(e, fab);
            });
            
            // Ocultar FAB quando estiver na seção de novo atendimento
            this.hideFabOnNewSection();
        }
    }

    // Método para criar efeito ripple no FAB
    createRippleEffect(event, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        // Adicionar keyframes se não existir
        if (!document.querySelector('#ripple-keyframes')) {
            const style = document.createElement('style');
            style.id = 'ripple-keyframes';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Não alterar position para manter o FAB fixo
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Método para ocultar FAB na seção de novo atendimento
    hideFabOnNewSection() {
        const fab = document.getElementById('fab-create-ticket');
        if (!fab) return;

        // Observer para detectar mudanças de seção
        const observer = new MutationObserver(() => {
            const novoSection = document.getElementById('novo-atendimento');
            const isNovoActive = novoSection && !novoSection.classList.contains('hidden');
            
            if (isNovoActive) {
                fab.style.opacity = '0';
                fab.style.pointerEvents = 'none';
            } else {
                fab.style.opacity = '1';
                fab.style.pointerEvents = 'auto';
            }
        });

        // Observar mudanças nas classes das seções
        document.querySelectorAll('.section').forEach(section => {
            observer.observe(section, { 
                attributes: true, 
                attributeFilter: ['class'] 
            });
        });
    }

    // ===== FUNÇÕES PARA CRIAR USUÁRIO =====

    setupCreateUserForm() {
        const form = document.getElementById('createUserForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createUser();
        });

        // Validação em tempo real
        const passwordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        if (passwordInput && confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                this.validatePasswordMatch();
            });
            
            passwordInput.addEventListener('input', () => {
                this.validatePasswordMatch();
            });
        }
    }

    validatePasswordMatch() {
        const password = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const confirmInput = document.getElementById('confirmPassword');

        if (confirmPassword && password !== confirmPassword) {
            confirmInput.setCustomValidity('As senhas não coincidem');
            confirmInput.style.borderColor = '#e53e3e';
        } else {
            confirmInput.setCustomValidity('');
            confirmInput.style.borderColor = '';
        }
    }

    async createUser() {
        const form = document.getElementById('createUserForm');
        const formData = new FormData(form);
        
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            role: formData.get('role')
        };

        // Validações básicas
        if (!userData.username || !userData.email || !userData.password) {
            this.showUserMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        if (userData.password !== userData.confirmPassword) {
            this.showUserMessage('As senhas não coincidem.', 'error');
            return;
        }

        if (userData.password.length < 6) {
            this.showUserMessage('A senha deve ter pelo menos 6 caracteres.', 'error');
            return;
        }

        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            this.showUserMessage('Por favor, insira um email válido.', 'error');
            return;
        }

        try {
            this.showUserMessage('Criando usuário...', 'info');
            
            const response = await fetch('/api/users/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeaders()
                },
                body: JSON.stringify({
                    username: userData.username,
                    email: userData.email,
                    password: userData.password,
                    role: userData.role
                })
            });

            const result = await response.json();

            if (response.ok) {
                this.showUserMessage(`✅ Usuário "${userData.username}" criado com sucesso!`, 'success');
                this.clearUserForm();
            } else {
                this.showUserMessage(`❌ Erro: ${result.message || 'Falha ao criar usuário'}`, 'error');
            }
        } catch (error) {
            this.showUserMessage('❌ Erro de conexão. Tente novamente.', 'error');
        }
    }

    clearUserForm() {
        const form = document.getElementById('createUserForm');
        if (form) {
            form.reset();
            
            // Limpar validações customizadas
            const confirmPasswordInput = document.getElementById('confirmPassword');
            if (confirmPasswordInput) {
                confirmPasswordInput.setCustomValidity('');
                confirmPasswordInput.style.borderColor = '';
            }
        }
        
        this.hideUserMessage();
    }

    showUserMessage(message, type = 'info') {
        // Remove mensagem anterior se existir
        this.hideUserMessage();
        
        const container = document.querySelector('#criar-usuario .form-container');
        if (!container) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.id = 'user-form-message';
        
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        messageDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
        
        container.appendChild(messageDiv);
        
        // Auto-remover mensagens de sucesso após 5 segundos
        if (type === 'success') {
            setTimeout(() => {
                this.hideUserMessage();
            }, 5000);
        }
    }

    hideUserMessage() {
        const message = document.getElementById('user-form-message');
        if (message) {
            message.remove();
        }
    }

    /**
     * 🧹 Limpa todos os caches possíveis do navegador
     * Usado após criar/atualizar atendimentos para garantir dados atualizados
     */

}

// Função global para logout
window.logout = function() {
    // Limpar dados de autenticação
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Redirecionar para página de login
    window.location.href = '/login.html';
};

// Inicializar aplicação
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TIWebControlApp();
});