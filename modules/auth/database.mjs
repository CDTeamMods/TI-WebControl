import { MongoClient } from 'mongodb';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class DatabaseManager {
    constructor() {
        this.mongoClient = null;
        this.mongoDb = null;
        this.sqliteDb = null;
        this.isMongoConnected = false;
        this.dbType = null;
    }

    async initialize() {
        const mongoUri = process.env.MONGODB_URI;
        
        if (mongoUri && mongoUri.trim() !== '') {
            try {
                console.log('🔄 Tentando conectar ao MongoDB...');
                this.mongoClient = new MongoClient(mongoUri);
                await this.mongoClient.connect();
                this.mongoDb = this.mongoClient.db('suporte_tecsave');
                this.isMongoConnected = true;
                this.dbType = 'mongodb';
                console.log('✅ Conectado ao MongoDB com sucesso!');
                await this.createMongoIndexes();
            } catch (error) {
                console.log('❌ Erro ao conectar ao MongoDB:', error.message);
                console.log('🔄 Usando SQLite local como fallback...');
                this.initializeSQLite();
            }
        } else {
            console.log('📝 MongoDB URI não configurada, usando SQLite local...');
            this.initializeSQLite();
        }
    }

    initializeSQLite() {
        const dbPath = join(process.cwd(), 'data', 'suporte.db');
        this.sqliteDb = new Database(dbPath);
        this.dbType = 'sqlite';
        console.log('✅ Banco SQLite inicializado!');
        this.createSQLiteTables();
    }

    createSQLiteTables() {
        // Tabela de usuários
        this.sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela de configurações do sistema
        this.sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS system_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                config_key TEXT UNIQUE NOT NULL,
                config_value TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Criar usuário admin padrão se não existir
        const adminExists = this.sqliteDb.prepare('SELECT id FROM users WHERE username = ?').get('admin');
        if (!adminExists) {
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            this.sqliteDb.prepare(`
                INSERT INTO users (username, email, password, role)
                VALUES (?, ?, ?, ?)
            `).run('admin', 'admin@tecsave.com', hashedPassword, 'admin');
            
            // Mostrar credenciais do .env
            const adminUser = process.env.ADMIN_ADMIN || 'admin';
            const adminPassword = process.env.PASSWORD_ADMIN || 'changepassword';
            console.log(`👤 Usuário admin criado (${adminUser}/${adminPassword})`);
        }

        // Inicializar configuração de primeiro login
        const firstLoginConfig = this.sqliteDb.prepare('SELECT id FROM system_config WHERE config_key = ?').get('default_credentials_used');
        if (!firstLoginConfig) {
            this.sqliteDb.prepare(`
                INSERT INTO system_config (config_key, config_value)
                VALUES (?, ?)
            `).run('default_credentials_used', 'false');
        }

        // Inicializar configuração de primeiro login do usuário local
        const localUserFirstLoginConfig = this.sqliteDb.prepare('SELECT id FROM system_config WHERE config_key = ?').get('local_user_first_login');
        if (!localUserFirstLoginConfig) {
            this.sqliteDb.prepare(`
                INSERT INTO system_config (config_key, config_value)
                VALUES (?, ?)
            `).run('local_user_first_login', 'false');
        }

        // Tabela de atendimentos/tickets
        this.sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS atendimentos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                cliente TEXT NOT NULL,
                empresa TEXT,
                problema TEXT NOT NULL,
                prioridade TEXT DEFAULT 'media',
                status TEXT DEFAULT 'resolvido',
                created_by INTEGER,
                updated_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                dataResolucao DATETIME,
                FOREIGN KEY (created_by) REFERENCES users (id)
            )
        `);

        // Índices para melhor performance
        this.sqliteDb.exec(`
            CREATE INDEX IF NOT EXISTS idx_atendimentos_status ON atendimentos(status);
            CREATE INDEX IF NOT EXISTS idx_atendimentos_prioridade ON atendimentos(prioridade);
            CREATE INDEX IF NOT EXISTS idx_atendimentos_cliente ON atendimentos(cliente);
            CREATE INDEX IF NOT EXISTS idx_atendimentos_created_at ON atendimentos(created_at);
        `);
    }

    async createMongoIndexes() {
        const usersCollection = this.mongoDb.collection('users');
        await usersCollection.createIndex({ username: 1 }, { unique: true });
        await usersCollection.createIndex({ email: 1 }, { unique: true });

        // Configurar collection de configurações do sistema
        const configCollection = this.mongoDb.collection('system_config');
        await configCollection.createIndex({ config_key: 1 }, { unique: true });

        // Configurar collection de atendimentos
        const atendimentosCollection = this.mongoDb.collection('atendimentos');
        await atendimentosCollection.createIndex({ status: 1 });
        await atendimentosCollection.createIndex({ prioridade: 1 });
        await atendimentosCollection.createIndex({ cliente: 1 });
        await atendimentosCollection.createIndex({ created_at: -1 });
        await atendimentosCollection.createIndex({ created_by: 1 });

        // Criar usuário admin padrão se não existir
        const adminExists = await usersCollection.findOne({ username: 'admin' });
        if (!adminExists) {
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            await usersCollection.insertOne({
                username: 'admin',
                email: 'admin@tecsave.com',
                password: hashedPassword,
                role: 'admin',
                created_at: new Date(),
                updated_at: new Date()
            });
            
            // Mostrar credenciais do .env
            const adminUser = process.env.ADMIN_ADMIN || 'admin';
            const adminPassword = process.env.PASSWORD_ADMIN || 'changepassword';
            console.log(`👤 Usuário admin criado (${adminUser}/${adminPassword})`);
        }

        // Inicializar configuração de primeiro login
        const firstLoginConfig = await configCollection.findOne({ config_key: 'default_credentials_used' });
        if (!firstLoginConfig) {
            await configCollection.insertOne({
                config_key: 'default_credentials_used',
                config_value: 'false',
                created_at: new Date(),
                updated_at: new Date()
            });
        }
    }

    async createUser(userData) {
        const { username, email, password, role = 'user' } = userData;
        const hashedPassword = bcrypt.hashSync(password, 10);

        if (this.dbType === 'mongodb') {
            const usersCollection = this.mongoDb.collection('users');
            const result = await usersCollection.insertOne({
                username,
                email,
                password: hashedPassword,
                role,
                created_at: new Date(),
                updated_at: new Date()
            });
            return { id: result.insertedId, username, email, role };
        } else {
            const stmt = this.sqliteDb.prepare(`
                INSERT INTO users (username, email, password, role)
                VALUES (?, ?, ?, ?)
            `);
            const result = stmt.run(username, email, hashedPassword, role);
            return { id: result.lastInsertRowid, username, email, role };
        }
    }

    async findUserByUsername(username) {
        if (this.dbType === 'mongodb') {
            const usersCollection = this.mongoDb.collection('users');
            return await usersCollection.findOne({ username });
        } else {
            const stmt = this.sqliteDb.prepare('SELECT * FROM users WHERE username = ?');
            return stmt.get(username);
        }
    }

    async findUserById(id) {
        if (this.dbType === 'mongodb') {
            const usersCollection = this.mongoDb.collection('users');
            return await usersCollection.findOne({ _id: id });
        } else {
            const stmt = this.sqliteDb.prepare('SELECT * FROM users WHERE id = ?');
            return stmt.get(id);
        }
    }

    async findUserByEmail(email) {
        if (this.dbType === 'mongodb') {
            const usersCollection = this.mongoDb.collection('users');
            return await usersCollection.findOne({ email });
        } else {
            const stmt = this.sqliteDb.prepare('SELECT * FROM users WHERE email = ?');
            return stmt.get(email);
        }
    }

    async getAllUsers() {
        if (this.dbType === 'mongodb') {
            const usersCollection = this.mongoDb.collection('users');
            return await usersCollection.find({}).toArray();
        } else {
            const stmt = this.sqliteDb.prepare('SELECT * FROM users ORDER BY created_at DESC');
            return stmt.all();
        }
    }

    async updateUser(id, userData) {
        const { username, email, password, role } = userData;
        
        if (password) {
            userData.password = bcrypt.hashSync(password, 10);
        }

        if (this.dbType === 'mongodb') {
            const updateData = { username, email, role, updated_at: new Date() };
            if (password) {
                updateData.password = userData.password;
            }
            const usersCollection = this.mongoDb.collection('users');
            await usersCollection.updateOne({ _id: id }, { $set: updateData });
        } else {
            // Para SQLite, converter a data para string no formato ISO
            const updateData = { username, email, role, updated_at: new Date().toISOString() };
            if (password) {
                updateData.password = userData.password;
            }
            
            const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updateData);
            values.push(id);
            
            const stmt = this.sqliteDb.prepare(`UPDATE users SET ${fields} WHERE id = ?`);
            stmt.run(...values);
        }
    }

    async deleteUser(id) {
        if (this.dbType === 'mongodb') {
            const usersCollection = this.mongoDb.collection('users');
            await usersCollection.deleteOne({ _id: id });
        } else {
            const stmt = this.sqliteDb.prepare('DELETE FROM users WHERE id = ?');
            stmt.run(id);
        }
    }

    async verifyPassword(plainPassword, hashedPassword) {
        return bcrypt.compareSync(plainPassword, hashedPassword);
    }

    async getSystemConfig(configKey) {
        if (this.dbType === 'mongodb') {
            const configCollection = this.mongoDb.collection('system_config');
            const config = await configCollection.findOne({ config_key: configKey });
            return config ? config.config_value : null;
        } else {
            const stmt = this.sqliteDb.prepare('SELECT config_value FROM system_config WHERE config_key = ?');
            const result = stmt.get(configKey);
            return result ? result.config_value : null;
        }
    }

    async setSystemConfig(configKey, configValue) {
        if (this.dbType === 'mongodb') {
            const configCollection = this.mongoDb.collection('system_config');
            await configCollection.updateOne(
                { config_key: configKey },
                { 
                    $set: { 
                        config_value: configValue,
                        updated_at: new Date()
                    }
                },
                { upsert: true }
            );
        } else {
            const stmt = this.sqliteDb.prepare(`
                INSERT OR REPLACE INTO system_config (config_key, config_value, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
            `);
            stmt.run(configKey, configValue);
        }
    }

    async close() {
        if (this.mongoClient) {
            await this.mongoClient.close();
        }
        if (this.sqliteDb) {
            this.sqliteDb.close();
        }
    }

    getDbType() {
        return this.dbType;
    }

    // 🎫 CRUD para Atendimentos/Tickets

    async createAtendimento(atendimentoData) {
        const now = new Date();
        const atendimento = {
            title: atendimentoData.title || atendimentoData.problema || 'Atendimento sem título',
            description: atendimentoData.description || atendimentoData.descricao || 'Descrição não informada',
            cliente: atendimentoData.cliente || 'Cliente não informado',
            empresa: atendimentoData.empresa || '',
            problema: atendimentoData.problema || 'Não especificado',
            prioridade: atendimentoData.prioridade || 'media',
            status: atendimentoData.status || 'em andamento',
            created_by: atendimentoData.created_by || null,
            created_at: now,
            updated_at: now
        };

        if (this.dbType === 'mongodb') {
            const collection = this.mongoDb.collection('atendimentos');
            const result = await collection.insertOne(atendimento);
            return { ...atendimento, id: result.insertedId };
        } else {
            const stmt = this.sqliteDb.prepare(`
                INSERT INTO atendimentos (title, description, cliente, empresa, problema, prioridade, status, created_by, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const result = stmt.run(
                atendimento.title,
                atendimento.description,
                atendimento.cliente,
                atendimento.empresa,
                atendimento.problema,
                atendimento.prioridade,
                atendimento.status,
                atendimento.created_by,
                atendimento.created_at.toISOString(),
                atendimento.updated_at.toISOString()
            );
            return { ...atendimento, id: result.lastInsertRowid };
        }
    }

    async getAllAtendimentos() {
        if (this.dbType === 'mongodb') {
            const collection = this.mongoDb.collection('atendimentos');
            const atendimentos = await collection.find({}).sort({ created_at: -1 }).toArray();
            return atendimentos.map(a => ({ ...a, id: a._id }));
        } else {
            const stmt = this.sqliteDb.prepare('SELECT * FROM atendimentos ORDER BY created_at DESC');
            return stmt.all();
        }
    }

    async getAtendimentoById(id) {
        if (this.dbType === 'mongodb') {
            const collection = this.mongoDb.collection('atendimentos');
            const atendimento = await collection.findOne({ _id: id });
            return atendimento ? { ...atendimento, id: atendimento._id } : null;
        } else {
            const numericId = parseInt(id, 10);
            const stmt = this.sqliteDb.prepare('SELECT * FROM atendimentos WHERE id = ?');
            return stmt.get(numericId);
        }
    }

    async updateAtendimento(id, updateData) {
        const now = new Date();
        
        if (this.dbType === 'mongodb') {
            updateData.updated_at = now;
            const collection = this.mongoDb.collection('atendimentos');
            const result = await collection.updateOne(
                { _id: id },
                { $set: updateData }
            );
            
            if (result.modifiedCount > 0) {
                // Retornar o atendimento atualizado
                const atendimentoAtualizado = await collection.findOne({ _id: id });
                return atendimentoAtualizado ? { ...atendimentoAtualizado, id: atendimentoAtualizado._id } : null;
            }
            return null;
        } else {
            // Para SQLite, converter a data para string no formato ISO e o ID para número
            updateData.updated_at = now.toISOString();
            const numericId = parseInt(id, 10);
            
            const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updateData);
            values.push(numericId);

            const stmt = this.sqliteDb.prepare(`UPDATE atendimentos SET ${fields} WHERE id = ?`);
            const result = stmt.run(...values);
            
            if (result.changes > 0) {
                // Retornar o atendimento atualizado
                const getStmt = this.sqliteDb.prepare('SELECT * FROM atendimentos WHERE id = ?');
                return getStmt.get(numericId);
            }
            return null;
        }
    }

    async deleteAtendimento(id) {
        if (this.dbType === 'mongodb') {
            const collection = this.mongoDb.collection('atendimentos');
            const result = await collection.deleteOne({ _id: id });
            return result.deletedCount > 0;
        } else {
            const stmt = this.sqliteDb.prepare('DELETE FROM atendimentos WHERE id = ?');
            const result = stmt.run(id);
            return result.changes > 0;
        }
    }

    async getAtendimentosByStatus(status) {
        if (this.dbType === 'mongodb') {
            const collection = this.mongoDb.collection('atendimentos');
            const atendimentos = await collection.find({ status }).sort({ created_at: -1 }).toArray();
            return atendimentos.map(a => ({ ...a, id: a._id }));
        } else {
            const stmt = this.sqliteDb.prepare('SELECT * FROM atendimentos WHERE status = ? ORDER BY created_at DESC');
            return stmt.all(status);
        }
    }

    async getAtendimentosByPriority(prioridade) {
        if (this.dbType === 'mongodb') {
            const collection = this.mongoDb.collection('atendimentos');
            const atendimentos = await collection.find({ prioridade }).sort({ created_at: -1 }).toArray();
            return atendimentos.map(a => ({ ...a, id: a._id }));
        } else {
            const stmt = this.sqliteDb.prepare('SELECT * FROM atendimentos WHERE prioridade = ? ORDER BY created_at DESC');
            return stmt.all(prioridade);
        }
    }

    async searchAtendimentos(searchTerm) {
        if (this.dbType === 'mongodb') {
            const collection = this.mongoDb.collection('atendimentos');
            const atendimentos = await collection.find({
                $or: [
                    { title: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } },
                    { cliente: { $regex: searchTerm, $options: 'i' } },
                    { problema: { $regex: searchTerm, $options: 'i' } }
                ]
            }).sort({ created_at: -1 }).toArray();
            return atendimentos.map(a => ({ ...a, id: a._id }));
        } else {
            const stmt = this.sqliteDb.prepare(`
                SELECT * FROM atendimentos 
                WHERE title LIKE ? OR description LIKE ? OR cliente LIKE ? OR problema LIKE ?
                ORDER BY created_at DESC
            `);
            const searchPattern = `%${searchTerm}%`;
            return stmt.all(searchPattern, searchPattern, searchPattern, searchPattern);
        }
    }
}

export default new DatabaseManager();