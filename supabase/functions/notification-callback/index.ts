import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // --- Auth: x-cron-secret (same as daily-notifications) ---
  const incoming = req.headers.get("x-cron-secret");
  if (!incoming) {
    return new Response(JSON.stringify({ error: "Missing x-cron-secret" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let authenticated = false;
  const envSecret = Deno.env.get("CRON_SECRET");
  if (envSecret && incoming === envSecret) {
    authenticated = true;
  }
  if (!authenticated) {
    const { data: dbSecret } = await supabase
      .from("integration_settings")
      .select("setting_value")
      .eq("setting_key", "n8n_cron_secret")
      .maybeSingle();
    if (dbSecret?.setting_value && incoming === dbSecret.setting_value) {
      authenticated = true;
    }
  }

  if (!authenticated) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    // Support single or batch
    const items: any[] = Array.isArray(body) ? body : [body];
    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of items) {
      const { client_id, notification_type, channel, status, external_id } = item;

      if (!client_id || !notification_type || !channel) {
        errors.push(`Missing required fields: ${JSON.stringify(item)}`);
        continue;
      }

      const { error } = await supabase.from("notification_logs").upsert(
        {
          client_id,
          notification_type,
          channel,
          status: status || "sent",
          external_id: external_id || null,
          sent_date: new Date().toISOString().split("T")[0],
        },
        { onConflict: "client_id,notification_type,channel,sent_date" }
      );

      if (error) {
        errors.push(`${client_id}/${channel}: ${(error as Error).message}`);
        skipped++;
      } else {
        inserted++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, inserted, skipped, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[notification-callback] error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
