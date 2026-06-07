# Dermalūm — Sistema de Gestão para Clínicas de Estética

> Plataforma completa de gestão clínica com agendamento online, workspace clínica, cobranças, relatórios e automações.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Lovable Cloud (Supabase) — PostgreSQL, Edge Functions (Deno), Auth, Storage |
| Automações | n8n (webhooks + cron) — 6 workflows |
| Integrações | Evolution API (WhatsApp), Resend (e-mail), SMS, Google Calendar (iCal) |

## Funcionalidades Principais

- **Dashboard** com calendário FullCalendar (vista diária/semanal)
- **Gestão de Clientes** com fichas clínicas, anamnese, fotos antes/depois, consentimentos
- **Agendamentos** com multi-serviço, atribuição automática de especialista
- **Workspace Clínica** — ambiente dedicado ao atendimento com formulários dinâmicos
- **Agendamento Público** — página online de 6 etapas para marcação por clientes
- **Serviços & Produtos** — CRUD completo com categorias, stock e drag-and-drop
- **Cobranças** com geração de PDF e envio por e-mail
- **Relatórios** — executivo, financeiro, clientes, atendimentos, produtos, especialistas
- **Marketing** — campanhas multi-canal (E-mail/SMS/WhatsApp) + avaliações Google automatizadas
- **Automações** — notificações via WhatsApp/SMS/e-mail, deteção de atendimentos esquecidos
- **Segurança** — RLS em todas as tabelas, papéis (Admin/Especialista/Recepcionista), auditoria

## Workflows n8n (6)

| # | Workflow | Trigger | Descrição |
|---|---|---|---|
| 1 | Agendamentos | Webhook | Confirmação, cancelamento, alteração e lembrete de marcações |
| 2 | Automações diárias | Cron 08:00 | Aniversariantes + clientes inativos + relatório semanal |
| 3 | Atendimentos em aberto | Cron 30min | Finalização automática de atendimentos esquecidos |
| 4 | Enviador de SMS | Cron 5min | Polling de lembretes pendentes e envio multi-canal |
| 5 | Marketing | Webhook | Campanhas de marketing em lotes com anti-bloqueio |
| 6 | Google Review | Cron 6h | Pedidos automáticos de avaliação Google pós-atendimento |

## Documentação

| Ficheiro | Conteúdo |
|---|---|
| `FUNCIONALIDADES.md` | Checklist técnica completa (280+ funcionalidades) |
| `DOCUMENTACAO.md` | Manual do utilizador para o cliente |
| `N8N_WORKFLOWS.md` | Guia completo de configuração dos 6 workflows n8n (inclui lembretes, campanhas e avaliações) |

## Segurança

- Row-Level Security (RLS) em todas as tabelas
- Auditoria completa realizada em Março 2026 (14 políticas corrigidas)
- Signup público desativado — apenas admins criam utilizadores
- Dependências auditadas e atualizadas contra CVEs conhecidas
- Edge functions protegidas com JWT e/ou CRON_SECRET

## Desenvolvimento Local

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```

---

*Dermalūm v1.1 — Abril 2026*
# bellex
