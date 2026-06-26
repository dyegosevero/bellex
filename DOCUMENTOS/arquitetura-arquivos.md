# Bellex — Árvore de Arquivos

> Gerado em 2026-06-26

```
src/
├── App.tsx                          # Roteador principal + detecção de hostname
├── main.tsx
├── index.css
│
├── assets/
│   ├── logo-color.png               # Logo usada nos sidebars SA e WS
│   ├── logo-1x1.png
│   ├── logo-1x1-white.png
│   ├── logo-icon.png
│   └── logo-svg.svg
│
├── contexts/
│   └── AuthContext.tsx              # Auth Supabase + detecção de domínio
│
├── integrations/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── types.ts
│   └── lovable/index.ts
│
├── lib/
│   ├── utils.ts
│   ├── brand.ts                     # Configuração de marca por subdomínio
│   ├── date.ts
│   ├── storage.ts
│   ├── webhook.ts
│   ├── edge-functions.ts
│   ├── crm.ts
│   ├── docs.ts
│   ├── sms.ts
│   ├── charge-pdf.ts
│   ├── export-utils.ts
│   ├── availability.ts
│   └── calendar-feed.ts
│
├── hooks/
│   │
│   ├── ── Nível Super Admin ──
│   ├── useSaWorkspaces.ts           # Lê workspace_customers (operadores)
│   ├── useSaPlans.ts                # Lê workspace_plans (planos SA→WS)
│   │
│   ├── ── Nível Workspace ──
│   ├── useCurrentWorkspace.ts       # Retorna o WS do usuário logado
│   ├── useWorkspaceClinics.ts       # Lê workspace_clinics
│   ├── useWorkspacePlans.ts         # Lê clinic_plans (planos WS→Clínica)
│   ├── useWorkspaceUsers.ts
│   ├── useWorkspaceSettings.ts
│   │
│   ├── ── Nível Clínica ──
│   ├── useDashboardData.ts
│   ├── useAppointmentData.ts
│   ├── useReportsData.ts
│   ├── usePendingBillings.ts
│   ├── useFeedbackEnabled.ts
│   ├── useClinicCountry.ts
│   ├── useBrand.ts
│   ├── useDebounce.ts
│   ├── use-mobile.tsx
│   └── use-toast.ts
│
├── components/
│   ├── ── Layouts ──
│   ├── SuperAdminLayout.tsx         # Sidebar SA (sa.bellex.beauty)
│   ├── WorkspaceLayout.tsx          # Sidebar WS (ws.bellex.beauty)
│   ├── AppLayout.tsx                # Layout clínica
│   ├── ProtectedRoute.tsx
│   │
│   ├── ui/                          # shadcn/ui + componentes customizados
│   │   ├── PageHeader.tsx
│   │   ├── button.tsx, input.tsx, dialog.tsx ...
│   │   └── (40+ componentes base)
│   │
│   ├── agenda/
│   ├── appointment-session/
│   ├── appointments/
│   ├── booking/
│   ├── clients/
│   ├── dashboard/
│   ├── faturamento/
│   ├── marketing/
│   ├── products/
│   ├── profile/
│   ├── reports/
│   ├── services/
│   ├── admin/
│   ├── docs/
│   ├── landing/
│   └── reactbits/                   # Animações (BlurText, CountUp, Aurora…)
│
└── pages/
    │
    ├── ── Super Admin (sa.bellex.beauty) ──
    ├── superadmin/
    │   ├── SaDashboard.tsx
    │   ├── SaWorkspaces.tsx          # CRUD workspace_customers
    │   ├── SaPlanosWS.tsx            # CRUD workspace_plans
    │   ├── SaFinanceiro.tsx          # MRR dos operadores
    │   ├── SaUsoIA.tsx
    │   ├── SaIntegracoes.tsx
    │   └── SaConfiguracoes.tsx
    │
    ├── ── Workspace (ws.bellex.beauty) ──
    ├── workspace/
    │   ├── WorkspaceDashboard.tsx    # KPIs das clínicas do WS
    │   ├── WorkspaceClientes.tsx     # Lista clientes (workspace_clinics)
    │   ├── WorkspaceClinics.tsx      # Gestão de clínicas
    │   ├── WorkspaceClinicNew.tsx    # Wizard: novo cliente + clínica
    │   ├── WorkspaceClinicDetail.tsx
    │   ├── WorkspacePlanos.tsx       # Planos do WS (clinic_plans)
    │   ├── WorkspacePlanEdit.tsx     # Criar/editar plano
    │   ├── WorkspaceFinanceiro.tsx   # MRR das clínicas do WS
    │   ├── WorkspaceRelatorios.tsx
    │   ├── WorkspaceUsuarios.tsx
    │   ├── WorkspaceNotificacoes.tsx
    │   ├── WorkspaceSuporte.tsx
    │   └── WorkspaceConfiguracoes.tsx
    │
    ├── ── Clínica (*.bellex.beauty / domínio customizado) ──
    ├── Dashboard.tsx / DashboardHome.tsx
    ├── Appointments.tsx / AppointmentNew.tsx / AppointmentDetail.tsx
    ├── AppointmentSession.tsx
    ├── Clients.tsx / ClientNew.tsx / ClientDetail.tsx / ClientEdit.tsx
    ├── Charges.tsx / ChargeNew.tsx / ChargeDetail.tsx / ChargeEdit.tsx
    ├── Faturamento.tsx / CaixaFinanceiro.tsx
    ├── Services.tsx / Products.tsx
    ├── Marketing.tsx / CampaignEditor.tsx / CampaignHistory.tsx
    ├── Inbox.tsx / Mensagens.tsx / Pipeline.tsx
    ├── Reports.tsx
    ├── Equipe.tsx / UserNew.tsx / UserDetail.tsx / UserEdit.tsx
    ├── Documents.tsx / DocumentEdit.tsx
    ├── BusinessHours.tsx / CalendarBlocks.tsx / SpecialistHours.tsx
    ├── Admin.tsx / admin/
    │   ├── AdminAgenda.tsx
    │   ├── AdminWhatsApp.tsx / AdminAgentes.tsx
    │   ├── AdminDocumentos.tsx / AdminEmail.tsx
    │   ├── AdminNotificacoes.tsx / AdminIntegracoes.tsx
    │   └── AdminAgentes.tsx
    ├── Profile.tsx
    ├── ImportData.tsx / InactiveClients.tsx / ReminderLogs.tsx / ReviewHistory.tsx
    │
    ├── ── Auth ──
    ├── Login.tsx / ForgotPassword.tsx / ResetPassword.tsx
    │
    ├── ── Público ──
    ├── Landing.tsx
    ├── PublicBooking.tsx / CancelBooking.tsx / ConfirmReview.tsx / Unsubscribe.tsx
    ├── Index.tsx / NotFound.tsx
    │
    └── recursos/                     # Landing pages por funcionalidade
        ├── Agenda.tsx / AgendamentoOnline.tsx
        ├── Clientes.tsx / Financeiro.tsx
        ├── Marketing.tsx / Relatorios.tsx
        └── Docs.tsx
```

---

## Tabelas Supabase

| Tabela | Usado por | Descrição |
|---|---|---|
| `workspace_customers` | SA | Operadores/workspaces contratados |
| `workspace_plans` | SA | Planos que SA vende a operadores |
| `workspace_clinics` | WS | Clínicas dentro de cada workspace |
| `clinic_plans` | WS | Planos que WS oferece às suas clínicas |

## Fluxo de Domínios

```
sa.bellex.beauty      → SuperAdminLayout  → pages/superadmin/
ws.bellex.beauty      → WorkspaceLayout   → pages/workspace/
*.bellex.beauty       → AppLayout         → pages/ (clínica)
domínio customizado   → AppLayout         → pages/ (clínica)
bellex.beauty         → Landing           → pages/Landing.tsx
```
