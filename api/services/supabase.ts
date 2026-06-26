import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function getClinicByPhone(phone: string) {
  const { data } = await supabase
    .from("clinics")
    .select("id, name, subdomain, plan, settings")
    .eq("whatsapp_number", phone)
    .single();
  return data;
}

export async function getClinicContext(clinicId: string) {
  const [{ data: services }, { data: settings }] = await Promise.all([
    supabase.from("servicos").select("nome, descricao, duracao_minutos").eq("clinica_id", clinicId).eq("ativo", true),
    supabase.from("clinic_settings").select("*").eq("clinica_id", clinicId).single(),
  ]);
  return { services: services ?? [], settings };
}

export async function getLeadComAgente(clinicId: string, phone: string) {
  // busca o lead e o agente ativo na coluna atual dele
  const { data: lead } = await supabase
    .from("leads")
    .select("id, stage_id, pipeline_stages(id, nome, agent_id, agents(id, system_prompt, ativo))")
    .eq("clinica_id", clinicId)
    .eq("telefone", phone)
    .single();

  return lead ?? null;
}

export async function getOrCreateLead(clinicId: string, phone: string, defaultStageId: string) {
  const { data: existing } = await supabase
    .from("leads")
    .select("id, stage_id")
    .eq("clinica_id", clinicId)
    .eq("telefone", phone)
    .single();

  if (existing) return existing;

  const { data: created } = await supabase
    .from("leads")
    .insert({ clinica_id: clinicId, telefone: phone, stage_id: defaultStageId })
    .select("id, stage_id")
    .single();

  return created;
}

export async function getStagesComCriterios(clinicId: string) {
  const { data } = await supabase
    .from("pipeline_stages")
    .select("id, nome, criterio_movimentacao, agent_id")
    .eq("clinica_id", clinicId)
    .order("ordem");
  return data ?? [];
}

export async function moverLead(leadId: string, stageId: string) {
  await supabase.from("leads").update({ stage_id: stageId }).eq("id", leadId);
}

export async function recordWorkspaceUsage(subdomain: string, tokensUsed: number) {
  const { data: wc } = await supabase
    .from("workspace_clinics")
    .select("id, customer_id")
    .eq("subdomain", subdomain)
    .single();
  if (!wc?.customer_id) return;

  await supabase.rpc("record_workspace_ai_usage", {
    p_workspace_id: wc.customer_id,
    p_clinic_id: wc.id,
    p_tokens: tokensUsed,
  });
}

export async function getOrCreatePatient(clinicId: string, phone: string, name?: string) {
  const { data: existing } = await supabase
    .from("clientes")
    .select("id, nome, telefone")
    .eq("clinica_id", clinicId)
    .eq("telefone", phone)
    .single();

  if (existing) return existing;

  const { data: created } = await supabase
    .from("clientes")
    .insert({ clinica_id: clinicId, telefone: phone, nome: name ?? "Paciente" })
    .select("id, nome, telefone")
    .single();

  return created;
}

export async function createAgendamento(payload: {
  clinica_id: string;
  cliente_id: string;
  servico_id: string;
  especialista_id?: string;
  data_hora: string;
}) {
  const { data, error } = await supabase.from("agendamentos").insert(payload).select().single();
  return { data, error };
}
