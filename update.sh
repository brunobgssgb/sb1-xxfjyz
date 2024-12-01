#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Sistema de Recargas - Atualizador ===${NC}\n"

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

# Backup antes da atualização
echo -e "${YELLOW}Criando backup...${NC}"
BACKUP_DIR="/backup/recharge-system"
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/pre-update-$(date +%Y%m%d_%H%M%S).tar.gz .
check_success "Backup"

# Atualizar código
echo -e "\n${YELLOW}Atualizando código...${NC}"
git pull
check_success "Atualização do código"

# Atualizar dependências
echo -e "\n${YELLOW}Atualizando dependências...${NC}"
npm install
check_success "Atualização de dependências"

# Gerar nova build
echo -e "\n${YELLOW}Gerando nova build...${NC}"
npm run build
check_success "Build"

# Reiniciar aplicação
echo -e "\n${YELLOW}Reiniciando aplicação...${NC}"
pm2 restart recharge-system
check_success "Reinício da aplicação"

echo -e "\n${GREEN}Atualização concluída com sucesso!${NC}"