# 🛠️ TI-WebControl

Sistema de Suporte Técnico moderno e responsivo para Web, desenvolvido com Node.js e Cordova.

[![Version](https://img.shields.io/github/package-json/v/CDTeamMods/TI-WebControl/main?style=for-the-badge&logo=github&label=VERSION&cacheSeconds=300)](https://github.com/CDTeamMods/TI-WebControl)
[![License](https://img.shields.io/github/license/CDTeamMods/TI-WebControl?style=for-the-badge&logo=opensourceinitiative&logoColor=lightgreen&cacheSeconds=300)](https://github.com/CDTeamMods/TI-WebControl/blob/main/LICENSE)

## 📋 Sobre o Projeto

O **TI-WebControl** é uma solução completa para gerenciamento de atendimentos técnicos, oferecendo:

- 🌐 **Interface Web Responsiva** - Acesso via navegador com design moderno
- 📊 **Exportação Excel** - Relatórios detalhados dos atendimentos
- 🎨 **UI/UX Moderna** - Interface intuitiva com menu hambúrguer responsivo

## 📦 Instalação

### Pré-requisitos

- Node.js >= v25.9.0
- Yarn (recomendado) >= 1.22.22

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

## 🔧 Configuração

### Variáveis de Ambiente

O projeto utiliza variáveis de ambiente para configuração:

- `WEBSITE_NAME` - Nome exibido no app e web
- `PORT` - Porta do servidor (padrão: 8080)

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