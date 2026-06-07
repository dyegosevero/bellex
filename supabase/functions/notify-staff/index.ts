import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StaffNotifyPayload {
  event: "confirmed" | "cancelled" | "changed";
  appointment_id: string;
  client_name: string;
  service_name: string;
  specialist_name: string;
  start_time: string;
  specialist_id?: string | null;
  source?: "staff" | "client";
}

const EVENT_LABELS: Record<string, string> = {
  confirmed: "Nova Marcação",
  cancelled: "Marcação Cancelada",
  changed: "Marcação Alterada",
};

const EVENT_COLORS: Record<string, string> = {
  confirmed: "#22C55E",
  cancelled: "#EF4444",
  changed: "#F59E0B",
};

const EVENT_SLUG_MAP: Record<string, string> = {
  confirmed: "staff_booking_confirmed_email",
  cancelled: "staff_booking_cancelled_email",
  changed: "staff_booking_changed_email",
};

function buildFallbackHtml(payload: StaffNotifyPayload, clinicName: string, tz: string): string {
  const label = EVENT_LABELS[payload.event] || "Notificação";
  const color = EVENT_COLORS[payload.event] || "#B0A496";
  const startDate = new Date(payload.start_time);
  const dateStr = startDate.toLocaleDateString("pt-PT", { timeZone: tz, day: "numeric", month: "long", year: "numeric" });
  const timeStr = startDate.toLocaleTimeString("pt-PT", { timeZone: tz, hour: "2-digit", minute: "2-digit" });

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: 'Manrope', Arial, sans-serif; background: #FAF8F5; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 8px; border: 1px solid #E8E2DA; padding: 40px;">
    <div style="display: inline-block; background: ${color}; color: #fff; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px;">${label}</div>
    <h1 style="font-size: 18px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase; color: #2D2520; margin: 0 0 20px;">${clinicName}</h1>
    <table style="width: 100%; font-size: 14px; color: #807668; line-height: 1.8;">
      <tr><td style="font-weight: 600; width: 110px;">Cliente:</td><td>${payload.client_name}</td></tr>
      <tr><td style="font-weight: 600;">Serviço:</td><td>${payload.service_name}</td></tr>
      <tr><td style="font-weight: 600;">Especialista:</td><td>${payload.specialist_name || "—"}</td></tr>
      <tr><td style="font-weight: 600;">Data:</td><td>${dateStr}</td></tr>
      <tr><td style="font-weight: 600;">Horário:</td><td>${timeStr}</td></tr>
    </table>
    <p style="font-size: 11px; color: #B0A496; margin: 24px 0 0; border-top: 1px solid #E8E2DA; padding-top: 16px;">
      Esta é uma notificação automática do sistema ${clinicName}.
    </p>
  </div>
</body></html>`;
}

function replaceTemplateVars(
  text: string,
  payload: StaffNotifyPayload,
  clinicName: string,
  dateStr: string,
  timeStr: string
): string {
  return text
    .replace(/\{nome_cliente\}/g, payload.client_name)
    .replace(/\{servico\}/g, payload.service_name)
    .replace(/\{especialista\}/g, payload.specialist_name || "—")
    .replace(/\{data\}/g, dateStr)
    .replace(/\{horario\}/g, timeStr)
    .replace(/\{negocio\}/g, clinicName);
}

async function sendViaResend(apiKey: string, from: string, to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error [${res.status}]: ${body}`);
  }
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const payload: StaffNotifyPayload = await req.json();
    if (!payload.event || !payload.appointment_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Staff notifications are ALWAYS sent — no toggle check.
    // All admins, receptionists, and the selected specialist must be notified.

    // Fetch email config + clinic settings (timezone) + DB template
    const templateSlug = EVENT_SLUG_MAP[payload.event];
    const [settingsRes, clinicRes, templateRes] = await Promise.all([
      adminClient.from("integration_settings").select("setting_key, setting_value").in("setting_key", ["resend_api_key", "email_from_name", "email_from_address"]),
      adminClient.from("clinic_settings").select("clinic_name, timezone").limit(1).maybeSingle(),
      templateSlug
        ? adminClient.from("message_templates").select("content, subject").eq("slug", templateSlug).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const settingsMap: Record<string, string> = {};
    (settingsRes.data ?? []).forEach((s: any) => { settingsMap[s.setting_key] = s.setting_value ?? ""; });

    const resendApiKey = settingsMap.resend_api_key || "";
    const clinicName = clinicRes.data?.clinic_name || "Clínica";
    const clinicTimezone = clinicRes.data?.timezone || "Europe/Lisbon";
    const fromName = settingsMap.email_from_name || clinicName;
    const fromEmail = settingsMap.email_from_address || "";

    if (!fromEmail) {
      return new Response(JSON.stringify({ error: "E-mail de remetente não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "API Key do Resend não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve specialist_name from profiles if missing
    if (!payload.specialist_name && payload.specialist_id) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("full_name")
        .eq("user_id", payload.specialist_id)
        .maybeSingle();
      if (profile?.full_name) {
        payload.specialist_name = profile.full_name;
      }
    }

    // Format date/time for template replacements
    const startDate = new Date(payload.start_time);
    const dateStr = startDate.toLocaleDateString("pt-PT", { timeZone: clinicTimezone, day: "numeric", month: "long", year: "numeric" });
    const timeStr = startDate.toLocaleTimeString("pt-PT", { timeZone: clinicTimezone, hour: "2-digit", minute: "2-digit" });

    // Build email HTML and subject — use DB template if available, fallback to hardcoded
    let html: string;
    let subject: string;

    const dbTemplate = templateRes?.data as { content?: string; subject?: string } | null;

    if (dbTemplate?.content) {
      html = replaceTemplateVars(dbTemplate.content, payload, clinicName, dateStr, timeStr);
      subject = dbTemplate.subject
        ? replaceTemplateVars(dbTemplate.subject, payload, clinicName, dateStr, timeStr)
        : `${EVENT_LABELS[payload.event] || "Notificação"} — ${payload.client_name} — ${payload.service_name}`;
    } else {
      html = buildFallbackHtml(payload, clinicName, clinicTimezone);
      const eventLabel = EVENT_LABELS[payload.event] || "Notificação";
      subject = `${eventLabel} — ${payload.client_name} — ${payload.service_name}`;
    }

    // Get recipients: all admins + all receptionists + the specialist
    const { data: userEmails } = await adminClient.rpc("list_user_emails");
    const { data: staffRoles } = await adminClient
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "atendimento"]);

    const staffUserIds = new Set((staffRoles ?? []).map((r: any) => r.user_id));
    const recipientEmails = new Set<string>();

    (userEmails ?? []).forEach((u: any) => {
      // Include all admins and receptionists
      if (staffUserIds.has(u.user_id)) {
        recipientEmails.add(u.email);
      }
      // Include the selected specialist
      if (payload.specialist_id && u.user_id === payload.specialist_id) {
        recipientEmails.add(u.email);
      }
    });

    if (recipientEmails.size === 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "no recipients" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const from = `${fromName} <${fromEmail}>`;
    const results: { email: string; status: string; error?: string }[] = [];

    for (const email of recipientEmails) {
      try {
        await sendViaResend(resendApiKey, from, email, subject, html);
        results.push({ email, status: "sent" });
      } catch (err) {
        console.error(`[notify-staff] Failed to send to ${email}:`, err);
        results.push({ email, status: "failed", error: (err as Error).message });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[notify-staff] error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
