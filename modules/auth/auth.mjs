import jwt from 'jsonwebtoken';
import database from './database.mjs';

const JWT_SECRET = process.env.JWT_SECRET || 'tecsave_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthManager {
    constructor() {
        this.database = database;
    }

    async login(username, password) {
        try {
            // Verificar primeiro se é o usuário admin local do .env
            const adminUsername = process.env.ADMIN_ADMIN;
            const adminPassword = process.env.PASSWORD_ADMIN;
            
            if (username === adminUsername && password === adminPassword) {
                // Verificar se é o primeiro login do usuário local
                const localUserFirstLogin = await this.database.getSystemConfig('local_user_first_login');
                
                if (localUserFirstLogin !== 'true') {
                    // Registrar o usuário local no banco de dados
                    try {
                        const existingUser = await this.database.findUserByUsername(adminUsername);
                        if (!existingUser) {
                            await this.database.createUser({
                                username: adminUsername,
                                email: 'admin@local.env',
                                password: adminPassword,
                                role: 'admin'
                            });
                            console.log('👤 Usuário local do .env registrado no banco de dados');
                        }
                        
                        // Marcar que o primeiro login foi realizado
                        await this.database.setSystemConfig('local_user_first_login', 'true');
                        console.log('🔐 Primeiro login do usuário local realizado - credenciais padrão agora ocultas');
                    } catch (error) {
                        console.error('❌ Erro ao registrar usuário local:', error);
                    }
                }

                const token = jwt.sign(
                    { 
                        id: 'admin_local', 
                        username: adminUsername, 
                        role: 'admin',
                        isLocalAdmin: true
                    },
                    JWT_SECRET,
                    { expiresIn: JWT_EXPIRES_IN }
                );

                return {
                    success: true,
                    message: localUserFirstLogin !== 'true' ? 
                        '🎉 Primeiro login realizado! Credenciais padrão agora ocultas por segurança.' : 
                        'Login realizado com sucesso (Admin Local)',
                    token,
                    user: {
                        id: 'admin_local',
                        username: adminUsername,
                        email: 'admin@local.env',
                        role: 'admin',
                        isLocalAdmin: true
                    }
                };
            }

            // Se não for o admin local, verificar no banco de dados
            const user = await this.database.findUserByUsername(username);
            
            if (!user) {
                return { success: false, message: 'Usuário não encontrado' };
            }

            // Verificar se são as credenciais padrão (admin/admin123)
            const isDefaultCredentials = username === 'admin' && password === 'admin123';
            
            if (isDefaultCredentials) {
                // Verificar se as credenciais padrão já foram usadas
                const defaultCredentialsUsed = await this.database.getSystemConfig('default_credentials_used');
                
                if (defaultCredentialsUsed === 'true') {
                    return { 
                        success: false, 
                        message: '🔒 Credenciais padrão desabilitadas por segurança. Entre em contato com o administrador.' 
                    };
                }
                
                // Se é o primeiro uso, marcar como usado
                await this.database.setSystemConfig('default_credentials_used', 'true');
                console.log('🔐 Credenciais padrão usadas pela primeira vez - agora desabilitadas');
            }

            const isValidPassword = await this.database.verifyPassword(password, user.password);
            
            if (!isValidPassword) {
                return { success: false, message: 'Senha incorreta' };
            }

            const token = jwt.sign(
                { 
                    id: user.id || user._id, 
                    username: user.username, 
                    role: user.role,
                    isLocalAdmin: false
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            return {
                success: true,
                message: isDefaultCredentials ? 
                    '⚠️ Login realizado com credenciais padrão - altere sua senha imediatamente!' : 
                    'Login realizado com sucesso',
                token,
                user: {
                    id: user.id || user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    isLocalAdmin: false
                }
            };
        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, message: 'Erro interno do servidor' };
        }
    }

    async register(userData) {
        try {
            const { username, email, password, role = 'user' } = userData;

            // Verificar se usuário já existe
            const existingUser = await this.database.findUserByUsername(username);
            if (existingUser) {
                return { success: false, message: 'Usuário já existe' };
            }

            const newUser = await this.database.createUser({
                username,
                email,
                password,
                role
            });

            return {
                success: true,
                message: 'Usuário criado com sucesso',
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role
                }
            };
        } catch (error) {
            console.error('Erro no registro:', error);
            return { success: false, message: 'Erro ao criar usuário' };
        }
    }

    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return { success: true, user: decoded };
        } catch (error) {
            return { success: false, message: 'Token inválido' };
        }
    }

    // Middleware para verificar autenticação
    requireAuth(req, res, next) {
        const token = req.headers.authorization?.replace('Bearer ', '') || 
                     req.session?.token ||
                     req.cookies?.token;

        if (!token) {
            // Se for uma requisição HTML, redirecionar para login
            if (req.accepts('html') && !req.path.startsWith('/api/')) {
                return res.redirect('/login.html');
            }
            return res.status(401).json({ 
                success: false, 
                message: 'Token de acesso requerido' 
            });
        }

        const verification = this.verifyToken(token);
        if (!verification.success) {
            // Se for uma requisição HTML, redirecionar para login
            if (req.accepts('html') && !req.path.startsWith('/api/')) {
                return res.redirect('/login.html');
            }
            return res.status(401).json(verification);
        }

        req.user = verification.user;
        next();
    }

    // Middleware para verificar se é admin
    requireAdmin(req, res, next) {
        // Verificar se é admin do banco ou admin local do .env
        const isAdmin = req.user?.role === 'admin';
        const isLocalAdmin = req.user?.isLocalAdmin === true;
        
        if (!isAdmin && !isLocalAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Acesso negado. Apenas administradores.' 
            });
        }
        next();
    }

    async getAllUsers() {
        try {
            const users = await this.database.getAllUsers();
            return {
                success: true,
                users: users.map(user => ({
                    id: user.id || user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    created_at: user.created_at
                }))
            };
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            return { success: false, message: 'Erro ao buscar usuários' };
        }
    }

    async updateUser(id, userData) {
        try {
            await this.database.updateUser(id, userData);
            return { success: true, message: 'Usuário atualizado com sucesso' };
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            return { success: false, message: 'Erro ao atualizar usuário' };
        }
    }

    async deleteUser(id) {
        try {
            await this.database.deleteUser(id);
            return { success: true, message: 'Usuário removido com sucesso' };
        } catch (error) {
            console.error('Erro ao remover usuário:', error);
            return { success: false, message: 'Erro ao remover usuário' };
        }
    }

    async getUserByUsername(username) {
        try {
            return await this.database.findUserByUsername(username);
        } catch (error) {
            console.error('Erro ao buscar usuário por username:', error);
            return null;
        }
    }

    async getUserByEmail(email) {
        try {
            return await this.database.findUserByEmail(email);
        } catch (error) {
            console.error('Erro ao buscar usuário por email:', error);
            return null;
        }
    }
}

export default new AuthManager();