import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// 📦 Importando módulos organizados
import { generateAtendimentosExcel, generateExcelFileName } from './modules/excel/exporter.mjs';
import { 
    obterAtendimentos, 
    getFormattedAtendimentos, 
    criarAtendimento, 
    atualizarAtendimento,
    excluirAtendimento,
    validateAtendimentoData,
    validateAtendimentoUpdateData 
} from './modules/atendimentos/manager.mjs';
import { logWithTimestamp } from './modules/utils/helpers.mjs';
import databaseConfig from './modules/utils/database-config.mjs';
import authManager from './modules/auth/auth.mjs';
import database from './modules/auth/database.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'www')));

// 🔧 Validar configuração de banco de dados
console.log(chalk.blue.bold('🚀 Iniciando Sistema de Suporte TecSave...\n'));
const dbConfig = databaseConfig.displayConfig();

// Inicializar banco de dados
console.log(chalk.yellow('⚡ Inicializando banco de dados...'));
await database.initialize();
console.log(chalk.green('✅ Banco de dados inicializado com sucesso!\n'));

// 🔐 Rotas de Autenticação
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await authManager.login(username, password);
        res.json(result);
    } catch (error) {
        logWithTimestamp('Erro no login:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Rota para verificar se deve ocultar credenciais padrão
app.get('/api/auth/check-default-credentials', async (req, res) => {
    try {
        const database = (await import('./modules/auth/database.mjs')).default;
        
        // Verificar se o usuário local já fez o primeiro login
        const localUserFirstLogin = await database.getSystemConfig('local_user_first_login');
        
        // Verificar se as credenciais padrão já foram usadas
        const defaultCredentialsUsed = await database.getSystemConfig('default_credentials_used');
        
        // Ocultar credenciais se qualquer uma das condições for verdadeira
        const hideDefaultCredentials = localUserFirstLogin === 'true' || defaultCredentialsUsed === 'true';
        
        res.status(200).json({ 
            hideDefaultCredentials,
            localUserFirstLogin: localUserFirstLogin === 'true',
            defaultCredentialsUsed: defaultCredentialsUsed === 'true'
        });
    } catch (error) {
        console.error('Erro ao verificar credenciais padrão:', error);
        res.status(500).json({ 
            hideDefaultCredentials: false,
            error: 'Erro interno do servidor' 
        });
    }
});

app.post('/api/auth/verify', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ success: false, message: 'Token não fornecido' });
    }
    
    const result = authManager.verifyToken(token);
    res.json(result);
});

app.post('/api/auth/register', authManager.requireAuth.bind(authManager), authManager.requireAdmin.bind(authManager), async (req, res) => {
    try {
        const result = await authManager.register(req.body);
        res.json(result);
    } catch (error) {
        logWithTimestamp('Erro no registro:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

app.get('/api/auth/users', authManager.requireAuth.bind(authManager), authManager.requireAdmin.bind(authManager), async (req, res) => {
    try {
        const result = await authManager.getAllUsers();
        res.json(result);
    } catch (error) {
        logWithTimestamp('Erro ao buscar usuários:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Rota para criar usuário (apenas para admins locais)
app.post('/api/users/create', authManager.requireAuth.bind(authManager), async (req, res) => {
    try {
        // Verificar se o usuário é admin local
        const token = req.headers.authorization?.replace('Bearer ', '');
        const tokenData = authManager.verifyToken(token);
        
        if (!tokenData.success || !tokenData.user.isLocalAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Acesso negado. Apenas administradores locais podem criar usuários.' 
            });
        }

        const { username, email, password, role } = req.body;

        // Validações básicas
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nome de usuário, email e senha são obrigatórios.' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'A senha deve ter pelo menos 6 caracteres.' 
            });
        }

        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Por favor, insira um email válido.' 
            });
        }

        // Verificar se o usuário já existe
        const existingUser = await authManager.getUserByUsername(username);
        if (existingUser) {
            return res.status(409).json({ 
                success: false, 
                message: 'Nome de usuário já existe.' 
            });
        }

        // Verificar se o email já existe
        const existingEmail = await authManager.getUserByEmail(email);
        if (existingEmail) {
            return res.status(409).json({ 
                success: false, 
                message: 'Email já está em uso.' 
            });
        }

        // Criar o usuário
        const result = await authManager.register({
            username,
            email,
            password,
            role: role || 'user'
        });

        if (result.success) {
            logWithTimestamp(`✅ Usuário "${username}" criado com sucesso pelo admin local "${tokenData.user.username}"`);
            res.json({ 
                success: true, 
                message: `Usuário "${username}" criado com sucesso!`,
                user: {
                    id: result.user.id,
                    username: result.user.username,
                    email: result.user.email,
                    role: result.user.role
                }
            });
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        logWithTimestamp('Erro ao criar usuário:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor ao criar usuário.' 
        });
    }
});

