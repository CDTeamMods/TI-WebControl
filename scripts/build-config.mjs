#!/usr/bin/env node

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🔧 Script para gerar config.xml e chcp.json a partir dos templates
 * Substitui placeholders pelas variáveis de ambiente
 */

const CONFIG_TEMPLATE_PATH = path.join(__dirname, '..', 'template', 'config.template.xml');
const CONFIG_OUTPUT_PATH = path.join(__dirname, '..', 'config.xml');
const CHCP_TEMPLATE_PATH = path.join(__dirname, '..', 'template', 'chcp.template.json');
const CHCP_OUTPUT_PATH = path.join(__dirname, '..', 'www', 'chcp.json');

/**
 * Gera uma data/hora no formato para release
 * @returns {string} Data no formato YYYY.MM.DD-HH.mm.ss
 */
function generateReleaseVersion() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}.${month}.${day}-${hours}.${minutes}.${seconds}`;
}

/**
 * Gera o arquivo config.xml
 */
function generateConfigXml() {
    try {
        console.log('🔧 Gerando config.xml...');
        
        // Ler o template
        if (!fs.existsSync(CONFIG_TEMPLATE_PATH)) {
            throw new Error(`Template não encontrado: ${CONFIG_TEMPLATE_PATH}`);
        }
        
        let templateContent = fs.readFileSync(CONFIG_TEMPLATE_PATH, 'utf8');
        
        // Substituir placeholders
        const replacements = {
            '{{WEBSITE_NAME}}': process.env.WEBSITE_NAME || 'Sistema de Atendimento'
        };
        
        for (const [placeholder, value] of Object.entries(replacements)) {
            templateContent = templateContent.replace(new RegExp(placeholder, 'g'), value);
        }
        
        // Escrever o arquivo final
        fs.writeFileSync(CONFIG_OUTPUT_PATH, templateContent, 'utf8');
        
        console.log('✅ config.xml gerado com sucesso!');
        console.log(`📄 Template: ${CONFIG_TEMPLATE_PATH}`);
        console.log(`📄 Output: ${CONFIG_OUTPUT_PATH}`);
        
    } catch (error) {
        console.error('❌ Erro ao gerar config.xml:', error.message);
        throw error;
    }
}

/**
 * Gera o arquivo chcp.json
 */
function generateChcpJson() {
    try {
        console.log('🔧 Gerando chcp.json...');
        
        // Ler o template
        if (!fs.existsSync(CHCP_TEMPLATE_PATH)) {
            throw new Error(`Template não encontrado: ${CHCP_TEMPLATE_PATH}`);
        }
        
        let templateContent = fs.readFileSync(CHCP_TEMPLATE_PATH, 'utf8');
        
        // Substituir placeholders
        const replacements = {
            '{{WEBSITE_NAME}}': process.env.WEBSITE_NAME || 'Sistema de Atendimento',
            '{{IOS_IDENTIFIER}}': process.env.IOS_IDENTIFIER || '',
            '{{ANDROID_IDENTIFIER}}': process.env.ANDROID_IDENTIFIER || 'com.tiwebcontrol.suporte',
            '{{UPDATE_MODE}}': process.env.UPDATE_MODE || 'now',
            '{{CONTENT_URL}}': process.env.CONTENT_URL || "https://example.webisite",
            '{{RELEASE_VERSION}}': generateReleaseVersion(),
            '{{MIN_NATIVE_INTERFACE}}': process.env.MIN_NATIVE_INTERFACE || '1',
            '{{AUTO_DOWNLOAD}}': process.env.AUTO_DOWNLOAD === 'false' ? 'false' : 'true',
            '{{AUTO_INSTALL}}': process.env.AUTO_INSTALL === 'false' ? 'false' : 'true'
        };
        
        for (const [placeholder, value] of Object.entries(replacements)) {
            templateContent = templateContent.replace(new RegExp(placeholder, 'g'), value);
        }
        
        // Escrever o arquivo final
        fs.writeFileSync(CHCP_OUTPUT_PATH, templateContent, 'utf8');
        
        console.log('✅ chcp.json gerado com sucesso!');
        console.log(`📄 Template: ${CHCP_TEMPLATE_PATH}`);
        console.log(`📄 Output: ${CHCP_OUTPUT_PATH}`);
        
    } catch (error) {
        console.error('❌ Erro ao gerar chcp.json:', error.message);
        throw error;
    }
}

/**
 * Gera todos os arquivos de configuração
 */
function generateAllConfigs() {
    try {
        console.log('🚀 Iniciando geração de arquivos de configuração...');
        console.log(`🏷️  Website Name: ${process.env.WEBSITE_NAME || 'Sistema de Atendimento'}`);
        console.log(`🌐 Content URL: ${process.env.CONTENT_URL || 'https://cdsuporte.squareweb.app'}`);
        console.log('');
        
        generateConfigXml();
        generateChcpJson();
        
        console.log('');
        console.log('🎉 Todos os arquivos de configuração foram gerados com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante a geração:', error.message);
        process.exit(1);
    }
}

// Executar sempre quando chamado diretamente
generateAllConfigs();

export { generateConfigXml, generateChcpJson, generateAllConfigs };