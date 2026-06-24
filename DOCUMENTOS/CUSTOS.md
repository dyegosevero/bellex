# Custos & Margens — Bellex

> Última atualização: 2026-06-13
> Modelo IA: GPT-4o mini | ~65.000 tokens/conversa | ~R$ 0,15/atendimento (margem de segurança incluída)
> Storage: R2 = $0,015/GB · Supabase = $0,021/GB (5 GB incluídos no Pro por projeto)

---

## App — Clínica (tenant no projeto principal da Bellex)

| | Starter | Pro | Scale |
|--|---------|-----|-------|
| **Mensalidade** | R$ 500/mês | R$ 750/mês | R$ 1.000/mês |
| **Armazenamento** | 10 GB | 20 GB | 30 GB |
| **Atendimentos IA/mês** | 250 | 600 | 1.000 |
| **Custo Storage — R2** | ~R$ 0,83 | ~R$ 1,65 | ~R$ 2,48 |
| **Custo Storage — Supabase** | ~R$ 1,16 | ~R$ 2,31 | ~R$ 3,47 |
| **Custo IA** | ~R$ 38 | ~R$ 90 | ~R$ 150 |
| **Lucro com R2** | ~R$ 461 | ~R$ 658 | ~R$ 847 |
| **Lucro com Supabase** | ~R$ 461 | ~R$ 658 | ~R$ 847 |

> Diferença máxima de storage entre R2 e Supabase no Scale: ~R$ 1/mês — irrelevante na margem.
> Sem custo de infra separado — clínica roda como tenant no projeto principal Bellex.

---

## Workspace (Supabase próprio, serve múltiplas clínicas)

| | Starter | Pro | Scale |
|--|---------|-----|-------|
| **Mensalidade** | R$ 750/mês | R$ 1.000/mês | R$ 1.500/mês |
| **Clínicas** | 5 | 10 | 20 |
| **Armazenamento** | 25 GB (5 GB/clínica) | 50 GB (5 GB/clínica) | 100 GB (5 GB/clínica) |
| **Atendimentos IA/mês** | 1.000 | 2.500 | 5.000 |
| **Custo Infra** | R$ 172 | R$ 172 | R$ 172 |
| **Custo Storage — R2** | ~R$ 0 | ~R$ 1,65 | ~R$ 3,30 |
| **Custo Storage — Supabase** | ~R$ 0,58 | ~R$ 2,89 | ~R$ 5,20 |
| **Custo IA** | ~R$ 150 | ~R$ 375 | ~R$ 750 |
| **Lucro com R2** | ~R$ 428 | ~R$ 453 | ~R$ 578 |
| **Lucro com Supabase** | ~R$ 427 | ~R$ 450 | ~R$ 573 |

> Diferença máxima entre R2 e Supabase no Scale: ~R$ 2/mês — não justifica a complexidade operacional do R2.
> Custo Infra = Supabase Pro ($25 ~R$ 130) + VPS rateado (~R$ 42) por Workspace.

---

## Conclusão: R2 vs Supabase Storage

| | R2 | Supabase |
|--|----|----|
| Custo/GB | $0,015 | $0,021 |
| Free tier | 10 GB por conta | 5 GB incluídos no Pro |
| Setup por Workspace | Manual (conta + token + CORS) | Zero — já integrado |
| Monitoramento | Separado (Super Admin custom) | Nativo no dashboard |
| Diferença de lucro (Scale) | +R$ 2/mês | base |
| **Recomendação** | ❌ Complexidade não justifica | ✅ Usar Supabase |

---

## Custos da Operação

### Fixos — pagos independente de quantos clientes

| Item | Custo/mês | Descrição |
|------|-----------|-----------|
| VPS KVM4 Hostinger | R$ 55,99 | Abriga tudo — Workspaces + Clínicas |
| Supabase Pro (principal) | ~R$ 130 | Abriga todas as clínicas sem Workspace (multi-tenant) |
| **Total fixo** | **~R$ 186/mês** | |

### Variáveis — só existem quando há Workspace

| Item | Custo/mês | Quando |
|------|-----------|--------|
| Supabase Pro por Workspace | ~R$ 130 | 1 projeto por mentora/whitelabel |
| Storage excedente (Supabase) | ~R$ 0–5 | Após 5 GB incluídos no Pro |

> Regra: Clínica sozinha → tenant no Supabase principal, sem custo extra.
> Workspace → projeto Supabase próprio, storage gerenciado pelo mesmo painel.
