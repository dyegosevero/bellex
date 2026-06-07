import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Auth via x-cron-secret
  const incoming = req.headers.get("x-cron-secret");
  if (!incoming) {
    return new Response(JSON.stringify({ error: "Missing x-cron-secret" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let authenticated = false;
  const envSecret = Deno.env.get("CRON_SECRET");
  if (envSecret && incoming === envSecret) authenticated = true;
  if (!authenticated) {
    const { data: dbSecret } = await supabase
      .from("integration_settings")
      .select("setting_value")
      .eq("setting_key", "n8n_cron_secret")
      .maybeSingle();
    if (dbSecret?.setting_value && incoming === dbSecret.setting_value) authenticated = true;
  }
  if (!authenticated) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { request_id, status, error: errMsg } = body || {};

    if (!request_id || !status || !["sent", "failed"].includes(status)) {
      return new Response(
        JSON.stringify({ error: "request_id and status (sent|failed) required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: rr, error: fetchErr } = await supabase
      .from("review_requests")
      .select("id, send_count")
      .eq("id", request_id)
      .maybeSingle();

    if (fetchErr || !rr) {
      return new Response(JSON.stringify({ error: "review_request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (status === "sent") {
      // send_count + next_send_at já foram atualizados otimisticamente em send-review-requests.
      // Aqui apenas confirmamos a entrega.
      const nowIso = new Date().toISOString();
      await supabase
        .from("review_requests")
        .update({
          delivery_status: "delivered",
          delivered_at: nowIso,
          reserved_until: null,
          last_error: null,
        })
        .eq("id", request_id);
    } else {
      // Rollback: o envio falhou, devolve o send_count e marca para retry rápido.
      const retryAt = new Date();
      retryAt.setMinutes(retryAt.getMinutes() + 15);
      const rolledBack = Math.max(0, (rr.send_count || 1) - 1);
      await supabase
        .from("review_requests")
        .update({
          delivery_status: "failed",
          send_count: rolledBack,
          next_send_at: retryAt.toISOString(),
          last_error: errMsg || "unknown error",
          reserved_until: null,
        })
        .eq("id", request_id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[review-callback] error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
