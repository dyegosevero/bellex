import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

  // Auth: CRON_SECRET header or admin user
  const cronSecret = Deno.env.get("CRON_SECRET");
  const incoming = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("Authorization");

  const cronAuth = cronSecret && incoming === cronSecret;
  let userAuth = false;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!cronAuth && authHeader) {
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await anonClient.auth.getUser();
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
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch inactive clients
    const { data: inactiveClients, error: clientsError } = await supabase.rpc("inactive_clients");
    if (clientsError) throw clientsError;

    if (!inactiveClients || inactiveClients.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum cliente inativo" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch email settings + clinic settings in parallel
    const [emailSettingsRes, clinicRes] = await Promise.all([
      supabase.from("integration_settings").select("setting_key, setting_value").in("setting_key", ["resend_api_key", "email_from_name", "email_from_address"]),
      supabase.from("clinic_settings").select("clinic_name").limit(1).maybeSingle(),
    ]);

    const emailSettings: Record<string, string> = {};
    (emailSettingsRes.data ?? []).forEach((s: any) => { emailSettings[s.setting_key] = s.setting_value ?? ""; });

    const resendApiKey = emailSettings.resend_api_key || "";
    const clinicName = fb(clinicRes.data?.clinic_name, DEFAULT_CLINIC_NAME);
    const fromName = fb(emailSettings.email_from_name, clinicName, DEFAULT_CLINIC_NAME);
    const fromEmail = fb(emailSettings.email_from_address);

    if (!resendApiKey || !fromEmail) {
      return new Response(JSON.stringify({ error: "Resend não configurado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch admin emails to send the report to
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (!adminRoles || adminRoles.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum admin encontrado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get admin emails from auth
    const adminEmails: string[] = [];
    for (const r of adminRoles) {
      const { data: { user } } = await supabase.auth.admin.getUserById(r.user_id);
      if (user?.email) adminEmails.push(user.email);
    }

    // Build email HTML
    const rows = inactiveClients.map((c: any) =>
      `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${c.client_name || "—"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${c.phone || "—"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${c.email || "—"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${c.last_visit ? new Date(c.last_visit).toLocaleDateString("pt-BR") : "Nunca"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${c.days_inactive ?? "—"} dias</td>
      </tr>`
    ).join("");

    const html = `
      <div style="font-family:sans-serif;max-width:700px;margin:0 auto">
        <h2 style="color:#333">Relatório Semanal — Clientes Inativos</h2>
        <p>${inactiveClients.length} cliente(s) sem atendimento há mais de 3 meses.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <thead>
            <tr style="background:#f5f5f5">
              <th style="padding:8px;text-align:left">Nome</th>
              <th style="padding:8px;text-align:left">Telefone</th>
              <th style="padding:8px;text-align:left">Email</th>
              <th style="padding:8px;text-align:left">Última Visita</th>
              <th style="padding:8px;text-align:left">Dias Inativo</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    const emailSubject = `[${clinicName}] ${inactiveClients.length} cliente(s) inativo(s)`;

    // Send via Resend to each admin
    const results: { email: string; status: string }[] = [];
    for (const adminEmail of adminEmails) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [adminEmail],
            subject: emailSubject,
            html,
          }),
        });
        if (!res.ok) {
          const body = await res.text();
          console.error(`Resend error for ${adminEmail}:`, res.status, body);
          results.push({ email: adminEmail, status: "failed" });
        } else {
          results.push({ email: adminEmail, status: "sent" });
        }
      } catch (err) {
        console.error(`Error sending to ${adminEmail}:`, err);
        results.push({ email: adminEmail, status: "failed" });
      }
    }

    return new Response(JSON.stringify({
      message: `Relatório enviado para ${adminEmails.length} admin(s)`,
      inactive_count: inactiveClients.length,
      recipients: adminEmails,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
