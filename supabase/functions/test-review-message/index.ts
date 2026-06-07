import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth: must be admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await anonClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { channel, recipient, recipient_name } = await req.json();
    if (!channel || !recipient) {
      return new Response(JSON.stringify({ error: "channel e recipient obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Load all settings
    const { data: settingsRows } = await adminClient
      .from("integration_settings")
      .select("setting_key, setting_value")
      .in("setting_key", [
        "review_google_url",
        "review_message",
        "review_message_whatsapp",
        "review_message_email",
        "review_message_sms",
        "review_email_subject",
      ]);

    const s: Record<string, string> = {};
    (settingsRows || []).forEach((r: any) => {
      s[r.setting_key] = r.setting_value || "";
    });

    const { data: clinicRow } = await adminClient
      .from("clinic_settings")
      .select("clinic_name, system_url, sms_sender_name")
      .limit(1)
      .maybeSingle();
    const clinicName = clinicRow?.clinic_name || "Clínica";
    const systemUrl = (clinicRow?.system_url || "").replace(/\/$/, "");
    const smsSenderName = (clinicRow as any)?.sms_sender_name || "";
    const googleUrl = s.review_google_url || "";

    // Load email sender settings
    const { data: emailSettings } = await adminClient
      .from("integration_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["email_from_name", "email_from_address", "email_reply_to"]);
    const es: Record<string, string> = {};
    (emailSettings || []).forEach((r: any) => { es[r.setting_key] = r.setting_value || ""; });

    // Load webhook
    const { data: webhookSetting } = await adminClient
      .from("integration_settings")
      .select("setting_value")
      .eq("setting_key", "n8n_marketing_webhook")
      .maybeSingle();

    let webhookUrl = webhookSetting?.setting_value;
    if (!webhookUrl) {
      const { data: mainWebhook } = await adminClient
        .from("integration_settings")
        .select("setting_value")
        .eq("setting_key", "n8n_webhook_url")
        .maybeSingle();
      webhookUrl = mainWebhook?.setting_value;
    }

    if (!webhookUrl) {
      return new Response(JSON.stringify({ error: "Webhook de marketing não configurado." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cronSecret = Deno.env.get("CRON_SECRET");
    let dbCronSecret: string | null = null;
    if (!cronSecret) {
      const { data: cs } = await adminClient
        .from("integration_settings")
        .select("setting_value")
        .eq("setting_key", "n8n_cron_secret")
        .maybeSingle();
      dbCronSecret = cs?.setting_value || null;
    }
    const effectiveCronSecret = cronSecret || dbCronSecret;
    const webhookHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (effectiveCronSecret) webhookHeaders["x-cron-secret"] = effectiveCronSecret;

    const fullName = recipient_name || "Cliente Teste";
    const nome = fullName.split(" ")[0];
    const confirmUrl = systemUrl
      ? `${systemUrl}/avaliacao/confirmar/test-token`
      : `${supabaseUrl}/functions/v1/confirm-review?token=test-token`;
    const unsubscribeUrl = systemUrl && channel === "email"
      ? `${systemUrl}/notificacao/cancelar?email=${encodeURIComponent(recipient)}`
      : "";

    const replacePlaceholders = (tpl: string) =>
      tpl
        .replace(/\{nome_completo\}/gi, fullName)
        .replace(/\{link_google\}/gi, googleUrl)
        .replace(/\{link_confirmar\}/gi, confirmUrl)
        .replace(/\{link_unsubscribe\}/gi, unsubscribeUrl)
        .replace(/\{negocio\}/gi, clinicName)
        .replace(/\{nome\}/gi, nome);

    const channelsObj: Record<string, any> = {};
    const tpl = s[`review_message_${channel}`] || s.review_message || "";
    const body = replacePlaceholders(tpl);

    if (channel === "whatsapp") {
      channelsObj.whatsapp = { phone: recipient, message: body };
    } else if (channel === "email") {
      channelsObj.email = {
        to: recipient,
        subject: replacePlaceholders(s.review_email_subject || "{negocio} — A sua opinião é importante! ⭐"),
        sender_name: clinicName,
        message: body,
      };
    } else if (channel === "sms") {
      channelsObj.sms = { phone: recipient, message: body };
    } else {
      return new Response(JSON.stringify({ error: "Canal inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = {
      event: "review_request",
      test_only: true,
      client_id: null,
      client_name: fullName,
      channels: channelsObj,
      sms: {
        sender_id: smsSenderName,
      },
      email: {
        from_name: es.email_from_name || clinicName,
        from_address: es.email_from_address || "",
        reply_to: es.email_reply_to || "",
      },
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: webhookHeaders,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return new Response(
        JSON.stringify({ error: `Webhook respondeu ${res.status}: ${text}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[test-review-message] error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
