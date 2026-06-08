import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_CLINIC_NAME = "Clínica";

/** Never return blank — chains through fallbacks */
function fb(value: string | null | undefined, ...fallbacks: (string | null | undefined)[]): string {
  if (value?.trim()) return value.trim();
  for (const f of fallbacks) {
    if (f?.trim()) return f.trim();
  }
  return "";
}

function resolveTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(`{${key}}`).join(value || "");
  }
  return result;
}

const EMAIL_SUBJECT_FALLBACKS: Record<string, string> = {
  birthday_email: "Feliz Aniversário! 🎂",
  inactive_email: "Sentimos sua falta 💛",
};

function resolveEmailSubject(
  slug: string,
  template: { subject?: string | null; label?: string | null } | undefined,
  vars: Record<string, string>,
  clinicName: string,
): string {
  const rawSubject = fb(
    template?.subject,
    EMAIL_SUBJECT_FALLBACKS[slug],
    template?.label,
    `Mensagem de ${clinicName}`,
    "Notificação",
  );
  return resolveTemplate(rawSubject, vars);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // --- Authentication ---
  const incoming = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("Authorization");

  let cronAuth = false;
  let userAuth = false;

  if (incoming) {
    const envSecret = Deno.env.get("CRON_SECRET");
    if (envSecret && incoming === envSecret) {
      cronAuth = true;
    }
    if (!cronAuth) {
      const { data: dbSecret } = await supabase
        .from("integration_settings")
        .select("setting_value")
        .eq("setting_key", "n8n_cron_secret")
        .maybeSingle();
      if (dbSecret?.setting_value && incoming === dbSecret.setting_value) {
        cronAuth = true;
      }
    }
  }

  if (!cronAuth && authHeader) {
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await anonClient.auth.getUser();
    if (user) {
      const { data: roleData } = await anonClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (roleData) userAuth = true;
    }
  }

  if (!cronAuth && !userAuth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch all config in parallel
    const [settingsRes, clinicRes, bookingRes, emailSettingsRes, replyToRes, templatesRes, notifRes] = await Promise.all([
      supabase
        .from("integration_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["n8n_webhook_enabled_birthday", "n8n_webhook_enabled_inactive"]),
      supabase.from("clinic_settings").select("clinic_name, phone, sms_sender_name, inactive_notification_interval_days, system_url").limit(1).maybeSingle(),
      supabase
        .from("booking_page_settings")
        .select("social_instagram, social_facebook, social_website")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("integration_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["email_from_name", "email_from_address"]),
      supabase.from("integration_settings").select("setting_value").eq("setting_key", "email_reply_to").maybeSingle(),
      supabase
        .from("message_templates")
        .select("slug, content, label, subject")
        .in("slug", [
          "birthday_sms",
          "birthday_whatsapp",
          "birthday_email",
          "inactive_sms",
          "inactive_whatsapp",
          "inactive_email",
        ]),
      supabase
        .from("notification_settings")
        .select("setting_key, enabled")
        .in("setting_key", [
          "birthday_sms",
          "birthday_whatsapp",
          "birthday_email",
          "inactive_sms",
          "inactive_whatsapp",
          "inactive_email",
        ]),
    ]);

    const settings = settingsRes.data ?? [];
    const birthdayEnabled =
      settings.find((s) => s.setting_key === "n8n_webhook_enabled_birthday")?.setting_value === "true";
    const inactiveEnabled =
      settings.find((s) => s.setting_key === "n8n_webhook_enabled_inactive")?.setting_value === "true";

    const clinic = clinicRes.data;
    const booking = bookingRes.data;
    const clinicName = fb(clinic?.clinic_name, DEFAULT_CLINIC_NAME);
    const notificationIntervalDays = (clinic as any)?.inactive_notification_interval_days ?? 30;

    const emailSettingsMap: Record<string, string> = {};
    (emailSettingsRes.data ?? []).forEach((s: any) => { emailSettingsMap[s.setting_key] = s.setting_value ?? ""; });

    const templates = templatesRes.data ?? [];

    // Build enabled map
    const enabledMap: Record<string, boolean> = {};
    (notifRes.data ?? []).forEach((s: any) => {
      enabledMap[s.setting_key] = s.enabled;
    });

    // SMS/Email config — with robust fallbacks
    const smsCallbackUrl = `${supabaseUrl}/functions/v1/sms-callback`;
    const rawReplyTo = replyToRes.data?.setting_value?.trim() || "";
    const rawFromEmail = emailSettingsMap.email_from_address || "";
    const smsRemetente = fb((clinic as any)?.sms_sender_name, clinicName, DEFAULT_CLINIC_NAME);
    const emailFromName = fb(emailSettingsMap.email_from_name, clinicName, DEFAULT_CLINIC_NAME);
    const emailFromAddress = fb(rawFromEmail, rawReplyTo);
    const emailReplyTo = fb(rawReplyTo, rawFromEmail);

    console.log("[daily-notifications] v5-resend-only config:", {
      supabaseUrl,
      smsCallbackUrl,
      smsRemetente,
      emailFromName,
      emailFromAddress,
      emailReplyTo,
    });

    // Helper: build channels for a given prefix and template vars
    function buildChannels(prefix: string, vars: Record<string, string>) {
      const channels: Record<string, any> = {};
      for (const ch of ["sms", "whatsapp", "email"]) {
        const slug = `${prefix}_${ch}`;
        const isEnabled = enabledMap[slug] ?? false;
        const tpl = templates.find((t) => t.slug === slug);

        const resolvedMessage = isEnabled && tpl ? resolveTemplate(tpl.content, vars) : "";

        const channelData: any = {
          enabled: isEnabled,
          message: resolvedMessage || (isEnabled ? `Notificação de ${clinicName}` : ""),
        };

        if (ch === "sms" && isEnabled) {
          channelData.callback_url = smsCallbackUrl;
          channelData.sender = fb(smsRemetente, clinicName, DEFAULT_CLINIC_NAME);
        }
        if (ch === "email" && isEnabled) {
          channelData.sender = fb(emailFromName, clinicName, DEFAULT_CLINIC_NAME);
          channelData.from = fb(emailFromAddress, emailReplyTo);
          channelData.reply_to = fb(emailReplyTo, emailFromAddress);
          channelData.subject = resolveEmailSubject(slug, tpl, vars, clinicName);
        }

        channels[ch] = channelData;
      }
      return channels;
    }

    // Read system_url from clinic_settings for unsubscribe links
    const systemOrigin = (clinic as any)?.system_url || "https://app.bellex.com.br";

    const baseVars: Record<string, string> = {
      negocio: clinicName,
      link_agendamento: booking?.social_website || "",
      link_site: booking?.social_website || "",
      link_instagram: booking?.social_instagram || "",
      link_facebook: booking?.social_facebook || "",
      telefone: clinic?.phone || "",
    };

    let birthdays: any[] = [];
    let inactive: any[] = [];

    // Fetch recently sent notifications to avoid re-sending within interval
    const intervalCutoff = new Date();
    intervalCutoff.setDate(intervalCutoff.getDate() - notificationIntervalDays);
    const cutoffStr = intervalCutoff.toISOString().split("T")[0];

    const { data: alreadySent } = await supabase
      .from("notification_logs")
      .select("client_id, notification_type, channel")
      .gte("sent_date", cutoffStr)
      .eq("status", "sent");

    const sentSet = new Set((alreadySent ?? []).map((r: any) => `${r.client_id}|${r.notification_type}|${r.channel}`));

    // Helper: filter out channels already sent for a client
    function filterSentChannels(clientId: string, type: string, channels: Record<string, any>) {
      const filtered: Record<string, any> = {};
      let hasAny = false;
      for (const [ch, data] of Object.entries(channels)) {
        if (sentSet.has(`${clientId}|${type}|${ch}`)) {
          filtered[ch] = { ...data, enabled: false, skipped: true };
        } else {
          filtered[ch] = data;
          if (data.enabled) hasAny = true;
        }
      }
      return { channels: filtered, hasAny };
    }

    // Process birthdays
    if (birthdayEnabled) {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");

      const { data: birthdayClients } = await supabase
        .from("clients")
        .select("id, full_name, email, phone, birth_date")
        .not("birth_date", "is", null);

      const filtered = (birthdayClients ?? []).filter((c) => {
        if (!c.birth_date) return false;
        return (c.birth_date as string).endsWith(`-${month}-${day}`);
      });

      for (const c of filtered) {
        const unsubLink = c.email
          ? `${systemOrigin}/notificacao/cancelar?email=${encodeURIComponent(c.email)}&type=birthday`
          : "";
        const vars = {
          ...baseVars,
          nome: c.full_name?.split(" ")[0] || "Cliente",
          nome_completo: c.full_name || "Cliente",
          link_unsubscribe: unsubLink,
        };
        const raw = buildChannels("birthday", vars);
        const { channels: ch, hasAny } = filterSentChannels(c.id, "birthday", raw);
        if (!hasAny) continue;

        birthdays.push({
          id: c.id,
          notification_type: "birthday",
          full_name: c.full_name || "Cliente",
          email: c.email || "",
          phone: c.phone || "",
          birth_date: c.birth_date,
          channels: ch,
        });
      }
    }

    // Process inactive clients
    if (inactiveEnabled) {
      const { data: inactiveClients } = await supabase.rpc("inactive_clients");
      const filtered = (inactiveClients ?? []).filter((c: any) => c.days_inactive != null && c.days_inactive > 0);

      for (const c of filtered) {
        const unsubLink = c.email
          ? `${systemOrigin}/notificacao/cancelar?email=${encodeURIComponent(c.email)}&type=inactive`
          : "";
        const vars = {
          ...baseVars,
          nome: c.client_name?.split(" ")[0] || "Cliente",
          nome_completo: c.client_name || "Cliente",
          link_unsubscribe: unsubLink,
        };
        const raw = buildChannels("inactive", vars);
        const { channels: ch, hasAny } = filterSentChannels(c.client_id, "inactive", raw);
        if (!hasAny) continue;

        inactive.push({
          client_id: c.client_id,
          notification_type: "inactive",
          client_name: c.client_name || "Cliente",
          phone: c.phone || "",
          email: c.email || "",
          last_visit: c.last_visit,
          days_inactive: c.days_inactive,
          channels: ch,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        version: "v5-resend-only",
        notification_interval_days: notificationIntervalDays,
        clinic_name: clinicName,
        birthday_enabled: birthdayEnabled,
        inactive_enabled: inactiveEnabled,
        birthdays_count: birthdays.length,
        inactive_count: inactive.length,
        birthdays,
        inactive,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in daily-notifications:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
