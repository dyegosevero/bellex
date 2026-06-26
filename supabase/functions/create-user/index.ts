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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
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
    const {
      data: { user: caller },
    } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await anonClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem criar usuários" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { email, password, full_name, phone, role, avatar_url, clinic_id } = body;

    if (!email || !password || !full_name || !role) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: email, password, full_name, role" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create user with admin client
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
        // clinic_id in app_metadata is included in the JWT automatically
        // This is how we do tenant isolation — no DB call needed on every request
        app_metadata: clinic_id ? { clinic_id } : {},
      });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = newUser.user.id;

    // Upsert profile (trigger may or may not have created it)
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        user_id: userId,
        full_name,
        phone: phone || null,
        avatar_url: avatar_url || null,
      }, { onConflict: "user_id" });

    if (profileError) {
      console.error("Profile upsert error:", profileError);
      // Try plain insert as fallback
      const { error: insertError } = await adminClient
        .from("profiles")
        .insert({
          user_id: userId,
          full_name,
          phone: phone || null,
          avatar_url: avatar_url || null,
        });
      if (insertError) {
        console.error("Profile insert fallback error:", insertError);
      }
    }

    // Assign role
    await adminClient.from("user_roles").insert({
      user_id: userId,
      role,
    });

    // If this is a clinic user, link them to the clinic
    if (clinic_id) {
      await adminClient
        .from("workspace_clinics")
        .update({ clinic_auth_user_id: userId })
        .eq("id", clinic_id);
    }

    // Send welcome email with password-reset link (never send plaintext password)
    try {
      const { data: emailSettings } = await adminClient
        .from("integration_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["resend_api_key", "email_from_name", "email_from_address"]);

      const { data: clinicData } = await adminClient
        .from("clinic_settings")
        .select("clinic_name, system_url")
        .limit(1)
        .maybeSingle();

      const settingsMap: Record<string, string> = {};
      (emailSettings ?? []).forEach((s: any) => { settingsMap[s.setting_key] = s.setting_value ?? ""; });

      const resendApiKey = settingsMap.resend_api_key || "";
      const clinicNameVal = clinicData?.clinic_name || "Clínica";
      const fromName = settingsMap.email_from_name || clinicNameVal;
      const fromEmail = settingsMap.email_from_address || "";

      if (resendApiKey && fromEmail) {
        // Generate a password-reset token so the user sets their own password
        const resetToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h for new users

        const { data: insertedToken } = await adminClient.from("password_reset_tokens").insert({
          user_id: userId,
          token: resetToken,
          expires_at: expiresAt.toISOString(),
        }).select("id").single();

        const appUrl = clinicData?.system_url || "https://app.bellex.com.br";
        const resetUrl = insertedToken
          ? `${appUrl}/redefinir-senha?id=${insertedToken.id}&token=${encodeURIComponent(resetToken)}`
          : appUrl;

        const roleLabels: Record<string, string> = {
          admin: "Administrador",
          especialista: "Especialista",
          atendimento: "Recepcionista",
        };

        const welcomeHtml = `
          <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #2d2519;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: 24px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase; margin: 0;">${clinicNameVal.toUpperCase()}</h1>
            </div>
            <p style="font-size: 15px; line-height: 1.6;">Olá <strong>${full_name}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6;">A sua conta foi criada com sucesso no sistema <strong>${clinicNameVal}</strong> com o perfil <strong>${roleLabels[role] || role}</strong>.</p>
            <div style="background: #f5f0eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #7a7062;"><strong>E-mail de acesso:</strong></p>
              <p style="margin: 0; font-size: 15px;">${email}</p>
            </div>
            <p style="font-size: 15px; line-height: 1.6;">Para aceder ao sistema, defina a sua senha clicando no botão abaixo:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: hsl(30, 12%, 65%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 0.5px;">
                Definir Senha
              </a>
            </div>
            <p style="font-size: 13px; color: #7a7062; line-height: 1.6;">Este link é válido por <strong>72 horas</strong>.</p>
            <hr style="border: none; border-top: 1px solid #e5ddd4; margin: 24px 0;" />
            <p style="font-size: 11px; color: #a39888; text-align: center;">Este e-mail foi enviado automaticamente pelo sistema ${clinicNameVal}.</p>
          </div>
        `;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [email],
            subject: `Bem-vindo(a) ao ${clinicNameVal} — Defina a sua senha`,
            html: welcomeHtml,
          }),
        });
      }
    } catch (emailError) {
      console.error("Email error (user was created anyway):", emailError);
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Erro interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
