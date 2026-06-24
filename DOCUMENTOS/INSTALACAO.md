# Guia de Instalação — Bellex

## Stack atual

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + Vite + TypeScript |
| Banco + Auth + Storage | Supabase (multi-tenant via RLS por `clinic_id`) |
| API de IA / WhatsApp | Node.js + Express + PM2 na VPS (porta 3001) |
| Servidor | VPS KVM4 Hostinger — `76.13.225.174` |
| Proxy | Nginx (serve o frontend + proxy `/api/` → Node) |
| WhatsApp | EvoAPI (instância por número) |
| IA | OpenAI GPT-4o mini |
| Memória de conversa | Redis na VPS (TTL 6h, últimas 10 mensagens) |
| Storage | Supabase Storage (bucket `clinic-branding`) |

---

## Arquitetura multi-tenant

Todos os clientes (Studio13, Espaço Vip, etc.) compartilham:
- O mesmo Supabase principal (dados isolados por `clinic_id` via RLS)
- A mesma API REST na VPS (cada clínica tem seus prompts e configs no banco)
- O mesmo Nginx

Cada cliente tem:
- Subdomínio próprio (`studio13.bellex.beauty`, `espacovip.bellex.beauty`)
- Domínio customizado opcional (`app.studio13.com.br`)
- Instância EvoAPI própria (número de WhatsApp da clínica)
- Prompt do agente, cor e logo configurados no painel do Workspace

---

## Tipos de instalação

### Tipo A — Clínica solo
Cliente independente, sem franquia. Um subdomínio, uma clínica.

### Tipo B — Workspace (Whitelabel)
Cliente com painel de gestora (Workspace) + uma ou mais clínicas.
Ex: Studio13 (Patricia) gerencia o painel de workspace e tem a clínica embaixo.

---

## 1. API REST (fazer 1x — serve todos os clientes)

A API já roda na VPS e é compartilhada. Só precisa deste setup na primeira vez ou ao fazer deploy de atualização.

### Primeiro deploy na VPS

```bash
ssh root@76.13.225.174

# instalar dependências globais (só na primeira vez)
npm install -g pm2 tsx

# copiar .env da API
cp /var/www/bellex/api/.env.example /var/www/bellex/api/.env
nano /var/www/bellex/api/.env
```

Variáveis do `/var/www/bellex/api/.env`:

```env
SUPABASE_URL=https://jrvkdekyupcxzbxtlnwu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
OPENAI_API_KEY=<chave_openai_bellex>
REDIS_URL=redis://:KBSqDRIl9RjDYGraXBDemRviGXCwwE3y@localhost:6379
EVOAPI_URL=<url_da_instância_evoapi>
EVOAPI_KEY=<api_key_evoapi>
WEBHOOK_SECRET=<segredo_para_validar_payload>
API_PORT=3001
```

```bash
# iniciar com PM2
cd /var/www/bellex
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### Deploy de atualização da API

```bash
# na máquina local — o rsync já inclui api/
sshpass -p 'Fg8L?6EpWBYwh5qD7#' rsync -az --delete \
  -e "ssh -o StrictHostKeyChecking=no -o PreferredAuthentications=password" \
  --exclude='.env' \
  api/ root@76.13.225.174:/var/www/bellex/api/

