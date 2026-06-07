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

  // --- Auth: x-cron-secret ---
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
    // 1. Load settings
    const { data: settingsRows } = await supabase
      .from("integration_settings")
      .select("setting_key, setting_value")
      .in("setting_key", [
        "review_enabled",
        "review_google_url",
        "review_channel",
        "review_delay_hours",
        "review_interval_days",
        "review_max_sends",
        "review_message",
        "review_message_whatsapp",
        "review_message_email",
        "review_message_sms",
        "review_email_subject",
        "email_from_name",
        "email_from_address",
        "email_reply_to",
      ]);

    const s: Record<string, string> = {};
    (settingsRows || []).forEach((r: any) => {
      s[r.setting_key] = r.setting_value || "";
    });

    if (s.review_enabled !== "true") {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Review requests disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const googleUrl = s.review_google_url;
    const channels = (s.review_channel || "whatsapp").split(",").filter(Boolean);
    const intervalDays = parseInt(s.review_interval_days || "7", 10);
    const maxSends = parseInt(s.review_max_sends || "3", 10);
    const delayHours = parseInt(s.review_delay_hours || "2", 10);

    if (!googleUrl) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Missing google URL" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Create review_requests for appointments concluded N hours ago (configurable)
    //    Only add clients that have NEVER had a review request before.
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - delayHours);

    const { data: completedAppts } = await supabase
      .from("appointments")
      .select("id, client_id")
      .eq("status", "concluido")
      .lte("updated_at", cutoffDate.toISOString());

    let createdCount = 0;
    if (completedAppts && completedAppts.length > 0) {
      const uniqueClientIds = [...new Set(completedAppts.map((a: any) => a.client_id))];

      const { data: existingRequests } = await supabase
        .from("review_requests")
        .select("client_id")
        .in("client_id", uniqueClientIds);

      const existingSet = new Set((existingRequests || []).map((r: any) => r.client_id));

      for (const appt of completedAppts) {
        if (existingSet.has(appt.client_id)) continue;

        const { error } = await supabase.from("review_requests").insert({
          client_id: appt.client_id,
          appointment_id: appt.id,
          send_count: 0,
          next_send_at: new Date().toISOString(),
        });

        if (!error) {
          createdCount++;
          existingSet.add(appt.client_id);
        }
      }
    }

    // 3. Find requests due to send: queued/failed OR reserved with expired lock
    const now = new Date().toISOString();
    // Only pick rows that are NOT currently reserved. A reserved row stays
    // locked until the callback explicitly marks it as 'failed' (or admin resets it).
    const { data: dueRequests } = await supabase
      .from("review_requests")
      .select("id, client_id, confirmation_token, send_count, delivery_status, reserved_until")
      .is("confirmed_at", null)
      .lte("next_send_at", now)
      .lt("send_count", maxSends)
      .in("delivery_status", ["queued", "failed"])
      .limit(25);

    if (!dueRequests || dueRequests.length === 0) {
      return new Response(
        JSON.stringify({ recipients: [], created: createdCount }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Load client info
    const clientIds = dueRequests.map((r: any) => r.client_id);
    const { data: clients } = await supabase
      .from("clients")
      .select("id, full_name, phone, email")
      .in("id", clientIds);

    const clientMap: Record<string, any> = {};
    (clients || []).forEach((c: any) => {
      clientMap[c.id] = c;
    });

    // 5. Load clinic settings for branding
    const { data: clinicRow } = await supabase
      .from("clinic_settings")
      .select("clinic_name, system_url, sms_sender_name")
      .limit(1)
      .maybeSingle();

    const clinicName = clinicRow?.clinic_name || "";
    const systemUrl = (clinicRow?.system_url || "").replace(/\/$/, "");
    const smsSenderName = (clinicRow as any)?.sms_sender_name || "";

    // 6. Build payloads — one object per client with channels sub-object
    // Use system_url (clinic's public site) when configured so clients see your domain,
    // not the backend URL. Falls back to the supabase function URL if not set.
    const confirmBaseUrl = systemUrl
      ? `${systemUrl}/avaliacao/confirmar/`
      : `${supabaseUrl}/functions/v1/confirm-review?token=`;
    const emailSubjectTemplate = s.review_email_subject || "{negocio} — A sua opinião é importante! ⭐";
    const recipients: any[] = [];

    for (const rr of dueRequests) {
      const client = clientMap[rr.client_id];
      if (!client) continue;

      const confirmUrl = confirmBaseUrl + rr.confirmation_token;
      const nome = (client.full_name || "").split(" ")[0];
      const unsubscribeUrl = systemUrl && client.email
        ? `${systemUrl}/notificacao/cancelar?email=${encodeURIComponent(client.email)}`
        : "";

      const replacePlaceholders = (tpl: string) =>
        tpl
          .replace(/{nome_completo}/g, client.full_name || "")
          .replace(/{nome}/g, nome)
          .replace(/{link_google}/g, googleUrl)
          .replace(/{link_confirmar}/g, confirmUrl)
          .replace(/{link_unsubscribe}/g, unsubscribeUrl)
          .replace(/{negocio}/g, clinicName);

      const channelsObj: Record<string, any> = {};

      for (const channel of channels) {
        const messageTemplate = s[`review_message_${channel}`] || s.review_message || "";
        const body = replacePlaceholders(messageTemplate);

        if (channel === "whatsapp" && client.phone) {
          channelsObj.whatsapp = { phone: client.phone, message: body };
        } else if (channel === "email" && client.email) {
          channelsObj.email = {
            to: client.email,
            subject: replacePlaceholders(emailSubjectTemplate),
            message: body,
          };
        } else if (channel === "sms" && client.phone) {
          channelsObj.sms = { phone: client.phone, message: body };
        }
      }

      if (Object.keys(channelsObj).length === 0) continue;

      recipients.push({
        event: "review_request",
        request_id: rr.id,
        client_id: client.id,
        client_name: client.full_name,
        channels: channelsObj,
      });

      // Optimistic reservation: increment send_count NOW, set long lock (24h),
      // and pre-compute next_send_at. Callback only confirms (delivered) or
      // rolls back on failure. This prevents duplicate sends if the callback
      // is delayed/missing.
      const reservedUntil = new Date();
      reservedUntil.setHours(reservedUntil.getHours() + 24);
      const nowIso = new Date().toISOString();
      const newSendCount = (rr.send_count || 0) + 1;
      const nextSend = new Date();
      nextSend.setDate(nextSend.getDate() + intervalDays);

      await supabase
        .from("review_requests")
        .update({
          delivery_status: "reserved",
          reserved_until: reservedUntil.toISOString(),
          send_count: newSendCount,
          last_sent_at: nowIso,
          next_send_at: newSendCount >= maxSends ? null : nextSend.toISOString(),
          last_error: null,
        })
        .eq("id", rr.id);
    }

    return new Response(
      JSON.stringify({
        recipients,
        created: createdCount,
        due: dueRequests.length,
        sms: {
          sender_id: smsSenderName,
        },
        email: {
          from_name: s.email_from_name || clinicName,
          from_address: s.email_from_address || "",
          reply_to: s.email_reply_to || "",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[send-review-requests] error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
