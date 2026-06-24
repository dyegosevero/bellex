# Bellex — Business Model Canvas

> Atualizado: junho 2026

---

## 🔵 COMO?

### Parcerias Principais
- Mentoras / consultoras de clínicas estéticas (canal de distribuição whitelabel)
- Franquias e redes de estética (Enterprise)
- Plataformas de pagamento: Stripe, Asaas, Pix
- Twilio / Z-API / Evolution API (WhatsApp)
- Supabase (infraestrutura)

### Atividades Principais
- Desenvolvimento e manutenção do produto SaaS
- Onboarding de novas clínicas (demo + configuração)
- Suporte e retenção de clientes
- Venda e ativação de licenças Whitelabel
- Operação do Super Admin (controle de todos os tenants)

### Recursos Principais
- Plataforma multi-tenant (um código, N instalações)
- Infraestrutura Supabase com RLS por tenant
- Sistema de branding dinâmico por instalação
- Equipe de produto e suporte
- Rede de parceiros whitelabel

---

## 🔴 O QUÊ?

### Proposta de Valor

**Para a clínica (SaaS):**
> Sistema completo de gestão para clínicas de estética — agenda, clientes, cobranças, marketing e relatórios num só lugar. Substitui 3–5 ferramentas e elimina 40h/mês de trabalho manual.

**Para a mentora / parceiro (Whitelabel):**
> Tenha seu próprio software de gestão com sua marca, sem desenvolver nada. Distribua para suas alunas/clientes como ferramenta do seu método. Receita recorrente + fidelização da base.

---

## 🟢 PARA QUEM?

### Segmentos de Clientes

**SaaS direto:**
- Clínicas de estética independentes (1–10 especialistas)
- Dermato, estética facial, corporal, massagem, barbearias premium
- Brasil, ticket R$ 129–R$ 499/mês

**Whitelabel — Uso:**
- Mentora/consultora que quer ferramenta com sua marca para uso próprio (1 clínica)

**Whitelabel — Distribuição:**
- Mentora com base de alunas clínicas → distribui o sistema como parte do método
- Franquia / rede → padroniza gestão das unidades com marca própria
- Consultor de negócios estéticos → oferece software como serviço para clientes

### Relacionamento com Clientes
- Demo individual (sem script genérico, dados reais do segmento)
- Onboarding assistido + migração gratuita de dados
- Suporte por chat e telefone (planos Pro+)
- Comunidade / base de conhecimento
- Para WL: canal direto com o parceiro (não com a clínica final)

### Canais
- Landing page (`bellex.com.br`) — SEO + Ads
- Indicação de clientes ativos
- Parceiros whitelabel (canal B2B2C)
- Instagram / conteúdo para donos de clínicas
- Demo agendada (high-touch para Enterprise e WL)

---

## 🟡 QUANTO?

### Fontes de Receita

| Modelo | Produto | Valor estimado |
|---|---|---|
| Assinatura mensal | SaaS Starter | R$ 129/mês |
| Assinatura mensal | SaaS Pro | R$ 249/mês |
| Sob consulta | SaaS Enterprise | R$ 500+/mês |
| Licença única ou anual | WL Uso (1 seat) | R$ 1.500–R$ 3.000 |
| Licença por seats | WL Distribuição (N clínicas) | R$ 3.000–R$ 15.000 |
| Recorrência futura | WL Revenda (royalties) | % por clínica ativa |

### Estrutura de Custos
- Infraestrutura: Supabase, Vercel/hosting, APIs (WhatsApp, e-mail, SMS)
- Desenvolvimento e produto (principal custo)
- Suporte e onboarding
- Marketing e aquisição (Ads, conteúdo)
- Ferramentas SaaS internas (GitHub, etc.)

---

## 🏗️ Arquitetura do Produto

```
Bellex (um código)
├── installation_type = "saas"
│   ├── Landing page pública
│   ├── Checkout / signup público
│   ├── Branding Bellex
│   └── Cobrança por plano de uso
│
└── installation_type = "whitelabel"
    ├── Sem landing page pública
    ├── Tenant Admin: parceiro cria/gerencia clínicas
    ├── Branding customizado (logo, cor, domínio)
    └── Cobrança por seats de distribuição
```

```
Painéis
├── admin.bellex.com.br     → Super Admin (você)
│                              todos os tenants + licenças
│
├── [domínio da mentora]    → Tenant Admin (parceiro WL)
│                              suas clínicas, seus seats
│
└── [domínio da clínica]    → App da Clínica (já existe)
                               agenda, clientes, financeiro
```
