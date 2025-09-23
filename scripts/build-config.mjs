#!/usr/bin/env node

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🔧 Script para gerar config.xml a partir do template
 * Substitui placeholders pelas variáveis de ambiente
 */

const TEMPLATE_PATH = path.join(__dirname, '..', 'config.template.xml');
const OUTPUT_PATH = path.join(__dirname, '..', 'config.xml');

function generateConfigXml() {
    try {
        console.log('🔧 Gerando config.xml...');
        
        // Ler o template
        if (!fs.existsSync(TEMPLATE_PATH)) {
            throw new Error(`Template não encontrado: ${TEMPLATE_PATH}`);
        }
        
        let templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf8');
        
        // Substituir placeholders
        const replacements = {
            '{{WEBSITE_NAME}}': process.env.WEBSITE_NAME || 'Sistema de Atendimento'
        };
        
        for (const [placeholder, value] of Object.entries(replacements)) {
            templateContent = templateContent.replace(new RegExp(placeholder, 'g'), value);
        }
        
        // Escrever o arquivo final
        fs.writeFileSync(OUTPUT_PATH, templateContent, 'utf8');
        
        console.log('✅ config.xml gerado com sucesso!');
        console.log(`📄 Template: ${TEMPLATE_PATH}`);
        console.log(`📄 Output: ${OUTPUT_PATH}`);
        console.log(`🏷️  Website Name: ${process.env.WEBSITE_NAME || 'Sistema de Atendimento'}`);
        
    } catch (error) {
        console.error('❌ Erro ao gerar config.xml:', error.message);
        process.exit(1);
    }
}

// Executar sempre quando chamado diretamente
generateConfigXml();

export { generateConfigXml };