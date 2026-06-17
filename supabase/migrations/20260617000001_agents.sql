-- Tabela de agentes
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone_number_id text,
  system_prompt text not null default '',
  model text not null default 'gpt-4o-mini',
  active boolean not null default true,
  n8n_workflow_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Qualificações do agente
create table if not exists public.agent_qualifications (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  description text not null,
  status_name text not null,
  created_at timestamptz not null default now()
);

-- Ações do agente (o que fazer quando qualificar)
create table if not exists public.agent_actions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  trigger_status text not null,
  action text not null default 'move_lead',
  target_stage_id uuid references public.pipeline_stages(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Adicionar agent_id nas etapas do pipeline
alter table public.pipeline_stages
  add column if not exists agent_id uuid references public.agents(id) on delete set null;

-- RLS permissivo (ajustar por tenant depois)
alter table public.agents enable row level security;
alter table public.agent_qualifications enable row level security;
alter table public.agent_actions enable row level security;

create policy "agents_all" on public.agents for all using (true);
create policy "agent_qualifications_all" on public.agent_qualifications for all using (true);
create policy "agent_actions_all" on public.agent_actions for all using (true);
