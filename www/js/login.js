class LoginManager {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.loginBtn = document.getElementById('loginBtn');
        this.messageDiv = document.getElementById('loginMessage');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.defaultCredentialsDiv = document.querySelector('.default-credentials');
        
        this.init();
        this.checkDefaultCredentialsVisibility();
    }

    init() {
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Auto-focus no campo de usuário
        this.usernameInput.focus();
        
        // Enter para submeter o form
        this.passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin(e);
            }
        });

        // Verificar se já está logado
        this.checkExistingAuth();
    }

    async checkExistingAuth() {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const response = await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        // Token válido, redirecionar para dashboard
                        console.log('✅ Token válido, redirecionando para dashboard');
                        window.location.href = '/';
                        return;
                    }
                }
                
                // Se chegou aqui, token é inválido
                console.log('❌ Token inválido, removendo do localStorage');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
            } catch (error) {
                console.error('❌ Erro ao verificar token:', error);
                // Token inválido, remover do localStorage
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
            }
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value;

        if (!username || !password) {
            this.showMessage('Por favor, preencha todos os campos', 'error');
            return;
        }

        this.setLoading(true);
        this.hideMessage();

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                // Salvar token e dados do usuário
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                this.showMessage('Login realizado com sucesso! Redirecionando...', 'success');
                
                // Redirecionar após 1 segundo
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                this.showMessage(data.message || 'Erro ao fazer login', 'error');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            this.showMessage('Erro de conexão. Tente novamente.', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(loading) {
        if (loading) {
            this.loginBtn.disabled = true;
            this.loginBtn.classList.add('loading');
            this.loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
        } else {
            this.loginBtn.disabled = false;
            this.loginBtn.classList.remove('loading');
            this.loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
        }
    }

    showMessage(message, type) {
        this.messageDiv.textContent = message;
        this.messageDiv.className = `message ${type}`;
        this.messageDiv.style.display = 'block';
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                this.hideMessage();
            }, 3000);
        }
    }

    hideMessage() {
        this.messageDiv.style.display = 'none';
    }

    async checkDefaultCredentialsVisibility() {
        try {
            const response = await fetch('/api/auth/check-default-credentials');
            const data = await response.json();
            
            if (data.hideDefaultCredentials) {
                // Ocultar as credenciais padrão
                if (this.defaultCredentialsDiv) {
                    this.defaultCredentialsDiv.style.display = 'none';
                }
            }
        } catch (error) {
            console.log('Erro ao verificar visibilidade das credenciais:', error);
            // Em caso de erro, manter as credenciais visíveis por segurança
        }
    }
}

// Função para toggle da senha
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});

// Função para logout (pode ser chamada de outras páginas)
window.logout = function() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
};