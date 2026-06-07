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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller
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

    const { charge_id, send_type, pdf_html, pdf_base64 } = await req.json();

    if (!charge_id || !send_type) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: charge_id, send_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Fetch charge + client + clinic name + email settings
    const [chargeRes, clinicRes, emailSettingsRes] = await Promise.all([
      adminClient.from("charges").select("*, clients(full_name, email, phone)").eq("id", charge_id).single(),
      adminClient.from("clinic_settings").select("clinic_name").limit(1).maybeSingle(),
      adminClient.from("integration_settings").select("setting_key, setting_value").in("setting_key", ["resend_api_key", "email_from_name", "email_from_address"]),
    ]);

    if (chargeRes.error || !chargeRes.data) {
      return new Response(JSON.stringify({ error: "Cobrança não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const charge = chargeRes.data;
    const client = (charge as any).clients;
    const clinicName = fb(clinicRes.data?.clinic_name, DEFAULT_CLINIC_NAME);

    const emailSettings: Record<string, string> = {};
    (emailSettingsRes.data ?? []).forEach((s: any) => { emailSettings[s.setting_key] = s.setting_value ?? ""; });
    const resendApiKey = emailSettings.resend_api_key || "";
    const fromName = fb(emailSettings.email_from_name, clinicName, DEFAULT_CLINIC_NAME);
    const fromEmail = fb(emailSettings.email_from_address);

    if (send_type === "email") {
      if (!client?.email) {
        return new Response(JSON.stringify({ error: "Cliente não possui e-mail cadastrado." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!resendApiKey || !fromEmail) {
        return new Response(JSON.stringify({ error: "Resend não configurado. Acesse Configurações > E-mail." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const emailSubject = `Cobrança / Fatura - ${clinicName}`;
      const clientFirstName = client.full_name?.split(" ")[0] || "Cliente";

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [client.email],
          subject: emailSubject,
          html: `<p>Olá ${clientFirstName},</p><p>Segue em anexo o documento referente ao seu atendimento.</p><p>Qualquer dúvida estamos à disposição.</p><br/><p>${clinicName}</p>`,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Resend error [${res.status}]: ${body}`);
      }

    } else if (send_type === "whatsapp") {
      // --- WHATSAPP via EvoAPI ---
      if (!client?.phone) {
        return new Response(JSON.stringify({ error: "Cliente não possui telefone cadastrado." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch EvoAPI settings
      const { data: integrations } = await adminClient
        .from("integration_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["whatsapp_request_url", "whatsapp_api_key", "evolution_instance_name"]);

      const settings: Record<string, string> = {};
      (integrations ?? []).forEach((s: any) => {
        if (s.setting_value) settings[s.setting_key] = s.setting_value;
      });

      if (!settings.whatsapp_request_url || !settings.whatsapp_api_key || !settings.evolution_instance_name) {
        return new Response(JSON.stringify({ error: "Integração WhatsApp (Evolution API) não configurada." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const cleanPhone = client.phone.replace(/\D/g, "");
      const baseUrl = settings.whatsapp_request_url.replace(/\/$/, "");
      const instanceName = settings.evolution_instance_name;

      if (!pdf_base64) {
        throw new Error("PDF base64 é obrigatório para envio por WhatsApp.");
      }

      // Decode base64 to bytes
      const binaryStr = atob(pdf_base64);
      const fileBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        fileBytes[i] = binaryStr.charCodeAt(i);
      }

      // Upload PDF to storage
      const fileName = `charge-pdfs/${charge_id}_${Date.now()}.pdf`;
      const { error: uploadError } = await adminClient.storage
        .from("consent-pdfs")
        .upload(fileName, fileBytes, { contentType: "application/pdf", upsert: true });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error("Erro ao fazer upload do documento.");
      }

      // Create signed URL valid for 7 days
      const { data: signedData, error: signedError } = await adminClient.storage
        .from("consent-pdfs")
        .createSignedUrl(fileName, 604800);

      if (signedError || !signedData?.signedUrl) {
        console.error("Signed URL error:", signedError);
        throw new Error("Erro ao gerar link do documento.");
      }

      const amount = Number(charge.amount).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
      const clientName = client.full_name || "Cliente";
      const caption = `Olá ${clientName},\n\nSegue o recibo referente ao seu atendimento no valor de ${amount}.\n\nQualquer dúvida estamos à disposição.\n\n${clinicName}`;
      const docFileName = `recibo-${clinicName.toLowerCase().replace(/\s+/g, "-")}.pdf`;

      // Send PDF via sendMedia (Evolution API)
      const sendMediaUrl = `${baseUrl}/message/sendMedia/${instanceName}`;

      const waRes = await fetch(sendMediaUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": settings.whatsapp_api_key,
        },
        body: JSON.stringify({
          number: cleanPhone,
          mediatype: "document",
          mimetype: "application/pdf",
          caption,
          media: signedData.signedUrl,
          fileName: docFileName,
        }),
      });

      if (!waRes.ok) {
        const errBody = await waRes.text();
        console.error("EvoAPI sendMedia error:", waRes.status, errBody);
        throw new Error(`Erro ao enviar WhatsApp: ${waRes.status}`);
      }
    } else {
      return new Response(JSON.stringify({ error: "Tipo de envio inválido. Use 'email' ou 'whatsapp'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record the send
    await adminClient.from("charge_sends").insert({
      charge_id,
      client_id: charge.client_id,
      send_type,
      status: "sent",
      sent_by: caller.id,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("send-charge error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message || "Erro ao enviar cobrança" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
