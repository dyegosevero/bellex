import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * GET /pending-reminders
 *
 * Returns reminders whose send_at is within the last 5 minutes (or a custom window)
 * and status = 'pending'. Atomically marks them as 'dispatched' to prevent duplicates.
 *
 * Auth: x-cron-secret header
 *
 * Query params:
 *   window_minutes (optional, default 5) — how many minutes back to look
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Auth: x-cron-secret
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
    const url = new URL(req.url);
    const windowMinutes = parseInt(url.searchParams.get("window_minutes") || "5", 10);

    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);

    // Fetch pending reminders within the window
    const { data: reminders, error: fetchError } = await supabase
      .from("reminder_history")
      .select("id, appointment_id, channels, channels_payload")
      .eq("status", "pending")
      .gte("send_at", windowStart.toISOString())
      .lte("send_at", now.toISOString())
      .order("send_at", { ascending: true });

    if (fetchError) throw fetchError;

    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ ok: true, total: 0, reminders: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as 'dispatched' to prevent double-sending
    const ids = reminders.map((r: any) => r.id);
    const { error: updateError } = await supabase
      .from("reminder_history")
      .update({ status: "dispatched", updated_at: now.toISOString() })
      .in("id", ids);

    if (updateError) {
      console.error("[pending-reminders] Failed to mark as dispatched:", updateError);
    }

    // Build flat channel-centric response for n8n
    const result = reminders.map((r: any) => {
      const cp = r.channels_payload || {};
      const ch = cp.channels || {};
      const summary = r.channels || {};
      const client = cp.client || {};

      return {
        id: r.id,
        appointment_id: r.appointment_id,
        channels: {
          sms: {
            enabled: !!summary.sms,
            to: client.phone || "",
            ...(ch.sms || {}),
          },
          whatsapp: {
            enabled: !!summary.whatsapp,
            to: client.phone || "",
            ...(ch.whatsapp || {}),
          },
          email: {
            enabled: !!summary.email,
            to: client.email || "",
            ...(ch.email || {}),
          },
        },
      };
    });

    return new Response(JSON.stringify({ ok: true, total: result.length, reminders: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[pending-reminders] error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
