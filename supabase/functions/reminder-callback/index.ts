import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const body = await req.json();
    const items: any[] = Array.isArray(body) ? body : [body];

    let updated = 0;
    const errors: string[] = [];

    for (const item of items) {
      const {
        appointment_id,
        status_detail,
        sms_external_id,
        whatsapp_external_id,
        email_external_id,
        sms_status,
        whatsapp_status,
        email_status,
      } = item;

      if (!appointment_id) {
        errors.push(`Missing appointment_id: ${JSON.stringify(item)}`);
        continue;
      }

      // Must have at least one channel status
      if (!sms_status && !whatsapp_status && !email_status) {
        errors.push(`Missing channel status (sms_status/whatsapp_status/email_status): ${JSON.stringify(item)}`);
        continue;
      }

      // Build update payload — only set fields that were provided
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (sms_status !== undefined) updateData.sms_status = sms_status;
      if (whatsapp_status !== undefined) updateData.whatsapp_status = whatsapp_status;
      if (email_status !== undefined) updateData.email_status = email_status;
      if (sms_external_id !== undefined) updateData.sms_external_id = sms_external_id;
      if (whatsapp_external_id !== undefined) updateData.whatsapp_external_id = whatsapp_external_id;
      if (email_external_id !== undefined) updateData.email_external_id = email_external_id;
      if (status_detail !== undefined) updateData.status_detail = status_detail;

      // Only update reminders that have been dispatched (lifecycle managed elsewhere)
      const { error, count } = await supabase
        .from("reminder_history")
        .update(updateData)
        .eq("appointment_id", appointment_id)
        .eq("status", "dispatched");

      if (error) {
        errors.push(`${appointment_id}: ${error.message}`);
      } else {
        updated++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, updated, errors: errors.length > 0 ? errors : undefined }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[reminder-callback] error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
