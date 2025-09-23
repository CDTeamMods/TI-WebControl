import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// 📦 Importando módulos organizados
import { generateAtendimentosExcel, generateExcelFileName } from './modules/excel/exporter.mjs';
import { 
    getAllAtendimentos, 
    getFormattedAtendimentos, 
    createAtendimento, 
    validateAtendimentoData 
} from './modules/atendimentos/manager.mjs';
import { logWithTimestamp } from './modules/utils/helpers.mjs';

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

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'index.html'));
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

// API Routes para funcionalidades de suporte
app.post('/api/atendimento', (req, res) => {
    try {
        // Validar dados do atendimento
        const validation = validateAtendimentoData(req.body);
        
        if (!validation.isValid) {
            return res.status(400).json({ 
                error: 'Dados inválidos', 
                details: validation.errors 
            });
        }

        // Criar novo atendimento
        const newAtendimento = createAtendimento(req.body);
        logWithTimestamp(`Novo atendimento criado: ${newAtendimento.title}`, 'success');
        
        res.status(201).json(newAtendimento);
    } catch (error) {
        logWithTimestamp(`Erro ao criar atendimento: ${error.message}`, 'error');
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/atendimentos', (req, res) => {
    try {
        const formattedAtendimentos = getFormattedAtendimentos();
        logWithTimestamp(`Listagem de atendimentos solicitada (${formattedAtendimentos.length} atendimentos)`, 'info');
        
        res.json({
            atendimentos: formattedAtendimentos,
            total: formattedAtendimentos.length
        });
    } catch (error) {
        logWithTimestamp(`Erro ao listar atendimentos: ${error.message}`, 'error');
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para exportar atendimentos para Excel com formatação avançada
app.get('/api/atendimentos/export', async (req, res) => {
    try {
        // Obter todos os atendimentos
        const atendimentos = getAllAtendimentos();
        
        // Gerar Excel usando o módulo especializado
        const buffer = await generateAtendimentosExcel(atendimentos);
        
        // Configurar headers para download
        const fileName = generateExcelFileName();
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Enviar arquivo
        res.send(buffer);
        logWithTimestamp(`Relatório Excel gerado: ${fileName}`, 'success');
        
    } catch (error) {
        logWithTimestamp(`Erro ao exportar Excel: ${error.message}`, 'error');
        res.status(500).json({ error: 'Erro ao gerar arquivo Excel' });
    }
});





// Iniciar servidor
app.listen(PORT, () => {
    logWithTimestamp(`🚀 Servidor rodando em http://localhost:${PORT}`, 'success');
    logWithTimestamp('📦 Módulos organizados carregados com sucesso!', 'success');
});