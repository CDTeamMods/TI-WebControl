# 🛠️ TI-WebControl

Sistema de Suporte Técnico moderno e responsivo para Web e Mobile, desenvolvido com Node.js e Cordova.

[![Version](https://img.shields.io/github/package-json/v/CDTeamMods/TI-WebControl?filename=package.json&style=social&logo=GitHub&logoSize=auto&label=Version)](https://github.com/CDTeamMods/TI-WebControl)
[![License](https://img.shields.io/github/license/CDTeamMods/TI-WebControl?style=social&logoSize=auto)](https://github.com/CDTeamMods/TI-WebControl/blob/main/LICENSE)

## 📋 Sobre o Projeto

O **TI-WebControl** é uma solução completa para gerenciamento de atendimentos técnicos, oferecendo:

- 🌐 **Interface Web Responsiva** - Acesso via navegador com design moderno
- 📱 **Aplicativo Mobile** - App nativo Android via Cordova
- 📊 **Exportação Excel** - Relatórios detalhados dos atendimentos
- 🔄 **Hot Code Push** - Atualizações automáticas do app mobile
- 🎨 **UI/UX Moderna** - Interface intuitiva com menu hambúrguer responsivo

## 📦 Instalação

### Pré-requisitos

- Node.js >= v22.19.0
- Yarn (recomendado)
- Android SDK (para build mobile)

### 1. Clone o repositório

```bash
git clone https://github.com/CDTeamMods/TI-WebControl.git
cd TI-WebControl
```

### 2. Instale as dependências

```bash
yarn install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
WEBSITE_NAME="TI-WebControl"
IOS_IDENTIFIER=""
ANDROID_IDENTIFIER="com.tiwebcontrol.suporte"
UPDATE_MODE="now"
CONTENT_URL=""
MIN_NATIVE_INTERFACE=""
AUTO_DOWNLOAD=true
AUTO_INSTALL=true

PORT=3000
```

### 4. Gere o arquivo de configuração

```bash
yarn build:config
```

## 🎯 Como Usar

### Desenvolvimento Web

```bash
# Inicia o servidor de desenvolvimento
yarn start

# Ou usando modo dev
yarn dev
```

Acesse: `http://localhost:8080`

### Build Mobile

```bash
# Adiciona plataforma Android (primeira vez)
yarn cordova:add

# Gera o APK
yarn build

# Executa no dispositivo/emulador
yarn cordova:run
```

### Hot Code Push (Mobile)

```bash
# Gera build para HCP
yarn hcp:build

# Inicia servidor HCP
yarn hcp:server
```

## 🔧 Configuração

### Variáveis de Ambiente

O projeto utiliza variáveis de ambiente para configuração:

- `WEBSITE_NAME` - Nome exibido no app e web
- `PORT` - Porta do servidor (padrão: 8080)

### Configuração Dinâmica

O sistema gera automaticamente o `config.xml` do Cordova baseado no template e nas variáveis de ambiente, garantindo sincronização entre web e mobile.

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **CDTeamMods** - *Desenvolvimento inicial* - [GitHub](https://github.com/CDTeamMods)

## 📞 Suporte

- 📧 Email: contato@cdteam.xyz
- 🐛 Issues: [GitHub Issues](https://github.com/CoohCooh/Suporte-TecSave/issues)