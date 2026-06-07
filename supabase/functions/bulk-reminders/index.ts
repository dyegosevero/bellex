import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

const EMAIL_SUBJECT_FALLBACKS: Record<string, string> = {
  booking_reminder_email: "Não esqueça sua marcação!",
};

/**
 * bulk-reminders
 *
 * Safety-net function: scans all future appointments and inserts pending reminders
 * into reminder_history for any that don't already have one.
 * 
 * The n8n polling workflow (pending-reminders) will pick them up at the right time.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Fetch clinic settings, booking settings, email settings
    const [clinicRes, bookingRes, emailSettingsRes] = await Promise.all([
      supabase.from("clinic_settings").select("clinic_name, reminder_lead, phone, sms_sender_name, timezone, system_url, booking_url").limit(1).maybeSingle(),
      supabase.from("booking_page_settings").select("social_instagram, social_facebook, social_website").limit(1).maybeSingle(),
      supabase.from("integration_settings").select("setting_key, setting_value").in("setting_key", ["email_from_name", "email_from_address", "email_reply_to"]),
    ]);

    const clinicData = clinicRes.data;
    const bookingData = bookingRes.data;
    const clinicTimezone = fb(clinicData?.timezone, "Europe/Lisbon");
    const effectiveClinicName = fb(clinicData?.clinic_name, "Clínica");
    const systemUrl = (clinicData as any)?.system_url || "";
    const bookingUrlValue = (clinicData as any)?.booking_url || "";
    const smsRemetente = fb((clinicData as any)?.sms_sender_name, effectiveClinicName);
    const smsCallbackUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/sms-callback` : "";

    const emailSettings: Record<string, string> = {};
    (emailSettingsRes.data ?? []).forEach((s: any) => { emailSettings[s.setting_key] = s.setting_value ?? ""; });
    const emailFromName = fb(emailSettings.email_from_name, effectiveClinicName);
    const emailFromAddress = fb(emailSettings.email_from_address);
    const emailReplyTo = fb(emailSettings.email_reply_to, emailFromAddress);

    // 2. Fetch reminder templates + notification settings
    const reminderSlugs = ["booking_reminder_sms", "booking_reminder_whatsapp", "booking_reminder_email"];
    const [templatesRes, notifSettingsRes] = await Promise.all([
      supabase.from("message_templates").select("slug, content, label, subject").in("slug", reminderSlugs),
      supabase.from("notification_settings").select("setting_key, enabled").in("setting_key", reminderSlugs),
    ]);

    const templates = templatesRes.data ?? [];
    const enabledMap: Record<string, boolean> = {};
    (notifSettingsRes.data ?? []).forEach((s: any) => { enabledMap[s.setting_key] = s.enabled; });

    // 3. Calculate lead time
    const leadMs = parseLeadToMs(clinicData?.reminder_lead ?? "24h") || 24 * 60 * 60 * 1000;

    // 4. Fetch appointments that should have reminders (send_at > now)
    // We look for appointments whose send_at would be in the future
    const minStartTime = new Date(Date.now() + leadMs).toISOString();
    const { data: appointments, error: apptError } = await supabase
      .from("appointments")
      .select(`
        id,
        start_time,
        cancellation_token,
        specialist_id,
        clients!inner(id, full_name, phone, email),
        services(name)
      `)
      .in("status", ["agendado", "confirmado"])
      .gt("start_time", new Date().toISOString())
      .order("start_time", { ascending: true });

    if (apptError) throw apptError;
    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ ok: true, total: 0, created: 0, message: "Nenhum agendamento elegível" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Check which appointments already have pending/dispatched/sent reminders
    const apptIds = appointments.map((a: any) => a.id);
    const { data: existingReminders } = await supabase
      .from("reminder_history")
      .select("appointment_id")
      .in("appointment_id", apptIds)
      .in("status", ["pending", "dispatched", "sent"]);

    const existingSet = new Set((existingReminders ?? []).map((r: any) => r.appointment_id));

    // 6. Fetch specialist names
    const specialistIds = [...new Set(appointments.filter((a: any) => a.specialist_id).map((a: any) => a.specialist_id))];
    let specialistMap: Record<string, string> = {};
    if (specialistIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", specialistIds);
      (profiles ?? []).forEach((p: any) => { specialistMap[p.user_id] = p.full_name; });
    }

    const channels = ["sms", "whatsapp", "email"];
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    // 7. For each appointment without a reminder, create one
    for (const appt of appointments as any[]) {
      try {
        if (existingSet.has(appt.id)) {
          skipped++;
          continue;
        }

        const client = appt.clients;
        const serviceName = appt.services?.name || "Serviço";
        const specialistName = specialistMap[appt.specialist_id] || "";
        const normalizedStartTime = toTimezoneOffsetDateTime(appt.start_time, clinicTimezone);
        const startDate = new Date(normalizedStartTime);

        const sendAt = new Date(startDate.getTime() - leadMs);
        if (sendAt.getTime() <= Date.now()) {
          skipped++;
          continue;
        }

        const dataFormatted = fmtInTimezone(startDate, clinicTimezone, { day: "numeric", month: "long" });
        const horarioFormatted = fmtInTimezone(startDate, clinicTimezone, { hour: "2-digit", minute: "2-digit" });

        function buildCancelUrl(token: string): string {
          const origin = (systemUrl || "").replace(/\/+$/, "");
          return origin ? `${origin}/cancelar/${token}` : "";
        }

        const cancelUrl = appt.cancellation_token ? buildCancelUrl(appt.cancellation_token) : "";

        const templateVars: Record<string, string> = {
          nome: client?.full_name?.split(" ")[0] || "Cliente",
          nome_completo: client?.full_name || "Cliente",
          negocio: effectiveClinicName,
          data: dataFormatted,
          servico: serviceName,
          especialista: specialistName,
          horario: horarioFormatted,
          link_agendamento: bookingUrlValue || bookingData?.social_website || "",
          link_cancelamento: cancelUrl,
          link_cancelar: cancelUrl,
          link_site: bookingData?.social_website || "",
          link_instagram: bookingData?.social_instagram || "",
          link_facebook: bookingData?.social_facebook || "",
          telefone: clinicData?.phone || "",
        };

        // Build channels payload with resolved messages
        const reminderChannelsPayload: Record<string, any> = {};
        const reminderChannelsSummary: Record<string, boolean> = {};
        for (const ch of channels) {
          const slug = `booking_reminder_${ch}`;
          let isEnabled = enabledMap[slug] ?? true;
          // Skip email if client has no email
          if (ch === "email" && !client?.email?.trim()) isEnabled = false;
          // Skip SMS/WhatsApp if client has no phone
          if ((ch === "sms" || ch === "whatsapp") && !client?.phone?.trim()) isEnabled = false;
          const tpl = templates.find((t: any) => t.slug === slug);
          const resolvedMessage = isEnabled && tpl ? resolveTemplate(tpl.content, templateVars) : "";
          const channelData: any = {
            enabled: isEnabled,
            message: resolvedMessage || (isEnabled ? `Notificação de ${effectiveClinicName}` : ""),
          };
          if (ch === "sms" && isEnabled) {
            channelData.callback_url = smsCallbackUrl;
            channelData.sender = fb(smsRemetente, effectiveClinicName, "Clínica");
          }
          if (ch === "email" && isEnabled) {
            channelData.sender = fb(emailFromName, effectiveClinicName, "Clínica");
            channelData.from = fb(emailFromAddress, emailReplyTo);
            channelData.reply_to = fb(emailReplyTo, emailFromAddress);
            const rawSubject = fb(tpl?.subject, EMAIL_SUBJECT_FALLBACKS[slug], tpl?.label, `Mensagem de ${effectiveClinicName}`);
            channelData.subject = resolveTemplate(rawSubject, templateVars);
          }
          reminderChannelsPayload[ch] = channelData;
          reminderChannelsSummary[ch] = isEnabled;
        }

        // Insert into reminder_history
        const { error: insertError } = await supabase.from("reminder_history").insert({
          appointment_id: appt.id,
          client_id: client?.id || null,
          client_name: client?.full_name || "Cliente",
          service_name: serviceName,
          specialist_name: specialistName,
          start_time: normalizedStartTime,
          send_at: sendAt.toISOString(),
          channels: reminderChannelsSummary,
          channels_payload: {
            client: {
              full_name: client?.full_name || "Cliente",
              phone: client?.phone || "",
              email: client?.email || "",
            },
            clinic_name: effectiveClinicName,
            cancel_url: cancelUrl,
            channels: reminderChannelsPayload,
          },
          status: "pending",
        });

        if (insertError) {
          errors.push(`Appt ${appt.id}: ${insertError.message}`);
        } else {
          created++;
        }
      } catch (err) {
        errors.push(`Appt ${appt.id}: ${String(err)}`);
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      total: appointments.length,
      created,
      skipped,
      already_scheduled: existingSet.size,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[bulk-reminders] error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
