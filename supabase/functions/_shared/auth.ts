/**
 * Valida x-bellex-api-key contra integration_settings.
 * n8n envia esse header — nunca usa service_role diretamente.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export async function validateApiKey(req: Request): Promise<boolean> {
  const key = req.headers.get("x-api-key");
  if (!key) return false;

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data } = await supabase
    .from("integration_settings")
    .select("setting_value")
    .eq("setting_key", "n8n_api_key")
    .maybeSingle();

  return data?.setting_value === key;
}

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

export function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
