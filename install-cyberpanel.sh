#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Sistema de Recargas - Instalador CyberPanel ===${NC}\n"

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Por favor, execute este script como root${NC}"
  exit 1
fi

# Função para verificar sucesso
check_success() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $1${NC}"
  else
    echo -e "${RED}✗ $1${NC}"
    exit 1
  fi
}

# Verificar Node.js
if ! command -v node &> /dev/null; then
  echo "Node.js não encontrado. Instalando..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
  check_success "Instalação do Node.js"
fi

# Verificar PM2
if ! command -v pm2 &> /dev/null; then
  echo "PM2 não encontrado. Instalando..."
  npm install -g pm2
  check_success "Instalação do PM2"
fi

# Configuração do domínio
echo -e "\n${YELLOW}Configuração do sistema${NC}"
read -p "Digite o domínio já configurado no CyberPanel (ex: maxrecargas.digital): " DOMAIN

# Diretório do site no CyberPanel
SITE_DIR="/home/$DOMAIN/public_html"

# Verificar se o diretório existe
if [ ! -d "$SITE_DIR" ]; then
  echo -e "${RED}Erro: Diretório $SITE_DIR não encontrado${NC}"
  echo -e "Certifique-se de que o domínio está corretamente configurado no CyberPanel"
  exit 1
fi

# Fazer backup do diretório atual se existir conteúdo
if [ "$(ls -A $SITE_DIR)" ]; then
  echo -e "\n${YELLOW}Fazendo backup do conteúdo atual...${NC}"
  BACKUP_DIR="/backup/recharge-system"
  mkdir -p $BACKUP_DIR
  tar -czf $BACKUP_DIR/pre-install-$(date +%Y%m%d_%H%M%S).tar.gz -C $SITE_DIR .
  check_success "Backup do conteúdo atual"
  
  # Limpar diretório
  rm -rf $SITE_DIR/*
  check_success "Limpeza do diretório"
fi

# Copiar arquivos do projeto
echo -e "\n${YELLOW}Copiando arquivos do projeto...${NC}"
cp -r ./* $SITE_DIR/
check_success "Cópia dos arquivos"

# Navegar até o diretório
cd $SITE_DIR

# Instalar dependências
echo -e "\n${YELLOW}Instalando dependências...${NC}"
npm install
check_success "Instalação de dependências"

# Build do projeto
echo -e "\n${YELLOW}Gerando build...${NC}"
npm run build
check_success "Build do projeto"

# Configurar PM2
echo -e "\n${YELLOW}Configurando PM2...${NC}"
cat > ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: 'recharge-system',
    script: 'npm',
    args: 'run preview',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOL
check_success "Configuração do PM2"

# Iniciar aplicação com PM2
echo -e "\n${YELLOW}Iniciando aplicação...${NC}"
pm2 start ecosystem.config.js
pm2 save
pm2 startup
check_success "Inicialização da aplicação"

# Configurar backup automático
echo -e "\n${YELLOW}Configurando backup automático...${NC}"
BACKUP_SCRIPT="/usr/local/bin/backup-recharge-system.sh"
cat > $BACKUP_SCRIPT << EOL
#!/bin/bash
BACKUP_DIR="/backup/recharge-system"
mkdir -p \$BACKUP_DIR
tar -czf \$BACKUP_DIR/backup-\$(date +%Y%m%d).tar.gz $SITE_DIR
find \$BACKUP_DIR -type f -mtime +7 -delete
EOL
chmod +x $BACKUP_SCRIPT

# Adicionar ao crontab
(crontab -l 2>/dev/null; echo "0 3 * * * $BACKUP_SCRIPT") | crontab -
check_success "Configuração do backup"

# Criar arquivo de configuração do proxy
echo -e "\n${YELLOW}Gerando configuração do proxy...${NC}"
cat > proxy.conf << EOL
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
}

location /api/webhooks/mercadopago {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    
    # Aumentar timeouts para processamento de webhooks
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
EOL
check_success "Geração da configuração do proxy"

echo -e "\n${GREEN}Instalação concluída com sucesso!${NC}"
echo -e "\nPróximos passos:"
echo -e "1. No CyberPanel, vá até Websites > List Websites"
echo -e "2. Clique no seu domínio ($DOMAIN)"
echo -e "3. Vá para 'Proxy Settings'"
echo -e "4. Cole o conteúdo do arquivo proxy.conf gerado em $SITE_DIR/proxy.conf"
echo -e "5. Salve as configurações"
echo -e "\nAcesse: https://$DOMAIN"
echo -e "Credenciais padrão:"
echo -e "Email: admin@admin.com"
echo -e "Senha: admin123"
echo -e "\n${YELLOW}IMPORTANTE: Altere a senha do administrador após o primeiro acesso!${NC}"

# Exibir informações úteis
echo -e "\n${YELLOW}Comandos úteis:${NC}"
echo "- Verificar status: pm2 status"
echo "- Visualizar logs: pm2 logs"
echo "- Reiniciar aplicação: pm2 restart recharge-system"
echo "- Atualizar sistema: cd $SITE_DIR && ./update.sh"

# Exibir conteúdo do proxy.conf
echo -e "\n${YELLOW}Configuração do proxy para copiar:${NC}"
echo -e "${GREEN}----------------------------------------${NC}"
cat proxy.conf
echo -e "${GREEN}----------------------------------------${NC}"