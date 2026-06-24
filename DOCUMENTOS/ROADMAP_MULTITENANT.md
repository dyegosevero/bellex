# Bellex — Roadmap Multi-tenant
> Status: 0 / 27 concluídos

---

## 1. Banco de dados (Migrations Supabase)

- [ ] `migration` tenants — `installation_type`, branding, domínio, plano, status
- [ ] `migration` licenses — licenças whitelabel com seats, validade, status
- [ ] `migration` tenant_users — vínculo usuário ↔ tenant com papel (owner, admin, member)
- [ ] `migration` asaas_subscriptions — referência da assinatura Asaas por tenant
- [ ] `RLS` isolamento total por `tenant_id` em todas as tabelas existentes
- [ ] `seed` roles — superadmin, tenant_owner, tenant_admin, member

---

## 2. Infraestrutura multi-tenant

- [ ] `spec` resolução de tenant por domínio/subdomínio (middleware)
- [ ] `spec` TenantContext no React
- [ ] `spec` branding dinâmico — logo, cor primária, nome carregado por tenant
- [ ] `spec` `installation_type` controla LP pública vs painel privado

---

## 3. Fluxo de Onboarding SaaS (com Asaas)

- [ ] `spec` tela de signup — nome, e-mail, senha, nome da clínica
- [ ] `spec` seleção de plano — Starter / Pro / Enterprise
- [ ] `spec` redirect para Asaas Pay com plano pré-selecionado
- [ ] `spec` webhook `/api/asaas/webhook` — eventos: `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, `SUBSCRIPTION_DELETED`
- [ ] `spec` lógica de ativação/desativação de tenant por status de pagamento
- [ ] `spec` página de confirmação pós-pagamento

---

## 4. Super Admin (`admin.bellex.com.br`)

- [ ] `spec` autenticação separada com `role = superadmin`
- [ ] `spec` dashboard — lista de todos os tenants SaaS + licenças WL
- [ ] `spec` filtros por status (ativo, trial, inadimplente, cancelado, expirado)
- [ ] `spec` tela de detalhe do tenant — plano, uso, datas, histórico de pagamento
- [ ] `spec` ações — ativar, desativar, alterar plano, resetar senha, impersonar
- [ ] `spec` gestão de licenças WL — criar, editar seats, expirar, suspender

---

## 5. Tenant Admin (painel do parceiro WL)

- [ ] `spec` rota `/admin` no domínio do parceiro, protegida por `role = tenant_owner`
- [ ] `spec` dashboard — clínicas criadas, seats usados / total, validade da licença
- [ ] `spec` criar nova clínica (consome 1 seat) — nome, domínio, logo, cor
- [ ] `spec` editar clínica existente
- [ ] `spec` alerta de expiração da licença — banner + e-mail

---

## Ordem de execução recomendada

```
Bloco 1 (banco) → Bloco 2 (infra) → Bloco 4 (Super Admin)
                                   → Bloco 3 (Onboarding/Asaas)
                                   → Bloco 5 (Tenant Admin)
```

Blocos 3 e 4 podem ser desenvolvidos em paralelo após o bloco 2.
