/**
 * agent-appointment
 * Cria um agendamento via agente IA.
 * Body: { lead_id, service_id, specialist_id, date, time, notes? }
 * Auth: x-bellex-api-key
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { validateApiKey, unauthorized, CORS as cors } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: cors });
  }

  if (!(await validateApiKey(req))) return unauthorized();

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const { lead_id, service_id, specialist_id, date, time, notes } = body;
  if (!lead_id || !service_id || !date || !time) {
    return new Response(JSON.stringify({ error: "lead_id, service_id, date e time são obrigatórios" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Busca dados do lead para criar o client_id
  const { data: lead } = await supabase
    .from("leads")
    .select("id, name, phone")
    .eq("id", lead_id)
    .maybeSingle();

  if (!lead) {
    return new Response(JSON.stringify({ error: "Lead não encontrado" }), {
      status: 404,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Busca serviço para calcular end_time
  const { data: service } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", service_id)
    .maybeSingle();

  const startTime = new Date(`${date}T${time}:00`);
  const endTime = new Date(startTime.getTime() + (service?.duration_minutes ?? 60) * 60000);

  const { data: appt, error } = await supabase
    .from("appointments")
    .insert({
      service_id,
      specialist_id: specialist_id ?? null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: "agendado",
      notes: notes ?? `Agendado via agente IA para ${lead.name}`,
      client_name: lead.name,
      client_phone: lead.phone,
    })
    .select("id, start_time, end_time, status")
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, appointment: appt }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
