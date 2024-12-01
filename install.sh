#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Sistema de Recargas - Auto Instalador ===${NC}\n"

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

# Verificar dependências
echo -e "${YELLOW}Verificando dependências...${NC}"

# Verificar Node.js
if ! command -v node &> /dev/null; then
  echo "Node.js não encontrado. Instalando..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
  check_success "Instalação do Node.js"
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
  echo "npm não encontrado. Instalando..."
  apt-get install -y npm
  check_success "Instalação do npm"
fi

# Verificar PM2
if ! command -v pm2 &> /dev/null; then
  echo "PM2 não encontrado. Instalando..."
  npm install -g pm2
  check_success "Instalação do PM2"
fi

# Solicitar informações
echo -e "\n${YELLOW}Configuração do domínio${NC}"
read -p "Digite seu domínio (ex: maxrecargas.digital): " DOMAIN
read -p "Digite o diretório de instalação [/home/$DOMAIN/public_html]: " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-/home/$DOMAIN/public_html}

# Criar diretório de instalação
mkdir -p $INSTALL_DIR
check_success "Criação do diretório de instalação"

# Configurar Nginx
echo -e "\n${YELLOW}Configurando Nginx...${NC}"
cat > /etc/nginx/conf.d/$DOMAIN.conf << EOL
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    root $INSTALL_DIR/dist;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api/webhooks/mercadopago {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOL
check_success "Configuração do Nginx"

# Configurar PM2
echo -e "\n${YELLOW}Configurando PM2...${NC}"
cat > $INSTALL_DIR/ecosystem.config.js << EOL
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

# Clonar repositório
echo -e "\n${YELLOW}Clonando repositório...${NC}"
cd $INSTALL_DIR
git clone https://github.com/seu-usuario/recharge-system.git .
check_success "Clone do repositório"

# Instalar dependências
echo -e "\n${YELLOW}Instalando dependências...${NC}"
npm install
check_success "Instalação de dependências"

# Build do projeto
echo -e "\n${YELLOW}Gerando build...${NC}"
npm run build
check_success "Build do projeto"

# Configurar SSL com Let's Encrypt
echo -e "\n${YELLOW}Configurando SSL...${NC}"
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
check_success "Configuração do SSL"

# Iniciar aplicação
echo -e "\n${YELLOW}Iniciando aplicação...${NC}"
pm2 start ecosystem.config.js
pm2 save
pm2 startup
check_success "Inicialização da aplicação"

# Reiniciar Nginx
systemctl restart nginx
check_success "Reinício do Nginx"

# Configurar backup automático
echo -e "\n${YELLOW}Configurando backup automático...${NC}"
BACKUP_SCRIPT="/usr/local/bin/backup-recharge-system.sh"
cat > $BACKUP_SCRIPT << EOL
#!/bin/bash
BACKUP_DIR="/backup/recharge-system"
mkdir -p \$BACKUP_DIR
tar -czf \$BACKUP_DIR/backup-\$(date +%Y%m%d).tar.gz $INSTALL_DIR
find \$BACKUP_DIR -type f -mtime +7 -delete
EOL
chmod +x $BACKUP_SCRIPT

# Adicionar ao crontab
(crontab -l 2>/dev/null; echo "0 3 * * * $BACKUP_SCRIPT") | crontab -
check_success "Configuração do backup"

echo -e "\n${GREEN}Instalação concluída com sucesso!${NC}"
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
echo "- Atualizar sistema: cd $INSTALL_DIR && ./update.sh"