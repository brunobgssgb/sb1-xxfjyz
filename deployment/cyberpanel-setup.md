# Guia de Implantação no CyberPanel

## 1. Pré-requisitos

- Acesso ao CyberPanel
- Domínio configurado
- Node.js 18+ instalado
- PM2 para gerenciamento de processos

## 2. Configuração do Domínio

1. No CyberPanel, crie um novo site:
   - Vá para `Websites` > `Create Website`
   - Digite seu domínio
   - Selecione `Node.js` como tipo de aplicação

2. Configure o SSL:
   - Vá para `SSL` > `Issue SSL`
   - Selecione Let's Encrypt
   - Clique em "Issue"

## 3. Configuração do Projeto

1. Acesse o servidor via SSH:
```bash
ssh usuario@seu-servidor
```

2. Navegue até o diretório do site:
```bash
cd /home/nome-do-site/public_html
```

3. Clone o projeto:
```bash
git clone seu-repositorio .
```

4. Instale as dependências:
```bash
npm install
```

5. Crie o arquivo de ambiente:
```bash
cat > .env << EOL
VITE_API_URL=https://seu-dominio.com
NODE_ENV=production
EOL
```

## 4. Build do Projeto

1. Gere a build de produção:
```bash
npm run build
```

## 5. Configuração do PM2

1. Instale o PM2 globalmente:
```bash
npm install -g pm2
```

2. Crie o arquivo de configuração do PM2:
```bash
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
```

3. Inicie a aplicação:
```bash
pm2 start ecosystem.config.js
```

4. Configure o startup automático:
```bash
pm2 startup
pm2 save
```

## 6. Configuração do Nginx

1. Crie a configuração do proxy reverso:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Endpoint para webhooks do Mercado Pago
    location /api/webhooks/mercadopago {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

2. Teste e recarregue o Nginx:
```bash
nginx -t
systemctl reload nginx
```

## 7. Configuração do Firewall

1. Abra as portas necessárias:
```bash
ufw allow 80
ufw allow 443
ufw allow 3000
```

## 8. Monitoramento

1. Monitore os logs:
```bash
pm2 logs
```

2. Monitore o status:
```bash
pm2 status
```

## 9. Backup

1. Configure backups automáticos:
```bash
# No crontab
0 3 * * * tar -czf /backup/recharge-system-$(date +\%Y\%m\%d).tar.gz /home/nome-do-site/public_html
```

## 10. Manutenção

Para atualizar o sistema:
```bash
# Pare a aplicação
pm2 stop recharge-system

# Atualize o código
git pull

# Instale dependências
npm install

# Gere nova build
npm run build

# Reinicie a aplicação
pm2 restart recharge-system
```

## 11. Troubleshooting

### Logs
- Logs do PM2: `pm2 logs`
- Logs do Nginx: `/var/log/nginx/error.log`
- Logs da Aplicação: `/home/nome-do-site/public_html/logs/`

### Comandos Úteis
```bash
# Reiniciar aplicação
pm2 restart recharge-system

# Verificar status
pm2 status

# Verificar uso de memória
pm2 monit
```