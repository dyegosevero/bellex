# Guia de Instalação — Bellex

Dois builds, um produto. O mesmo código serve para ambas as situações.

```
bun run build:clinic  →  app da clínica (sempre instalado)
bun run build:admin   →  Workspace (só na Situação 2)
```

---

## Situação 1 — Solo (uma clínica, um app)

**Quando usar:** cliente quer um app só para ela, sem filiais.

### 1. Supabase

- [ ] Criar novo projeto Supabase (dashboard.supabase.com)
- [ ] Anotar `Project URL` e `anon key` (Settings → API)
- [ ] Rodar as migrations: `supabase db push` apontando para o novo projeto
- [ ] Criar o primeiro tenant na tabela `clinics` com o nome da clínica
- [ ] Criar o usuário admin (Authentication → Users → Invite)

### 2. Cloudflare R2

- [ ] Criar conta Cloudflare (cloudflare.com)
- [ ] Criar bucket R2 → nome: `bellex`
- [ ] Gerar API Token → permissão *Object Read & Write*
- [ ] Anotar: `Account ID`, `Access Key ID`, `Secret Access Key`

### 3. Variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>

VITE_R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
VITE_R2_ACCESS_KEY_ID=
VITE_R2_SECRET_ACCESS_KEY=
VITE_R2_BUCKET=bellex
VITE_R2_ACCOUNT_ID=
```

### 4. Build e deploy

```bash
bun run build:clinic
```

Suba o conteúdo da pasta `dist/` para a pasta do subdomínio na Hostinger.

Crie o arquivo `.htaccess` na raiz da pasta:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

### 5. Branding

- [ ] Substituir `public/logo-color.png` e `public/logo-1x1.png`
- [ ] Ajustar cor primária em `tailwind.config.ts` (variável `--primary`)
- [ ] Favicon (`public/favicon.ico`)
- [ ] Atualizar nome da clínica no Supabase (tabela `clinic_settings`)

### 6. Integrações (opcionais)

- [ ] **Resend** — criar conta, gerar API Key, verificar domínio de envio
- [ ] **WhatsApp (Evolution API)** — subir instância, conectar número via QR Code
- [ ] **OpenAI** — gerar API Key para o agente de atendimento

### 7. Onboarding

- [ ] Cadastrar especialistas e definir roles (admin / especialista / recepção)
- [ ] Cadastrar serviços com duração e preço
- [ ] Configurar horários de funcionamento
- [ ] Importar clientes via CSV
- [ ] Testar fluxo completo: agendamento → atendimento → cobrança

---

## Situação 2 — Multi-unidade (Workspace + N clínicas)

**Quando usar:** cliente tem filiais, ou mentora com mentoradas — uma pessoa gerencia várias.

São **dois deploys separados**:
- Um Workspace (painel de controle da gestora)
- Um app Clinic para cada unidade/mentorada

### 1. Supabase

- [ ] Criar novo projeto Supabase
- [ ] Anotar `Project URL` e `anon key`
- [ ] Rodar migrations
- [ ] Criar a gestora como usuário admin
- [ ] Criar um tenant na tabela `clinics` para cada unidade

### 2. Cloudflare R2

Mesmo processo da Situação 1 — um bucket compartilhado entre todas as unidades.

- [ ] Criar bucket R2 → nome: `bellex`
- [ ] Gerar API Token → permissão *Object Read & Write*

### 3. Variáveis de ambiente

Mesmo `.env` da Situação 1 — o Supabase é o mesmo para Workspace e todas as clínicas.

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>

VITE_R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
VITE_R2_ACCESS_KEY_ID=
VITE_R2_SECRET_ACCESS_KEY=
VITE_R2_BUCKET=bellex
VITE_R2_ACCOUNT_ID=
```

### 4. Build e deploy

**Workspace (gestora):**

```bash
bun run build:admin
```

Suba `dist/` para `workspace.dominio.com` (ou `app.dominio.com/admin`).

**Cada clínica/unidade:**

```bash
bun run build:clinic
```

Suba `dist/` para `unidade1.dominio.com`, `unidade2.dominio.com`, etc.

Cada pasta recebe seu próprio `.htaccess`:

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

### 5. DNS (para cada subdomínio)

No DNS do domínio, adicionar registro `A` para cada subdomínio:

```
workspace  →  185.245.180.165  (IP Hostinger)
unidade1   →  185.245.180.165
unidade2   →  185.245.180.165
```

### 6. Branding

- [ ] Logo e favicon (igual Situação 1)
- [ ] Cor primária por instalação se necessário
- [ ] Nome de cada unidade configurado no Supabase por `clinic_id`

### 7. Integrações

- [ ] **Resend** — uma conta, vários domínios de envio (um por unidade) ou domínio da gestora
- [ ] **WhatsApp** — uma instância Evolution API por número (uma por unidade)
- [ ] **OpenAI** — uma API Key compartilhada ou por unidade

### 8. Onboarding

- [ ] Onboarding com a gestora — Workspace (visão geral das unidades)
- [ ] Onboarding com cada unidade — agenda, clientes, cobranças
- [ ] Testar agendamento online de cada unidade separadamente

---

## Comparativo

| | Situação 1 — Solo | Situação 2 — Multi |
|--|--|--|
| Supabase | 1 projeto | 1 projeto compartilhado |
| Tenants | 1 | N |
| Deploys | 1 (clinic) | 1 workspace + N clinic |
| Subdomínios | 1 | N + 1 |
| Workspace | ❌ | ✅ |
| Complexidade de setup | Baixa | Média |

---

## Checklist rápido pré-entrega

- [ ] App abre sem erros no browser
- [ ] Login funciona
- [ ] Agendamento online público acessível
- [ ] E-mail de confirmação chega (Resend)
- [ ] Upload de foto funciona (R2)
- [ ] HTTPS ativo (SSL Hostinger automático)