# reiniciar
ssh root@76.13.225.174 "pm2 restart bellex-api"
```

### Nginx — proxy da API (configurar 1x)

Em `/etc/nginx/sites-available/bellex`:

```nginx
location /api/ {
  proxy_pass http://localhost:3001/;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

---

## 2. Novo cliente — passo a passo

### 2.1 Criar no Supabase

No painel do Super Admin ou direto no Supabase:

```sql
-- criar workspace (se for Whitelabel)
INSERT INTO workspace_licenses (owner_email, workspace_name, plan, seats)
VALUES ('patricia@studio13.com', 'Studio13', 'ws_starter', 5);

-- criar a clínica
INSERT INTO workspace_clinics (workspace_id, name, subdomain, color, plan)
VALUES ('<workspace_id>', 'Studio 13', 'studio13', '#C2185B', 'pro');
```

Ou via painel Super Admin em `ws.bellex.beauty`.

### 2.2 Criar usuário admin

No Supabase → Authentication → Users → **Invite user**
- E-mail da cliente (Patricia / Ana)
- Ela recebe o convite e define a senha

### 2.3 Configurar subdomínio no Nginx

Em `/etc/nginx/sites-available/bellex`, adicionar server block:

```nginx
server {
  listen 80;
  server_name studio13.bellex.beauty;
  root /var/www/bellex/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://localhost:3001/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

```bash
nginx -t && systemctl reload nginx
```

SSL (HTTPS) — certbot:

```bash
certbot --nginx -d studio13.bellex.beauty
```

### 2.4 DNS

No painel de DNS do domínio `bellex.beauty`, adicionar registro A:

```
studio13  →  76.13.225.174
```

Se cliente tiver domínio próprio (`app.studio13.com.br`):
```
app  →  76.13.225.174   (no DNS do domínio da cliente)
```
E atualizar `workspace_clinics.custom_domain = 'app.studio13.com.br'`.

### 2.5 Branding

Feito via painel do Workspace — não requer deploy:

- **Cor primária**: configurada em `workspace_clinics.color` (hex) → aplicada dinamicamente por subdomínio
- **Logo**: upload via painel → salvo no bucket `clinic-branding` do Supabase Storage → `workspace_clinics.logo_url`
- **Nome da clínica**: `workspace_clinics.name`

A tela de login e o header leem `logo_url` e `color` automaticamente ao acessar o subdomínio.

### 2.6 WhatsApp (EvoAPI)

Cada clínica tem sua instância (número próprio):

1. No painel EvoAPI, criar instância com nome único (ex: `studio13`)
2. Conectar via QR Code
3. Configurar webhook da instância:
   ```
   URL: https://bellex.beauty/api/webhook/whatsapp
   Header: x-webhook-secret: <WEBHOOK_SECRET>
   ```
4. Registrar no banco:
   ```sql
   UPDATE clinics SET whatsapp_number = 'studio13' WHERE id = '<clinic_id>';
   ```

### 2.7 Agente de IA — configurar por clínica

Cada clínica tem seu próprio prompt e critérios de qualificação. A API usa sempre o mesmo código, mas lê as configs do banco para cada clínica.

No Supabase ou via Super Admin:

```sql
INSERT INTO agent_configs (clinica_id, system_prompt, ativo)
VALUES (
  '<clinic_id>',
  'Você é a assistente virtual do Studio 13, clínica de estética da Patricia...',
  true
);

-- configurar pipeline stages (colunas do CRM + critérios de movimentação)
INSERT INTO pipeline_stages (clinica_id, nome, criterio_movimentacao, agent_id, ordem)
VALUES
  ('<clinic_id>', 'Novo Lead', 'primeiro contato', '<agent_id>', 1),
  ('<clinic_id>', 'Qualificado', 'paciente quer agendar', '<agent_id>', 2),
  ('<clinic_id>', 'Aguardando Humano', null, null, 3); -- sem agent_id = IA para
```

### 2.8 Onboarding da cliente

- [ ] Acesso ao app (`studio13.bellex.beauty`) funcionando
- [ ] Login com e-mail de convite
- [ ] Cadastrar especialistas e definir roles
- [ ] Cadastrar serviços com duração e preço
- [ ] Configurar horários de funcionamento
- [ ] Upload de logo e cor no painel de configurações
- [ ] Conectar WhatsApp via QR Code
- [ ] Testar fluxo: mensagem no WhatsApp → agente responde → agendamento criado

---

## 3. Deploy do frontend

```bash
# build
bun run build

# enviar para VPS
sshpass -p 'Fg8L?6EpWBYwh5qD7#' rsync -az --delete \
  -e "ssh -o StrictHostKeyChecking=no -o PreferredAuthentications=password" \
  dist/ root@76.13.225.174:/var/www/bellex/dist/
```

O mesmo `dist/` serve todos os subdomínios — o Nginx aponta todos para `/var/www/bellex/dist/`. O branding (cor + logo) é aplicado em runtime via banco de dados, não no build.

---

## 4. Checklist pré-entrega por cliente

- [ ] Subdomínio acessível via HTTPS
- [ ] Login funciona com o usuário criado
- [ ] Logo e cor corretos na tela de login e header
- [ ] Agendamento online público acessível (`studio13.bellex.beauty/booking`)
- [ ] WhatsApp conectado (QR Code lido, instância online)
- [ ] Agente de IA responde no WhatsApp
- [ ] Agendamento criado via IA aparece na agenda
- [ ] Upload de foto funciona (Supabase Storage)

---

## Clientes ativos

| Cliente | Tipo | Subdomínio | Responsável |
|---------|------|-----------|-------------|
| Studio 13 | Workspace Whitelabel | `studio13.bellex.beauty` | Patricia |
| Espaço Vip | Workspace Whitelabel | `espacovip.bellex.beauty` | Ana |
