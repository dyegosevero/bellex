import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_CLINIC_NAME = "Clínica";

function fb(value: string | null | undefined, ...fallbacks: (string | null | undefined)[]): string {
  if (value?.trim()) return value.trim();
  for (const f of fallbacks) {
    if (f?.trim()) return f.trim();
  }
  return "";
}

function parseLeadToMs(lead: string | null): number | null {
  if (!lead) return null;
  const match = lead.match(/^(\d+)\s*(h|m|min)$/i);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  if (unit === "h") return val * 60 * 60 * 1000;
  return val * 60 * 1000;
}

function fmtInTimezone(date: Date, tz: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("pt-PT", { ...options, timeZone: tz }).format(date);
}

function getTimezoneOffset(dateStr: string, tz: string): string {
  const date = new Date(dateStr + "Z");
  const utcStr = date.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = date.toLocaleString("en-US", { timeZone: tz });
  const diffMs = new Date(tzStr).getTime() - new Date(utcStr).getTime();
  const sign = diffMs >= 0 ? "+" : "-";
  const abs = Math.abs(diffMs);
  const hours = Math.floor(abs / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function toTimezoneOffsetDateTime(dateValue: string | Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(new Date(dateValue));

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  const naive = `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
  return `${naive}${getTimezoneOffset(naive, tz)}`;
}

function resolveTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(`{${key}}`).join(value || "");
  }
  return result;
}

async function dispatchWebhook(webhookUrl: string, body: Record<string, unknown>, label: string) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`[fire-booking-webhook] ${label} failed: ${response.status} ${errorText}`.trim());
  }
}

const EVENT_SLUG_MAP: Record<string, string> = {
  confirmed: "booking_confirmed",
  cancelled: "booking_cancelled",
  changed: "booking_changed",
};

const EMAIL_SUBJECT_FALLBACKS: Record<string, string> = {
  booking_confirmed_email: "Parabéns! Sua marcação foi confirmada!",
  booking_cancelled_email: "Que pena! Sua marcação foi cancelada!",
  booking_changed_email: "Atenção! Sua marcação foi alterada!",
  booking_reminder_email: "Não esqueça sua marcação!",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { event, appointment_id, cancellation_token, client, client_id, service_id, service_name, start_time, specialist_name, specialist_id, clinic_name, notify_client, source } = payload;

    if (!event || !appointment_id) {
      return new Response(JSON.stringify({ error: "Missing event or appointment_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all needed data with service_role (bypasses RLS)
    const [settingsRes, clinicRes, bookingRes, emailSettingsRes, clientPrefsRes] = await Promise.all([
      supabase.from("integration_settings").select("setting_key, setting_value").in("setting_key", ["n8n_webhook_url_booking"]),
      supabase.from("clinic_settings").select("clinic_name, reminder_lead, phone, sms_sender_name, timezone, system_url, booking_url").limit(1).maybeSingle(),
      supabase.from("booking_page_settings").select("social_instagram, social_facebook, social_website").limit(1).maybeSingle(),
      supabase.from("integration_settings").select("setting_key, setting_value").in("setting_key", ["email_from_name", "email_from_address", "email_reply_to"]),
      client_id
        ? supabase.from("clients").select("notify_whatsapp, notify_email, notify_sms").eq("id", client_id).maybeSingle()
        : Promise.resolve({ data: null } as any),
    ]);

    const clientPrefs = (clientPrefsRes as any)?.data || {};
    const channelAllowed = (ch: string): boolean => {
      if (ch === "whatsapp") return clientPrefs.notify_whatsapp !== false;
      if (ch === "email") return clientPrefs.notify_email !== false;
      if (ch === "sms") return clientPrefs.notify_sms !== false;
      return true;
    };

    const webhookUrl = settingsRes.data?.find((s: any) => s.setting_key === "n8n_webhook_url_booking")?.setting_value;

    const clinicData = clinicRes.data;
    const bookingData = bookingRes.data;
    const systemUrl = (clinicData as any)?.system_url || "";
    const bookingUrl = (clinicData as any)?.booking_url || "";

    const emailSettings: Record<string, string> = {};
    (emailSettingsRes.data ?? []).forEach((s: any) => { emailSettings[s.setting_key] = s.setting_value ?? ""; });

    const effectiveClinicName = fb(clinicData?.clinic_name, clinic_name, DEFAULT_CLINIC_NAME);
    const clinicTimezone = fb(clinicData?.timezone, "Europe/Lisbon");
    const emailFromName = fb(emailSettings.email_from_name, effectiveClinicName);
    const emailFromAddress = fb(emailSettings.email_from_address);
    const emailReplyTo = fb(emailSettings.email_reply_to, emailFromAddress);
    const smsRemetente = fb((clinicData as any)?.sms_sender_name, effectiveClinicName);
    const smsCallbackUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/sms-callback` : "";
    const normalizedStartTime = start_time ? toTimezoneOffsetDateTime(start_time, clinicTimezone) : start_time;

    // Build template vars
    const startDate = new Date(normalizedStartTime);
    const dataFormatted = fmtInTimezone(startDate, clinicTimezone, { day: "numeric", month: "long" });
    const horarioFormatted = fmtInTimezone(startDate, clinicTimezone, { hour: "2-digit", minute: "2-digit" });

    function buildCancelUrl(token: string): string {
      const origin = (systemUrl || "").replace(/\/+$/, "");
      return origin ? `${origin}/cancelar/${token}` : "";
    }

    const templateVars: Record<string, string> = {
      nome: client?.full_name?.split(" ")[0] || "Cliente",
      nome_completo: client?.full_name || "Cliente",
      negocio: effectiveClinicName,
      data: dataFormatted,
      servico: service_name || "Serviço",
      especialista: specialist_name || "",
      horario: horarioFormatted,
      link_agendamento: bookingUrl || bookingData?.social_website || "",
      link_cancelamento: cancellation_token ? buildCancelUrl(cancellation_token) : "",
      link_cancelar: cancellation_token ? buildCancelUrl(cancellation_token) : "",
      link_site: bookingData?.social_website || "",
      link_instagram: bookingData?.social_instagram || "",
      link_facebook: bookingData?.social_facebook || "",
      telefone: clinicData?.phone || "",
    };

    if (event === "cancelled") {
      templateVars.link_cancelamento = "";
      templateVars.link_cancelar = "";
    }
    const cancelUrl = event !== "cancelled" && cancellation_token ? buildCancelUrl(cancellation_token) : "";

    const slugPrefix = EVENT_SLUG_MAP[event];
    if (!slugPrefix) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "unknown_event" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const channels = ["sms", "whatsapp", "email"];
    const templateSlugs = channels.map((ch) => `${slugPrefix}_${ch}`);
    const settingKeys = [...templateSlugs];

    if (event === "confirmed" || event === "changed") {
      channels.forEach((ch) => {
        templateSlugs.push(`booking_reminder_${ch}`);
        settingKeys.push(`booking_reminder_${ch}`);
      });
    }

    const [templatesRes, notifSettingsRes] = await Promise.all([
      supabase.from("message_templates").select("slug, content, label, subject").in("slug", templateSlugs),
      supabase.from("notification_settings").select("setting_key, enabled").in("setting_key", settingKeys),
    ]);

    const templates = templatesRes.data ?? [];
    const enabledMap: Record<string, boolean> = {};
    (notifSettingsRes.data ?? []).forEach((s: any) => { enabledMap[s.setting_key] = s.enabled; });

    // Build channels payload for the main event
    const channelsPayload: Record<string, any> = {};
    for (const ch of channels) {
      const slug = `${slugPrefix}_${ch}`;
      let isEnabled = enabledMap[slug] ?? true;
      if (!channelAllowed(ch)) isEnabled = false;
      const tpl = templates.find((t: any) => t.slug === slug);
      const resolvedMessage = isEnabled && tpl ? resolveTemplate(tpl.content, templateVars) : "";
      const channelData: any = {
        enabled: isEnabled,
        message: resolvedMessage || (isEnabled ? `Notificação de ${effectiveClinicName}` : ""),
      };
      if (ch === "sms" && isEnabled) {
        channelData.callback_url = smsCallbackUrl;
        channelData.sender = fb(smsRemetente, effectiveClinicName, DEFAULT_CLINIC_NAME);
      }
      if (ch === "email" && isEnabled) {
        channelData.sender = fb(emailFromName, effectiveClinicName, DEFAULT_CLINIC_NAME);
        channelData.from = fb(emailFromAddress, emailReplyTo);
        channelData.reply_to = fb(emailReplyTo, emailFromAddress);
        const rawSubject = fb(
          tpl?.subject,
          EMAIL_SUBJECT_FALLBACKS[slug],
          tpl?.label,
          `Mensagem de ${effectiveClinicName}`,
        );
        channelData.subject = resolveTemplate(rawSubject, templateVars);
      }
      channelsPayload[ch] = channelData;
    }

    const shouldNotify = notify_client !== undefined ? notify_client : true;

    // Main webhook body
    const body: any = {
      event,
      notification_type: slugPrefix,
      appointment_id,
      notify_client: shouldNotify,
      client: {
        full_name: client?.full_name || "Cliente",
        phone: client?.phone || "",
        email: client?.email || "",
      },
      service_name: service_name || "Serviço",
      specialist_name: specialist_name || "",
      start_time: normalizedStartTime,
      clinic_name: effectiveClinicName,
      channels: channelsPayload,
    };

    if (event === "changed") {
      body.cancel_url = cancelUrl;
    }

    // Fire main webhook only if notify_client is true AND webhook URL exists
    if (shouldNotify && webhookUrl) {
      try {
        await dispatchWebhook(webhookUrl, body, event);
      } catch (err) {
        console.error("[fire-booking-webhook] webhook dispatch error (non-blocking):", err);
      }
    }

    // For confirmed or changed: save reminder to reminder_history for polling
    if ((event === "confirmed" || event === "changed") && normalizedStartTime) {
      // If event is "changed", delete any existing pending reminders for this appointment
      if (event === "changed") {
        await supabase
          .from("reminder_history")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("appointment_id", appointment_id)
          .eq("status", "pending");
      }

      const leadMs = parseLeadToMs(clinicData?.reminder_lead ?? "24h");
      if (leadMs) {
        const sendAt = new Date(startDate.getTime() - leadMs);
        if (sendAt.getTime() > Date.now()) {
          // Build reminder channels payload with resolved messages
          const reminderChannelsPayload: Record<string, any> = {};
          const reminderChannelsSummary: Record<string, boolean> = {};
          for (const ch of channels) {
            const slug = `booking_reminder_${ch}`;
            let isEnabled = enabledMap[slug] ?? true;
            if (!channelAllowed(ch)) isEnabled = false;
            if (ch === "email" && !client?.email?.trim()) isEnabled = false;
            if ((ch === "sms" || ch === "whatsapp") && !client?.phone?.trim()) isEnabled = false;
            const tpl = templates.find((t: any) => t.slug === slug);
            const resolvedMessage = isEnabled && tpl ? resolveTemplate(tpl.content, templateVars) : "";
            const channelData: any = {
              enabled: isEnabled,
              message: resolvedMessage || (isEnabled ? `Notificação de ${effectiveClinicName}` : ""),
            };
            if (ch === "sms" && isEnabled) {
              channelData.callback_url = smsCallbackUrl;
              channelData.sender = fb(smsRemetente, effectiveClinicName, DEFAULT_CLINIC_NAME);
            }
            if (ch === "email" && isEnabled) {
              channelData.sender = fb(emailFromName, effectiveClinicName, DEFAULT_CLINIC_NAME);
              channelData.from = fb(emailFromAddress, emailReplyTo);
              channelData.reply_to = fb(emailReplyTo, emailFromAddress);
              const rawSubject = fb(tpl?.subject, EMAIL_SUBJECT_FALLBACKS[slug], tpl?.label, `Mensagem de ${effectiveClinicName}`);
              channelData.subject = resolveTemplate(rawSubject, templateVars);
            }
            reminderChannelsPayload[ch] = channelData;
            reminderChannelsSummary[ch] = isEnabled;
          }

          console.log("[fire-booking-webhook] Creating reminder:", {
            appointment_id,
            send_at: sendAt.toISOString(),
            start_time: normalizedStartTime,
            leadMs,
            now: new Date().toISOString(),
            sendAtFuture: sendAt.getTime() > Date.now(),
          });

          const { error: reminderInsertError } = await supabase.from("reminder_history").insert({
            appointment_id,
            client_id: client_id || null,
            client_name: client?.full_name || "Cliente",
            service_id: service_id || null,
            service_name: service_name || "Serviço",
            specialist_id: specialist_id || null,
            specialist_name: specialist_name || "",
            start_time: normalizedStartTime,
            send_at: sendAt.toISOString(),
            channels: reminderChannelsSummary,
            channels_payload: {
              client: {
                full_name: client?.full_name || "Cliente",
                phone: client?.phone || "",
                email: client?.email || "",
              },
              channels: reminderChannelsPayload,
            },
            status: "pending",
          });

          if (reminderInsertError) {
            console.error("[fire-booking-webhook] REMINDER INSERT ERROR:", reminderInsertError);
          } else {
            console.log("[fire-booking-webhook] Reminder created successfully for", appointment_id);
          }
        } else {
          console.log("[fire-booking-webhook] Skipped reminder: sendAt is in the past", {
            sendAt: sendAt.toISOString(),
            now: new Date().toISOString(),
          });
        }
      } else {
        console.log("[fire-booking-webhook] Skipped reminder: no leadMs parsed from", clinicData?.reminder_lead);
      }
    }

    // If cancelled, also cancel any pending reminders
    if (event === "cancelled") {
      await supabase
        .from("reminder_history")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("appointment_id", appointment_id)
        .eq("status", "pending");
    }

    // Notify staff — check setting for internal (staff) actions; public bookings always notify
    const effectiveSource = source || "staff";
    let shouldNotifyStaff = true;

    if (effectiveSource === "staff") {
      try {
        const { data: setting } = await supabase
          .from("notification_settings")
          .select("enabled")
          .eq("setting_key", "staff_booking_email")
          .maybeSingle();
        if (setting && !setting.enabled) {
          shouldNotifyStaff = false;
          console.log("[fire-booking-webhook] staff_booking_email disabled — skipping notify-staff");
        }
      } catch (err) {
        console.error("[fire-booking-webhook] error checking staff_booking_email setting:", err);
      }
    }

    if (shouldNotifyStaff) {
      try {
        await supabase.functions.invoke("notify-staff", {
          body: {
            event,
            appointment_id,
            client_name: client?.full_name || "Cliente",
            service_name: service_name || "Serviço",
            specialist_name: specialist_name || "",
            start_time: normalizedStartTime,
            specialist_id: specialist_id || null,
            source: effectiveSource,
          },
        });
      } catch (err) {
        console.error("[fire-booking-webhook] notify-staff error:", err);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[fire-booking-webhook] error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
