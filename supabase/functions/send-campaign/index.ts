import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

/* ------------------------------------------------------------------ */
/*  renderCampaignHtml — Gera o HTML completo para email marketing     */
/*  O único placeholder que permanece é {nome}                         */
/* ------------------------------------------------------------------ */
function renderCampaignHtml(campaign: any, opts: {
  clinicName: string;
  clinicPhone: string;
  linkAgendamento: string;
  linkInstagram: string;
  linkFacebook: string;
  systemUrl: string;
}): string {
  const content = campaign.content || "";
  const subject = campaign.subject || "";
  const showHeader = campaign.show_header_image !== false;
  const headerUrl = campaign.header_image_url || "";
  const ctaText = campaign.cta_text || "";
  const ctaUrl = campaign.cta_url || "";
  const { clinicName, clinicPhone, linkAgendamento, linkInstagram, linkFacebook, systemUrl } = opts;

  const headerBlock = showHeader && headerUrl
    ? `<tr><td style="padding:0"><img src="${headerUrl}" alt="" style="width:100%;display:block;border-radius:8px 8px 0 0" /></td></tr>`
    : "";

  const ctaBlock = ctaText
    ? `<tr><td align="center" style="padding:24px 0 8px">
        <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:12px 28px;background-color:#b0a59b;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">${ctaText}</a>
       </td></tr>`
    : "";

  // Social links
  const socials: string[] = [];
  if (linkAgendamento) socials.push(`<a href="${linkAgendamento}" target="_blank" style="color:#b0a59b;text-decoration:none;font-size:12px">Website</a>`);
  if (linkInstagram) socials.push(`<a href="${linkInstagram}" target="_blank" style="color:#b0a59b;text-decoration:none;font-size:12px">Instagram</a>`);
  if (linkFacebook) socials.push(`<a href="${linkFacebook}" target="_blank" style="color:#b0a59b;text-decoration:none;font-size:12px">Facebook</a>`);

  const socialBlock = socials.length > 0
    ? `<tr><td align="center" style="padding:8px 0">${socials.join(" &nbsp;|&nbsp; ")}</td></tr>`
    : "";

  const phoneBlock = clinicPhone
    ? `<tr><td align="center" style="padding:4px 0;font-size:12px;color:#888">Tel: ${clinicPhone}</td></tr>`
    : "";

  // Unsubscribe link — {email} is replaced per recipient downstream
  const unsubscribeUrl = systemUrl
    ? `${systemUrl.replace(/\/$/, "")}/notificacao/cancelar?email={email}`
    : "";
  const unsubscribeBlock = unsubscribeUrl
    ? `<tr><td align="center" style="padding:12px 0 4px;font-size:11px;color:#999">
         Recebeu este e-mail porque está subscrito a comunicações de ${clinicName}.<br>
         <a href="${unsubscribeUrl}" target="_blank" style="color:#999;text-decoration:underline">Cancelar subscrição</a>
       </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5">
<tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%">
    ${headerBlock}
    <tr><td style="padding:24px 32px;font-size:14px;line-height:1.6;color:#333333">
      ${content}
    </td></tr>
    ${ctaBlock}
    <tr><td style="padding:24px 32px 0;border-top:1px solid #e5e5e5"></td></tr>
    <tr><td align="center" style="padding:8px 0;font-size:13px;font-weight:600;color:#333">${clinicName}</td></tr>
    ${socialBlock}
    ${phoneBlock}
    ${unsubscribeBlock}
    <tr><td style="padding:12px 0"></td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify authenticated admin
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

    const { campaign_id, test_only, test_recipient, sender_name_override } = await req.json();
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: "campaign_id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Load campaign
    const { data: campaign, error: campErr } = await adminClient
      .from("campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();
    if (campErr || !campaign) {
      return new Response(JSON.stringify({ error: "Campanha não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load settings in parallel
    const [{ data: clinicSettings }, { data: bookingSettings }, { data: emailSettingsData }, { data: replyToSetting }, { data: systemUrlSetting }] = await Promise.all([
      adminClient.from("clinic_settings").select("clinic_name, sms_sender_name, phone, address, system_url").limit(1).single(),
      adminClient.from("booking_page_settings").select("social_website, social_instagram, social_facebook").limit(1).single(),
      adminClient.from("integration_settings").select("setting_key, setting_value").in("setting_key", ["email_from_name", "email_from_address"]),
      adminClient.from("integration_settings").select("setting_value").eq("setting_key", "email_reply_to").maybeSingle(),
      adminClient.from("integration_settings").select("setting_value").eq("setting_key", "system_url").maybeSingle(),
    ]);

    const clinicName = fb(clinicSettings?.clinic_name, DEFAULT_CLINIC_NAME);
    const systemUrl = fb(clinicSettings?.system_url, systemUrlSetting?.setting_value);

    const emailSettings: Record<string, string> = {};
    (emailSettingsData ?? []).forEach((s: any) => { emailSettings[s.setting_key] = s.setting_value ?? ""; });

    // Determine contact field & build recipient query
    const contactField = campaign.channel === "email" ? "email" : "phone";

    // Fetch ALL clients with pagination to avoid the 1000-row limit
    let allClients: any[] = [];
    let offset = 0;
    const PAGE_SIZE = 1000;
    while (true) {
      let q = adminClient
        .from("clients")
        .select("id, full_name, email, phone, opt_in")
        .not(contactField, "is", null)
        .neq(contactField, "");

      if (!campaign.include_no_optin) {
        q = q.eq("opt_in", true);
      }

      const { data: page } = await q.range(offset, offset + PAGE_SIZE - 1);
      if (!page || page.length === 0) break;
      allClients = allClients.concat(page);
      if (page.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }

    let filteredClients = allClients;

    // Apply audience filter
    if (campaign.audience_filter !== "all" && filteredClients.length > 0) {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 1);

      const clientIds = filteredClients.map((c: any) => c.id);
      let allAppointments: any[] = [];
      for (let i = 0; i < clientIds.length; i += 500) {
        const batch = clientIds.slice(i, i + 500);
        const { data: appointments } = await adminClient
          .from("appointments")
          .select("client_id, start_time")
          .in("client_id", batch);
        if (appointments) allAppointments = allAppointments.concat(appointments);
      }

      const appByClient: Record<string, string[]> = {};
      allAppointments.forEach((a: any) => {
        if (!appByClient[a.client_id]) appByClient[a.client_id] = [];
        appByClient[a.client_id].push(a.start_time);
      });

      filteredClients = filteredClients.filter((c: any) => {
        const appts = appByClient[c.id] || [];
        if (appts.length === 0) return campaign.audience_filter === "inactive";
        const sorted = appts.sort();
        const firstVisit = new Date(sorted[0]);
        const lastVisit = new Date(sorted[sorted.length - 1]);

        switch (campaign.audience_filter) {
          case "new": return firstVisit >= cutoff;
          case "active": return lastVisit >= cutoff;
          case "inactive": return lastVisit < cutoff;
          default: return true;
        }
      });
    }

    let recipients: any[];
    if (test_only && test_recipient) {
      recipients = [{
        id: null,
        full_name: "Teste",
        email: campaign.channel === "email" ? test_recipient : "",
        phone: campaign.channel !== "email" ? test_recipient : "",
      }];
    } else {
      recipients = test_only ? filteredClients.slice(0, 1) : filteredClients;
    }

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum destinatário encontrado para os filtros selecionados." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update recipient count and status
    await adminClient
      .from("campaigns")
      .update({
        recipient_count: filteredClients.length,
        status: test_only ? campaign.status : "sending",
      })
      .eq("id", campaign_id);

    // Get webhook URL — priority: n8n_marketing_webhook > n8n_webhook_url
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
      await adminClient
        .from("campaigns")
        .update({ status: campaign.status })
        .eq("id", campaign_id);
      return new Response(JSON.stringify({ error: "Webhook de marketing não configurado. Defina o URL do webhook em Configurações → Integrações → Webhooks." }), {
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

    // Resolved field names
    const fromName = fb(emailSettings.email_from_name, clinicName, DEFAULT_CLINIC_NAME);
    const fromEmail = fb(emailSettings.email_from_address, replyToSetting?.setting_value);
    const replyTo = fb(replyToSetting?.setting_value, emailSettings.email_from_address);
    const rawSmsRemetente = fb(sender_name_override, clinicSettings?.sms_sender_name, clinicName, DEFAULT_CLINIC_NAME);
    // Alphanumeric Sender ID: max 11 chars, only A-Z 0-9
    const smsRemetente = rawSmsRemetente.replace(/[^a-zA-Z0-9]/g, "").slice(0, 11) || "CLINICA";

    // Pre-render email HTML (with {nome} placeholder intact)
    const isEmail = campaign.channel === "email";
    let htmlBody = "";
    if (isEmail) {
      htmlBody = renderCampaignHtml(campaign, {
        clinicName,
        clinicPhone: clinicSettings?.phone || "",
        linkAgendamento: bookingSettings?.social_website || "",
        linkInstagram: bookingSettings?.social_instagram || "",
        linkFacebook: bookingSettings?.social_facebook || "",
        systemUrl,
      });
    }

    // Pre-render SMS/WA message (with {nome} placeholder intact)
    const smsMessage = campaign.content || `Mensagem de ${clinicName}`;

    // Insert recipient records as "pending" BEFORE sending
    if (!test_only) {
      const recipientRows = recipients
        .filter((c: any) => c.id)
        .map((c: any) => ({
          campaign_id: campaign.id,
          client_id: c.id,
          status: "pending",
        }));

      for (let i = 0; i < recipientRows.length; i += 100) {
        await adminClient
          .from("campaign_recipients")
          .insert(recipientRows.slice(i, i + 100));
      }
    }

    // Build single payload with ALL recipients
    const payload: Record<string, any> = {
      event: "marketing_campaign",
      campaign_id: campaign.id,
      channel: campaign.channel || "email",
      test_only: !!test_only,
      batch_size: campaign.batch_size || 1,
      send_delay_seconds: campaign.send_delay_seconds || 2,
    };

    // Business info for placeholders
    const clinicPhone = clinicSettings?.phone || "";
    const clinicAddress = clinicSettings?.address || "";
    const clinicEmail = fb(replyToSetting?.setting_value, emailSettings.email_from_address);

    if (test_only) {
      const template = `${campaign.subject || ""} ${campaign.content || ""}`;
      const placeholders = new Set((template.match(/\{[a-z_]+\}/gi) || []).map((item) => item.toLowerCase()));
      const missing: string[] = [];

      if (placeholders.has("{telefone}") && campaign.channel === "email") missing.push("telefone do cliente");
      if (placeholders.has("{email}") && campaign.channel !== "email") missing.push("e-mail do cliente");
      if (placeholders.has("{negocio_telefone}") && !clinicPhone.trim()) missing.push("telefone do negócio");
      if (placeholders.has("{negocio_email}") && !clinicEmail.trim()) missing.push("e-mail do negócio");
      if (placeholders.has("{negocio_endereco}") && !clinicAddress.trim()) missing.push("endereço do negócio");

      if (missing.length > 0) {
        return new Response(
          JSON.stringify({ error: `Faltam dados para o teste: ${missing.join(", ")}.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Helper: substitute variables. Order matters — substitute longer/more
    // specific keys first so {telefone} can never be matched by {email}, etc.
    const personalize = (tpl: string, ctx: { nome: string; nome_completo: string; telefone: string; email: string; }) =>
      tpl
        .replace(/\{nome_completo\}/gi, ctx.nome_completo)
        .replace(/\{negocio_telefone\}/gi, clinicPhone)
        .replace(/\{negocio_endereco\}/gi, clinicAddress)
        .replace(/\{negocio_email\}/gi, clinicEmail)
        .replace(/\{negocio_nome\}/gi, clinicName)
        .replace(/\{telefone\}/gi, ctx.telefone)
        .replace(/\{negocio\}/gi, clinicName)
        .replace(/\{email\}/gi, ctx.email)
        .replace(/\{nome\}/gi, ctx.nome);

    if (isEmail) {
      payload.subject = fb(campaign.subject, `Novidades de ${clinicName}`, "Novidades");
      payload.from_name = fromName;
      payload.from_email = fromEmail;
      payload.reply_to = replyTo;
      payload.recipients = recipients.map((c: any) => {
        const fullName = c.full_name || "Cliente";
        const nome = fullName.split(" ")[0] || fullName;
        const email = c.email || "";
        const telefone = c.phone || "";
        const personalHtml = personalize(htmlBody, { nome, nome_completo: fullName, telefone, email });
        return {
          client_id: c.id,
          nome,
          email,
          html_body: personalHtml,
        };
      });
    } else {
      payload.sender_name = smsRemetente;
      payload.recipients = recipients.map((c: any) => {
        const fullName = c.full_name || "Cliente";
        const nome = fullName.split(" ")[0] || fullName;
        const telefone = c.phone || "";
        const email = c.email || "";
        const personalMsg = personalize(smsMessage, { nome, nome_completo: fullName, telefone, email });
        return {
          client_id: c.id,
          nome,
          telefone,
          message: personalMsg,
        };
      });
    }

    // Single POST to webhook — n8n handles batching, delays, and reports back via campaign-callback
    let dispatched = false;

    try {
      const webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers: webhookHeaders,
        body: JSON.stringify(payload),
      });

      if (!webhookRes.ok) {
        const errText = await webhookRes.text().catch(() => "");
        console.error(`[send-campaign] Webhook error: ${webhookRes.status} ${errText}`);

        // Webhook rejected — mark all recipients as failed immediately
        if (!test_only) {
          const failedIds = recipients.filter((c: any) => c.id).map((c: any) => c.id);
          for (let i = 0; i < failedIds.length; i += 500) {
            await adminClient
              .from("campaign_recipients")
              .update({
                status: "failed",
                error_message: `Webhook error: ${webhookRes.status}`,
              })
              .eq("campaign_id", campaign.id)
              .in("client_id", failedIds.slice(i, i + 500));
          }
          await adminClient
            .from("campaigns")
            .update({ status: "failed" })
            .eq("id", campaign_id);
        }
      } else {
        dispatched = true;
        // Recipients stay as "pending" — the campaign-callback endpoint
        // will update them to sent/failed as n8n processes each one.
        // Campaign stays as "sending" until all callbacks arrive.
      }
    } catch (err) {
      console.error(`[send-campaign] Fetch error:`, err);

      if (!test_only) {
        const failedIds = recipients.filter((c: any) => c.id).map((c: any) => c.id);
        for (let i = 0; i < failedIds.length; i += 500) {
          await adminClient
            .from("campaign_recipients")
            .update({
              status: "failed",
              error_message: `Network error: ${String(err)}`,
            })
            .eq("campaign_id", campaign.id)
            .in("client_id", failedIds.slice(i, i + 500));
        }
        await adminClient
          .from("campaigns")
          .update({ status: "failed" })
          .eq("id", campaign_id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        recipients_count: recipients.length,
        dispatched,
        test_only: !!test_only,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-campaign error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Erro ao enviar campanha" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