// Middleware de autenticação para rotas protegidas
const requireAuth = authManager.requireAuth.bind(authManager);

// Rota principal (protegida)
app.get('/', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

// Rota de login (não protegida)
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'login.html'));
});

// Rota para obter configurações do sistema
app.get('/api/config', (req, res) => {
    res.json({
        websiteName: process.env.WEBSITE_NAME || 'Sistema de Atendimento'
    });
});

// Rota para obter informações do sistema
app.get('/api/system-info', (req, res) => {
    // Headers para evitar cache
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Type', 'application/json');
    
    try {
        const systemInfo = {
            // Informações do Sistema Operacional
            platform: os.platform(),
            architecture: os.arch(),
            release: os.release(),
            type: os.type(),
            
            // Informações de Hardware
            totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100, // GB
            freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024 * 100) / 100, // GB
            cpuCores: os.cpus().length,
            cpuModel: os.cpus()[0]?.model || 'Desconhecido',
            
            // Informações de Rede
            hostname: os.hostname(),
            networkInterfaces: Object.keys(os.networkInterfaces()),
            
            // Informações do Node.js
            nodeVersion: process.version,
            uptime: Math.round(process.uptime()),
            
            // Informações do Usuário
            username: os.userInfo().username,
            homeDir: os.userInfo().homedir,
            
            // Timestamp
            timestamp: new Date().toISOString()
        };
        
        res.json(systemInfo);
    } catch (error) {
        console.error('Erro ao obter informações do sistema:', error);
        res.status(500).json({ error: 'Erro ao obter informações do sistema' });
    }
});

