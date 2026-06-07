import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Allowlist of valid app origins for reset links
const ALLOWED_ORIGINS = [
  "https://system.dermalum.pt",
  "https://efkzdermalum.lovable.app",
  "https://id-preview--2f62c437-9d35-4f93-9e0d-de118afbab95.lovable.app",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "email é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use server-side constant instead of user-supplied site_url
    const appUrl = Deno.env.get("APP_URL") || ALLOWED_ORIGINS[0];

    // Find user by email
    const { data: users, error: listErr } = await adminClient.auth.admin.listUsers();
    if (listErr) throw listErr;

    const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    // Always return success to avoid email enumeration
    if (!user) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a shorter URL-safe token to avoid copy/email client truncation issues
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any existing tokens for this user
    await adminClient
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("user_id", user.id)
      .eq("used", false);

    // Store token
    const { data: insertedToken, error: insertErr } = await adminClient.from("password_reset_tokens").insert({
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    }).select("id").single();
    if (insertErr) throw insertErr;

    // Build reset URL using server-side constant
    const resetUrl = `${appUrl}/redefinir-senha?id=${insertedToken.id}&token=${encodeURIComponent(token)}`;

    // Get user name from profile
    const { data: profile } = await adminClient
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const userName = profile?.full_name || "Usuário";

    // Get Resend API key, sender config, and clinic name
    const { data: settings } = await adminClient
      .from("integration_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["resend_api_key", "email_from_name", "email_from_address"]);

    const { data: clinicData } = await adminClient
      .from("clinic_settings")
      .select("clinic_name")
      .limit(1)
      .maybeSingle();

    const clinicNameVal = clinicData?.clinic_name || "Clínica";

    const settingsMap: Record<string, string> = {};
    (settings ?? []).forEach((s: any) => { settingsMap[s.setting_key] = s.setting_value ?? ""; });

    const resendApiKey = settingsMap.resend_api_key;
    const fromName = settingsMap.email_from_name || clinicNameVal;
    const fromEmail = settingsMap.email_from_address || "noreply@dermalum.pt";

    if (!resendApiKey) {
      console.error("Resend not configured");
      return new Response(JSON.stringify({ error: "E-mail não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = `
      <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #2d2519;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase; margin: 0;">${clinicNameVal.toUpperCase()}</h1>
        </div>
        <p style="font-size: 15px; line-height: 1.6;">Olá <strong>${userName}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6;">Recebemos um pedido para redefinir a sua senha. Clique no botão abaixo para criar uma nova senha:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: hsl(30, 12%, 65%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 0.5px;">
            Redefinir Senha
          </a>
        </div>
        <p style="font-size: 13px; color: #7a7062; line-height: 1.6;">Este link é válido por <strong>1 hora</strong>. Se não solicitou esta alteração, ignore este e-mail.</p>
        <hr style="border: none; border-top: 1px solid #e5ddd4; margin: 24px 0;" />
        <p style="font-size: 11px; color: #a39888; text-align: center;">Este e-mail foi enviado automaticamente pelo sistema ${clinicNameVal}.</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [email],
        subject: `Redefinir sua senha — ${clinicNameVal}`,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Resend error:", res.status, body);
      throw new Error("Erro ao enviar e-mail");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
