/**
 * agent-availability
 * Retorna slots disponíveis para um serviço em uma data.
 * Reutiliza a mesma lógica da função /availability pública.
 * Parâmetros: service_id, date (YYYY-MM-DD), specialist_id (opcional)
 * Auth: x-bellex-api-key
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { validateApiKey, unauthorized, CORS as cors } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!(await validateApiKey(req))) return unauthorized();

  const url = new URL(req.url);
  const serviceId = url.searchParams.get("service_id");
  const date = url.searchParams.get("date"); // YYYY-MM-DD
  const specialistId = url.searchParams.get("specialist_id") ?? null;

  if (!serviceId || !date) {
    return new Response(JSON.stringify({ error: "service_id e date são obrigatórios" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Delega para a função /availability já existente
  const availabilityUrl = new URL(`${Deno.env.get("SUPABASE_URL")}/functions/v1/availability`);
  availabilityUrl.searchParams.set("service_id", serviceId);
  availabilityUrl.searchParams.set("date", date);
  if (specialistId) availabilityUrl.searchParams.set("specialist_id", specialistId);

  const res = await fetch(availabilityUrl.toString(), {
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  // Retorna apenas os slots disponíveis num formato limpo pro agente
  const slots = (data.slots ?? [])
    .filter((s: { available: boolean }) => s.available)
    .map((s: { time: string; specialist_name?: string }) => ({
      time: s.time,
      specialist: s.specialist_name ?? null,
    }));

  return new Response(JSON.stringify({ date, slots }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