// API Routes para funcionalidades de suporte (protegidas)
app.post('/api/atendimento', requireAuth, async (req, res) => {
    try {
        // Validar dados do atendimento
        const validation = validateAtendimentoData(req.body);
        
        if (!validation.isValid) {
            return res.status(400).json({ 
                error: 'Dados inválidos', 
                details: validation.errors 
            });
        }

        // Adicionar informações do usuário autenticado
        logWithTimestamp(`🔍 DEBUG - req.user: ${JSON.stringify(req.user)}`, 'info');
        logWithTimestamp(`🔍 DEBUG - req.user?.id: ${req.user?.id}`, 'info');
        
        // Mapear admin_local para o ID numérico do banco (1)
        let created_by = null;
        if (req.user?.id === 'admin_local') {
            created_by = 1; // ID do admin no banco SQLite
        } else if (req.user?.id && typeof req.user.id === 'number') {
            created_by = req.user.id;
        }
        
        // Mapear campos do frontend para o backend
        const dadosAtendimento = {
            title: req.body.title || req.body.problema || 'Atendimento sem título',
            description: req.body.description || req.body.descricao || 'Descrição não informada',
            cliente: req.body.cliente || req.body.client || 'Cliente não informado',
            empresa: req.body.empresa || '',
            problema: req.body.problema || req.body.title || 'Não especificado',
            prioridade: req.body.prioridade || req.body.priority || 'media',
            status: req.body.status || 'em andamento',
            created_by: created_by
        };
        
        logWithTimestamp(`🔍 DEBUG - dadosAtendimento.created_by: ${dadosAtendimento.created_by}`, 'info');

        // Criar novo atendimento
        const newAtendimento = await criarAtendimento(dadosAtendimento);
        logWithTimestamp(`✅ Novo atendimento criado: ${newAtendimento.title}`, 'success');
        
        res.status(201).json(newAtendimento);
    } catch (error) {
        logWithTimestamp(`❌ Erro ao criar atendimento: ${error.message}`, 'error');
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/atendimentos', requireAuth, async (req, res) => {
    try {
        const atendimentos = await obterAtendimentos();
        const formattedAtendimentos = getFormattedAtendimentos(atendimentos);
        res.json(formattedAtendimentos);
    } catch (error) {
        logWithTimestamp(`❌ Erro ao obter atendimentos: ${error.message}`, 'error');
        res.status(500).json({ error: 'Erro ao obter atendimentos' });
    }
});

// Rota para atualizar atendimento
app.put('/api/atendimento/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const dadosAtualizacao = req.body;
        
        // Validar dados de entrada usando a função específica para atualizações
        const validation = validateAtendimentoUpdateData(dadosAtualizacao);
        if (!validation.isValid) {
            return res.status(400).json({ 
                error: 'Dados inválidos', 
                details: validation.errors 
            });
        }

        // Adicionar informações de auditoria
        dadosAtualizacao.updated_by = req.user.username;
        dadosAtualizacao.updated_at = new Date().toISOString();

        const atendimentoAtualizado = await atualizarAtendimento(id, dadosAtualizacao);
        
        if (!atendimentoAtualizado) {
            return res.status(404).json({ error: 'Atendimento não encontrado' });
        }

        logWithTimestamp(`✅ Atendimento ${id} atualizado por ${req.user.username}`, 'info');
        res.json({ 
            success: true, 
            message: 'Atendimento atualizado com sucesso',
            atendimento: atendimentoAtualizado 
        });
    } catch (error) {
        logWithTimestamp(`❌ Erro ao atualizar atendimento: ${error.message}`, 'error');
        res.status(500).json({ error: 'Erro ao atualizar atendimento' });
    }
});

// Rota para excluir atendimento
app.delete('/api/atendimento/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        const sucesso = await excluirAtendimento(id);
        
        if (!sucesso) {
            return res.status(404).json({ error: 'Atendimento não encontrado' });
        }

        logWithTimestamp(`🗑️ Atendimento ${id} excluído por ${req.user.username}`, 'info');
        res.json({ 
            success: true, 
            message: 'Atendimento excluído com sucesso' 
        });
    } catch (error) {
        logWithTimestamp(`❌ Erro ao excluir atendimento: ${error.message}`, 'error');
        res.status(500).json({ error: 'Erro ao excluir atendimento' });
    }
});

// Rota para exportar atendimentos para Excel com formatação avançada
app.get('/api/atendimentos/export', requireAuth, async (req, res) => {
    try {
        // Obter todos os atendimentos
        const atendimentos = await obterAtendimentos();
        
        // Gerar Excel usando o módulo especializado
        const buffer = await generateAtendimentosExcel(atendimentos);
        
        // Configurar headers para download
        const fileName = generateExcelFileName();
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Enviar arquivo
        res.send(buffer);
        logWithTimestamp(`✅ Relatório Excel gerado: ${fileName}`, 'success');
        
    } catch (error) {
        logWithTimestamp(`❌ Erro ao exportar Excel: ${error.message}`, 'error');
        res.status(500).json({ error: 'Erro ao gerar arquivo Excel' });
    }
});





// Iniciar servidor
app.listen(PORT, () => {
    console.log(chalk.green.bold('\n🎉 Servidor iniciado com sucesso!'));
    console.log(chalk.white('─'.repeat(50)));
    console.log(chalk.cyan(`🚀 Porta: ${PORT}`));
    console.log(chalk.cyan(`🌐 URL: http://localhost:${PORT}`));
    console.log(chalk.cyan(`🗄️  Banco: ${dbConfig.type.toUpperCase()}`));
    console.log(chalk.white('─'.repeat(50)));
    console.log(chalk.yellow('💡 Pressione Ctrl+C para parar o servidor\n'));
});