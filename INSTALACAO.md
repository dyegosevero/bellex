# Guia de Implementação — Bellex

---

## Opção A — Clínica (sem Workspace)

Clínica roda como **tenant no projeto Supabase principal da Bellex**. Sem infraestrutura própria.

### 1. Infraestrutura

- [ ] Nenhum projeto Supabase novo — clínica é tenant no principal
- [ ] Criar conta Cloudflare para a clínica
- [ ] Criar bucket R2 → nome: `bellex`
- [ ] Gerar API Token R2 com permissão *Object Read & Write*
- [ ] Apontar domínio/subdomínio da clínica para o VPS (registro A ou CNAME)

### 2. Branding / Whitelabel

- [ ] Substituir `logo-color.png` e `logo-1x1.png` pelo logo da clínica
- [ ] Ajustar cor primária no `tailwind.config.ts` (variável `--primary`)
- [ ] Atualizar nome da clínica nas configs do Supabase (tabela `settings` ou `clinics`)
- [ ] Favicon

### 3. Integrações

- [ ] **Resend** — criar conta, gerar API Key, configurar domínio de envio, verificar DNS
- [ ] **WhatsApp (Evolution API)** — subir instância da EvoAPI no VPS, conectar número via QR Code, salvar `instance_name` e `api_key`
- [ ] **OpenAI** — gerar API Key, definir modelo (`gpt-4o-mini`), configurar prompt do agente

### 4. Migração de Dados

- [ ] Importar clientes via CSV (nome, telefone, e-mail, data de nascimento)
- [ ] Cadastrar especialistas e definir roles (admin / especialista / atendimento)
- [ ] Cadastrar serviços com duração e preço
- [ ] Configurar horários de funcionamento

### 5. Variáveis de Ambiente

```env
# Supabase (compartilhado — não muda)
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

# R2 da clínica
VITE_R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
VITE_R2_ACCESS_KEY_ID=
VITE_R2_SECRET_ACCESS_KEY=
VITE_R2_BUCKET=bellex
VITE_R2_ACCOUNT_ID=

# Resend
RESEND_API_KEY=
RESEND_FROM=noreply@dominio.com.br

# Evolution API (WhatsApp)
EVO_API_URL=
EVO_API_KEY=
EVO_INSTANCE=

# OpenAI
OPENAI_API_KEY=
```

### 6. Treinamento

- [ ] Onboarding com a equipe (agenda, clientes, cobranças)
- [ ] Configurar agendamento online e testar link público
- [ ] Testar fluxo completo: agendamento → atendimento → cobrança

---

## Opção B — Workspace + Clínicas (Whitelabel completo)

Mentora/dona de franquia com **Supabase próprio**, **R2 próprio** e painel `/workspace` para gerenciar múltiplas clínicas.

### 1. Infraestrutura

- [ ] Criar novo projeto Supabase na sua org (Management API ou dashboard)
- [ ] Anotar `SUPABASE_URL`, `anon key` e `service_role key` do novo projeto
- [ ] Rodar todas as migrations no novo projeto
- [ ] Criar conta Cloudflare para a mentora
- [ ] Criar bucket R2 → nome: `bellex`
- [ ] Gerar API Token R2 com permissão *Object Read & Write*
- [ ] Apontar domínio principal da mentora + subdomínios das clínicas para o VPS

### 2. Branding / Whitelabel

- [ ] Substituir `logo-color.png`, `logo-1x1.png` e `logo-1x1-white.png`
- [ ] Ajustar cor primária no `tailwind.config.ts`
- [ ] Atualizar nome do Workspace nas configs
- [ ] Favicon + meta tags (título, descrição, og:image)
- [ ] Configurar domínio personalizado no Workspace (DNS TXT + CNAME + A record)

### 3. Integrações

- [ ] **Resend** — criar conta, gerar API Key, verificar domínio de envio da mentora
- [ ] **WhatsApp (Evolution API)** — subir instância da EvoAPI, conectar número da mentora via QR Code
- [ ] **OpenAI** — gerar API Key, configurar agente de suporte nas clínicas (Claude Haiku ou GPT-4o mini)
- [ ] Configurar webhook do WhatsApp apontando para o endpoint da instância

### 4. Migração de Dados

- [ ] Importar clínicas existentes da mentora (nome, CNPJ, endereço)
- [ ] Importar clientes de cada clínica via CSV
- [ ] Cadastrar especialistas por clínica com roles
- [ ] Cadastrar serviços por clínica com duração e preço
- [ ] Configurar horários de funcionamento por clínica
- [ ] Configurar planos que a mentora vende para suas clínicas

### 5. Variáveis de Ambiente

```env
# Supabase próprio da mentora
VITE_SUPABASE_URL=https://<projeto_mentora>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=

# R2 da mentora
VITE_R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
VITE_R2_ACCESS_KEY_ID=
VITE_R2_SECRET_ACCESS_KEY=
VITE_R2_BUCKET=bellex
VITE_R2_ACCOUNT_ID=

# Resend
RESEND_API_KEY=
RESEND_FROM=noreply@dominio.com.br

# Evolution API (WhatsApp)
EVO_API_URL=
EVO_API_KEY=
EVO_INSTANCE=

# OpenAI
OPENAI_API_KEY=
```

### 6. Treinamento

- [ ] Onboarding com a mentora — Workspace (clínicas, usuários, planos, licenças)
- [ ] Onboarding com cada clínica — agenda, clientes, cobranças
- [ ] Testar agendamento online de cada clínica
- [ ] Testar fluxo de suporte (ticket da clínica → mentora resolve)

---

## Comparativo

| | Clínica | Workspace |
|--|---------|-----------|
| Supabase próprio | ❌ | ✅ |
| R2 próprio | ✅ | ✅ |
| Painel `/workspace` | ❌ | ✅ |
| Gerencia múltiplas clínicas | ❌ | ✅ |
| Migrations novas | ❌ | ✅ |
| Custo infra/mês | ~R$ 5 | ~R$ 172 |
| Setup | R$ 7.000 | R$ 12.000 |
| Mensalidade | R$ 500 | R$ 750 |
