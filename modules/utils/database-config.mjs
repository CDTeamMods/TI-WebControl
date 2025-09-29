import chalk from 'chalk';
import 'dotenv/config';

/**
 * 🗄️ Configurador de Banco de Dados
 * Gerencia a configuração e validação de conexões de banco
 */
class DatabaseConfig {
    constructor() {
        this.useMongoDB = process.env.USE_MONGODB === 'true';
        this.useSQLite = process.env.USE_SQLITE === 'true';
        this.mongodbUri = process.env.MONGODB_URI;
    }

    /**
     * 🔍 Valida e determina qual banco de dados usar
     * @returns {Object} Configuração do banco de dados
     */
    validateAndGetConfig() {
        console.log(chalk.blue.bold('\n🔧 Configurando Sistema de Banco de Dados...\n'));

        // Verificar se MongoDB está habilitado
        if (this.useMongoDB) {
            console.log(chalk.cyan('📊 MongoDB habilitado na configuração'));
            
            if (!this.mongodbUri || this.mongodbUri.trim() === '') {
                console.log(chalk.red.bold('❌ ERRO: MongoDB habilitado mas MONGODB_URI está vazio!'));
                console.log(chalk.yellow('💡 Dica: Configure a variável MONGODB_URI no arquivo .env'));
                this.exitWithError();
            }

            console.log(chalk.green('✅ MongoDB configurado corretamente'));
            console.log(chalk.gray(`🔗 URI: ${this.mongodbUri.substring(0, 20)}...`));
            
            return {
                type: 'mongodb',
                uri: this.mongodbUri,
                enabled: true
            };
        }

        // Verificar se SQLite está habilitado
        if (this.useSQLite) {
            console.log(chalk.cyan('📊 SQLite habilitado na configuração'));
            console.log(chalk.green('✅ SQLite configurado corretamente'));
            console.log(chalk.gray('📁 Banco local será utilizado'));
            
            return {
                type: 'sqlite',
                enabled: true
            };
        }

        // Nenhum banco configurado
        console.log(chalk.red.bold('❌ ERRO CRÍTICO: Nenhum banco de dados configurado!'));
        console.log(chalk.yellow('📋 Configurações encontradas:'));
        console.log(chalk.gray(`   USE_MONGODB: ${this.useMongoDB}`));
        console.log(chalk.gray(`   USE_SQLITE: ${this.useSQLite}`));
        console.log(chalk.yellow('\n💡 Soluções possíveis:'));
        console.log(chalk.white('   1. Configure USE_MONGODB=true e defina MONGODB_URI'));
        console.log(chalk.white('   2. Configure USE_SQLITE=true para usar banco local'));
        
        this.exitWithError();
    }

    /**
     * 🚨 Encerra o processo com erro
     */
    exitWithError() {
        console.log(chalk.red.bold('\n🛑 Sistema interrompido devido a erro de configuração\n'));
        process.exit(1);
    }

    /**
     * 📊 Exibe informações de configuração
     */
    displayConfig() {
        const config = this.validateAndGetConfig();
        
        console.log(chalk.blue.bold('\n📋 Resumo da Configuração:'));
        console.log(chalk.white('─'.repeat(40)));
        console.log(chalk.cyan(`🗄️  Tipo de Banco: ${config.type.toUpperCase()}`));
        
        if (config.type === 'mongodb') {
            console.log(chalk.cyan(`🔗 URI: ${config.uri}`));
        } else {
            console.log(chalk.cyan('📁 Arquivo: database.sqlite (local)'));
        }
        
        console.log(chalk.green('✅ Status: Configurado e pronto'));
        console.log(chalk.white('─'.repeat(40)));
        
        return config;
    }
}

export default new DatabaseConfig();